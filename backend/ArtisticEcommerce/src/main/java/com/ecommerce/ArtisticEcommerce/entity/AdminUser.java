package com.ecommerce.ArtisticEcommerce.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "admin_users", uniqueConstraints = @UniqueConstraint(columnNames = "username"))
public class AdminUser {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String username;

    @Column(nullable = false, length = 100)
    private String passwordHash; // BCrypt

    @Column(nullable = false, length = 80)
    private String roles; // ex: "ROLE_ADMIN"

    @Column(nullable = false)
    private boolean enabled = true;

    // getters/setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public String getRoles() { return roles; }
    public void setRoles(String roles) { this.roles = roles; }
    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
}
