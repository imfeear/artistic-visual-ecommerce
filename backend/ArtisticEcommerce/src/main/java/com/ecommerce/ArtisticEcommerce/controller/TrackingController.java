package com.ecommerce.ArtisticEcommerce.controller;

import com.ecommerce.ArtisticEcommerce.entity.AccessLog;
import com.ecommerce.ArtisticEcommerce.service.AccessLogService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/track")
@CrossOrigin
public class TrackingController {

    private final AccessLogService accessLogService;

    public TrackingController(AccessLogService accessLogService) {
        this.accessLogService = accessLogService;
    }

    @PostMapping("/event")
    public ResponseEntity<Void> trackEvent(
            @RequestParam String type,
            @RequestParam(required = false) String meta,
            @RequestHeader(value = "X-Forwarded-For", required = false) String forwardedFor,
            @RequestHeader(value = "User-Agent", required = false) String ua) {

        String ip = forwardedFor != null ? forwardedFor : "unknown";

        AccessLog log = new AccessLog("/track/event", "POST", ip, ua, type, meta);
        accessLogService.save(log);

        return ResponseEntity.ok().build();
    }
}
