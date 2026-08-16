package com.infosys.carbonfootprint.service;

import com.infosys.carbonfootprint.dto.ActivityLogRequest;
import com.infosys.carbonfootprint.dto.ActivityLogResponse;
import com.infosys.carbonfootprint.dto.ApiResponse;
import com.infosys.carbonfootprint.entity.ActivityCategory;
import com.infosys.carbonfootprint.entity.ActivityLog;
import com.infosys.carbonfootprint.entity.ActivityType;
import com.infosys.carbonfootprint.entity.EmissionFactor;
import com.infosys.carbonfootprint.entity.User;
import com.infosys.carbonfootprint.repository.ActivityCategoryRepository;
import com.infosys.carbonfootprint.repository.ActivityLogRepository;
import com.infosys.carbonfootprint.repository.ActivityTypeRepository;
import com.infosys.carbonfootprint.repository.EmissionFactorRepository;
import com.infosys.carbonfootprint.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Optional;

@Service
public class UserActivityLogService {

    private final ActivityLogRepository activityLogRepository;
    private final ActivityTypeRepository activityTypeRepository;
    private final ActivityCategoryRepository categoryRepository;
    private final EmissionFactorRepository emissionFactorRepository;
    private final UserRepository userRepository;

    public UserActivityLogService(ActivityLogRepository activityLogRepository,
                                  ActivityTypeRepository activityTypeRepository,
                                  ActivityCategoryRepository categoryRepository,
                                  EmissionFactorRepository emissionFactorRepository,
                                  UserRepository userRepository) {
        this.activityLogRepository = activityLogRepository;
        this.activityTypeRepository = activityTypeRepository;
        this.categoryRepository = categoryRepository;
        this.emissionFactorRepository = emissionFactorRepository;
        this.userRepository = userRepository;
    }

    /**
     * Module 4 & 5: Record user daily activity and calculate carbon emission
     * Formula: Carbon Emission = Quantity × Emission Factor
     */
    @Transactional
    public ActivityLogResponse createActivityLog(Long userId, ActivityLogRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        ActivityType activityType = activityTypeRepository.findById(request.getActivityTypeId())
                .orElseThrow(() -> new IllegalArgumentException("Activity type not found with ID: " + request.getActivityTypeId()));

        ActivityCategory category = activityType.getCategory();
        LocalDate activityDate = request.getActivityDate() != null ? request.getActivityDate() : LocalDate.now();

        // Module 5: Fetch active emission factor for activity type on log date
        Optional<EmissionFactor> factorOpt = emissionFactorRepository
                .findActiveFactorForActivityAndDate(activityType.getId(), activityDate);

        if (factorOpt.isEmpty()) {
            factorOpt = emissionFactorRepository
                    .findFirstByActivityTypeIdAndActiveTrueOrderByEffectiveFromDesc(activityType.getId());
        }

        double factorValue = factorOpt.map(EmissionFactor::getKgCo2PerUnit).orElse(0.1);

        // Calculate Carbon Emission = Quantity * Emission Factor
        double rawEmission = request.getQuantity() * factorValue;
        double totalEmission = Math.round(rawEmission * 100.0) / 100.0;

        String unit = request.getUnit() != null && !request.getUnit().trim().isEmpty()
                ? request.getUnit().trim()
                : activityType.getUnit();

        ActivityLog log = ActivityLog.builder()
                .user(user)
                .category(category)
                .activityType(activityType)
                .quantity(request.getQuantity())
                .unit(unit)
                .emissionFactor(factorValue)
                .totalEmission(totalEmission)
                .kgCo2e(totalEmission)
                .activityDate(activityDate)
                .logDate(activityDate)
                .notes(request.getNotes() != null ? request.getNotes().trim() : null)
                .active(request.getActive() != null ? request.getActive() : true)
                .build();

        log = activityLogRepository.save(log);
        return toResponse(log);
    }

