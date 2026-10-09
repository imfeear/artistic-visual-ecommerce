package com.ecommerce.ArtisticEcommerce.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import com.ecommerce.ArtisticEcommerce.entity.Admin;
import com.ecommerce.ArtisticEcommerce.repository.AdminRepository;

import java.util.List;

@Configuration
public class AdminSeeder implements CommandLineRunner {

    @Value("${app.admin.user:admin}")
    private String seedUser;

    @Value("${app.admin.password:elefante10}")
    private String seedPass;

    private final AdminRepository repo;
    private final BCryptPasswordEncoder enc;

    public AdminSeeder(AdminRepository repo, BCryptPasswordEncoder enc) {
        this.repo = repo;
        this.enc = enc;
    }

    @Override
    public void run(String... args) {
        List<Admin> all = repo.findAll();

        if (all.isEmpty()) {
            Admin a = new Admin();
            a.setUsername(seedUser);
            a.setPasswordHash(enc.encode(seedPass));
            a.setEnabled(true);
            repo.save(a);
            System.out.println("[ADMIN] Criado admin inicial: " + seedUser);
            return;
        }

        // Garante apenas 1 habilitado
        boolean first = true;
        for (Admin a : all) {
            if (first) {
                if (!a.isEnabled()) { a.setEnabled(true); repo.save(a); }
                first = false;
            } else if (a.isEnabled()) {
                a.setEnabled(false);
                repo.save(a);
            }
        }
    }
}
