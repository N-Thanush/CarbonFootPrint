package com.infosys.carbonfootprint.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Specific activity types within a category.
 * Examples: Car, Bus, Train under TRANSPORT; Grid Electricity under ELECTRICITY.
 * Admin can create/manage activity types.
 */
@Entity
@Table(name = "activity_types")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private ActivityCategory category;

    @Column(length = 20)
    private String activityCode;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 500)
    private String description;

    /** Unit of measurement (e.g., "km", "kWh", "serving", "item", "kg") */
    @Column(nullable = false, length = 30)
    private String unit;

    private Double minQuantity;

    private Double maxQuantity;

    private Double defaultQuantity;

    @Builder.Default
    private Integer displayOrder = 0;

    @Column(length = 50)
    private String icon;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @Column(length = 500)
    private String remarks;

    @Column(length = 100)
    private String createdBy;

    @Column(length = 100)
    private String updatedBy;

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
