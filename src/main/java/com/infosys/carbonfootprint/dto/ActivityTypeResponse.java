package com.infosys.carbonfootprint.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityTypeResponse {

    private Long id;
    private Long categoryId;
    private String categoryName;
    private String activityCode;
    private String name;
    private String description;
    private String unit;
    private Double minQuantity;
    private Double maxQuantity;
    private Double defaultQuantity;
    private Integer displayOrder;
    private String icon;
    private Boolean active;
    private String remarks;
    private String createdBy;
    private String updatedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
