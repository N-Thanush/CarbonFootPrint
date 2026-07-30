package com.infosys.carbonfootprint.controller;

import com.infosys.carbonfootprint.dto.ActivityTypeRequest;
import com.infosys.carbonfootprint.dto.ActivityTypeResponse;
import com.infosys.carbonfootprint.dto.ApiResponse;
import com.infosys.carbonfootprint.service.AdminActivityTypeService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/activity-types")
public class AdminActivityTypeController {

    private final AdminActivityTypeService activityTypeService;

    public AdminActivityTypeController(AdminActivityTypeService activityTypeService) {
        this.activityTypeService = activityTypeService;
    }

    @GetMapping
    public ResponseEntity<Page<ActivityTypeResponse>> getActivityTypes(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("name").ascending());
        return ResponseEntity.ok(activityTypeService.getActivityTypes(categoryId, pageRequest));
    }

    @PostMapping
    public ResponseEntity<ActivityTypeResponse> createActivityType(@Valid @RequestBody ActivityTypeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(activityTypeService.createActivityType(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ActivityTypeResponse> updateActivityType(@PathVariable Long id, @Valid @RequestBody ActivityTypeRequest request) {
        return ResponseEntity.ok(activityTypeService.updateActivityType(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteActivityType(@PathVariable Long id) {
        return ResponseEntity.ok(activityTypeService.deleteActivityType(id));
    }
}
