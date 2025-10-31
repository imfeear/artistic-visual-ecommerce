package com.ecommerce.ArtisticEcommerce.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ecommerce.ArtisticEcommerce.dto.ProductDto;
import com.ecommerce.ArtisticEcommerce.entity.Product;
import com.ecommerce.ArtisticEcommerce.repository.ProductRepository;

@Service
@Transactional
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public List<Product> findAll() {
        return productRepository.findAll();
    }

    public Product findById(Long id) {
        return productRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Produto não encontrado com o ID: " + id));
    }

    public Product create(ProductDto dto) {
        Product p = new Product();
        p.setName(dto.getName());
        p.setDescription(dto.getDescription());
        p.setPrice(dto.getPrice());
        p.setImageUrl(dto.getImageUrl());
        p.setAvailable(dto.isAvailable());
        return productRepository.save(p);
    }

    public Product update(Long id, ProductDto dto) {
        Product p = findById(id);
        p.setName(dto.getName());
        p.setDescription(dto.getDescription());
        p.setPrice(dto.getPrice());
        p.setImageUrl(dto.getImageUrl());
        p.setAvailable(dto.isAvailable());
        return productRepository.save(p);
    }

    public void delete(Long id) {
        Product p = findById(id);
        productRepository.delete(p);
    }
}
