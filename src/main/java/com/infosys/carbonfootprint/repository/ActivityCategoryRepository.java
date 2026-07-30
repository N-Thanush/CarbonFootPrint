package com.infosys.carbonfootprint.repository;

import com.infosys.carbonfootprint.entity.ActivityCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ActivityCategoryRepository extends JpaRepository<ActivityCategory, Long> {

    Optional<ActivityCategory> findByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCase(String name);

    List<ActivityCategory> findByActiveTrueOrderByDisplayOrderAsc();

    Page<ActivityCategory> findByActiveTrue(Pageable pageable);

    Page<ActivityCategory> findAll(Pageable pageable);
}
