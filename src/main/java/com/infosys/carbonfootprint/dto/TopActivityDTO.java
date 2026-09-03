package com.infosys.carbonfootprint.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TopActivityDTO {

    private String activityTypeName;
    private String categoryName;
    private String colorCode;
    private Double totalEmissionKgCo2;
    private Double percentageShare;
}
