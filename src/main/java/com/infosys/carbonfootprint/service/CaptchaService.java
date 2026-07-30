package com.infosys.carbonfootprint.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * Service to verify Google reCAPTCHA v2 tokens.
 */
@Service
public class CaptchaService {

    private static final Logger logger = LoggerFactory.getLogger(CaptchaService.class);
    private static final String GOOGLE_RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

    @Value("${app.recaptcha.secret-key:6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe}")
    private String secretKey;

    @Value("${app.recaptcha.enabled:true}")
    private boolean enabled;

    private final RestTemplate restTemplate = new RestTemplate();

    public boolean verifyToken(String responseToken) {
        if (!enabled) {
            logger.info("reCAPTCHA validation disabled in application configuration");
            return true;
        }

        // Allow test tokens or dev bypass
        if ("test_token".equalsIgnoreCase(responseToken) || "dev_pass".equalsIgnoreCase(responseToken)) {
            logger.info("reCAPTCHA test token received — auto-passing validation");
            return true;
        }

        if (responseToken == null || responseToken.trim().isEmpty()) {
            logger.warn("reCAPTCHA token is missing");
            return false;
        }

        try {
            String url = String.format("%s?secret=%s&response=%s",
                    GOOGLE_RECAPTCHA_VERIFY_URL, secretKey, responseToken);

            @SuppressWarnings("unchecked")
            Map<String, Object> googleResponse = restTemplate.postForObject(url, null, Map.class);

            if (googleResponse != null && Boolean.TRUE.equals(googleResponse.get("success"))) {
                logger.info("reCAPTCHA validation successful");
                return true;
            } else {
                logger.warn("reCAPTCHA validation failed: {}", googleResponse);
                return false;
            }
        } catch (Exception e) {
            logger.error("Error connecting to Google reCAPTCHA verification API: {}", e.getMessage());
            // Fallback for development if network fails or invalid key
            return true;
        }
    }
}
