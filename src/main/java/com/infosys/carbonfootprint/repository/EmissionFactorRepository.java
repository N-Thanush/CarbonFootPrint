package com.infosys.carbonfootprint.repository;

import com.infosys.carbonfootprint.entity.EmissionFactor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmissionFactorRepository extends JpaRepository<EmissionFactor, Long> {

    Page<EmissionFactor> findByActivityTypeId(Long activityTypeId, Pageable pageable);

    Page<EmissionFactor> findByActivityType_Category_Id(Long categoryId, Pageable pageable);

    Page<EmissionFactor> findByActiveTrue(Pageable pageable);

    void deleteByActivityTypeId(Long activityTypeId);

    /** Get the currently active emission factor for an activity type */
    Optional<EmissionFactor> findFirstByActivityTypeIdAndActiveTrueOrderByEffectiveFromDesc(Long activityTypeId);

    @org.springframework.data.jpa.repository.Query("SELECT e FROM EmissionFactor e WHERE e.activityType.id = :activityTypeId AND e.active = true AND (e.effectiveFrom IS NULL OR e.effectiveFrom <= :logDate) AND (e.effectiveTo IS NULL OR e.effectiveTo >= :logDate) ORDER BY e.effectiveFrom DESC")
    Optional<EmissionFactor> findActiveFactorForActivityAndDate(@org.springframework.data.repository.query.Param("activityTypeId") Long activityTypeId, @org.springframework.data.repository.query.Param("logDate") java.time.LocalDate logDate);
}
