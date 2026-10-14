package com.finovex.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Body of POST /auth/register. The rules and messages mirror the sign-up form
 * ({@code Frontend/src/features/auth/schemas.ts}); keep the two in step.
 *
 * @param businessName the user's first business; not stored yet, because the business module doesn't exist
 */
public record RegisterRequest(
		@NotBlank(message = "Enter your full name")
		@Size(min = 2, message = "Enter your full name")
		@Size(max = 100, message = "Keep your name under 100 characters")
		String fullName,

		@NotBlank(message = "Enter your business name")
		@Size(min = 2, message = "Enter your business name")
		@Size(max = 120, message = "Keep the business name under 120 characters")
		String businessName,

		@NotBlank(message = "Use 3–30 letters, numbers, dots, dashes or underscores")
		@Pattern(regexp = "^\\s*[A-Za-z0-9._-]{3,30}\\s*$",
				message = "Use 3–30 letters, numbers, dots, dashes or underscores")
		String username,

		@NotBlank(message = "Enter a valid email address, like name@company.com")
		@Email(message = "Enter a valid email address, like name@company.com")
		@Size(max = 254, message = "Enter a valid email address, like name@company.com")
		String email,

		@NotNull(message = "Use at least 8 characters")
		@Size(min = 8, message = "Use at least 8 characters")
		@Size(max = 128, message = "Keep the password under 128 characters")
		@Pattern(regexp = "(?s).*[A-Za-z].*", message = "Include at least one letter")
		@Pattern(regexp = "(?s).*\\d.*", message = "Include at least one number")
		String password) {
}
