package com.infosys.carbonfootprint.service;

import com.infosys.carbonfootprint.dto.*;
import com.infosys.carbonfootprint.entity.User;
import com.infosys.carbonfootprint.enums.AccountStatus;
import com.infosys.carbonfootprint.enums.AuthProvider;
import com.infosys.carbonfootprint.enums.Role;
import com.infosys.carbonfootprint.repository.UserRepository;
import com.infosys.carbonfootprint.security.JwtTokenProvider;
import com.infosys.carbonfootprint.util.DocumentValidator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service handling user registration, login, and profile retrieval.
 */
@Service
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final DocumentValidator documentValidator;
    private final CaptchaService captchaService;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider jwtTokenProvider,
                       DocumentValidator documentValidator,
                       CaptchaService captchaService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.documentValidator = documentValidator;
        this.captchaService = captchaService;
    }

    /**
     * Registers a new user.
     *
     * Steps:
     * 0. Verify reCAPTCHA token
     * 1. Check if email is already registered
     * 2. Check if document number is already used
     * 3. Validate document number format (Aadhaar/PAN/Voter ID)
     * 4. Hash the password
     * 5. Save user with PENDING status
     */
    @Transactional
    public ApiResponse register(RegisterRequest request) {
        // 0. Verify reCAPTCHA token
        if (!captchaService.verifyToken(request.getCaptchaToken())) {
            throw new IllegalArgumentException("reCAPTCHA validation failed. Please complete the CAPTCHA challenge.");
        }

        // 1. Check duplicate email
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("An account with this email already exists");
        }

        // 2. Check duplicate document number
        if (userRepository.existsByDocumentNumber(request.getDocumentNumber().trim())) {
            throw new IllegalArgumentException("This document number is already registered");
        }

        // 3. Validate document format
        if (!documentValidator.isValid(request.getDocumentType(), request.getDocumentNumber())) {
            String hint = documentValidator.getFormatHint(request.getDocumentType());
            throw new IllegalArgumentException("Invalid document number format. " + hint);
        }

        // 4. Build user entity
        User user = User.builder()
                .fullName(request.getFullName().trim())
                .email(request.getEmail().trim().toLowerCase())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone().trim())
                .dateOfBirth(request.getDateOfBirth())
                .address(request.getAddress().trim())
                .organization(request.getOrganization() != null ? request.getOrganization().trim() : null)
                .profilePictureUrl(request.getProfilePictureUrl())
                .documentType(request.getDocumentType())
                .documentNumber(request.getDocumentNumber().trim().toUpperCase())
                .role(Role.USER)
                .accountStatus(AccountStatus.PENDING)
                .authProvider(AuthProvider.LOCAL)
                .build();

        // 5. Save
        userRepository.save(user);

        logger.info("New user registered: {} (status: PENDING)", user.getEmail());

        return ApiResponse.success(
                "Registration successful! Your account is pending admin approval. " +
                "You will be able to log in once approved.");
    }

    /**
     * Authenticates a user with email and password.
     *
     * Steps:
     * 1. Find user by email
     * 2. Verify password
     * 3. Check account status is APPROVED
     * 4. Generate and return JWT token
     */
    public AuthResponse login(LoginRequest request) {
        // 1. Find user
        User user = userRepository.findByEmail(request.getEmail().trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        // 2. Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        // 3. Check account status
        if (user.getAccountStatus() == AccountStatus.PENDING) {
            throw new IllegalStateException(
                    "Your account is pending admin approval. Please wait for approval before logging in.");
        }
        if (user.getAccountStatus() == AccountStatus.REJECTED) {
            throw new IllegalStateException(
                    "Your account registration has been rejected. Please contact support for more information.");
        }

        // 4. Generate JWT
        String token = jwtTokenProvider.generateToken(
                user.getId(), user.getEmail(), user.getRole().name());

        logger.info("User logged in: {}", user.getEmail());

        return new AuthResponse(token, user.getId(), user.getFullName(),
                user.getEmail(), user.getRole().name());
    }

    /**
     * Retrieves the profile of the currently authenticated user.
     */
    public UserProfileResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return UserProfileResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .dateOfBirth(user.getDateOfBirth())
                .address(user.getAddress())
                .organization(user.getOrganization())
                .profilePictureUrl(user.getProfilePictureUrl())
                .documentType(user.getDocumentType())
                .documentNumber(user.getDocumentNumber())
                .role(user.getRole())
                .accountStatus(user.getAccountStatus())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
