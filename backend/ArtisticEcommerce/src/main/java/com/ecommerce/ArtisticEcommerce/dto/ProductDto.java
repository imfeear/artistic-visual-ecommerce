package com.ecommerce.ArtisticEcommerce.dto;

import lombok.Data;

@Data
public class ProductDto {

    private String name;
    private String description;
    private double price;
    private String imageUrl;
    private boolean available;


}
