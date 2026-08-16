package com.infosys.carbonfootprint.config;

import com.infosys.carbonfootprint.security.JwtAuthenticationFilter;
import com.infosys.carbonfootprint.security.OAuth2LoginSuccessHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Spring Security configuration.
 *
 * - Stateless sessions (JWT-based, no cookies)
 * - Public endpoints: /api/auth/register, /api/auth/login, / (health check),
 * /oauth2/**
 * - Admin endpoints: /api/admin/** require ROLE_ADMIN
 * - All other endpoints require authentication
 * - CORS configured for React dev servers (localhost:3000 and localhost:5173)
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

        private final JwtAuthenticationFilter jwtAuthenticationFilter;
        private final OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;

        public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter,
                        OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler) {
                this.jwtAuthenticationFilter = jwtAuthenticationFilter;
                this.oAuth2LoginSuccessHandler = oAuth2LoginSuccessHandler;
        }

        @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
                http
                                // Disable CSRF since we use stateless JWT
                                .csrf(csrf -> csrf.disable())

                                // Enable CORS
                                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                                // Disable frameOptions to allow inline iframe preview of document proof files
                                .headers(headers -> headers.frameOptions(frame -> frame.disable()))

                                // Stateless session — no server-side session
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                                // Authorization rules
                                .authorizeHttpRequests(auth -> auth
                                                // Public endpoints — no auth required
                                                .requestMatchers("/api/auth/register", "/api/auth/login", "/api/auth/set-password", "/api/auth/forgot-password", "/api/auth/reset-password", "/api/auth/upload-document", "/api/auth/documents/**").permitAll()
                                                .requestMatchers(HttpMethod.GET, "/").permitAll()
                                                .requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll()

                                                // Admin-only endpoints
                                                .requestMatchers("/api/admin/**").hasRole("ADMIN")

                                                // Everything else requires authentication
                                                .anyRequest().authenticated())

                                // Optional OAuth2 Google Login
                                .oauth2Login(oauth2 -> oauth2
                                                .successHandler(oAuth2LoginSuccessHandler))

                                // Add JWT filter before Spring's UsernamePasswordAuthenticationFilter
                                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

                return http.build();
        }

        /**
         * BCrypt password encoder for hashing passwords.
         */
        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }

        /**
         * CORS configuration for React frontend development servers.
         */
        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration configuration = new CorsConfiguration();
                configuration.setAllowedOriginPatterns(List.of(
                                "http://localhost:*",
                                "http://127.0.0.1:*"
                ));
                configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
                configuration.setAllowedHeaders(List.of("*"));
                configuration.setAllowCredentials(true);
                configuration.setMaxAge(3600L);

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", configuration);
                return source;
        }
}
