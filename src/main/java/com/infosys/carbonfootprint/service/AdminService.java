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

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for admin operations — managing user approvals and rejections.
 */
@Service
public class AdminService {

    private static final Logger logger = LoggerFactory.getLogger(AdminService.class);

    private final UserRepository userRepository;

    public AdminService(UserRepository userRepository) {
        this.userRepository = userRepository;
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
     * Approves a user's account — changes status from PENDING to APPROVED.
     */
    @Transactional
    public ApiResponse approveUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        if (user.getAccountStatus() == AccountStatus.APPROVED) {
            return ApiResponse.success("User is already approved");
        }

        user.setAccountStatus(AccountStatus.APPROVED);
        userRepository.save(user);

        logger.info("Admin approved user: {} (ID: {})", user.getEmail(), userId);

        return ApiResponse.success("User '" + user.getFullName() + "' has been approved successfully");
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

        logger.info("Admin rejected user: {} (ID: {})", user.getEmail(), userId);

        return ApiResponse.success("User '" + user.getFullName() + "' has been rejected");
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
