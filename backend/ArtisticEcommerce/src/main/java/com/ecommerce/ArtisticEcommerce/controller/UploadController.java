package com.ecommerce.ArtisticEcommerce.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.nio.file.*;
import java.util.*;

@RestController
@RequestMapping("/api/uploads")
public class UploadController {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    private static final Set<String> ALLOWED = Set.of(
            "image/jpeg", "image/png", "image/webp"
    );

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> upload(@RequestParam("file") MultipartFile file) throws IOException {
        if (file.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Arquivo vazio");
        if (!ALLOWED.contains(Objects.toString(file.getContentType(), "")))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo não suportado");

        String original = Objects.toString(file.getOriginalFilename(), "");
        String ext = "";
        int dot = original.lastIndexOf('.');
        if (dot >= 0) ext = original.substring(dot).toLowerCase(Locale.ROOT);

        String name = UUID.randomUUID().toString().replace("-", "") + ext;

        Path base = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(base);
        Path target = base.resolve(name);
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        String url = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/uploads/").path(name).toUriString();

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("filename", name);
        out.put("url", url);                 // URL absoluta (http://host:8080/uploads/xxx.jpg)
        out.put("size", file.getSize());
        out.put("contentType", file.getContentType());
        return out;
    }
}
