package com.infosys.carbonfootprint.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityLogResponse {

    private Long id;
    private Long userId;
    private String userEmail;
    private String userFullName;

    private Long categoryId;
    private String categoryName;
    private String categoryCode;
    private String colorCode;
    private String iconName;

    private Long activityTypeId;
    private String activityTypeName;
    private String activityCode;

    private Double quantity;
    private String unit;
    private Double emissionFactor;
    private Double totalEmission;

    @JsonFormat(pattern = "dd-MM-yyyy")
    private LocalDate activityDate;

    /** ISO date string for standard processing if needed */
    private String activityDateIso;

    private String notes;
    private Boolean active;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
