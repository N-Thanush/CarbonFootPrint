package com.infosys.carbonfootprint.util;

import com.infosys.carbonfootprint.enums.DocumentType;
import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

/**
 * Validates identity document numbers using regex patterns.
 *
 * Supported documents:
 * - Aadhaar: exactly 12 digits (e.g., 234567890123)
 * - PAN: 5 uppercase letters + 4 digits + 1 uppercase letter (e.g., ABCDE1234F)
 * - Voter ID: 3 uppercase letters + 7 digits (e.g., ABC1234567)
 */
@Component
public class DocumentValidator {

    private static final Pattern AADHAAR_PATTERN = Pattern.compile("^\\d{12}$");
    private static final Pattern PAN_PATTERN = Pattern.compile("^[A-Z]{5}[0-9]{4}[A-Z]$");
    private static final Pattern VOTER_ID_PATTERN = Pattern.compile("^[A-Z]{3}\\d{7}$");

    /**
     * Validates a document number against its type-specific format.
     *
     * @param documentType the type of identity document
     * @param documentNumber the document number to validate
     * @return true if the document number matches the expected format
     */
    public boolean isValid(DocumentType documentType, String documentNumber) {
        if (documentType == null || documentNumber == null || documentNumber.isBlank()) {
            return false;
        }

        String trimmed = documentNumber.trim().toUpperCase();

        return switch (documentType) {
            case AADHAAR -> AADHAAR_PATTERN.matcher(documentNumber.trim()).matches();
            case PAN -> PAN_PATTERN.matcher(trimmed).matches();
            case VOTER_ID -> VOTER_ID_PATTERN.matcher(trimmed).matches();
        };
    }

    /**
     * Returns a human-readable format description for error messages.
     */
    public String getFormatHint(DocumentType documentType) {
        return switch (documentType) {
            case AADHAAR -> "Aadhaar must be exactly 12 digits (e.g., 234567890123)";
            case PAN -> "PAN must be 5 letters + 4 digits + 1 letter (e.g., ABCDE1234F)";
            case VOTER_ID -> "Voter ID must be 3 letters + 7 digits (e.g., ABC1234567)";
        };
    }
}
