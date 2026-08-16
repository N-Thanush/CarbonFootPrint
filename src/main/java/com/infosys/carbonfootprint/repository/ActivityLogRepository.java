package com.infosys.carbonfootprint.repository;

import com.infosys.carbonfootprint.entity.ActivityLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {

    Page<ActivityLog> findByUserId(Long userId, Pageable pageable);

    List<ActivityLog> findByUserIdAndActivityDateBetween(Long userId, LocalDate startDate, LocalDate endDate);

    Page<ActivityLog> findByUserIdAndActivityDateBetween(Long userId, LocalDate startDate, LocalDate endDate, Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT a FROM ActivityLog a WHERE a.user.id = :userId " +
            "AND (a.active IS TRUE OR a.active IS NULL) " +
            "AND (:categoryId IS NULL OR a.activityType.category.id = :categoryId) " +
            "AND (:activityDate IS NULL OR a.activityDate = :activityDate) " +
            "ORDER BY a.activityDate DESC, a.createdAt DESC")
    Page<ActivityLog> findUserLogsFiltered(
            @org.springframework.data.repository.query.Param("userId") Long userId,
            @org.springframework.data.repository.query.Param("categoryId") Long categoryId,
            @org.springframework.data.repository.query.Param("activityDate") LocalDate activityDate,
            Pageable pageable);

    void deleteByUserId(Long userId);

    void deleteByActivityTypeId(Long activityTypeId);

    void deleteByCategoryId(Long categoryId);

    boolean existsByCategoryId(Long categoryId);

    boolean existsByActivityTypeId(Long activityTypeId);
}
