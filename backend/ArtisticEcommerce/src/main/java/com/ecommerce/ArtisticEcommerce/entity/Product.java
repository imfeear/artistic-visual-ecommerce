package com.ecommerce.ArtisticEcommerce.entity;

import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.PrePersist;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "products")
@Data
public class Product {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String description;
    private double price;

    @Lob
    @JdbcTypeCode(SqlTypes.LONGVARCHAR)
    @Column(name = "image_url")     
    private String imageUrl;
    private boolean available;

    // Nullable only for existing, unclassified products. API writes require an explicit category.
    @Column(name = "category", length = 32)
    private String category;
    private String availability;
    private Boolean featured;
    private Instant createdAt;

    @ElementCollection
    @org.hibernate.annotations.BatchSize(size = 48)
    @CollectionTable(name = "product_materials", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "material", length = 80)
    private Set<String> materials = new LinkedHashSet<>();

    public String getAvailability() {
        return availability == null ? (available ? "available" : "sold-out") : availability;
    }

    public Boolean getFeatured() {
        return Boolean.TRUE.equals(featured);
    }

    @PrePersist
    void timestamp() {
        if (createdAt == null) createdAt = Instant.now();
    }

}
