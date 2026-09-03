package com.infosys.carbonfootprint.controller;

import com.infosys.carbonfootprint.dto.ApiResponse;
import com.infosys.carbonfootprint.dto.GoalRequest;
import com.infosys.carbonfootprint.dto.GoalResponse;
import com.infosys.carbonfootprint.entity.User;
import com.infosys.carbonfootprint.repository.UserRepository;
import com.infosys.carbonfootprint.service.GoalService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user/goals")
public class GoalController {

    private final GoalService goalService;
    private final UserRepository userRepository;

    public GoalController(GoalService goalService, UserRepository userRepository) {
        this.goalService = goalService;
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

    @PostMapping
    public ResponseEntity<GoalResponse> createGoal(
            Authentication authentication,
            @Valid @RequestBody GoalRequest request) {
        Long userId = getUserIdFromAuth(authentication);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(goalService.createGoal(userId, request));
    }

    @GetMapping
    public ResponseEntity<List<GoalResponse>> getUserGoals(Authentication authentication) {
        Long userId = getUserIdFromAuth(authentication);
        return ResponseEntity.ok(goalService.getUserGoals(userId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<GoalResponse> updateGoal(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody GoalRequest request) {
        Long userId = getUserIdFromAuth(authentication);
        return ResponseEntity.ok(goalService.updateGoal(id, userId, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteGoal(
            Authentication authentication,
            @PathVariable Long id) {
        Long userId = getUserIdFromAuth(authentication);
        return ResponseEntity.ok(goalService.deleteGoal(id, userId));
    }
}
