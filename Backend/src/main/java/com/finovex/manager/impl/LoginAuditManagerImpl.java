package com.finovex.manager.impl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.finovex.dto.request.ClientInfo;
import com.finovex.entity.UserLoginAudit;
import com.finovex.enums.LoginEvent;
import com.finovex.enums.LoginResult;
import com.finovex.manager.LoginAuditManager;
import com.finovex.repository.UserLoginAuditRepository;
import com.finovex.repository.UserRepository;

@Service
public class LoginAuditManagerImpl implements LoginAuditManager {

	private static final int MAX_USERNAME_LENGTH = 100;

	private final UserLoginAuditRepository userLoginAuditRepository;

	private final UserRepository userRepository;

	public LoginAuditManagerImpl(UserLoginAuditRepository userLoginAuditRepository, UserRepository userRepository) {
		this.userLoginAuditRepository = userLoginAuditRepository;
		this.userRepository = userRepository;
	}

	@Override
	@Transactional(propagation = Propagation.REQUIRES_NEW)
	public void record(LoginEvent event, LoginResult result, Integer userSeq, String username, String sessionId,
			ClientInfo client) {
		UserLoginAudit audit = new UserLoginAudit();
		audit.setUser(userSeq == null ? null : this.userRepository.getReferenceById(userSeq));
		audit.setUsername(username == null || username.length() <= MAX_USERNAME_LENGTH ? username
				: username.substring(0, MAX_USERNAME_LENGTH));
		audit.setEvent(event);
		audit.setResult(result);
		audit.setSessionId(sessionId);
		audit.setIpAddress(client.ipAddress());
		audit.setUserAgent(client.userAgent());
		this.userLoginAuditRepository.save(audit);
	}

}
