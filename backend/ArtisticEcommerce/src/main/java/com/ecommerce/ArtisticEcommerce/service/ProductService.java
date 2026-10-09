package com.ecommerce.ArtisticEcommerce.service;

import java.util.List;
import java.util.LinkedHashSet;
import java.util.Locale;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import com.ecommerce.ArtisticEcommerce.dto.CatalogPage;
import com.ecommerce.ArtisticEcommerce.dto.CatalogFilters;

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
        var products = productRepository.findAll();
        products.forEach(product -> product.getMaterials().size());
        return products;
    }

    public Product findById(Long id) {
        var product = productRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Produto não encontrado com o ID: " + id));
        product.getMaterials().size();
        return product;
    }

    public Product create(ProductDto dto) {
        Product p = new Product();
        apply(p, dto, true);
        return productRepository.save(p);
    }

    public Product update(Long id, ProductDto dto) {
        Product p = findById(id);
        apply(p, dto, false);
        return productRepository.save(p);
    }

    private void apply(Product p, ProductDto dto, boolean creating) {
        ProductCatalog.requireCategory(dto.getCategory());
        ProductCatalog.require(dto.getName() != null && !dto.getName().isBlank() && dto.getName().length() <= 160, "Informe um nome de até 160 caracteres.");
        ProductCatalog.require(Double.isFinite(dto.getPrice()) && dto.getPrice() >= 0, "Informe um preço válido.");
        p.setName(dto.getName());
        p.setDescription(dto.getDescription());
        p.setPrice(dto.getPrice());
        p.setImageUrl(dto.getImageUrl());
        p.setCategory(dto.getCategory());
        if (dto.getAvailability() != null) {
            ProductCatalog.require(ProductCatalog.AVAILABILITIES.contains(dto.getAvailability()), "Disponibilidade inválida.");
            p.setAvailability(dto.getAvailability());
            p.setAvailable(!"sold-out".equals(dto.getAvailability()));
        } else if (dto.getAvailable() != null || creating) {
            boolean available = Boolean.TRUE.equals(dto.getAvailable());
            if (creating || available != p.isAvailable()) p.setAvailability(available ? "available" : "sold-out");
            p.setAvailable(available);
        }
        if (dto.getFeatured() != null) p.setFeatured(dto.getFeatured());
        if (dto.getMaterials() != null) {
            ProductCatalog.require(dto.getMaterials().size() <= 12, "Cadastre até 12 materiais ou técnicas.");
            var values = new LinkedHashSet<String>();
            for (String material : dto.getMaterials()) {
                ProductCatalog.require(material != null && !material.isBlank() && material.length() <= 80, "Materiais devem ter entre 1 e 80 caracteres.");
                values.add(material.strip().replaceAll("\\s+", " ").toLowerCase(Locale.ROOT));
            }
            p.setMaterials(values);
        }
    }

    @Transactional(readOnly = true)
    public CatalogPage catalog(String search, List<String> categories, List<String> statuses, List<String> materials,
                               Double min, Double max, String order, int page, int size) {
        ProductCatalog.require(page >= 1 && size >= 1 && size <= 48, "Paginação inválida.");
        ProductCatalog.require(categories.stream().allMatch(ProductCatalog.CATEGORIES::contains), "Categoria inválida.");
        ProductCatalog.require(statuses.stream().allMatch(ProductCatalog.AVAILABILITIES::contains), "Disponibilidade inválida.");
        ProductCatalog.require(min == null || Double.isFinite(min) && min >= 0, "Preço mínimo inválido.");
        ProductCatalog.require(max == null || Double.isFinite(max) && max >= 0, "Preço máximo inválido.");
        ProductCatalog.require(min == null || max == null || min <= max, "O preço mínimo deve ser menor ou igual ao máximo.");
        ProductCatalog.require(search == null || search.length() <= 160, "A busca deve ter até 160 caracteres.");
        ProductCatalog.require(materials.size() <= 12 && materials.stream().allMatch(m -> m.length() <= 80), "Filtro de materiais inválido.");
        Specification<Product> spec = ProductCatalog.matching(search, categories, statuses, materials, min, max);
        Sort sort = switch (order) {
            case "recent" -> Sort.by(Sort.Direction.DESC, "id");
            case "price-up" -> Sort.by("price").ascending().and(Sort.by("id").descending());
            case "price-down" -> Sort.by("price").descending().and(Sort.by("id").descending());
            case "name" -> Sort.by("name").ascending().and(Sort.by("id").descending());
            case "featured" -> Sort.by("featured").descending().and(Sort.by("id").descending());
            default -> throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "Ordenação inválida.");
        };
        // Normalize null legacy flags in the ordering expression without rewriting old rows.
        if ("featured".equals(order)) {
            spec = spec.and((root, query, cb) -> {
                if (query.getResultType() != Long.class) query.orderBy(cb.desc(cb.coalesce(root.<Boolean>get("featured"), false)), cb.desc(root.get("id")));
                return cb.conjunction();
            });
            sort = Sort.unsorted();
        }
        var result = productRepository.findAll(spec, PageRequest.of(page - 1, size, sort));
        int effectivePage = Math.max(1, Math.min(page, result.getTotalPages()));
        if (effectivePage != page) result = productRepository.findAll(spec, PageRequest.of(effectivePage - 1, size, sort));
        result.getContent().forEach(product -> product.getMaterials().size());
        return new CatalogPage(result.getContent(), result.getTotalElements(), result.getTotalPages(), effectivePage, size);
    }

    @Transactional(readOnly = true)
    public CatalogFilters filters() {
        Object[] bounds = productRepository.findPriceBounds().getFirst();
        return new CatalogFilters(productRepository.findMaterials(), (Double) bounds[0], (Double) bounds[1], productRepository.count());
    }

    public void delete(Long id) {
        Product p = findById(id);
        productRepository.delete(p);
    }
}
