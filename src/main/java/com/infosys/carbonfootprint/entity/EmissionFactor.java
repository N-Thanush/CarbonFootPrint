package com.infosys.carbonfootprint.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Configurable emission factor linking an activity type to its CO₂ output.
 * Example: Car → 0.21 kg CO₂ per km (source: EPA).
 * Admin can update factors without changing application code.
 */
@Entity
@Table(name = "emission_factors")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmissionFactor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "activity_type_id", nullable = false)
    private ActivityType activityType;

    /** kg of CO₂ equivalent per unit of activity */
    @Column(nullable = false)
    private Double kgCo2PerUnit;

    /** Data source (e.g., "EPA", "IPCC", "India CEA") */
    @Column(length = 100)
    private String source;

    /** Date range for which this factor is valid */
    private LocalDate effectiveFrom;
    private LocalDate effectiveTo;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

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
