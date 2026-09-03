package com.infosys.carbonfootprint.service;

import com.infosys.carbonfootprint.dto.AlertDTO;
import com.infosys.carbonfootprint.dto.TopActivityDTO;
import com.infosys.carbonfootprint.entity.ActivityLog;
import com.infosys.carbonfootprint.entity.Goal;
import com.infosys.carbonfootprint.enums.GoalStatus;
import com.infosys.carbonfootprint.repository.ActivityLogRepository;
import com.infosys.carbonfootprint.repository.GoalRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final ActivityLogRepository activityLogRepository;
    private final GoalRepository goalRepository;

    public AnalyticsService(ActivityLogRepository activityLogRepository, GoalRepository goalRepository) {
        this.activityLogRepository = activityLogRepository;
        this.goalRepository = goalRepository;
    }

    public List<TopActivityDTO> getTop5EmissionActivities(Long userId) {
        LocalDate startOfMonth = LocalDate.now().withDayOfMonth(1);
        LocalDate endOfMonth = LocalDate.now().withDayOfMonth(LocalDate.now().lengthOfMonth());

        List<ActivityLog> logs = activityLogRepository.findByUserIdAndActivityDateBetween(userId, startOfMonth, endOfMonth);
        if (logs.isEmpty()) {
            logs = activityLogRepository.findByUserIdAndActivityDateBetween(userId, LocalDate.now().minusMonths(6), LocalDate.now());
        }

        Map<String, TopActivityDTO> activityMap = new HashMap<>();
        double grandTotal = 0.0;

        for (ActivityLog log : logs) {
            if (log.getActive() != null && !log.getActive()) continue;

            String typeName = log.getActivityType() != null ? log.getActivityType().getName() : "General Activity";
            String catName = log.getCategory() != null ? log.getCategory().getName() : (log.getActivityType() != null && log.getActivityType().getCategory() != null ? log.getActivityType().getCategory().getName() : "General");
            String color = log.getCategory() != null && log.getCategory().getColorCode() != null ? log.getCategory().getColorCode() : "#10B981";

            double emission = log.getTotalEmission() != null ? log.getTotalEmission() : 0.0;
            grandTotal += emission;

            if (activityMap.containsKey(typeName)) {
                TopActivityDTO existing = activityMap.get(typeName);
                existing.setTotalEmissionKgCo2(Math.round((existing.getTotalEmissionKgCo2() + emission) * 100.0) / 100.0);
            } else {
                activityMap.put(typeName, TopActivityDTO.builder()
                        .activityTypeName(typeName)
                        .categoryName(catName)
                        .colorCode(color)
                        .totalEmissionKgCo2(Math.round(emission * 100.0) / 100.0)
                        .build());
            }
        }

        final double finalGrandTotal = grandTotal > 0 ? grandTotal : 1.0;
        return activityMap.values().stream()
                .peek(dto -> dto.setPercentageShare(Math.round((dto.getTotalEmissionKgCo2() / finalGrandTotal) * 100.0 * 10.0) / 10.0))
                .sorted((a, b) -> Double.compare(b.getTotalEmissionKgCo2(), a.getTotalEmissionKgCo2()))
                .limit(5)
                .collect(Collectors.toList());
    }

    public List<AlertDTO> getEmissionAlertsAndRecommendations(Long userId) {
        LocalDate startOfMonth = LocalDate.now().withDayOfMonth(1);
        LocalDate endOfMonth = LocalDate.now().withDayOfMonth(LocalDate.now().lengthOfMonth());

        List<ActivityLog> logs = activityLogRepository.findByUserIdAndActivityDateBetween(userId, startOfMonth, endOfMonth);
        List<Goal> activeGoals = goalRepository.findByUserIdAndStatus(userId, GoalStatus.ACTIVE);

        Map<String, Double> categoryEmissions = new HashMap<>();
        for (ActivityLog log : logs) {
            if (log.getActive() != null && !log.getActive()) continue;
            String catName = log.getCategory() != null ? log.getCategory().getName() : "General";
            double emission = log.getTotalEmission() != null ? log.getTotalEmission() : 0.0;
            categoryEmissions.put(catName, categoryEmissions.getOrDefault(catName, 0.0) + emission);
        }

        List<AlertDTO> alerts = new ArrayList<>();

        // Default category limits if no specific goal set
        Map<String, Double> defaultLimits = Map.of(
                "Transport", 100.0,
                "Electricity", 120.0,
                "Food", 80.0,
                "Shopping", 60.0
        );

        Map<String, String> ecoRecommendations = Map.of(
                "Transport", "Your transport emissions are high. Please consider using public transit, cycling, or carpooling.",
                "Electricity", "Electricity consumption is elevated. Switch off idle devices, replace traditional bulbs with LEDs, and optimize AC usage.",
                "Food", "Food carbon footprint is high. Consider adding more plant-based meals and reducing meat consumption.",
                "Shopping", "Shopping carbon footprint is high. Consider buying eco-friendly, durable, or recycled items."
        );

        for (Map.Entry<String, Double> entry : categoryEmissions.entrySet()) {
            String category = entry.getKey();
            double emission = Math.round(entry.getValue() * 100.0) / 100.0;

            double limit = defaultLimits.getOrDefault(category, 100.0);
            for (Goal g : activeGoals) {
                if (g.getCategory() != null && g.getCategory().getName().equalsIgnoreCase(category)) {
                    limit = g.getTargetLimitKgCo2();
                }
            }

            if (emission > limit) {
                String rec = ecoRecommendations.getOrDefault(category, "Consider optimizing your daily activities under " + category + " to reduce carbon emissions.");
                alerts.add(AlertDTO.builder()
                        .categoryName(category)
                        .alertLevel(emission > (limit * 1.3) ? "CRITICAL" : "WARNING")
                        .title("High " + category + " Carbon Emissions")
                        .message("Your " + category.toLowerCase() + " emissions (" + emission + " kg CO₂e) crossed your monthly limit of " + limit + " kg CO₂e.")
                        .recommendation(rec)
                        .currentEmissionKgCo2(emission)
                        .limitKgCo2(limit)
                        .build());
            }
        }

        if (alerts.isEmpty()) {
            alerts.add(AlertDTO.builder()
                    .categoryName("Overall")
                    .alertLevel("INFO")
                    .title("Great Job!")
                    .message("Your carbon emissions are well within recommended sustainability thresholds this month.")
                    .recommendation("Keep up the great work! Log your daily activities regularly to stay eco-aware.")
                    .currentEmissionKgCo2(0.0)
                    .limitKgCo2(100.0)
                    .build());
        }

        return alerts;
    }
}
