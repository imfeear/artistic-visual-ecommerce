package com.ecommerce.ArtisticEcommerce.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@NoArgsConstructor
@AllArgsConstructor
@Data
@Entity
@Table(name = "access_logs")
public class AccessLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String path;
    private String method;
    private String ip;
    private String userAgent;
    private String eventType;
    private String metadata;
    private LocalDateTime createdAt = LocalDateTime.now();

    public AccessLog(String path, String method, String ip, String userAgent, String eventType, String metadata) {
        this.path = path;
        this.method = method;
        this.ip = ip;
        this.userAgent = userAgent;
        this.eventType = eventType;
        this.metadata = metadata;
        this.createdAt = LocalDateTime.now();
    }

    // Getters e setters omitidos para brevidade
}
