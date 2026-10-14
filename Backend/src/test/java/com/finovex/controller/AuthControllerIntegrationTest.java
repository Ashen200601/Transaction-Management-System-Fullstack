package com.finovex.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.testcontainers.junit.jupiter.Testcontainers;

import com.finovex.TestcontainersConfiguration;
import com.finovex.entity.User;
import com.finovex.enums.MasterDataStatus;
import com.finovex.repository.UserRepository;
import com.jayway.jsonpath.JsonPath;

/**
 * End to end through every layer: HTTP, security, controller, manager, repository and a real
 * PostgreSQL with the Flyway migrations applied. Needs Docker; skipped when it isn't running.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
@Testcontainers(disabledWithoutDocker = true)
class AuthControllerIntegrationTest {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private UserRepository userRepository;

	@Test
	void registerThenLoginThenLogout() throws Exception {
		String username = uniqueUsername();
		register(username, username + "@example.com").andExpect(status().isCreated())
			.andExpect(jsonPath("$.id").isString())
			.andExpect(jsonPath("$.username").value(username));

		// The entity conventions: sequence id, audit columns filled in, status label set on load.
		User saved = this.userRepository.findByUsername(username).orElseThrow();
		assertThat(saved.getUserSeq()).isPositive();
		assertThat(saved.getCreatedBy()).isEqualTo("system");
		assertThat(saved.getCreatedDate()).isNotNull();
		assertThat(saved.getLastModifiedDate()).isNotNull();
		assertThat(saved.getStatus()).isEqualTo(MasterDataStatus.ACTIVE.getStatusSeq());
		assertThat(saved.getStatusDescription()).isEqualTo("Active");

		String loginBody = this.mockMvc
			.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON)
				.content(json("{'username':'%s','password':'secret123'}", username.toUpperCase())))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.accessToken").isNotEmpty())
			.andExpect(jsonPath("$.expiresIn").value(8 * 60 * 60))
			.andExpect(jsonPath("$.user.id").value(String.valueOf(saved.getUserSeq())))
			.andExpect(jsonPath("$.user.username").value(username))
			.andExpect(jsonPath("$.user.name").value("Jane Perera"))
			.andExpect(jsonPath("$.user.email").value(username + "@example.com"))
			.andReturn()
			.getResponse()
			.getContentAsString();
		String token = JsonPath.read(loginBody, "$.accessToken");

		this.mockMvc.perform(post("/auth/logout").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
			.andExpect(status().isNoContent());
	}

	@Test
	void registerWithTakenUsernameAndEmailIsAConflictPerField() throws Exception {
		String username = uniqueUsername();
		register(username, username + "@example.com").andExpect(status().isCreated());

		register(username, username.toUpperCase() + "@EXAMPLE.com").andExpect(status().isConflict())
			.andExpect(header().string(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_PROBLEM_JSON_VALUE))
			.andExpect(jsonPath("$.code").value("ACCOUNT_EXISTS"))
			.andExpect(jsonPath("$.errors.username[0]").value("That username is taken. Try another."))
			.andExpect(jsonPath("$.errors.email[0]").isNotEmpty());
	}

	@Test
	void invalidRegistrationListsEveryFieldProblem() throws Exception {
		this.mockMvc
			.perform(post("/auth/register").contentType(MediaType.APPLICATION_JSON)
				.content(json("{'fullName':'','businessName':'Shop','username':'a b','email':'nope','password':'short'}")))
			.andExpect(status().isUnprocessableContent())
			.andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
			.andExpect(jsonPath("$.title").value("Validation failed"))
			.andExpect(jsonPath("$.errors.fullName").value(hasItem("Enter your full name")))
			.andExpect(jsonPath("$.errors.username[0]").value(containsString("3–30")))
			.andExpect(jsonPath("$.errors.email").isNotEmpty())
			.andExpect(jsonPath("$.errors.password").value(hasItem("Use at least 8 characters")))
			.andExpect(jsonPath("$.errors.password").value(hasItem("Include at least one number")))
			.andExpect(jsonPath("$.errors.password").value(not(hasItem("Include at least one letter"))));
	}

	@Test
	void wrongPasswordAndUnknownUserGetTheSameAnswer() throws Exception {
		String username = uniqueUsername();
		register(username, username + "@example.com").andExpect(status().isCreated());

		for (String attempt : new String[] { username, "nobody-" + username }) {
			this.mockMvc
				.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON)
					.content(json("{'username':'%s','password':'wrong-pass1'}", attempt)))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"))
				.andExpect(jsonPath("$.detail").value("Incorrect username or password."));
		}
	}

	@Test
	void protectedEndpointsNeedAValidToken() throws Exception {
		this.mockMvc.perform(post("/auth/logout"))
			.andExpect(status().isUnauthorized())
			.andExpect(header().string(HttpHeaders.WWW_AUTHENTICATE, "Bearer"))
			.andExpect(jsonPath("$.code").value("UNAUTHORIZED"));

		this.mockMvc.perform(post("/auth/logout").header(HttpHeaders.AUTHORIZATION, "Bearer not-a-real-token"))
			.andExpect(status().isUnauthorized())
			.andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
	}

	@Test
	void healthIsPublic() throws Exception {
		this.mockMvc.perform(get("/actuator/health")).andExpect(status().isOk());
	}

	@Test
	void corsAllowsTheViteDevServerOnly() throws Exception {
		this.mockMvc
			.perform(options("/auth/login").header(HttpHeaders.ORIGIN, "http://localhost:5173")
				.header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST"))
			.andExpect(status().isOk())
			.andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "http://localhost:5173"));

		this.mockMvc
			.perform(options("/auth/login").header(HttpHeaders.ORIGIN, "http://evil.example")
				.header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST"))
			.andExpect(status().isForbidden());
	}

	private ResultActions register(String username, String email)
			throws Exception {
		return this.mockMvc.perform(post("/auth/register").contentType(MediaType.APPLICATION_JSON)
			.content(json("{'fullName':'Jane Perera','businessName':'Perera Stores','username':'%s','email':'%s','password':'secret123'}",
					username, email)));
	}

	private static String uniqueUsername() {
		return "user" + UUID.randomUUID().toString().substring(0, 8);
	}

	/** JSON written with single quotes for readability. */
	private static String json(String template, Object... args) {
		return String.format(template, args).replace('\'', '"');
	}

}
