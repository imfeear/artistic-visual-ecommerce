package com.ecommerce.ArtisticEcommerce.dto;

import lombok.Data;
import java.util.Set;

@Data
public class ProductDto {

    private String name;
    private String description;
    private double price;
    private String imageUrl;
    private Boolean available;
    private String category;
    private String availability;
    private Set<String> materials;
    private Boolean featured;


}
