package com.ecommerce.ArtisticEcommerce.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import com.ecommerce.ArtisticEcommerce.entity.Admin;
import com.ecommerce.ArtisticEcommerce.repository.AdminRepository;

record ChangePasswordRequest(String currentPassword, String newPassword) {}

@RestController
@RequestMapping("/api/admin/account")
public class AdminAccountController {

    private final AdminRepository repo;
    private final BCryptPasswordEncoder enc;

    public AdminAccountController(AdminRepository repo, BCryptPasswordEncoder enc) {
        this.repo = repo;
        this.enc = enc;
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(Authentication auth, @RequestBody ChangePasswordRequest req) {
        String username = auth.getName();
        Admin admin = repo.findByUsername(username).orElseThrow();

        if (!enc.matches(req.currentPassword(), admin.getPasswordHash())) {
            return ResponseEntity.badRequest().body("Senha atual incorreta");
        }
        if (req.newPassword() == null || req.newPassword().length() < 8) {
            return ResponseEntity.badRequest().body("Nova senha inválida (mín. 8 caracteres)");
        }
        admin.setPasswordHash(enc.encode(req.newPassword()));
        repo.save(admin);
        return ResponseEntity.ok().build();
    }
}
