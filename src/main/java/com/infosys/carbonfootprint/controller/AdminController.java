package com.infosys.carbonfootprint.controller;

import com.infosys.carbonfootprint.dto.ApiResponse;
import com.infosys.carbonfootprint.dto.UserProfileResponse;
import com.infosys.carbonfootprint.enums.AccountStatus;
import com.infosys.carbonfootprint.service.AdminService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for admin operations.
 *
 * All endpoints require ROLE_ADMIN (enforced by SecurityConfig).
 *
 * Endpoints:
 * - GET  /api/admin/users/pending     — list all pending user registrations
 * - GET  /api/admin/users             — paginated list of users (optional status filter)
 * - PUT  /api/admin/users/{id}/approve — approve a user
 * - PUT  /api/admin/users/{id}/reject  — reject a user
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    /**
     * Get all users with PENDING account status.
     */
    @GetMapping("/users/pending")
    public ResponseEntity<List<UserProfileResponse>> getPendingUsers() {
        List<UserProfileResponse> pendingUsers = adminService.getPendingUsers();
        return ResponseEntity.ok(pendingUsers);
    }

    /**
     * Paginated endpoint for listing users.
     *
     * Query params:
     *   status — PENDING, APPROVED, REJECTED, or ALL (default: ALL)
     *   page   — zero-based page index (default: 0)
     *   size   — page size (default: 10)
     *
     * Returns a Spring Page JSON with content[], totalElements, totalPages, etc.
     */
    @GetMapping("/users")
    public ResponseEntity<Page<UserProfileResponse>> getUsers(
            @RequestParam(defaultValue = "ALL") String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<UserProfileResponse> result;
        if ("ALL".equalsIgnoreCase(status)) {
            result = adminService.getAllUsers(pageRequest);
        } else {
            AccountStatus accountStatus = AccountStatus.valueOf(status.toUpperCase());
            result = adminService.getUsersByStatus(accountStatus, pageRequest);
        }

        return ResponseEntity.ok(result);
    }

    /**
     * Approve a user's account — allows them to log in.
     */
    @PutMapping("/users/{id}/approve")
    public ResponseEntity<ApiResponse> approveUser(@PathVariable Long id) {
        ApiResponse response = adminService.approveUser(id);
        return ResponseEntity.ok(response);
    }

    /**
     * Reject a user's account — blocks them from logging in.
     */
    @PutMapping("/users/{id}/reject")
    public ResponseEntity<ApiResponse> rejectUser(@PathVariable Long id) {
        ApiResponse response = adminService.rejectUser(id);
        return ResponseEntity.ok(response);
    }
}
