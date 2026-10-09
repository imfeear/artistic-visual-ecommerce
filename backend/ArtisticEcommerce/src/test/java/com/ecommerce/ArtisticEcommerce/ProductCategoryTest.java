package com.ecommerce.ArtisticEcommerce;

import java.util.Set;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import com.ecommerce.ArtisticEcommerce.controller.ProductController;
import com.ecommerce.ArtisticEcommerce.controller.ProductExceptionHandler;
import com.ecommerce.ArtisticEcommerce.dto.ProductDto;
import com.ecommerce.ArtisticEcommerce.entity.Product;
import com.ecommerce.ArtisticEcommerce.repository.ProductRepository;
import com.ecommerce.ArtisticEcommerce.service.ProductService;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

// PostgreSQL runs must use a disposable database: Hibernate creates/drops this test schema.
@DataJpaTest(properties = {
    "spring.datasource.url=${CATEGORY_TEST_DB_URL:jdbc:h2:mem:categories;MODE=PostgreSQL;DB_CLOSE_DELAY=-1}",
    "spring.datasource.username=${CATEGORY_TEST_DB_USER:sa}",
    "spring.datasource.password=${CATEGORY_TEST_DB_PASSWORD:}",
    "spring.datasource.driver-class-name=${CATEGORY_TEST_DB_DRIVER:org.h2.Driver}",
    "spring.jpa.hibernate.ddl-auto=create-drop"
})
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(ProductService.class)
@ContextConfiguration(initializers = ProductCategoryTest.IsolatedDatabase.class)
class ProductCategoryTest {
    public static class IsolatedDatabase implements ApplicationContextInitializer<ConfigurableApplicationContext> {
        @Override public void initialize(ConfigurableApplicationContext context) {
            var url = context.getEnvironment().getProperty("spring.datasource.url", "");
            boolean isolated = url.startsWith("jdbc:h2:mem:");
            if (url.startsWith("jdbc:postgresql://")) {
                var path = java.net.URI.create(url.substring(5)).getPath();
                isolated = path != null && path.matches("/artistic_category_test_[a-zA-Z0-9_]+");
            }
            if (!isolated) throw new IllegalStateException(
                "Category tests require an in-memory database or a disposable artistic_category_test_* database.");
        }
    }

    @Autowired ProductService service;
    @Autowired ProductRepository repository;
    @Autowired EntityManager entityManager;
    @Autowired JdbcTemplate jdbc;
    final ObjectMapper json = new ObjectMapper();
    MockMvc mvc;

    @BeforeEach void setup() {
        mvc = MockMvcBuilders.standaloneSetup(new ProductController(service))
            .setControllerAdvice(new ProductExceptionHandler()).build();
    }

    ProductDto dto(String category) {
        var dto = new ProductDto();
        dto.setName("Peça de teste"); dto.setDescription("Categoria explícita"); dto.setPrice(50);
        dto.setCategory(category); dto.setAvailability("available"); dto.setMaterials(Set.of());
        return dto;
    }

    void assertStored(Long id, String category) {
        entityManager.flush();
        entityManager.clear();
        assertThat(jdbc.queryForObject("SELECT category FROM products WHERE id = ?", String.class, id))
            .isEqualTo(category);
        assertThat(repository.findById(id).orElseThrow().getCategory()).isEqualTo(category);
    }

