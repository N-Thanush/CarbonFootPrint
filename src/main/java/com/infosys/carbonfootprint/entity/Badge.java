package com.infosys.carbonfootprint.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Badge definitions for gamification.
 * Examples: "First Log", "10 kg CO₂ Saved", "7-Day Streak".
 */
@Entity
@Table(name = "badges")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Badge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Column(length = 500)
    private String description;

    /** Icon name for frontend display */
    @Column(length = 50)
    private String iconName;

    /** Criteria description (e.g., "Log your first activity") */
    @Column(length = 500)
    private String criteria;

    /** Numeric threshold for auto-awarding (e.g., 10 for "10 kg saved") */
    private Double thresholdValue;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
