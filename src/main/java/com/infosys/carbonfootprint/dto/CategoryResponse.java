package com.infosys.carbonfootprint.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryResponse {

    private Long id;
    private String categoryCode;
    private String name;
    private String description;
    private String iconName;
    private String colorCode;
    private Integer displayOrder;
    private Boolean active;
    private String remarks;
    private String createdBy;
    private String updatedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
