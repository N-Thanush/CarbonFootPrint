package com.infosys.carbonfootprint.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlertDTO {

    private String categoryName;
    private String alertLevel; // WARNING, CRITICAL, INFO
    private String title;
    private String message;
    private String recommendation;
    private Double currentEmissionKgCo2;
    private Double limitKgCo2;
}
