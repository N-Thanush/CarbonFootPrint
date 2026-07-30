package com.infosys.carbonfootprint.dto;

import lombok.*;

/**
 * DTO returned after successful login — contains the JWT token and basic user info.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {

    private String token;
    private String tokenType;
    private Long userId;
    private String fullName;
    private String email;
    private String role;

    /**
     * Convenience constructor that defaults tokenType to "Bearer".
     */
    public AuthResponse(String token, Long userId, String fullName, String email, String role) {
        this.token = token;
        this.tokenType = "Bearer";
        this.userId = userId;
        this.fullName = fullName;
        this.email = email;
        this.role = role;
    }
}
