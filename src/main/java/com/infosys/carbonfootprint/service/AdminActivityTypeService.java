package com.infosys.carbonfootprint.service;

import com.infosys.carbonfootprint.dto.ActivityTypeRequest;
import com.infosys.carbonfootprint.dto.ActivityTypeResponse;
import com.infosys.carbonfootprint.dto.ApiResponse;
import com.infosys.carbonfootprint.entity.ActivityCategory;
import com.infosys.carbonfootprint.entity.ActivityType;
import com.infosys.carbonfootprint.repository.ActivityCategoryRepository;
import com.infosys.carbonfootprint.repository.ActivityTypeRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminActivityTypeService {

    private final ActivityTypeRepository activityTypeRepository;
    private final ActivityCategoryRepository categoryRepository;

    public AdminActivityTypeService(ActivityTypeRepository activityTypeRepository,
                                    ActivityCategoryRepository categoryRepository) {
        this.activityTypeRepository = activityTypeRepository;
        this.categoryRepository = categoryRepository;
    }

    public Page<ActivityTypeResponse> getActivityTypes(Long categoryId, Pageable pageable) {
        if (categoryId != null) {
            return activityTypeRepository.findByCategoryId(categoryId, pageable).map(this::toResponse);
        }
        return activityTypeRepository.findAll(pageable).map(this::toResponse);
    }

    @Transactional
    public ActivityTypeResponse createActivityType(ActivityTypeRequest request) {
        ActivityCategory category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("Category not found with ID: " + request.getCategoryId()));

        if (activityTypeRepository.existsByNameIgnoreCaseAndCategoryId(request.getName().trim(), request.getCategoryId())) {
            throw new IllegalArgumentException("Activity type '" + request.getName() + "' already exists in category '" + category.getName() + "'");
        }

        ActivityType type = ActivityType.builder()
                .category(category)
                .name(request.getName().trim())
                .description(request.getDescription() != null ? request.getDescription().trim() : null)
                .unit(request.getUnit().trim())
                .active(request.getActive() != null ? request.getActive() : true)
                .build();

        type = activityTypeRepository.save(type);
        return toResponse(type);
    }

    @Transactional
    public ActivityTypeResponse updateActivityType(Long id, ActivityTypeRequest request) {
        ActivityType type = activityTypeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Activity type not found with ID: " + id));

        ActivityCategory category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("Category not found with ID: " + request.getCategoryId()));

        type.setCategory(category);
        type.setName(request.getName().trim());
        if (request.getDescription() != null) type.setDescription(request.getDescription().trim());
        type.setUnit(request.getUnit().trim());
        if (request.getActive() != null) type.setActive(request.getActive());

        type = activityTypeRepository.save(type);
        return toResponse(type);
    }

    @Transactional
    public ApiResponse deleteActivityType(Long id) {
        ActivityType type = activityTypeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Activity type not found with ID: " + id));
        type.setActive(false);
        activityTypeRepository.save(type);
        return ApiResponse.success("Activity type '" + type.getName() + "' deactivated successfully");
    }

    private ActivityTypeResponse toResponse(ActivityType t) {
        return ActivityTypeResponse.builder()
                .id(t.getId())
                .categoryId(t.getCategory().getId())
                .categoryName(t.getCategory().getName())
                .name(t.getName())
                .description(t.getDescription())
                .unit(t.getUnit())
                .active(t.getActive())
                .createdAt(t.getCreatedAt())
                .build();
    }
}
