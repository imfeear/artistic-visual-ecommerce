package com.ecommerce.ArtisticEcommerce;

import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import com.ecommerce.ArtisticEcommerce.controller.ProductController;
import com.ecommerce.ArtisticEcommerce.dto.ProductDto;
import com.ecommerce.ArtisticEcommerce.entity.Product;
import com.ecommerce.ArtisticEcommerce.repository.ProductRepository;
import com.ecommerce.ArtisticEcommerce.service.ProductService;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@DataJpaTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:catalog;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
    "spring.datasource.username=sa", "spring.datasource.password=",
    "spring.datasource.driver-class-name=org.h2.Driver", "spring.jpa.hibernate.ddl-auto=create-drop"
})
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(ProductService.class)
class ProductCatalogTest {
    @Autowired ProductRepository repository;
    @Autowired ProductService service;
    MockMvc mvc;

    @BeforeEach void setup() {
        mvc = MockMvcBuilders.standaloneSetup(new ProductController(service)).build();
    }

    ProductDto dto(String name, double price, String category, String status, Set<String> materials) {
        var dto = new ProductDto();
        dto.setName(name); dto.setDescription("Pintura à mão de Pernambuco"); dto.setPrice(price);
        dto.setCategory(category); dto.setAvailability(status); dto.setMaterials(materials);
        return dto;
    }

    @Test void combinesFiltersWithAccentInsensitiveSearchAndAnySelectedMaterial() {
        var match = service.create(dto("Brincos de Cerâmica", 80, "brincos", "made-to-order", Set.of("Cerâmica", "Pintura manual")));
        service.create(dto("Brincos de Resina", 180, "brincos", "available", Set.of("Resina")));
        service.create(dto("Máscara", 80, "decoracao", "made-to-order", Set.of("Cerâmica")));
        var result = service.catalog("ceramica", List.of("brincos"), List.of("made-to-order"), List.of("ceramica", "resina"), 50d, 100d, "price-up", 1, 12);
        assertThat(result.content()).extracting(Product::getId).containsExactly(match.getId());
        assertThat(result.totalElements()).isEqualTo(1);
        assertThat(match.isAvailable()).isTrue();
        assertThat(service.filters().materials()).contains("cerâmica", "pintura manual", "resina");
    }

    @Test void sortsPaginatesAndDoesNotDuplicateProductsWithMultipleMaterials() {
        service.create(dto("Um", 80, "brincos", "available", Set.of("resina", "biscuit")));
        service.create(dto("Dois", 20, "decoracao", "sold-out", Set.of("resina")));
        service.create(dto("Três", 50, "quadros", "available", Set.of("biscuit")));
        var page = service.catalog(null, List.of(), List.of(), List.of("resina", "biscuit"), null, null, "price-up", 2, 1);
        assertThat(page.totalElements()).isEqualTo(3);
        assertThat(page.content()).extracting(Product::getPrice).containsExactly(50d);
        assertThat(service.catalog(null, List.of(), List.of(), List.of(), null, null, "price-down", 99, 2).page()).isEqualTo(2);
    }

    @Test void preservesAndFiltersLegacyProductsWithoutReclassifyingThem() {
        var old = new Product(); old.setName("Produto antigo"); old.setAvailable(false); old.setPrice(25);
        repository.saveAndFlush(old);
        var page = service.catalog(null, List.of(), List.of("sold-out"), List.of(), null, null, "recent", 1, 12);
        assertThat(page.content()).hasSize(1);
        assertThat(page.content().getFirst().getCategory()).isNull();
        assertThat(service.catalog(null, List.of("outros-artesanatos"), List.of(), List.of(), null, null, "recent", 1, 12).content()).isEmpty();
        assertThat(page.content().getFirst().getFeatured()).isFalse();
        assertThat(page.content().getFirst().getMaterials()).isEmpty();
    }

    @Test void featuredSortPlacesFeaturedBeforeNullLegacyFlags() {
        var featured = dto("Destaque", 80, "brincos", "available", Set.of()); featured.setFeatured(true);
        var first = service.create(featured);
        var old = new Product(); old.setName("Antigo"); repository.saveAndFlush(old);
        assertThat(service.catalog(null, List.of(), List.of(), List.of(), null, null, "featured", 1, 12).content())
            .extracting(Product::getId).containsExactly(first.getId(), old.getId());
    }

    @Test void editingKeepsExplicitCategoryAndOtherOmittedFields() {
        var product = service.create(dto("Por encomenda", 50, "personalizadas", "made-to-order", Set.of("madeira")));
        var legacy = dto("Nome editado", 70, "personalizadas", null, null); legacy.setAvailable(true);
        var updated = service.update(product.getId(), legacy);
        assertThat(updated.getCategory()).isEqualTo("personalizadas");
        assertThat(updated.getMaterials()).containsExactly("madeira");
        assertThat(updated.getAvailability()).isEqualTo("made-to-order");
        assertThat(updated.getCreatedAt()).isNotNull();
    }

    @Test void rejectsInvalidRangesAndProductClassification() {
        assertThatThrownBy(() -> service.catalog(null, List.of(), List.of(), List.of(), 100d, 20d, "recent", 1, 12))
            .isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> service.create(dto("Inválido", 10, "sem-categoria", "available", Set.of())))
            .isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> service.catalog(null, List.of(), List.of(), List.of(), null, null, "recent", 1, 500))
            .isInstanceOf(ResponseStatusException.class);
    }

    @Test void catalogEndpointsKeepLegacyArrayContractAndValidateQueries() throws Exception {
        service.create(dto("Peça", 30, "brincos", "available", Set.of("resina")));
        mvc.perform(get("/api/products/catalog")).andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1)).andExpect(jsonPath("$.page").value(1));
        mvc.perform(get("/api/products/catalog").param("min", "40").param("max", "10")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/products")).andExpect(status().isOk()).andExpect(jsonPath("$[0].category").value("brincos"));
        mvc.perform(get("/api/products/filters")).andExpect(status().isOk()).andExpect(jsonPath("$.materials[0]").value("resina"));
    }
}
