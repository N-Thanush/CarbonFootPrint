package com.infosys.carbonfootprint.controller;

import com.infosys.carbonfootprint.dto.AlertDTO;
import com.infosys.carbonfootprint.dto.TopActivityDTO;
import com.infosys.carbonfootprint.entity.User;
import com.infosys.carbonfootprint.repository.UserRepository;
import com.infosys.carbonfootprint.service.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final UserRepository userRepository;

    public AnalyticsController(AnalyticsService analyticsService, UserRepository userRepository) {
        this.analyticsService = analyticsService;
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

    @GetMapping("/top-activities")
    public ResponseEntity<List<TopActivityDTO>> getTopActivities(Authentication authentication) {
        Long userId = getUserIdFromAuth(authentication);
        return ResponseEntity.ok(analyticsService.getTop5EmissionActivities(userId));
    }

    @GetMapping("/alerts")
    public ResponseEntity<List<AlertDTO>> getAlertsAndRecommendations(Authentication authentication) {
        Long userId = getUserIdFromAuth(authentication);
        return ResponseEntity.ok(analyticsService.getEmissionAlertsAndRecommendations(userId));
    }
}
