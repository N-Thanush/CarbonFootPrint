package com.infosys.carbonfootprint.repository;

import com.infosys.carbonfootprint.entity.Badge;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BadgeRepository extends JpaRepository<Badge, Long> {

    Optional<Badge> findByName(String name);

    Page<Badge> findByActiveTrue(Pageable pageable);
}
