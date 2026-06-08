package com.tritux.rh.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .headers(headers -> headers
                .frameOptions(frame -> frame.sameOrigin())
            )
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .authorizeHttpRequests(auth -> auth
                // ── Routes publiques (site web Tritux, sans token) ────────
                .requestMatchers(HttpMethod.GET,  "/api/job-offers").permitAll()
                .requestMatchers(HttpMethod.GET,  "/api/job-offers/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/candidats-externes/apply").permitAll()

                // ── Callback Google OAuth2 ────────────────────────────────
                .requestMatchers(HttpMethod.POST, "/api/calendar/oauth/callback").permitAll()

                // ── Avatars publics (utilisés dans <img src> sans token) ──
                .requestMatchers(HttpMethod.GET,  "/api/profile/avatar/**").permitAll()

                // ── Fichiers chat publics (images/fichiers dans le chat) ──
                .requestMatchers(HttpMethod.GET,  "/api/chat/files/**").permitAll()

                // ── SSE chat : nécessite auth mais pas de Bearer classique ─
                // Spring gère correctement le token via le query param ?token ou header
                .requestMatchers("/api/chat/stream").authenticated()

                // ── Routes protégées (Studio RH interne) ─────────────────
                .requestMatchers("/api/candidats-externes/*/cv").authenticated()
                .requestMatchers("/api/candidats-externes/*/cv-download").authenticated()
                .requestMatchers("/api/**").authenticated()
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> {})
            );

        return http.build();
    }
}