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
@Access(AccessType.FIELD)
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
    @JoinColumn(name = "category_id")
    private ActivityCategory category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "activity_type_id", nullable = false)
    private ActivityType activityType;

    /** Quantity of activity performed (e.g., 20 for 20 km) */
    @Column(nullable = false)
    private Double quantity;

    /** Unit of measurement (copied from ActivityType at log time for historical accuracy) */
    @Column(nullable = false, length = 30)
    private String unit;

    /** Emission factor value used for calculation (kg CO₂ per unit) */
    @Column(name = "emission_factor")
    private Double emissionFactor;

    /** Legacy compatibility field for older database schema */
    @Column(name = "kg_co2e", nullable = false)
    @Builder.Default
    private Double kgCo2e = 0.0;

    /** Calculated CO₂ emission in kg (quantity × emission factor) */
    @Column(name = "total_emission", nullable = false)
    private Double totalEmission;

    /** Date the activity was performed */
    @Column(name = "activity_date", nullable = false)
    private LocalDate activityDate;

    /** Legacy compatibility field for older database schema */
    @Column(name = "log_date", nullable = false)
    private LocalDate logDate;

    /** Optional notes about the activity */
    @Column(length = 500)
    private String notes;

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
        if (this.activityDate == null) {
            this.activityDate = LocalDate.now();
        }
        if (this.logDate == null) {
            this.logDate = this.activityDate;
        }
        if (this.kgCo2e == null || (this.kgCo2e == 0.0 && this.totalEmission != null)) {
            this.kgCo2e = this.totalEmission;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
        if (this.logDate == null) {
            this.logDate = this.activityDate;
        }
        if (this.kgCo2e == null || (this.kgCo2e == 0.0 && this.totalEmission != null)) {
            this.kgCo2e = this.totalEmission;
        }
    }

    public Double getKgCo2e() {
        return this.kgCo2e;
    }

    public void setKgCo2e(Double kgCo2e) {
        this.kgCo2e = kgCo2e;
    }

    public LocalDate getLogDate() {
        return this.logDate;
    }

    public void setLogDate(LocalDate logDate) {
        this.logDate = logDate;
    }
}
