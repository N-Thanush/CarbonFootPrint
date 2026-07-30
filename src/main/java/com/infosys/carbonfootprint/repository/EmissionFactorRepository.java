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

    Page<EmissionFactor> findByActiveTrue(Pageable pageable);

    /** Get the currently active emission factor for an activity type */
    Optional<EmissionFactor> findFirstByActivityTypeIdAndActiveTrueOrderByEffectiveFromDesc(Long activityTypeId);
}
