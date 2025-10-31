package com.ecommerce.ArtisticEcommerce.config;

import com.ecommerce.ArtisticEcommerce.entity.AdminUser;
import com.ecommerce.ArtisticEcommerce.repository.AdminUserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@Configuration
public class AdminBootstrap {

    @Bean
    CommandLineRunner initAdmin(AdminUserRepository repo, BCryptPasswordEncoder enc) {
        return args -> {
            repo.findByUsername("admin").ifPresentOrElse(u -> {}, () -> {
                String raw = System.getenv("APP_ADMIN_INIT_PASSWORD");
                if (raw == null || raw.isBlank()) {
                    System.out.println("[WARN] APP_ADMIN_INIT_PASSWORD não definido. Admin não será criado.");
                    return;
                }
                AdminUser u = new AdminUser();
                u.setUsername("admin");
                u.setPasswordHash(enc.encode(raw)); // só hash, nunca salva senha em claro
                u.setRoles("ROLE_ADMIN");
                u.setEnabled(true);
                repo.save(u);
                System.out.println("[INFO] Usuário admin criado.");
            });
        };
    }
}
