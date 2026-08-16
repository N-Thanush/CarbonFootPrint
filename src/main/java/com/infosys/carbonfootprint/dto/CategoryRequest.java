package com.infosys.carbonfootprint.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryRequest {

    private String categoryCode;

    @NotBlank(message = "Category name is required")
    @Size(max = 100, message = "Category name cannot exceed 100 characters")
    private String name;

    @NotBlank(message = "Description is required")
    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;

    @Size(max = 50, message = "Icon name cannot exceed 50 characters")
    private String iconName;

    @Size(max = 20, message = "Color code cannot exceed 20 characters")
    private String colorCode;

    private Integer displayOrder;

    private Boolean active;

    @Size(max = 500, message = "Remarks cannot exceed 500 characters")
    private String remarks;

    private String createdBy;
}
