package com.ecommerce.ArtisticEcommerce.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "admins", uniqueConstraints = @UniqueConstraint(columnNames = "username"))
public class Admin {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable=false, length=100)
    private String username;

    @Column(name="password_hash", nullable=false, length=100)
    private String passwordHash;

    @Column(nullable=false)
    private boolean enabled = true;

    @Column(nullable=false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable=false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void onUpdate(){ this.updatedAt = LocalDateTime.now(); }

    // getters/setters
    public Long getId(){ return id; }
    public String getUsername(){ return username; }
    public void setUsername(String username){ this.username = username; }
    public String getPasswordHash(){ return passwordHash; }
    public void setPasswordHash(String passwordHash){ this.passwordHash = passwordHash; }
    public boolean isEnabled(){ return enabled; }
    public void setEnabled(boolean enabled){ this.enabled = enabled; }
}
