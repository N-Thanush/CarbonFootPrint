package com.infosys.carbonfootprint.entity;

import com.infosys.carbonfootprint.enums.AccountStatus;
import com.infosys.carbonfootprint.enums.AuthProvider;
import com.infosys.carbonfootprint.enums.DocumentType;
import com.infosys.carbonfootprint.enums.Role;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * JPA entity representing a registered user in the Carbon Footprint system.
 * Maps to the "users" table in PostgreSQL.
 */
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String email;

    // Nullable for OAuth2 users who don't set a password
    private String password;

    @Column(length = 15)
    private String phone;

    private LocalDate dateOfBirth;

    @Column(columnDefinition = "TEXT")
    private String address;

    private String country;

    private String state;

    // Optional — for corporate/organization users
    private String organization;

    private String gender;

    private String designation;

    private String industryType;

    // File path or URL of the uploaded document proof
    private String documentFileUrl;

    // Activation & Password Reset Tokens
    private String activationToken;

    private LocalDateTime activationTokenExpiry;

    private String resetPasswordToken;

    private LocalDateTime resetPasswordTokenExpiry;

    // URL or file path to the profile picture
    private String profilePictureUrl;

    @Enumerated(EnumType.STRING)
    private DocumentType documentType;

    private String documentNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Role role = Role.USER;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private AccountStatus accountStatus = AccountStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private AuthProvider authProvider = AuthProvider.LOCAL;

    @Column(nullable = false)
    @Builder.Default
    private Boolean mustChangePassword = false;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
