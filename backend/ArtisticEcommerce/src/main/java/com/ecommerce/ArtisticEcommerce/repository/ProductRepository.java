package com.ecommerce.ArtisticEcommerce.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.ecommerce.ArtisticEcommerce.entity.Product;

public interface ProductRepository extends JpaRepository <Product, Long> {
}
