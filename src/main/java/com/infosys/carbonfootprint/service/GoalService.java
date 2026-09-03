package com.infosys.carbonfootprint.service;

import com.infosys.carbonfootprint.dto.ApiResponse;
import com.infosys.carbonfootprint.dto.GoalRequest;
import com.infosys.carbonfootprint.dto.GoalResponse;
import com.infosys.carbonfootprint.entity.ActivityCategory;
import com.infosys.carbonfootprint.entity.ActivityLog;
import com.infosys.carbonfootprint.entity.Goal;
import com.infosys.carbonfootprint.entity.User;
import com.infosys.carbonfootprint.enums.GoalStatus;
import com.infosys.carbonfootprint.repository.ActivityCategoryRepository;
import com.infosys.carbonfootprint.repository.ActivityLogRepository;
import com.infosys.carbonfootprint.repository.GoalRepository;
import com.infosys.carbonfootprint.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class GoalService {

    private final GoalRepository goalRepository;
    private final UserRepository userRepository;
    private final ActivityCategoryRepository categoryRepository;
    private final ActivityLogRepository activityLogRepository;

    public GoalService(GoalRepository goalRepository,
                       UserRepository userRepository,
                       ActivityCategoryRepository categoryRepository,
                       ActivityLogRepository activityLogRepository) {
        this.goalRepository = goalRepository;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.activityLogRepository = activityLogRepository;
    }

    @Transactional
    public GoalResponse createGoal(Long userId, GoalRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        ActivityCategory category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElse(null);
        }

        String title = request.getTitle();
        if (title == null || title.trim().isEmpty()) {
            title = category != null
                    ? "Monthly Target for " + category.getName()
                    : "Overall Monthly Emission Target";
        }

        Goal goal = Goal.builder()
                .user(user)
                .category(category)
                .title(title.trim())
                .targetLimitKgCo2(request.getTargetLimitKgCo2())
                .targetReductionPercent(request.getTargetReductionPercent() != null ? request.getTargetReductionPercent() : 0.0)
                .baselineKgCo2(0.0)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .status(GoalStatus.ACTIVE)
                .build();

        goal = goalRepository.save(goal);
        return toResponse(goal);
    }

    @Transactional(readOnly = true)
    public List<GoalResponse> getUserGoals(Long userId) {
        List<Goal> goals = goalRepository.findByUserIdAndStatus(userId, GoalStatus.ACTIVE);
        if (goals.isEmpty()) {
            goals = goalRepository.findByUserId(userId, org.springframework.data.domain.PageRequest.of(0, 50)).getContent();
        }
        return goals.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public GoalResponse updateGoal(Long goalId, Long userId, GoalRequest request) {
        Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new IllegalArgumentException("Goal not found with ID: " + goalId));

        if (!goal.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Unauthorized to modify this goal");
        }

        if (request.getTitle() != null && !request.getTitle().trim().isEmpty()) {
            goal.setTitle(request.getTitle().trim());
        }
        if (request.getTargetLimitKgCo2() != null) {
            goal.setTargetLimitKgCo2(request.getTargetLimitKgCo2());
        }
        if (request.getStartDate() != null) {
            goal.setStartDate(request.getStartDate());
        }
        if (request.getEndDate() != null) {
            goal.setEndDate(request.getEndDate());
        }

        goal = goalRepository.save(goal);
        return toResponse(goal);
    }

    @Transactional
    public ApiResponse deleteGoal(Long goalId, Long userId) {
        Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new IllegalArgumentException("Goal not found with ID: " + goalId));

        if (!goal.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Unauthorized to delete this goal");
        }

        goalRepository.delete(goal);
        return ApiResponse.success("Goal deleted successfully");
    }

    public GoalResponse toResponse(Goal goal) {
        List<ActivityLog> userLogs = activityLogRepository.findByUserIdAndActivityDateBetween(
                goal.getUser().getId(),
                goal.getStartDate(),
                goal.getEndDate()
        );

        double totalLogged = userLogs.stream()
                .filter(l -> l.getActive() == null || l.getActive())
                .filter(l -> goal.getCategory() == null || (l.getCategory() != null && l.getCategory().getId().equals(goal.getCategory().getId())))
                .mapToDouble(l -> l.getTotalEmission() != null ? l.getTotalEmission() : 0.0)
                .sum();

        totalLogged = Math.round(totalLogged * 100.0) / 100.0;
        double target = goal.getTargetLimitKgCo2() != null ? goal.getTargetLimitKgCo2() : 100.0;
        double progressPercent = Math.round((totalLogged / target) * 100.0 * 10.0) / 10.0;

        GoalStatus status = goal.getStatus();
        String message = "On track";
        if (totalLogged > target) {
            status = GoalStatus.EXCEEDED;
            message = "Target Exceeded! Consider reducing high-emission activities.";
        } else if (progressPercent >= 90.0) {
            message = "Warning: 90% of monthly budget consumed!";
        } else if (LocalDate.now().isAfter(goal.getEndDate()) && totalLogged <= target) {
            status = GoalStatus.ACHIEVED;
            message = "Goal Achieved!";
        }

        return GoalResponse.builder()
                .id(goal.getId())
                .userId(goal.getUser().getId())
                .categoryId(goal.getCategory() != null ? goal.getCategory().getId() : null)
                .categoryName(goal.getCategory() != null ? goal.getCategory().getName() : "All Categories")
                .categoryCode(goal.getCategory() != null ? goal.getCategory().getCategoryCode() : "ALL")
                .title(goal.getTitle())
                .targetLimitKgCo2(target)
                .currentEmissionKgCo2(totalLogged)
                .progressPercentage(progressPercent)
                .startDate(goal.getStartDate())
                .endDate(goal.getEndDate())
                .status(status)
                .statusMessage(message)
                .createdAt(goal.getCreatedAt())
                .updatedAt(goal.getUpdatedAt())
                .build();
    }
}
