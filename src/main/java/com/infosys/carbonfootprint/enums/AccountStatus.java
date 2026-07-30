package com.infosys.carbonfootprint.enums;

/**
 * Represents the approval status of a user account.
 * New registrations start as PENDING and require admin approval.
 */
public enum AccountStatus {
    PENDING,
    APPROVED,
    REJECTED
}
