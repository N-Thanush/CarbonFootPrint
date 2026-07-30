package com.infosys.carbonfootprint.controller;

import com.infosys.carbonfootprint.dto.*;
import com.infosys.carbonfootprint.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for authentication endpoints.
 *
 * Public endpoints:
 * - POST /api/auth/register — register a new user
 * - POST /api/auth/login — login and get JWT token
 *
 * Protected endpoint:
 * - GET /api/auth/me — get current user's profile (requires JWT)
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }
    /**
     * Register a new user account.
     *
     * The request body is validated using Bean Validation.
     * Document number format is validated by the DocumentValidator.
     * Account status is set to PENDING — requires admin approval.
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse> register(@Valid @RequestBody RegisterRequest request) {
        ApiResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Login with email and password.
     *
     * Returns a JWT token if credentials are valid AND account is APPROVED.
     * Returns 403 if account is PENDING or REJECTED.
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Get the current authenticated user's profile.
     *
     * Requires a valid JWT token in the Authorization header.
     */
    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getCurrentUser(Authentication authentication) {
        String email = authentication.getName();
        UserProfileResponse profile = authService.getCurrentUser(email);
        return ResponseEntity.ok(profile);
    }
}
