package com.infosys.carbonfootprint.entity;

import com.infosys.carbonfootprint.enums.GoalStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Represents a user's sustainability goal.
 * Example: Reduce monthly carbon footprint by 20% from a baseline.
 */
@Entity
@Table(name = "goals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Goal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private ActivityCategory category;

    @Column(length = 150)
    private String title;

    /** Target emission limit in kg CO₂e for period */
    @Column(nullable = false)
    private Double targetLimitKgCo2;

    /** Target reduction percentage (optional, e.g., 20.0 for 20%) */
    @Builder.Default
    private Double targetReductionPercent = 0.0;

    /** Baseline carbon footprint in kg CO₂ (optional) */
    @Builder.Default
    private Double baselineKgCo2 = 0.0;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private GoalStatus status = GoalStatus.ACTIVE;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
