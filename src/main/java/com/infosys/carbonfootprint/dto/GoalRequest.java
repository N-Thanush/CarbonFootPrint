package com.infosys.carbonfootprint.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoalRequest {

    private String title;

    private Long categoryId;

    @NotNull(message = "Target limit in kg CO2 is required")
    @Positive(message = "Target limit must be positive")
    private Double targetLimitKgCo2;

    private Double targetReductionPercent;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;
}
