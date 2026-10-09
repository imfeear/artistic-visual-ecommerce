package com.ecommerce.ArtisticEcommerce.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.*;

import java.util.List;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // Usa o serviço que lê do banco (AdminUserDetailsService)
    @Bean
    public DaoAuthenticationProvider authProvider(
            AdminUserDetailsService uds,
            BCryptPasswordEncoder enc
    ) {
        DaoAuthenticationProvider p = new DaoAuthenticationProvider();
        p.setUserDetailsService(uds);
        p.setPasswordEncoder(enc);
        return p;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, DaoAuthenticationProvider authProvider) throws Exception {
        http.csrf(csrf -> csrf.disable());
        http.cors(Customizer.withDefaults());
        http.authenticationProvider(authProvider);

        http.authorizeHttpRequests(auth -> auth
            //CORS/preflight
            .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

            //tracking público
            .requestMatchers(HttpMethod.POST, "/track/event").permitAll()

            //catálogo público (GET)
            .requestMatchers(HttpMethod.GET, "/api/products", "/api/products/**").permitAll()
            .requestMatchers(HttpMethod.GET, "/uploads/**").permitAll()
            .requestMatchers(HttpMethod.POST, "/api/uploads").authenticated() 

            // público
            .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/carousel").permitAll()
            // admin
            .requestMatchers("/api/carousel/all").hasRole("ADMIN")
            .requestMatchers(org.springframework.http.HttpMethod.PUT, "/api/carousel").hasRole("ADMIN")

            //mutações de produto: só ADMIN
            .requestMatchers(HttpMethod.POST,   "/api/products/**").hasRole("ADMIN")
            .requestMatchers(HttpMethod.PUT,    "/api/products/**").hasRole("ADMIN")
            .requestMatchers(HttpMethod.DELETE, "/api/products/**").hasRole("ADMIN")

            //endpoints REST de conta do admin: só ADMIN
            .requestMatchers("/api/admin/**").hasRole("ADMIN")

            //rota do SPA/admin e /error ficam públicos
            .requestMatchers("/admin/**", "/error").permitAll()

            //qualquer outra coisa exige auth
            .anyRequest().authenticated()
        );

        http.httpBasic(Customizer.withDefaults());
        return http.build();
    }

    // CORS p/ Vite
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration c = new CorsConfiguration();
        c.setAllowedOrigins(List.of("http://localhost:5173", "http://127.0.0.1:5173"));
        c.setAllowedMethods(List.of("GET","POST","PUT","DELETE","OPTIONS"));
        c.setAllowedHeaders(List.of("Authorization","Content-Type","Accept","Origin","X-Requested-With"));
        c.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource s = new UrlBasedCorsConfigurationSource();
        s.registerCorsConfiguration("/**", c);
        return s;
    }
}
