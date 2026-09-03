package com.infosys.carbonfootprint.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ArticleRequest {

    @NotBlank(message = "Article title is required")
    private String title;

    @NotBlank(message = "Article summary is required")
    private String summary;

    @NotBlank(message = "Article content is required")
    private String content;

    private String category;
    private String imageUrl;
    private String author;
    private Boolean published;
}
