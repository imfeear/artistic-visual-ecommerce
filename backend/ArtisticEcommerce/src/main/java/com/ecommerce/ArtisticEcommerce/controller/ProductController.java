package com.ecommerce.ArtisticEcommerce.controller;

import java.util.List;

import com.ecommerce.ArtisticEcommerce.dto.ProductDto;
import com.ecommerce.ArtisticEcommerce.dto.CatalogPage;
import com.ecommerce.ArtisticEcommerce.dto.CatalogFilters;
import com.ecommerce.ArtisticEcommerce.entity.Product;
import com.ecommerce.ArtisticEcommerce.service.ProductService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/products")
@CrossOrigin
public class ProductController {

    private final ProductService productService;
    public ProductController(ProductService productService) { this.productService = productService; }

    @GetMapping
    public ResponseEntity<List<Product>> list() { return ResponseEntity.ok(productService.findAll()); }

    @GetMapping("/catalog")
    public CatalogPage catalog(
        @RequestParam(name = "busca", required = false) String search,
        @RequestParam(name = "categoria", defaultValue = "") List<String> categories,
        @RequestParam(name = "status", defaultValue = "") List<String> statuses,
        @RequestParam(name = "material", defaultValue = "") List<String> materials,
        @RequestParam(name = "min", required = false) Double min,
        @RequestParam(name = "max", required = false) Double max,
        @RequestParam(name = "ordem", defaultValue = "recent") String order,
        @RequestParam(name = "pagina", defaultValue = "1") int page,
        @RequestParam(name = "tamanho", defaultValue = "12") int size) {
        return productService.catalog(search, categories, statuses, materials, min, max, order, page, size);
    }

    @GetMapping("/filters")
    public CatalogFilters filters() { return productService.filters(); }

    @GetMapping("/{id}")
    public ResponseEntity<Product> get(@PathVariable Long id) { return ResponseEntity.ok(productService.findById(id)); }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Product> create(@RequestBody ProductDto dto) { return ResponseEntity.ok(productService.create(dto)); }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Product> update(@PathVariable Long id, @RequestBody ProductDto dto) { return ResponseEntity.ok(productService.update(id, dto)); }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) { productService.delete(id); return ResponseEntity.noContent().build(); }
}

