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
    private String name;
    private String description;
    private String iconName;
    private Integer displayOrder;
    private Boolean active;
    private LocalDateTime createdAt;
}