    @ParameterizedTest
    @ValueSource(strings = {"brincos", "esculturas", "esculturas-biscuit", "decoracao", "quadros", "personalizadas", "colecionaveis", "outros-artesanatos"})
    void creationRoundTripsEveryCategoryThroughDtoDatabaseAndCatalog(String category) throws Exception {
        var response = mvc.perform(post("/api/products").contentType(MediaType.APPLICATION_JSON)
            .content(json.writeValueAsString(dto(category))))
            .andExpect(status().isOk()).andExpect(jsonPath("$.category").value(category)).andReturn();
        Long id = json.readTree(response.getResponse().getContentAsString()).get("id").asLong();
        assertStored(id, category);
        mvc.perform(get("/api/products/{id}", id)).andExpect(jsonPath("$.category").value(category));
        mvc.perform(get("/api/products/catalog").param("categoria", category))
            .andExpect(jsonPath("$.totalElements").value(1))
            .andExpect(jsonPath("$.content[0].category").value(category));
        // Editing another field must keep the saved category.
        var edited = dto(category); edited.setPrice(75);
        mvc.perform(put("/api/products/{id}", id).contentType(MediaType.APPLICATION_JSON)
            .content(json.writeValueAsString(edited))).andExpect(status().isOk())
            .andExpect(jsonPath("$.category").value(category));
        assertStored(id, category);
    }

    @ParameterizedTest
    @ValueSource(strings = {"brincos", "esculturas", "esculturas-biscuit", "decoracao", "quadros", "personalizadas", "colecionaveis", "outros-artesanatos"})
    void editingChangesAndPersistsEveryCategory(String category) throws Exception {
        var original = service.create(dto("quadros"));
        mvc.perform(put("/api/products/{id}", original.getId()).contentType(MediaType.APPLICATION_JSON)
            .content(json.writeValueAsString(dto(category))))
            .andExpect(status().isOk()).andExpect(jsonPath("$.category").value(category));
        assertStored(original.getId(), category);
        mvc.perform(get("/api/products")).andExpect(jsonPath("$[0].category").value(category));
    }

    @ParameterizedTest
    @NullSource
    @ValueSource(strings = {"", " ", "Brincos", "biscuit", "outros", "undefined", "null", " brincos "})
    void missingOrInvalidCategoryReturnsClear400AndDoesNotOverwriteProduct(String category) throws Exception {
        var original = service.create(dto("brincos"));
        var payload = json.writeValueAsString(dto(category));
        mvc.perform(post("/api/products").contentType(MediaType.APPLICATION_JSON).content(payload))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.detail").isNotEmpty());
        mvc.perform(put("/api/products/{id}", original.getId()).contentType(MediaType.APPLICATION_JSON).content(payload))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.detail").isNotEmpty());
        assertStored(original.getId(), "brincos");
        assertThat(repository.count()).isEqualTo(1);
    }

    @Test void omittedAndWrongTypeCategoryAreRejected() throws Exception {
        var payload = json.valueToTree(dto("brincos"));
        ((com.fasterxml.jackson.databind.node.ObjectNode) payload).remove("category");
        mvc.perform(post("/api/products").contentType(MediaType.APPLICATION_JSON).content(payload.toString()))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.detail").value("Selecione uma categoria para o produto."));
        ((com.fasterxml.jackson.databind.node.ObjectNode) payload).putObject("category").put("value", "brincos");
        mvc.perform(post("/api/products").contentType(MediaType.APPLICATION_JSON).content(payload.toString()))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.detail").isNotEmpty());
        assertThat(repository.count()).isZero();
    }

    @Test void legacyRowsStayUnclassifiedUntilExplicitlyEdited() throws Exception {
        var legacy = new Product(); legacy.setName("Peça antiga"); legacy.setPrice(20); legacy.setAvailable(true);
        repository.saveAndFlush(legacy);
        assertStored(legacy.getId(), null);
        mvc.perform(get("/api/products/{id}", legacy.getId())).andExpect(jsonPath("$.category").doesNotExist());
        mvc.perform(get("/api/products/catalog").param("categoria", "outros-artesanatos"))
            .andExpect(jsonPath("$.totalElements").value(0));
        mvc.perform(put("/api/products/{id}", legacy.getId()).contentType(MediaType.APPLICATION_JSON)
            .content(json.writeValueAsString(dto("colecionaveis")))).andExpect(status().isOk());
        assertStored(legacy.getId(), "colecionaveis");
    }
}
