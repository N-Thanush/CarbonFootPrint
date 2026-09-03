package com.infosys.carbonfootprint.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.infosys.carbonfootprint.enums.GoalStatus;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoalResponse {

    private Long id;
    private Long userId;
    private Long categoryId;
    private String categoryName;
    private String categoryCode;
    private String title;
    private Double targetLimitKgCo2;
    private Double currentEmissionKgCo2;
    private Double progressPercentage;

    @JsonFormat(pattern = "dd-MM-yyyy")
    private LocalDate startDate;

    @JsonFormat(pattern = "dd-MM-yyyy")
    private LocalDate endDate;

    private GoalStatus status;
    private String statusMessage;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
