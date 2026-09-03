package com.infosys.carbonfootprint.repository;

import com.infosys.carbonfootprint.entity.Article;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ArticleRepository extends JpaRepository<Article, Long> {

    Page<Article> findByPublishedTrue(Pageable pageable);

    Page<Article> findByCategoryAndPublishedTrue(String category, Pageable pageable);
}
