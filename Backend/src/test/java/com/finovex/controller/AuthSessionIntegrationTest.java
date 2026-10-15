package com.finovex.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.groups.Tuple.tuple;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Date;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;
import org.testcontainers.junit.jupiter.Testcontainers;

import com.finovex.TestcontainersConfiguration;
import com.finovex.entity.RefreshToken;
import com.finovex.entity.User;
import com.finovex.entity.UserLoginAudit;
import com.finovex.enums.LoginEvent;
import com.finovex.enums.LoginResult;
import com.finovex.enums.MasterDataStatus;
import com.finovex.enums.SessionEndReason;
import com.finovex.manager.RefreshTokenManager;
import com.finovex.repository.RefreshTokenRepository;
import com.finovex.repository.UserLoginAuditRepository;
import com.finovex.repository.UserRepository;
import com.finovex.security.RefreshTokenCookie;
import com.jayway.jsonpath.JsonPath;

import jakarta.servlet.http.Cookie;

/**
 * Sign-in sessions end to end: the refresh cookie, rotation, reuse detection, sign-out and the
 * login audit, on a real PostgreSQL. The reuse grace is 0 here, so a second use is caught at once.
 */
@SpringBootTest(properties = "finovex.security.session.reuse-grace=0s")
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
@Testcontainers(disabledWithoutDocker = true)
class AuthSessionIntegrationTest {

	private static final String USER_AGENT = "Finovex integration test";

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private RefreshTokenRepository refreshTokenRepository;

	@Autowired
	private UserLoginAuditRepository userLoginAuditRepository;

	@Autowired
	private RefreshTokenManager refreshTokenManager;

	@Test
	void loginSetsAnHttpOnlyStrictCookieThatOnlyGoesToTheAuthEndpoints() throws Exception {
		String username = signUp();

		MvcResult login = login(username, "secret123").andReturn();

		assertThat(login.getResponse().getHeaders(HttpHeaders.SET_COOKIE)).singleElement()
			.satisfies((setCookie) -> assertThat(setCookie).contains(RefreshTokenCookie.NAME + "=", "HttpOnly",
					"SameSite=Strict", "Path=/auth")
				.doesNotContain("Max-Age", "Expires"));
		String cookieValue = login.getResponse().getCookie(RefreshTokenCookie.NAME).getValue();
		List<RefreshToken> tokens = tokensOf(username);
		assertThat(tokens).singleElement().satisfies((token) -> {
			assertThat(token.getTokenHash()).hasSize(64).isNotEqualTo(cookieValue);
			assertThat(token.getUsedDate()).isNull();
			assertThat(token.getUserAgent()).isEqualTo(USER_AGENT);
		});
	}

	@Test
	void refreshReplacesTheCookieAndReturnsAWorkingAccessToken() throws Exception {
		String username = signUp();
		Cookie first = refreshCookie(login(username, "secret123").andReturn());

		MvcResult refreshed = this.mockMvc.perform(post("/auth/refresh").cookie(first).header(HttpHeaders.USER_AGENT,
				USER_AGENT))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.accessToken").isNotEmpty())
			.andExpect(jsonPath("$.expiresIn").value(15 * 60))
			.andExpect(jsonPath("$.user.username").value(username))
			.andReturn();
		Cookie second = refreshCookie(refreshed);
		assertThat(second.getValue()).isNotEqualTo(first.getValue());

		// The new access token is accepted: this path needs a token and isn't built yet, so 404, not 401.
		String accessToken = JsonPath.read(refreshed.getResponse().getContentAsString(), "$.accessToken");
		this.mockMvc.perform(get("/businesses").header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken))
			.andExpect(status().isNotFound());

