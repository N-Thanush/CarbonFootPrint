package com.infosys.carbonfootprint.service;

import com.infosys.carbonfootprint.dto.ActivityTypeRequest;
import com.infosys.carbonfootprint.dto.ActivityTypeResponse;
import com.infosys.carbonfootprint.dto.ApiResponse;
import com.infosys.carbonfootprint.entity.ActivityCategory;
import com.infosys.carbonfootprint.entity.ActivityType;
import com.infosys.carbonfootprint.entity.EmissionFactor;
import com.infosys.carbonfootprint.repository.ActivityCategoryRepository;
import com.infosys.carbonfootprint.repository.ActivityTypeRepository;
import com.infosys.carbonfootprint.repository.EmissionFactorRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class AdminActivityTypeService {

    private final ActivityTypeRepository activityTypeRepository;
    private final ActivityCategoryRepository categoryRepository;
    private final EmissionFactorRepository emissionFactorRepository;
    private final com.infosys.carbonfootprint.repository.ActivityLogRepository activityLogRepository;

    public AdminActivityTypeService(ActivityTypeRepository activityTypeRepository,
                                    ActivityCategoryRepository categoryRepository,
                                    EmissionFactorRepository emissionFactorRepository,
                                    com.infosys.carbonfootprint.repository.ActivityLogRepository activityLogRepository) {
        this.activityTypeRepository = activityTypeRepository;
        this.categoryRepository = categoryRepository;
        this.emissionFactorRepository = emissionFactorRepository;
        this.activityLogRepository = activityLogRepository;
    }

    public Page<ActivityTypeResponse> getActivityTypes(Long categoryId, Pageable pageable) {
        if (categoryId != null) {
            return activityTypeRepository.findByCategoryId(categoryId, pageable).map(this::toResponse);
        }
        return activityTypeRepository.findAll(pageable).map(this::toResponse);
    }

    public Page<ActivityTypeResponse> getActiveActivityTypes(Long categoryId, Pageable pageable) {
        if (categoryId != null) {
            return activityTypeRepository.findByCategoryIdAndActiveTrueAndCategoryActiveTrue(categoryId, pageable).map(this::toResponse);
        }
        return activityTypeRepository.findByActiveTrueAndCategoryActiveTrue(pageable).map(this::toResponse);
    }

    @Transactional
    public ActivityTypeResponse createActivityType(ActivityTypeRequest request) {
        if (request.getCategoryId() == null) {
            throw new IllegalArgumentException("Category ID is required");
        }
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Activity type name is required");
        }
        if (request.getUnit() == null || request.getUnit().trim().isEmpty()) {
            throw new IllegalArgumentException("Unit is required");
        }

        ActivityCategory category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("Category not found with ID: " + request.getCategoryId()));

        String trimmedName = request.getName().trim();
        String trimmedUnit = request.getUnit().trim();

        if (activityTypeRepository.existsByNameIgnoreCaseAndCategoryId(trimmedName, request.getCategoryId())) {
            throw new IllegalArgumentException("Activity type '" + trimmedName + "' already exists in category '" + category.getName() + "'");
        }

        String code = request.getActivityCode() != null && !request.getActivityCode().trim().isEmpty()
                ? request.getActivityCode().trim().toUpperCase()
                : (trimmedName.length() > 0
                    ? trimmedName.replaceAll("[^a-zA-Z0-9]", "").substring(0, Math.min(4, Math.max(1, trimmedName.replaceAll("[^a-zA-Z0-9]", "").length()))).toUpperCase()
                    : "ACT");

        if (code.isEmpty()) {
            code = "ACT";
        }

        ActivityType type = ActivityType.builder()
                .category(category)
                .activityCode(code)
                .name(trimmedName)
                .description(request.getDescription() != null ? request.getDescription().trim() : null)
                .unit(trimmedUnit)
                .minQuantity(request.getMinQuantity() != null ? request.getMinQuantity() : 0.0)
                .maxQuantity(request.getMaxQuantity() != null ? request.getMaxQuantity() : 10000.0)
                .defaultQuantity(request.getDefaultQuantity() != null ? request.getDefaultQuantity() : 1.0)
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                .icon(request.getIcon() != null ? request.getIcon().trim() : "activity")
                .active(request.getActive() != null ? request.getActive() : true)
                .remarks(request.getRemarks() != null ? request.getRemarks().trim() : null)
                .createdBy(request.getCreatedBy() != null ? request.getCreatedBy().trim() : "ADMIN")
                .build();

        type = activityTypeRepository.save(type);

        // Seed a default active emission factor for this newly created activity type
        EmissionFactor defaultFactor = EmissionFactor.builder()
                .activityType(type)
                .kgCo2PerUnit(0.1)
                .unit(trimmedUnit)
                .source("Default Admin Factor")
                .effectiveFrom(LocalDate.of(2026, 1, 1))
                .active(true)
                .createdBy("ADMIN")
                .build();
        emissionFactorRepository.save(defaultFactor);

        return toResponse(type);
    }

    @Transactional
    public ActivityTypeResponse updateActivityType(Long id, ActivityTypeRequest request) {
        ActivityType type = activityTypeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Activity type not found with ID: " + id));

        if (request.getCategoryId() == null) {
            throw new IllegalArgumentException("Category ID is required");
        }

        ActivityCategory category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("Category not found with ID: " + request.getCategoryId()));

        type.setCategory(category);
        if (request.getActivityCode() != null && !request.getActivityCode().trim().isEmpty()) {
            type.setActivityCode(request.getActivityCode().trim().toUpperCase());
        }
        if (request.getName() != null && !request.getName().trim().isEmpty()) {
            type.setName(request.getName().trim());
        }
        if (request.getDescription() != null) type.setDescription(request.getDescription().trim());
        if (request.getUnit() != null && !request.getUnit().trim().isEmpty()) {
            type.setUnit(request.getUnit().trim());
        }
        if (request.getMinQuantity() != null) type.setMinQuantity(request.getMinQuantity());
        if (request.getMaxQuantity() != null) type.setMaxQuantity(request.getMaxQuantity());
        if (request.getDefaultQuantity() != null) type.setDefaultQuantity(request.getDefaultQuantity());
        if (request.getDisplayOrder() != null) type.setDisplayOrder(request.getDisplayOrder());
        if (request.getIcon() != null) type.setIcon(request.getIcon().trim());
        if (request.getActive() != null) type.setActive(request.getActive());
        if (request.getRemarks() != null) type.setRemarks(request.getRemarks().trim());
        type.setUpdatedBy("ADMIN");

        type = activityTypeRepository.save(type);
        return toResponse(type);
    }

    @Transactional
    public ApiResponse deleteActivityType(Long id) {
        ActivityType type = activityTypeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Activity type not found with ID: " + id));

        // Delete associated activity logs first to maintain relational integrity
        activityLogRepository.deleteByActivityTypeId(id);

        // Delete associated emission factors
        emissionFactorRepository.deleteByActivityTypeId(id);

        // Permanently delete the activity type
        activityTypeRepository.delete(type);
        return ApiResponse.success("Activity type '" + type.getName() + "' and its configured emission factors were permanently deleted");
    }

    private ActivityTypeResponse toResponse(ActivityType t) {
        return ActivityTypeResponse.builder()
                .id(t.getId())
                .categoryId(t.getCategory() != null ? t.getCategory().getId() : null)
                .categoryName(t.getCategory() != null ? t.getCategory().getName() : "GENERAL")
                .activityCode(t.getActivityCode())
                .name(t.getName())
                .description(t.getDescription())
                .unit(t.getUnit())
                .minQuantity(t.getMinQuantity())
                .maxQuantity(t.getMaxQuantity())
                .defaultQuantity(t.getDefaultQuantity())
                .displayOrder(t.getDisplayOrder())
                .icon(t.getIcon())
                .active(t.getActive())
                .remarks(t.getRemarks())
                .createdBy(t.getCreatedBy())
                .updatedBy(t.getUpdatedBy())
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .build();
    }
}