    /**
     * Update an existing activity log entry and re-calculate carbon emission
     */
    @Transactional
    public ActivityLogResponse updateActivityLog(Long id, Long userId, ActivityLogRequest request) {
        ActivityLog log = activityLogRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Activity log entry not found with ID: " + id));

        if (!log.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Unauthorized to modify activity log entry ID: " + id);
        }

        ActivityType activityType = activityTypeRepository.findById(request.getActivityTypeId())
                .orElseThrow(() -> new IllegalArgumentException("Activity type not found with ID: " + request.getActivityTypeId()));

        ActivityCategory category = activityType.getCategory();
        LocalDate activityDate = request.getActivityDate() != null ? request.getActivityDate() : log.getActivityDate();

        Optional<EmissionFactor> factorOpt = emissionFactorRepository
                .findActiveFactorForActivityAndDate(activityType.getId(), activityDate);

        if (factorOpt.isEmpty()) {
            factorOpt = emissionFactorRepository
                    .findFirstByActivityTypeIdAndActiveTrueOrderByEffectiveFromDesc(activityType.getId());
        }

        double factorValue = factorOpt.map(EmissionFactor::getKgCo2PerUnit).orElse(log.getEmissionFactor() != null ? log.getEmissionFactor() : 0.1);
        double rawEmission = request.getQuantity() * factorValue;
        double totalEmission = Math.round(rawEmission * 100.0) / 100.0;

        String unit = request.getUnit() != null && !request.getUnit().trim().isEmpty()
                ? request.getUnit().trim()
                : activityType.getUnit();

        log.setCategory(category);
        log.setActivityType(activityType);
        log.setQuantity(request.getQuantity());
        log.setUnit(unit);
        log.setEmissionFactor(factorValue);
        log.setTotalEmission(totalEmission);
        log.setKgCo2e(totalEmission);
        log.setActivityDate(activityDate);
        log.setLogDate(activityDate);
        if (request.getNotes() != null) log.setNotes(request.getNotes().trim());
        if (request.getActive() != null) log.setActive(request.getActive());

        log = activityLogRepository.save(log);
        return toResponse(log);
    }

    /**
     * Delete an activity log entry
     */
    @Transactional
    public ApiResponse deleteActivityLog(Long id, Long userId) {
        ActivityLog log = activityLogRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Activity log entry not found with ID: " + id));

        User currentUser = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        if (!log.getUser().getId().equals(userId) && currentUser.getRole() != com.infosys.carbonfootprint.enums.Role.ADMIN) {
            throw new IllegalArgumentException("Unauthorized to delete activity log entry ID: " + id);
        }

        try {
            activityLogRepository.delete(log);
        } catch (Exception ex) {
            log.setActive(false);
            activityLogRepository.save(log);
        }
        return ApiResponse.success("Activity log entry deleted successfully");
    }

    /**
     * Module 6: View Activity History with Search/Filter by Date & Category
     */
    public Page<ActivityLogResponse> getUserActivityHistory(Long userId, LocalDate date, Long categoryId, Pageable pageable) {
        return activityLogRepository.findUserLogsFiltered(userId, categoryId, date, pageable)
                .map(this::toResponse);
    }

    /**
     * Get all activity logs for Admin auditing
     */
    public Page<ActivityLogResponse> getAllActivityLogs(Pageable pageable) {
        return activityLogRepository.findAll(pageable).map(this::toResponse);
    }

    private ActivityLogResponse toResponse(ActivityLog log) {
        ActivityCategory cat = log.getCategory() != null ? log.getCategory() : log.getActivityType().getCategory();
        return ActivityLogResponse.builder()
                .id(log.getId())
                .userId(log.getUser().getId())
                .userEmail(log.getUser().getEmail())
                .userFullName(log.getUser().getFullName())
                .categoryId(cat.getId())
                .categoryName(cat.getName())
                .categoryCode(cat.getCategoryCode())
                .colorCode(cat.getColorCode())
                .iconName(cat.getIconName())
                .activityTypeId(log.getActivityType().getId())
                .activityTypeName(log.getActivityType().getName())
                .activityCode(log.getActivityType().getActivityCode())
                .quantity(log.getQuantity())
                .unit(log.getUnit())
                .emissionFactor(log.getEmissionFactor())
                .totalEmission(log.getTotalEmission())
                .activityDate(log.getActivityDate())
                .activityDateIso(log.getActivityDate() != null ? log.getActivityDate().toString() : null)
                .notes(log.getNotes())
                .active(log.getActive())
                .createdAt(log.getCreatedAt())
                .updatedAt(log.getUpdatedAt())
                .build();
    }
}
