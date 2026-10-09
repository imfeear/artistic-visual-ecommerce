package com.ecommerce.ArtisticEcommerce.service;

import com.ecommerce.ArtisticEcommerce.dto.CarouselItemRequest;
import com.ecommerce.ArtisticEcommerce.entity.CarouselImage;
import com.ecommerce.ArtisticEcommerce.repository.CarouselImageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CarouselService {

    private final CarouselImageRepository repo;

    public List<CarouselImage> listPublic() {
        return repo.findAllByActiveTrueOrderByPositionAsc();
    }

    public List<CarouselImage> listAll() {
        return repo.findAllByOrderByPositionAsc();
    }

    @Transactional
    public List<CarouselImage> replaceAll(List<CarouselItemRequest> items) {
        repo.deleteAll(); // simples: substitui tudo (MVP)
        List<CarouselImage> toSave = items.stream()
                .map(i -> CarouselImage.builder()
                        .id(null)
                        .url(i.url())
                        .position(i.position() == null ? 1 : i.position())
                        .active(i.active() == null ? true : i.active())
                        .build())
                .sorted(Comparator.comparing(CarouselImage::getPosition))
                .toList();
        repo.saveAll(toSave);
        return repo.findAllByOrderByPositionAsc();
    }
}
