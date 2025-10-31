package com.ecommerce.ArtisticEcommerce.repository;

import com.ecommerce.ArtisticEcommerce.entity.CarouselImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CarouselImageRepository extends JpaRepository<CarouselImage, Long> {
    List<CarouselImage> findAllByActiveTrueOrderByPositionAsc();
    List<CarouselImage> findAllByOrderByPositionAsc();
}
