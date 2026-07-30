package com.infosys.carbonfootprint.security;

import com.infosys.carbonfootprint.entity.User;
import com.infosys.carbonfootprint.enums.AccountStatus;
import com.infosys.carbonfootprint.enums.AuthProvider;
import com.infosys.carbonfootprint.enums.DocumentType;
import com.infosys.carbonfootprint.enums.Role;
import com.infosys.carbonfootprint.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Optional;

/**
 * Authentication success handler for Google OAuth2 logins.
 */
@Component
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private static final Logger logger = LoggerFactory.getLogger(OAuth2LoginSuccessHandler.class);

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;

    public OAuth2LoginSuccessHandler(UserRepository userRepository, JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication)
            throws IOException, ServletException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String picture = oAuth2User.getAttribute("picture");

        logger.info("Google OAuth2 login attempt for email: {}", email);

        if (email == null) {
            getRedirectStrategy().sendRedirect(request, response, "http://localhost:5173/login?error=email_not_provided");
            return;
        }

        Optional<User> userOptional = userRepository.findByEmail(email);
        User user;

        if (userOptional.isPresent()) {
            user = userOptional.get();
        } else {
            // Auto-register Google OAuth2 user
            user = User.builder()
                    .fullName(name != null ? name : "Google User")
                    .email(email.toLowerCase())
                    .profilePictureUrl(picture)
                    .documentType(DocumentType.PAN)
                    .documentNumber("GOOGLE" + System.currentTimeMillis() % 100000)
                    .role(Role.USER)
                    .accountStatus(AccountStatus.PENDING)
                    .authProvider(AuthProvider.GOOGLE)
                    .build();

            user = userRepository.save(user);
            logger.info("Auto-registered new user via Google OAuth2: {} (PENDING approval)", email);
        }

        if (user.getAccountStatus() == AccountStatus.PENDING) {
            getRedirectStrategy().sendRedirect(request, response, "http://localhost:5173/login?status=pending");
            return;
        }

        if (user.getAccountStatus() == AccountStatus.REJECTED) {
            getRedirectStrategy().sendRedirect(request, response, "http://localhost:5173/login?status=rejected");
            return;
        }

        // Generate JWT token for approved user
        String token = jwtTokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole().name());

        String redirectUrl = String.format("http://localhost:5173/login?token=%s&role=%s&name=%s",
                token, user.getRole().name(), user.getFullName());

        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}