		List<RefreshToken> tokens = tokensOf(username);
		assertThat(tokens).hasSize(2).extracting(RefreshToken::getSessionId).containsOnly(tokens.get(0).getSessionId());
		assertThat(auditOf(username)).extracting(UserLoginAudit::getEvent, UserLoginAudit::getResult)
			.containsExactly(tuple(LoginEvent.LOGIN, LoginResult.SUCCESS),
					tuple(LoginEvent.REFRESH, LoginResult.SUCCESS));
	}

	@Test
	void usingAnOldRefreshTokenAgainEndsTheWholeSession() throws Exception {
		String username = signUp();
		Cookie first = refreshCookie(login(username, "secret123").andReturn());
		Cookie second = refreshCookie(this.mockMvc.perform(post("/auth/refresh").cookie(first)).andReturn());

		// Someone replays the first token: refused, and the cookie is deleted.
		this.mockMvc.perform(post("/auth/refresh").cookie(first))
			.andExpect(status().isUnauthorized())
			.andExpect(jsonPath("$.code").value("SESSION_EXPIRED"))
			.andExpect(cookie().maxAge(RefreshTokenCookie.NAME, 0));
		// The real user's newer token is dead too, because the session was ended.
		this.mockMvc.perform(post("/auth/refresh").cookie(second)).andExpect(status().isUnauthorized());

		assertThat(tokensOf(username)).allSatisfy((token) -> {
			assertThat(token.getRevokedDate()).isNotNull();
			assertThat(token.getRevokedReason()).isEqualTo(SessionEndReason.TOKEN_REUSED);
		});
		assertThat(auditOf(username)).extracting(UserLoginAudit::getResult)
			.containsExactly(LoginResult.SUCCESS, LoginResult.SUCCESS, LoginResult.TOKEN_REUSED,
					LoginResult.SESSION_REVOKED);
	}

	@Test
	void logoutEndsTheSessionOnTheServer() throws Exception {
		String username = signUp();
		Cookie cookie = refreshCookie(login(username, "secret123").andReturn());

		this.mockMvc.perform(post("/auth/logout").cookie(cookie))
			.andExpect(status().isNoContent())
			.andExpect(cookie().maxAge(RefreshTokenCookie.NAME, 0));
		this.mockMvc.perform(post("/auth/refresh").cookie(cookie)).andExpect(status().isUnauthorized());

		assertThat(tokensOf(username)).singleElement()
			.satisfies((token) -> assertThat(token.getRevokedReason()).isEqualTo(SessionEndReason.LOGOUT));
		assertThat(auditOf(username)).extracting(UserLoginAudit::getEvent)
			.containsExactly(LoginEvent.LOGIN, LoginEvent.LOGOUT, LoginEvent.REFRESH);
	}

	@Test
	void refreshWithoutACookieIsRefusedAndNotAudited() throws Exception {
		long auditRows = this.userLoginAuditRepository.count();

		this.mockMvc.perform(post("/auth/refresh"))
			.andExpect(status().isUnauthorized())
			.andExpect(jsonPath("$.code").value("SESSION_EXPIRED"));
		this.mockMvc.perform(post("/auth/logout")).andExpect(status().isNoContent());

		assertThat(this.userLoginAuditRepository.count()).isEqualTo(auditRows);
	}

	@Test
	void failedSignInsAreAuditedEvenThoughTheSignInIsRolledBack() throws Exception {
		String username = signUp();
		String nobody = "nobody-" + username;

		login(username.toUpperCase(), "wrong-pass1").andExpect(status().isUnauthorized())
			.andExpect(header().doesNotExist(HttpHeaders.SET_COOKIE));
		login(nobody, "wrong-pass1").andExpect(status().isUnauthorized());

		assertThat(auditOf(username)).singleElement().satisfies((audit) -> {
			assertThat(audit.getResult()).isEqualTo(LoginResult.INVALID_CREDENTIALS);
			assertThat(audit.getUserSeq()).isEqualTo(userSeq(username));
			assertThat(audit.getIpAddress()).isEqualTo("127.0.0.1");
			assertThat(audit.getUserAgent()).isEqualTo(USER_AGENT);
			assertThat(audit.getSessionId()).isNull();
		});
		assertThat(auditOf(nobody)).singleElement().satisfies((audit) -> {
			assertThat(audit.getResult()).isEqualTo(LoginResult.INVALID_CREDENTIALS);
			assertThat(audit.getUserSeq()).isNull();
		});
		assertThat(tokensOf(username)).isEmpty();
	}

	@Test
	void onlyApprovedAccountsSignIn() throws Exception {
		String inactive = signUp();
		setUserStatus(inactive, MasterDataStatus.OPEN);
		login(inactive, "secret123").andExpect(status().isForbidden())
			.andExpect(jsonPath("$.code").value("ACCOUNT_DISABLED"));

		// A deleted account is treated as if it didn't exist.
		String deleted = signUp();
		setUserStatus(deleted, MasterDataStatus.DELETED);
		login(deleted, "secret123").andExpect(status().isUnauthorized())
			.andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));

		assertThat(auditOf(inactive)).extracting(UserLoginAudit::getResult)
			.containsExactly(LoginResult.ACCOUNT_DISABLED);
		assertThat(auditOf(deleted)).singleElement().satisfies((audit) -> {
			assertThat(audit.getResult()).isEqualTo(LoginResult.INVALID_CREDENTIALS);
			assertThat(audit.getUserSeq()).isNull();
		});
	}

	@Test
	void makingAnAccountInactiveEndsItsSessionAtTheNextRefresh() throws Exception {
		String username = signUp();
		Cookie cookie = refreshCookie(login(username, "secret123").andReturn());
		setUserStatus(username, MasterDataStatus.OPEN);

		this.mockMvc.perform(post("/auth/refresh").cookie(cookie)).andExpect(status().isUnauthorized());

		assertThat(tokensOf(username)).singleElement().satisfies((token) -> {
			assertThat(token.getRevokedReason()).isEqualTo(SessionEndReason.ACCOUNT_DISABLED);
			assertThat(token.getStatus()).isEqualTo(MasterDataStatus.OPEN.getStatusSeq());
		});
	}

	@Test
	void refreshTokensAreApprovedWhileUsableAndOpenOnceUsed() throws Exception {
		String username = signUp();
		Cookie first = refreshCookie(login(username, "secret123").andReturn());
		this.mockMvc.perform(post("/auth/refresh").cookie(first)).andExpect(status().isOk());

		assertThat(tokensOf(username)).extracting(RefreshToken::getStatus)
			.containsExactly(MasterDataStatus.OPEN.getStatusSeq(), MasterDataStatus.APPROVED.getStatusSeq());
	}

	@Test
	void tokensOfLongEndedSessionsAreDeleted() throws Exception {
		String username = signUp();
		login(username, "secret123");
		RefreshToken token = tokensOf(username).get(0);
		token.setExpiresDate(new Date(System.currentTimeMillis() - 2L * 24 * 60 * 60 * 1000));
		this.refreshTokenRepository.save(token);

		assertThat(this.refreshTokenManager.deleteExpired()).isGreaterThanOrEqualTo(1);
		assertThat(tokensOf(username)).isEmpty();
	}

	private String signUp() throws Exception {
		String username = "user" + UUID.randomUUID().toString().substring(0, 8);
		this.mockMvc
			.perform(post("/auth/signup").contentType(MediaType.APPLICATION_JSON)
				.content(json("{'fullName':'Jane Perera','businessName':'Perera Stores','username':'%s',"
						+ "'email':'%s@example.com','password':'secret123'}", username, username)))
			.andExpect(status().isCreated());
		return username;
	}

	private ResultActions login(String username, String password)
			throws Exception {
		return this.mockMvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON)
			.header(HttpHeaders.USER_AGENT, USER_AGENT)
			.content(json("{'username':'%s','password':'%s'}", username, password)));
	}

	private static Cookie refreshCookie(MvcResult result) {
		Cookie cookie = result.getResponse().getCookie(RefreshTokenCookie.NAME);
		assertThat(cookie).as("refresh cookie").isNotNull();
		return new Cookie(cookie.getName(), cookie.getValue());
	}

	private void setUserStatus(String username, MasterDataStatus status) {
		User user = this.userRepository.findByUsername(username).orElseThrow();
		user.setStatus(status.getStatusSeq());
		this.userRepository.save(user);
	}

	private Integer userSeq(String username) {
		return this.userRepository.findByUsername(username).orElseThrow().getUserSeq();
	}

	private List<RefreshToken> tokensOf(String username) {
		Integer userSeq = userSeq(username);
		return this.refreshTokenRepository.findAll()
			.stream()
			.filter((token) -> token.getUserSeq().equals(userSeq))
			.sorted((a, b) -> a.getRefreshTokenSeq().compareTo(b.getRefreshTokenSeq()))
			.toList();
	}

	private List<UserLoginAudit> auditOf(String username) {
		return this.userLoginAuditRepository.findAll()
			.stream()
			.filter((audit) -> username.equals(audit.getUsername()))
			.sorted((a, b) -> a.getUserLoginAuditSeq().compareTo(b.getUserLoginAuditSeq()))
			.toList();
	}

	private static String json(String template, Object... args) {
		return String.format(template, args).replace('\'', '"');
	}

}
