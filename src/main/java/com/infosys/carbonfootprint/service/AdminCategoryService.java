package com.infosys.carbonfootprint.service;

import com.infosys.carbonfootprint.dto.ApiResponse;
import com.infosys.carbonfootprint.dto.CategoryRequest;
import com.infosys.carbonfootprint.dto.CategoryResponse;
import com.infosys.carbonfootprint.entity.ActivityCategory;
import com.infosys.carbonfootprint.repository.ActivityCategoryRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminCategoryService {

    private final ActivityCategoryRepository categoryRepository;

    public AdminCategoryService(ActivityCategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public Page<CategoryResponse> getCategories(Pageable pageable) {
        return categoryRepository.findAll(pageable).map(this::toResponse);
    }

    @Transactional
    public CategoryResponse createCategory(CategoryRequest request) {
        if (categoryRepository.existsByNameIgnoreCase(request.getName().trim())) {
            throw new IllegalArgumentException("Category with name '" + request.getName() + "' already exists");
        }

        ActivityCategory category = ActivityCategory.builder()
                .name(request.getName().trim())
                .description(request.getDescription() != null ? request.getDescription().trim() : null)
                .iconName(request.getIconName() != null ? request.getIconName().trim() : "folder")
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                .active(request.getActive() != null ? request.getActive() : true)
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

        category.setName(request.getName().trim());
        if (request.getDescription() != null) category.setDescription(request.getDescription().trim());
        if (request.getIconName() != null) category.setIconName(request.getIconName().trim());
        if (request.getDisplayOrder() != null) category.setDisplayOrder(request.getDisplayOrder());
        if (request.getActive() != null) category.setActive(request.getActive());

        category = categoryRepository.save(category);
        return toResponse(category);
    }

    @Transactional
    public ApiResponse deleteCategory(Long id) {
        ActivityCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Category not found with ID: " + id));
        category.setActive(false);
        categoryRepository.save(category);
        return ApiResponse.success("Category '" + category.getName() + "' deactivated successfully");
    }

    private CategoryResponse toResponse(ActivityCategory c) {
        return CategoryResponse.builder()
                .id(c.getId())
                .name(c.getName())
                .description(c.getDescription())
                .iconName(c.getIconName())
                .displayOrder(c.getDisplayOrder())
                .active(c.getActive())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
