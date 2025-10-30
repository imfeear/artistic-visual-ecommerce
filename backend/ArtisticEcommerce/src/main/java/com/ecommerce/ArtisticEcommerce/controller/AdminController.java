package com.ecommerce.ArtisticEcommerce.controller;

import com.ecommerce.ArtisticEcommerce.entity.AccessLog;
import com.ecommerce.ArtisticEcommerce.service.AccessLogService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/admin")
@CrossOrigin
public class AdminController {

    private final AccessLogService accessLogService;

    public AdminController(AccessLogService accessLogService) {
        this.accessLogService = accessLogService;
    }

    @GetMapping("/logs")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<AccessLog>> getLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        return ResponseEntity.ok(accessLogService.findAll(PageRequest.of(page, size)));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getStats() {
        Map<String, Object> resp = new HashMap<>();
        resp.put("totalAccess", accessLogService.totalAccess());
        resp.put("uniqueIps", accessLogService.uniqueIps());
        return ResponseEntity.ok(resp);
    }
}
