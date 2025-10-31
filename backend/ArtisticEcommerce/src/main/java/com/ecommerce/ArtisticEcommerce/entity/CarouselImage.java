package com.ecommerce.ArtisticEcommerce.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "carousel_images")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class CarouselImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false) // ex: /uploads/abc.webp
    private String url;

    @Column(nullable = false)
    private Integer position; // 1,2,3...

    @Column(nullable = false)
    private Boolean active = true;
}
