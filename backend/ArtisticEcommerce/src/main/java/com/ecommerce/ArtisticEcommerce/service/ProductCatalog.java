package com.ecommerce.ArtisticEcommerce.service;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import com.ecommerce.ArtisticEcommerce.entity.Product;

public final class ProductCatalog {
    private ProductCatalog() {}

    public static final Set<String> CATEGORIES = Set.of("brincos", "esculturas", "esculturas-biscuit",
        "decoracao", "quadros", "personalizadas", "colecionaveis", "outros-artesanatos");
    public static final Set<String> AVAILABILITIES = Set.of("available", "made-to-order", "sold-out");

    public static void require(boolean valid, String message) {
        if (!valid) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    public static void requireCategory(String category) {
        require(category != null && !category.isBlank(), "Selecione uma categoria para o produto.");
        require(CATEGORIES.contains(category), "Categoria inválida. Selecione uma das categorias disponíveis.");
    }

    public static String normalize(String text) {
        return Normalizer.normalize(text, Normalizer.Form.NFD).replaceAll("\\p{M}", "").toLowerCase(Locale.ROOT);
    }

    private static Expression<String> normalized(jakarta.persistence.criteria.CriteriaBuilder cb, Expression<String> field) {
        return cb.function("translate", String.class, cb.lower(field),
            cb.literal("áàâãäéèêëíìîïóòôõöúùûüç"), cb.literal("aaaaaeeeeiiiiooooouuuuc"));
    }

    public static Specification<Product> matching(String search, List<String> categories, List<String> statuses,
                                                   List<String> materials, Double min, Double max) {
        return (root, query, cb) -> {
            List<Predicate> conditions = new ArrayList<>();
            if (search != null && !search.isBlank()) {
                // Escape LIKE wildcards so a search is always literal text.
                String pattern = "%" + normalize(search.strip()).replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
                conditions.add(cb.or(cb.like(normalized(cb, root.get("name")), pattern, '\\'),
                    cb.like(normalized(cb, root.get("description")), pattern, '\\')));
            }
            if (!categories.isEmpty()) conditions.add(root.<String>get("category").in(categories));
            if (!statuses.isEmpty()) {
                Expression<String> legacy = cb.<String>selectCase().when(cb.isTrue(root.get("available")), "available").otherwise("sold-out");
                conditions.add(cb.coalesce(root.<String>get("availability"), legacy).in(statuses));
            }
            if (!materials.isEmpty()) {
                var materialQuery = query.subquery(Long.class);
                var product = materialQuery.from(Product.class);
                var material = product.joinSet("materials");
                materialQuery.select(product.get("id")).where(cb.equal(product.get("id"), root.get("id")),
                    normalized(cb, material.as(String.class)).in(materials.stream().map(ProductCatalog::normalize).toList()));
                conditions.add(cb.exists(materialQuery));
            }
            if (min != null) conditions.add(cb.ge(root.get("price"), min));
            if (max != null) conditions.add(cb.le(root.get("price"), max));
            return cb.and(conditions.toArray(Predicate[]::new));
        };
    }
}
