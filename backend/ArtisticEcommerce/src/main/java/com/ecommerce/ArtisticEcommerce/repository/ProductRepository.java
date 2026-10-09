package com.ecommerce.ArtisticEcommerce.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import com.ecommerce.ArtisticEcommerce.entity.Product;

public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {
    @Query("select distinct m from Product p join p.materials m order by m")
    List<String> findMaterials();

    @Query("select min(p.price), max(p.price) from Product p")
    List<Object[]> findPriceBounds();
}
