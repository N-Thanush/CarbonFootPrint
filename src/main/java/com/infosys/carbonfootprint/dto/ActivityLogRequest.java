package com.infosys.carbonfootprint.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityLogRequest {

    @NotNull(message = "Activity type ID is required")
    private Long activityTypeId;

    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be greater than zero")
    private Double quantity;

    @Size(max = 30, message = "Unit cannot exceed 30 characters")
    private String unit;

    @NotNull(message = "Activity date is required")
    private LocalDate activityDate;

    @Size(max = 500, message = "Notes cannot exceed 500 characters")
    private String notes;

    private Boolean active;
}
