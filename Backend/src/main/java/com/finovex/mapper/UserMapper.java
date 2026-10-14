package com.finovex.mapper;

import com.finovex.dto.response.UserResponse;
import com.finovex.entity.User;

/**
 * Entity to response DTO. Entities never leave the manager layer; DTOs do. Ids go out as
 * strings because the frontend types every id as a string.
 */
public final class UserMapper {

	private UserMapper() {
	}

	public static UserResponse toResponse(User user) {
		return new UserResponse(String.valueOf(user.getUserSeq()), user.getUsername(), user.getName(),
				user.getEmail());
	}

}
