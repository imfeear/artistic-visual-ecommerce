package com.ecommerce.ArtisticEcommerce.dto;

import java.util.List;

public record CatalogFilters(List<String> materials, Double minPrice, Double maxPrice, long totalProducts) {}
