package com.infosys.carbonfootprint.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityTypeRequest {

    @NotNull(message = "Category ID is required")
    private Long categoryId;

    private String activityCode;

    @NotBlank(message = "Activity type name is required")
    @Size(max = 100, message = "Name cannot exceed 100 characters")
    private String name;

    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;

    @NotBlank(message = "Unit is required (e.g. km, kWh, serving, item)")
    @Size(max = 30, message = "Unit cannot exceed 30 characters")
    private String unit;

    private Double minQuantity;

    private Double maxQuantity;

    private Double defaultQuantity;

    private Integer displayOrder;

    private String icon;

    private Boolean active;

    @Size(max = 500, message = "Remarks cannot exceed 500 characters")
    private String remarks;

    private String createdBy;
}
