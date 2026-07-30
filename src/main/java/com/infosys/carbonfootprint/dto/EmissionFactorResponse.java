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
    private Long activityTypeId;
    private String activityTypeName;
    private String categoryName;
    private String unit;
    private Double kgCo2PerUnit;
    private String source;
    private LocalDate effectiveFrom;
    private LocalDate effectiveTo;
    private Boolean active;
    private LocalDateTime createdAt;
}
