package com.ecommerce.ArtisticEcommerce.controller;

import com.ecommerce.ArtisticEcommerce.dto.CarouselItemRequest;
import com.ecommerce.ArtisticEcommerce.entity.CarouselImage;
import com.ecommerce.ArtisticEcommerce.service.CarouselService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/carousel")
public class CarouselController {

    private final CarouselService service;

    // Público (site consome aqui)
    @GetMapping
    public List<CarouselImage> publicList() {
        return service.listPublic();
    }

    // Admin (modal consome aqui)
    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public List<CarouselImage> adminList() {
        return service.listAll();
    }

    // Admin substitui toda a lista (MVP)
    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<CarouselImage> saveAll(@RequestBody List<CarouselItemRequest> items) {
        return service.replaceAll(items);
    }
}
