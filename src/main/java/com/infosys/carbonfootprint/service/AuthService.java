package com.infosys.carbonfootprint.service;

import com.infosys.carbonfootprint.dto.*;
import com.infosys.carbonfootprint.entity.User;
import com.infosys.carbonfootprint.enums.AccountStatus;
import com.infosys.carbonfootprint.enums.AuthProvider;
import com.infosys.carbonfootprint.enums.Role;
import com.infosys.carbonfootprint.repository.UserRepository;
import com.infosys.carbonfootprint.security.JwtTokenProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Service handling user registration, login, profile retrieval, account activation, and password reset.
 */
@Service
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final CaptchaService captchaService;
    private final EmailService emailService;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider jwtTokenProvider,
                       CaptchaService captchaService,
                       EmailService emailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.captchaService = captchaService;
        this.emailService = emailService;
    }

    private String generateTempPassword() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
        StringBuilder sb = new StringBuilder("Temp#");
        java.security.SecureRandom random = new java.security.SecureRandom();
        for (int i = 0; i < 6; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }

    /**
     * Registers a new user.
     *
     * Steps:
     * 0. Verify reCAPTCHA token
     * 1. Check if email is already registered
     * 2. Check if document number is already used
     * 3. Validate document number format (Aadhaar/PAN/Voter ID)
     * 4. Save user with PENDING status (Password is set after Admin approval via Email link)
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

        // 3. Generate initial temporary password placeholder for user
        String tempPassword = generateTempPassword();
        String encodedPassword = passwordEncoder.encode(tempPassword);

        // 4. Build user entity
        User user = User.builder()
                .fullName(request.getFullName().trim())
                .email(request.getEmail().trim().toLowerCase())
                .password(encodedPassword)
                .mustChangePassword(true)
                .phone(request.getPhone().trim())
                .dateOfBirth(request.getDateOfBirth())
                .gender(request.getGender() != null ? request.getGender().trim() : null)
                .designation(request.getDesignation() != null ? request.getDesignation().trim() : null)
                .industryType(request.getIndustryType() != null ? request.getIndustryType().trim() : null)
                .address(request.getAddress().trim())
                .country(request.getCountry() != null ? request.getCountry().trim() : null)
                .state(request.getState() != null ? request.getState().trim() : null)
                .organization(request.getOrganization() != null ? request.getOrganization().trim() : null)
                .documentFileUrl(request.getDocumentFileUrl())
                .profilePictureUrl(request.getProfilePictureUrl())
                .documentType(request.getDocumentType())
                .documentNumber(request.getDocumentNumber() != null && !request.getDocumentNumber().trim().isEmpty() ? request.getDocumentNumber().trim().toUpperCase() : "NOT_PROVIDED")
                .role(Role.USER)
                .accountStatus(AccountStatus.PENDING)
                .authProvider(AuthProvider.LOCAL)
                .build();

        // 6. Save
        userRepository.save(user);

        logger.info("New user registered: {} (status: PENDING)", user.getEmail());

        return ApiResponse.success(
                "Registration successful! Your profile & document proof have been submitted for admin approval. " +
                "Once approved by the administrator, an email with your Username and Temporary Password will be sent to " + user.getEmail() + ".");
    }

    /**
     * Sets user password via activation token (after Admin approval).
     */
    @Transactional
    public ApiResponse setPassword(SetPasswordRequest request) {
        User user = userRepository.findByActivationToken(request.getToken())
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired activation link token."));

        if (user.getActivationTokenExpiry() != null && user.getActivationTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Activation token has expired. Please contact support or request a new link.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setMustChangePassword(false);
        user.setActivationToken(null);
        user.setActivationTokenExpiry(null);
        user.setAccountStatus(AccountStatus.APPROVED);

        userRepository.save(user);

        logger.info("Password set successfully for user: {}", user.getEmail());
        return ApiResponse.success("Password set successfully! You can now log in to your account.");
    }

    /**
     * Initiates Forgot Password flow by sending reset token link to user's email.
     */
    @Transactional
    public ApiResponse forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail().trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("No account found with this email address."));

        String resetToken = UUID.randomUUID().toString();
        user.setResetPasswordToken(resetToken);
        user.setResetPasswordTokenExpiry(LocalDateTime.now().plusHours(2));

        userRepository.save(user);

        emailService.sendForgotPasswordEmail(user, resetToken);

        logger.info("Password reset token generated and email sent for: {}", user.getEmail());
        return ApiResponse.success("If an account exists with this email, a password reset link has been sent.");
    }

    /**
     * Resets user password using reset token.
     */
    @Transactional
    public ApiResponse resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByResetPasswordToken(request.getToken())
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired password reset token."));

        if (user.getResetPasswordTokenExpiry() != null && user.getResetPasswordTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Password reset token has expired. Please request a new password reset link.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setMustChangePassword(false);
        user.setResetPasswordToken(null);
        user.setResetPasswordTokenExpiry(null);

        userRepository.save(user);

        logger.info("Password reset successfully for user: {}", user.getEmail());
        return ApiResponse.success("Password reset successfully! You may now log in with your new password.");
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
        if (user.getPassword() == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        // 3. Check account status
        if (user.getAccountStatus() == AccountStatus.PENDING) {
            throw new IllegalStateException(
                    "Your account is pending admin approval. Please wait for approval email before logging in.");
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
                user.getEmail(), user.getRole().name(),
                Boolean.TRUE.equals(user.getMustChangePassword()));
    }

    /**
     * Changes user's password and clears mustChangePassword flag.
     */
    @Transactional
    public ApiResponse changePassword(String email, ChangePasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("New password and confirm password do not match.");
        }

        User user = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + email));

        user.setPassword(passwordEncoder.encode(request.getNewPassword().trim()));
        user.setMustChangePassword(false);
        userRepository.save(user);

        logger.info("Password changed successfully for user: {}", user.getEmail());
        return ApiResponse.success("Password changed successfully!");
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
                .gender(user.getGender())
                .designation(user.getDesignation())
                .industryType(user.getIndustryType())
                .address(user.getAddress())
                .country(user.getCountry())
                .state(user.getState())
                .organization(user.getOrganization())
                .documentFileUrl(user.getDocumentFileUrl())
                .profilePictureUrl(user.getProfilePictureUrl())
                .documentType(user.getDocumentType())
                .documentNumber(user.getDocumentNumber())
                .role(user.getRole())
                .accountStatus(user.getAccountStatus())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
