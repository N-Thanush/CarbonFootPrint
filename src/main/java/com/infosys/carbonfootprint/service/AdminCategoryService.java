package com.infosys.carbonfootprint.service;

import com.infosys.carbonfootprint.dto.ApiResponse;
import com.infosys.carbonfootprint.dto.CategoryRequest;
import com.infosys.carbonfootprint.dto.CategoryResponse;
import com.infosys.carbonfootprint.entity.ActivityCategory;
import com.infosys.carbonfootprint.entity.ActivityType;
import com.infosys.carbonfootprint.repository.ActivityCategoryRepository;
import com.infosys.carbonfootprint.repository.ActivityTypeRepository;
import com.infosys.carbonfootprint.repository.EmissionFactorRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AdminCategoryService {

    private final ActivityCategoryRepository categoryRepository;
    private final ActivityTypeRepository activityTypeRepository;
    private final EmissionFactorRepository emissionFactorRepository;
    private final com.infosys.carbonfootprint.repository.ActivityLogRepository activityLogRepository;

    public AdminCategoryService(ActivityCategoryRepository categoryRepository,
                                ActivityTypeRepository activityTypeRepository,
                                EmissionFactorRepository emissionFactorRepository,
                                com.infosys.carbonfootprint.repository.ActivityLogRepository activityLogRepository) {
        this.categoryRepository = categoryRepository;
        this.activityTypeRepository = activityTypeRepository;
        this.emissionFactorRepository = emissionFactorRepository;
        this.activityLogRepository = activityLogRepository;
    }

    public Page<CategoryResponse> getCategories(Pageable pageable) {
        return categoryRepository.findAll(pageable).map(this::toResponse);
    }

    public Page<CategoryResponse> getActiveCategories(Pageable pageable) {
        return categoryRepository.findByActiveTrue(pageable).map(this::toResponse);
    }

    @Transactional
    public CategoryResponse createCategory(CategoryRequest request) {
        if (categoryRepository.existsByNameIgnoreCase(request.getName().trim())) {
            throw new IllegalArgumentException("Category with name '" + request.getName() + "' already exists");
        }

        String code = request.getCategoryCode() != null && !request.getCategoryCode().trim().isEmpty()
                ? request.getCategoryCode().trim().toUpperCase()
                : request.getName().trim().replaceAll("[^a-zA-Z0-9]", "").substring(0, Math.min(3, request.getName().trim().length())).toUpperCase();

        ActivityCategory category = ActivityCategory.builder()
                .categoryCode(code)
                .name(request.getName().trim())
                .description(request.getDescription() != null ? request.getDescription().trim() : "")
                .iconName(request.getIconName() != null ? request.getIconName().trim() : "folder")
                .colorCode(request.getColorCode() != null ? request.getColorCode().trim() : "#10B981")
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                .active(request.getActive() != null ? request.getActive() : true)
                .remarks(request.getRemarks() != null ? request.getRemarks().trim() : null)
                .createdBy(request.getCreatedBy() != null ? request.getCreatedBy().trim() : "ADMIN")
                .build();

        category = categoryRepository.save(category);
        return toResponse(category);
    }

    @Transactional
    public CategoryResponse updateCategory(Long id, CategoryRequest request) {
        ActivityCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Category not found with ID: " + id));

        if (!category.getName().equalsIgnoreCase(request.getName().trim()) &&
                categoryRepository.existsByNameIgnoreCase(request.getName().trim())) {
            throw new IllegalArgumentException("Category with name '" + request.getName() + "' already exists");
        }

        if (request.getCategoryCode() != null && !request.getCategoryCode().trim().isEmpty()) {
            category.setCategoryCode(request.getCategoryCode().trim().toUpperCase());
        }
        category.setName(request.getName().trim());
        if (request.getDescription() != null) category.setDescription(request.getDescription().trim());
        if (request.getIconName() != null) category.setIconName(request.getIconName().trim());
        if (request.getColorCode() != null) category.setColorCode(request.getColorCode().trim());
        if (request.getDisplayOrder() != null) category.setDisplayOrder(request.getDisplayOrder());
        
        boolean wasActive = Boolean.TRUE.equals(category.getActive());
        if (request.getActive() != null) {
            category.setActive(request.getActive());
        }
        if (request.getRemarks() != null) category.setRemarks(request.getRemarks().trim());
        category.setUpdatedBy("ADMIN");

        category = categoryRepository.save(category);

        // Cascade active status to all activity types and emission factors in this category
        if (Boolean.TRUE.equals(category.getActive())) {
            cascadeActivateActivityTypes(category.getId());
        } else if (Boolean.FALSE.equals(category.getActive())) {
            cascadeDeactivateActivityTypes(category.getId());
        }

        return toResponse(category);
    }

    @Transactional
    public CategoryResponse toggleStatus(Long id, Boolean active) {
        ActivityCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Category not found with ID: " + id));
        boolean targetActive = active != null ? active : !category.getActive();
        category.setActive(targetActive);
        category.setUpdatedBy("ADMIN");
        category = categoryRepository.save(category);

        if (targetActive) {
            cascadeActivateActivityTypes(category.getId());
        } else {
            cascadeDeactivateActivityTypes(category.getId());
        }

        return toResponse(category);
    }

    @Transactional
    public ApiResponse deleteCategory(Long id) {
        ActivityCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Category not found with ID: " + id));
        
        boolean isReferenced = activityLogRepository.existsByCategoryId(id);
        if (isReferenced) {
            cascadeDeactivateActivityTypes(category.getId());
            category.setActive(false);
            category.setUpdatedBy("ADMIN");
            categoryRepository.save(category);
            return ApiResponse.success("Category '" + category.getName() + "' and its activity types were deactivated (retained for historical activity logs)");
        }

        List<ActivityType> types = activityTypeRepository.findByCategoryId(id);
        for (ActivityType t : types) {
            emissionFactorRepository.deleteAll(emissionFactorRepository.findByActivityTypeId(t.getId(), Pageable.unpaged()).getContent());
            activityTypeRepository.delete(t);
        }
        categoryRepository.delete(category);
        return ApiResponse.success("Category '" + category.getName() + "' and its activity types were permanently deleted");
    }

    private void cascadeActivateActivityTypes(Long categoryId) {
        List<ActivityType> types = activityTypeRepository.findByCategoryId(categoryId);
        for (ActivityType t : types) {
            t.setActive(true);
            t.setUpdatedBy("ADMIN");
            activityTypeRepository.save(t);
            List<com.infosys.carbonfootprint.entity.EmissionFactor> factors = emissionFactorRepository.findByActivityTypeId(t.getId(), Pageable.unpaged()).getContent();
            for (com.infosys.carbonfootprint.entity.EmissionFactor ef : factors) {
                ef.setActive(true);
                ef.setUpdatedBy("ADMIN");
                emissionFactorRepository.save(ef);
            }
        }
    }

    private void cascadeDeactivateActivityTypes(Long categoryId) {
        List<ActivityType> types = activityTypeRepository.findByCategoryId(categoryId);
        for (ActivityType t : types) {
            t.setActive(false);
            t.setUpdatedBy("ADMIN");
            activityTypeRepository.save(t);
            List<com.infosys.carbonfootprint.entity.EmissionFactor> factors = emissionFactorRepository.findByActivityTypeId(t.getId(), Pageable.unpaged()).getContent();
            for (com.infosys.carbonfootprint.entity.EmissionFactor ef : factors) {
                ef.setActive(false);
                ef.setUpdatedBy("ADMIN");
                emissionFactorRepository.save(ef);
            }
        }
    }

    private CategoryResponse toResponse(ActivityCategory c) {
        return CategoryResponse.builder()
                .id(c.getId())
                .categoryCode(c.getCategoryCode())
                .name(c.getName())
                .description(c.getDescription())
                .iconName(c.getIconName())
                .colorCode(c.getColorCode())
                .displayOrder(c.getDisplayOrder())
                .active(c.getActive())
                .remarks(c.getRemarks())
                .createdBy(c.getCreatedBy())
                .updatedBy(c.getUpdatedBy())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }
}
