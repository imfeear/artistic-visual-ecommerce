package com.ecommerce.ArtisticEcommerce.dto;

import java.util.List;
import com.ecommerce.ArtisticEcommerce.entity.Product;

public record CatalogPage(List<Product> content, long totalElements, int totalPages, int page, int size) {}
