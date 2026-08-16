package com.infosys.carbonfootprint.repository;

import com.infosys.carbonfootprint.entity.UserBadge;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserBadgeRepository extends JpaRepository<UserBadge, Long> {

    List<UserBadge> findByUserId(Long userId);

    Page<UserBadge> findByUserId(Long userId, Pageable pageable);

    boolean existsByUserIdAndBadgeId(Long userId, Long badgeId);

    void deleteByUserId(Long userId);
}
