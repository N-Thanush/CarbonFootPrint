package com.infosys.carbonfootprint.dto;

import com.infosys.carbonfootprint.enums.AccountStatus;
import com.infosys.carbonfootprint.enums.DocumentType;
import com.infosys.carbonfootprint.enums.Role;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO for returning user profile data (excludes password and sensitive internals).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileResponse {

    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private LocalDate dateOfBirth;
    private String gender;
    private String designation;
    private String industryType;
    private String address;
    private String country;
    private String state;
    private String organization;
    private String documentFileUrl;
    private String profilePictureUrl;
    private DocumentType documentType;
    private String documentNumber;
    private Role role;
    private AccountStatus accountStatus;
    private LocalDateTime createdAt;
}
