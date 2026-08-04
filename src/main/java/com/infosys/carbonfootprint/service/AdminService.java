package com.infosys.carbonfootprint.service;

import com.infosys.carbonfootprint.dto.ApiResponse;
import com.infosys.carbonfootprint.dto.UserProfileResponse;
import com.infosys.carbonfootprint.entity.User;
import com.infosys.carbonfootprint.enums.AccountStatus;
import com.infosys.carbonfootprint.repository.ActivityLogRepository;
import com.infosys.carbonfootprint.repository.GoalRepository;
import com.infosys.carbonfootprint.repository.UserBadgeRepository;
import com.infosys.carbonfootprint.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Service for admin operations — managing user approvals and rejections.
 */
@Service
public class AdminService {

    private static final Logger logger = LoggerFactory.getLogger(AdminService.class);

    private final UserRepository userRepository;
    private final EmailService emailService;
    private final ActivityLogRepository activityLogRepository;
    private final GoalRepository goalRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminService(UserRepository userRepository,
                        EmailService emailService,
                        ActivityLogRepository activityLogRepository,
                        GoalRepository goalRepository,
                        UserBadgeRepository userBadgeRepository,
                        PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.activityLogRepository = activityLogRepository;
        this.goalRepository = goalRepository;
        this.userBadgeRepository = userBadgeRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Retrieves all users with PENDING account status.
     */
    public List<UserProfileResponse> getPendingUsers() {
        return userRepository.findByAccountStatus(AccountStatus.PENDING)
                .stream()
                .map(this::toProfileResponse)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves a paginated list of users filtered by account status.
     */
    public Page<UserProfileResponse> getUsersByStatus(AccountStatus status, Pageable pageable) {
        return userRepository.findByAccountStatus(status, pageable)
                .map(this::toProfileResponse);
    }

    /**
     * Retrieves a paginated list of all users regardless of status.
     */
    public Page<UserProfileResponse> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable)
                .map(this::toProfileResponse);
    }

    /**
     * Generates a random temporary password (e.g. Temp#8x9K).
     */
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
     * Approves a user's account — changes status from PENDING to APPROVED,
     * generates a temporary password, and sends approval email with Username & Temporary Password.
     */
    @Transactional
    public ApiResponse approveUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        if (user.getAccountStatus() == AccountStatus.APPROVED) {
            return ApiResponse.success("User is already approved");
        }

        String tempPassword = generateTempPassword();
        user.setPassword(passwordEncoder.encode(tempPassword));
        user.setMustChangePassword(true);
        user.setAccountStatus(AccountStatus.APPROVED);

        userRepository.save(user);

        // Send approval email with Username and Temporary Password
        emailService.sendApprovalEmail(user, tempPassword);

        logger.info("Admin approved user: {} (ID: {}). Temporary password generated: [{}] & email sent.", user.getEmail(), userId, tempPassword);

        return ApiResponse.success("User '" + user.getFullName() + "' approved successfully! Email with Username and Temporary Password (" + tempPassword + ") sent to " + user.getEmail());
    }

    /**
     * Rejects a user's account — changes status from PENDING to REJECTED.
     */
    @Transactional
    public ApiResponse rejectUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        if (user.getAccountStatus() == AccountStatus.REJECTED) {
            return ApiResponse.success("User is already rejected");
        }

        user.setAccountStatus(AccountStatus.REJECTED);
        userRepository.save(user);

        // Send rejection email notification
        emailService.sendRejectionEmail(user);

        logger.info("Admin rejected user: {} (ID: {})", user.getEmail(), userId);

        return ApiResponse.success("User '" + user.getFullName() + "' has been rejected");
    }

    /**
     * Deletes a user record completely from the system database.
     */
    @Transactional
    public ApiResponse deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        activityLogRepository.deleteByUserId(userId);
        goalRepository.deleteByUserId(userId);
        userBadgeRepository.deleteByUserId(userId);

        userRepository.delete(user);
        logger.info("Admin deleted user record: {} (ID: {})", user.getEmail(), userId);

        return ApiResponse.success("User record for '" + user.getFullName() + "' deleted successfully");
    }

    /**
     * Maps a User entity to a UserProfileResponse DTO.
     */
    private UserProfileResponse toProfileResponse(User user) {
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
