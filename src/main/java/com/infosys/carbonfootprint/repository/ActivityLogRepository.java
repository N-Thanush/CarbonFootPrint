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

    List<ActivityLog> findByUserIdAndLogDateBetween(Long userId, LocalDate startDate, LocalDate endDate);

    Page<ActivityLog> findByUserIdAndLogDateBetween(Long userId, LocalDate startDate, LocalDate endDate, Pageable pageable);
}
