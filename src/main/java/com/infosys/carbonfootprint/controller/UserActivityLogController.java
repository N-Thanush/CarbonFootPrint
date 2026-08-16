package com.infosys.carbonfootprint.controller;

import com.infosys.carbonfootprint.dto.ActivityLogRequest;
import com.infosys.carbonfootprint.dto.ActivityLogResponse;
import com.infosys.carbonfootprint.dto.ActivityTypeResponse;
import com.infosys.carbonfootprint.dto.ApiResponse;
import com.infosys.carbonfootprint.dto.CategoryResponse;
import com.infosys.carbonfootprint.entity.User;
import com.infosys.carbonfootprint.repository.UserRepository;
import com.infosys.carbonfootprint.service.AdminActivityTypeService;
import com.infosys.carbonfootprint.service.AdminCategoryService;
import com.infosys.carbonfootprint.service.UserActivityLogService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/user")
public class UserActivityLogController {

    private final UserActivityLogService activityLogService;
    private final AdminCategoryService categoryService;
    private final AdminActivityTypeService activityTypeService;
    private final UserRepository userRepository;

    public UserActivityLogController(UserActivityLogService activityLogService,
                                     AdminCategoryService categoryService,
                                     AdminActivityTypeService activityTypeService,
                                     UserRepository userRepository) {
        this.activityLogService = activityLogService;
        this.categoryService = categoryService;
        this.activityTypeService = activityTypeService;
        this.userRepository = userRepository;
    }

    private Long getUserIdFromAuth(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalArgumentException("User authentication required");
        }
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found: " + email));
        return user.getId();
    }

    /**
     * Get active categories for user category cards grid
     */
    @GetMapping("/categories")
    public ResponseEntity<Page<CategoryResponse>> getCategories() {
        PageRequest pageRequest = PageRequest.of(0, 100, Sort.by("displayOrder").ascending());
        return ResponseEntity.ok(categoryService.getActiveCategories(pageRequest));
    }

    /**
     * Get active activity types (optionally filtered by category ID)
     */
    @GetMapping("/activity-types")
    public ResponseEntity<Page<ActivityTypeResponse>> getActivityTypes(
            @RequestParam(required = false) Long categoryId) {
        PageRequest pageRequest = PageRequest.of(0, 100, Sort.by("name").ascending());
        return ResponseEntity.ok(activityTypeService.getActiveActivityTypes(categoryId, pageRequest));
    }

    /**
     * Module 4 & 5: Record daily activity log with automatic carbon emission calculation
     */
    @PostMapping("/activities")
    public ResponseEntity<ActivityLogResponse> createActivity(
            Authentication authentication,
            @Valid @RequestBody ActivityLogRequest request) {
        Long userId = getUserIdFromAuth(authentication);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(activityLogService.createActivityLog(userId, request));
    }

    /**
     * Module 6: Get user activity history with search/filter by date and category
     */
    @GetMapping("/activities")
    public ResponseEntity<Page<ActivityLogResponse>> getActivityHistory(
            Authentication authentication,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long userId = getUserIdFromAuth(authentication);
        PageRequest pageRequest = PageRequest.of(page, size);
        return ResponseEntity.ok(activityLogService.getUserActivityHistory(userId, date, categoryId, pageRequest));
    }

    /**
     * Module 6: Update an activity log entry
     */
    @PutMapping("/activities/{id}")
    public ResponseEntity<ActivityLogResponse> updateActivity(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody ActivityLogRequest request) {
        Long userId = getUserIdFromAuth(authentication);
        return ResponseEntity.ok(activityLogService.updateActivityLog(id, userId, request));
    }

    /**
     * Module 6: Delete an activity log entry
     */
    @DeleteMapping("/activities/{id}")
    public ResponseEntity<ApiResponse> deleteActivity(
            Authentication authentication,
            @PathVariable Long id) {
        Long userId = getUserIdFromAuth(authentication);
        return ResponseEntity.ok(activityLogService.deleteActivityLog(id, userId));
    }
}
