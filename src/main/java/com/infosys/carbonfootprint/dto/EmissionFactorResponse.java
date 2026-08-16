package com.infosys.carbonfootprint.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmissionFactorResponse {

    private Long id;
    private Long categoryId;
    private Long activityTypeId;
    private String activityTypeName;
    private String categoryName;
    private String unit;
    private Double kgCo2PerUnit;
    private String source;
    private String sourceVersion;
    private LocalDate effectiveFrom;
    private LocalDate effectiveTo;
    private Boolean active;
    private String remarks;
    private String createdBy;
    private String updatedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
