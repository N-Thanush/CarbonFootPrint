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
import org.springframework.web.multipart.MultipartFile;
import java.util.Map;

/**
 * REST controller for authentication and user account endpoints.
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
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse> register(@Valid @RequestBody RegisterRequest request) {
        ApiResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Set password via activation token after Admin approval.
     */
    @PostMapping("/set-password")
    public ResponseEntity<ApiResponse> setPassword(@Valid @RequestBody SetPasswordRequest request) {
        ApiResponse response = authService.setPassword(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Request password reset token via email.
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        ApiResponse response = authService.forgotPassword(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Reset password using reset token.
     */
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        ApiResponse response = authService.resetPassword(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Upload document proof file (PDF / Image).
     * Saves file to project uploads directory and returns full view URL.
     */
    @PostMapping("/upload-document")
    public ResponseEntity<Map<String, String>> uploadDocument(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
            }

            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }

            String cleanFileName = System.currentTimeMillis() + "_" + (originalFilename != null ? originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_") : "doc" + extension);

            java.nio.file.Path uploadDir = java.nio.file.Paths.get("uploads", "documents");
            if (!java.nio.file.Files.exists(uploadDir)) {
                java.nio.file.Files.createDirectories(uploadDir);
            }

            java.nio.file.Path filePath = uploadDir.resolve(cleanFileName);
            java.nio.file.Files.copy(file.getInputStream(), filePath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);

            String fileUrl = "http://localhost:8080/api/auth/documents/" + cleanFileName;
            return ResponseEntity.ok(Map.of(
                "url", fileUrl,
                "fileName", originalFilename != null ? originalFilename : cleanFileName
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to store file: " + e.getMessage()));
        }
    }

    /**
     * Serve uploaded document proof files (PDF, JPG, PNG).
     */
    @GetMapping("/documents/{filename:.+}")
    public ResponseEntity<org.springframework.core.io.Resource> getDocument(@PathVariable String filename) {
        try {
            java.nio.file.Path filePath = java.nio.file.Paths.get("uploads", "documents").resolve(filename).normalize();
            org.springframework.core.io.Resource resource = new org.springframework.core.io.UrlResource(filePath.toUri());

            if (!resource.exists()) {
                return ResponseEntity.notFound().build();
            }

            String contentType = "application/octet-stream";
            if (filename.toLowerCase().endsWith(".pdf")) contentType = "application/pdf";
            else if (filename.toLowerCase().endsWith(".png")) contentType = "image/png";
            else if (filename.toLowerCase().endsWith(".jpg") || filename.toLowerCase().endsWith(".jpeg")) contentType = "image/jpeg";

            return ResponseEntity.ok()
                    .header(org.springframework.http.HttpHeaders.CONTENT_TYPE, contentType)
                    .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Login with email and password.
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Get the current authenticated user's profile.
     */
    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getCurrentUser(Authentication authentication) {
        String email = authentication.getName();
        UserProfileResponse profile = authService.getCurrentUser(email);
        return ResponseEntity.ok(profile);
    }
}
