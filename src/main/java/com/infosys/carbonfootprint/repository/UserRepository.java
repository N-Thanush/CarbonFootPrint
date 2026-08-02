package com.infosys.carbonfootprint.repository;

import com.infosys.carbonfootprint.entity.User;
import com.infosys.carbonfootprint.enums.AccountStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for User entity.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByDocumentNumber(String documentNumber);

    List<User> findByAccountStatus(AccountStatus status);

    Optional<User> findByActivationToken(String activationToken);

    Optional<User> findByResetPasswordToken(String resetPasswordToken);

    /**
     * Paginated query for users filtered by account status.
     */
    Page<User> findByAccountStatus(AccountStatus status, Pageable pageable);
}
