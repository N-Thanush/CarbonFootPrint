package com.infosys.carbonfootprint.repository;

import com.infosys.carbonfootprint.entity.ActivityType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActivityTypeRepository extends JpaRepository<ActivityType, Long> {

    List<ActivityType> findByCategoryIdAndActiveTrue(Long categoryId);

    Page<ActivityType> findByCategoryId(Long categoryId, Pageable pageable);

    Page<ActivityType> findByActiveTrue(Pageable pageable);

    boolean existsByNameIgnoreCaseAndCategoryId(String name, Long categoryId);
}
