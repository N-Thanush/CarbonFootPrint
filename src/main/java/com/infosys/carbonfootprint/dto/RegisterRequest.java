package com.infosys.carbonfootprint.dto;

import com.infosys.carbonfootprint.enums.DocumentType;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDate;

/**
 * DTO for user registration requests.
 * All validations are enforced via Bean Validation annotations.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterRequest {

    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 100, message = "Password must be between 8 and 100 characters")
    private String password;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^\\d{10}$", message = "Phone number must be exactly 10 digits")
    private String phone;

    @NotNull(message = "Date of birth is required")
    @Past(message = "Date of birth must be in the past")
    private LocalDate dateOfBirth;

    @NotBlank(message = "Address is required")
    @Size(max = 500, message = "Address must not exceed 500 characters")
    private String address;

    // Optional field
    @Size(max = 200, message = "Organization name must not exceed 200 characters")
    private String organization;

    // URL to profile picture (optional for now)
    private String profilePictureUrl;

    @NotNull(message = "Document type is required (AADHAAR, PAN, or VOTER_ID)")
    private DocumentType documentType;

    @NotBlank(message = "Document number is required")
    private String documentNumber;

    // Google reCAPTCHA v2 response token
    private String captchaToken;
}
