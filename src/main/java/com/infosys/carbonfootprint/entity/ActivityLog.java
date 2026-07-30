package com.infosys.carbonfootprint.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Records a user's daily activity and calculated carbon emission.
 * Example: User drove 20 km by car → 4.2 kg CO₂e.
 */
@Entity
@Table(name = "activity_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "activity_type_id", nullable = false)
    private ActivityType activityType;

    /** Quantity of activity performed (e.g., 20 for 20 km) */
    @Column(nullable = false)
    private Double quantity;

    /** Unit of measurement (copied from ActivityType at log time for historical accuracy) */
    @Column(nullable = false, length = 30)
    private String unit;

    /** Calculated CO₂ emission in kg (quantity × emission factor) */
    @Column(nullable = false)
    private Double kgCo2e;

    /** Date the activity was performed */
    @Column(nullable = false)
    private LocalDate logDate;

    /** Optional notes about the activity */
    @Column(length = 500)
    private String notes;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
