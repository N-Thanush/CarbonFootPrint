package com.infosys.carbonfootprint.repository;

import com.infosys.carbonfootprint.entity.Goal;
import com.infosys.carbonfootprint.enums.GoalStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GoalRepository extends JpaRepository<Goal, Long> {

    Page<Goal> findByUserId(Long userId, Pageable pageable);

    List<Goal> findByUserIdAndStatus(Long userId, GoalStatus status);

    Optional<Goal> findFirstByUserIdAndStatusOrderByCreatedAtDesc(Long userId, GoalStatus status);
}
