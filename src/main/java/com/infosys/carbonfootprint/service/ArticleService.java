package com.infosys.carbonfootprint.service;

import com.infosys.carbonfootprint.dto.ApiResponse;
import com.infosys.carbonfootprint.dto.ArticleRequest;
import com.infosys.carbonfootprint.dto.ArticleResponse;
import com.infosys.carbonfootprint.entity.Article;
import com.infosys.carbonfootprint.repository.ArticleRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ArticleService {

    private final ArticleRepository articleRepository;

    public ArticleService(ArticleRepository articleRepository) {
        this.articleRepository = articleRepository;
    }

    @Transactional
    public ArticleResponse createArticle(ArticleRequest request) {
        Article article = Article.builder()
                .title(request.getTitle().trim())
                .summary(request.getSummary().trim())
                .content(request.getContent().trim())
                .category(request.getCategory() != null ? request.getCategory().trim() : "Sustainability")
                .imageUrl(request.getImageUrl() != null ? request.getImageUrl().trim() : null)
                .author(request.getAuthor() != null ? request.getAuthor().trim() : "Admin Team")
                .published(request.getPublished() != null ? request.getPublished() : true)
                .build();

        article = articleRepository.save(article);
        return toResponse(article);
    }

    @Transactional
    public ArticleResponse updateArticle(Long id, ArticleRequest request) {
        Article article = articleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Article not found with ID: " + id));

        if (request.getTitle() != null) article.setTitle(request.getTitle().trim());
        if (request.getSummary() != null) article.setSummary(request.getSummary().trim());
        if (request.getContent() != null) article.setContent(request.getContent().trim());
        if (request.getCategory() != null) article.setCategory(request.getCategory().trim());
        if (request.getImageUrl() != null) article.setImageUrl(request.getImageUrl().trim());
        if (request.getAuthor() != null) article.setAuthor(request.getAuthor().trim());
        if (request.getPublished() != null) article.setPublished(request.getPublished());

        article = articleRepository.save(article);
        return toResponse(article);
    }

    @Transactional
    public ApiResponse deleteArticle(Long id) {
        Article article = articleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Article not found with ID: " + id));
        articleRepository.delete(article);
        return ApiResponse.success("Article deleted successfully");
    }

    public Page<ArticleResponse> getAllArticlesForAdmin(Pageable pageable) {
        return articleRepository.findAll(pageable).map(this::toResponse);
    }

    public Page<ArticleResponse> getPublishedArticlesForUser(String category, Pageable pageable) {
        if (category != null && !category.trim().isEmpty()) {
            return articleRepository.findByCategoryAndPublishedTrue(category.trim(), pageable).map(this::toResponse);
        }
        return articleRepository.findByPublishedTrue(pageable).map(this::toResponse);
    }

    public ArticleResponse getArticleById(Long id) {
        Article article = articleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Article not found with ID: " + id));
        return toResponse(article);
    }

    private ArticleResponse toResponse(Article a) {
        return ArticleResponse.builder()
                .id(a.getId())
                .title(a.getTitle())
                .summary(a.getSummary())
                .content(a.getContent())
                .category(a.getCategory())
                .imageUrl(a.getImageUrl())
                .author(a.getAuthor())
                .published(a.getPublished())
                .createdAt(a.getCreatedAt())
                .updatedAt(a.getUpdatedAt())
                .build();
    }
}
