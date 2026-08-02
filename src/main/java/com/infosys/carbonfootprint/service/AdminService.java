package com.infosys.carbonfootprint.service;

import com.infosys.carbonfootprint.dto.ApiResponse;
import com.infosys.carbonfootprint.dto.UserProfileResponse;
import com.infosys.carbonfootprint.entity.User;
import com.infosys.carbonfootprint.enums.AccountStatus;
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

/**
 * Service for admin operations — managing user approvals and rejections.
 */
@Service
public class AdminService {

    private static final Logger logger = LoggerFactory.getLogger(AdminService.class);

    private final UserRepository userRepository;
    private final EmailService emailService;

    public AdminService(UserRepository userRepository, EmailService emailService) {
        this.userRepository = userRepository;
        this.emailService = emailService;
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
     * Approves a user's account — changes status from PENDING to APPROVED
     * and sends an approval email with activation link token.
     */
    @Transactional
    public ApiResponse approveUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        if (user.getAccountStatus() == AccountStatus.APPROVED) {
            return ApiResponse.success("User is already approved");
        }

        user.setAccountStatus(AccountStatus.APPROVED);

        // Generate activation token for password setup if password is not set
        String token = UUID.randomUUID().toString();
        user.setActivationToken(token);
        user.setActivationTokenExpiry(LocalDateTime.now().plusHours(24));

        userRepository.save(user);

        // Send approval email with set password activation link
        emailService.sendApprovalEmail(user, token);

        logger.info("Admin approved user: {} (ID: {}). Activation email sent.", user.getEmail(), userId);

        return ApiResponse.success("User '" + user.getFullName() + "' approved successfully! An email with activation link has been sent to " + user.getEmail());
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
