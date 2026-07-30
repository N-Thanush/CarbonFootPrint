package com.infosys.carbonfootprint.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmissionFactorRequest {

    @NotNull(message = "Activity type ID is required")
    private Long activityTypeId;

    @NotNull(message = "kg CO2 per unit is required")
    @PositiveOrZero(message = "Emission factor must be positive or zero")
    private Double kgCo2PerUnit;

    @Size(max = 100, message = "Source cannot exceed 100 characters")
    private String source;

    private LocalDate effectiveFrom;
    private LocalDate effectiveTo;

    private Boolean active;
}
