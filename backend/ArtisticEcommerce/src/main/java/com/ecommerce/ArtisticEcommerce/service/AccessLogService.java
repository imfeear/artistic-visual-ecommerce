package com.ecommerce.ArtisticEcommerce.service;

import com.ecommerce.ArtisticEcommerce.entity.AccessLog;
import com.ecommerce.ArtisticEcommerce.repository.AccessLogRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class AccessLogService {

    private final AccessLogRepository repository;

    public AccessLogService(AccessLogRepository repository) {
        this.repository = repository;
    }

    public void save(AccessLog log) {
        repository.save(log);
    }

    public List<AccessLog> findAll() {
        return repository.findAll();
    }

    public Page<AccessLog> findAll(Pageable pageable) {
        return repository.findAll(pageable);
    }

    public long totalAccess() {
        return repository.countAll();
    }

    public long uniqueIps() {
        return repository.countDistinctIps();
    }
}
