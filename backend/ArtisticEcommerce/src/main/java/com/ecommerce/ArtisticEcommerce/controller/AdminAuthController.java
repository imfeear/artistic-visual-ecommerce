package com.ecommerce.ArtisticEcommerce.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin // opcional (já temos CORS global)
public class AdminAuthController {

    @GetMapping("/check")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> check() {
        return ResponseEntity.noContent().build(); // 204
    }
}
