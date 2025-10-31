package com.ecommerce.ArtisticEcommerce.service;

import com.ecommerce.ArtisticEcommerce.entity.AccessLog;
import com.ecommerce.ArtisticEcommerce.repository.AccessLogRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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

    // ---- resumo para o painel (N dias) ----
    public Map<String, Object> summary(int days) {
        LocalDateTime from = LocalDateTime.now().minusDays(days);
        Map<String, Object> out = new HashMap<>();

        out.put("total", repository.totalSince(from));
        out.put("uniqueIps", repository.uniqueIpsSince(from));

        Map<String, Long> byType = new HashMap<>();
        for (Object[] r : repository.countByTypeSince(from)) {
            byType.put((String) r[0], (Long) r[1]);
        }
        out.put("countsByType", byType);

        List<Map<String, Object>> top = new ArrayList<>();
        for (Object[] r : repository.topClicksSince(from)) {
            Map<String, Object> row = new HashMap<>();
            row.put("label", (String) r[0]);
            row.put("count", (Long) r[1]);
            top.add(row);
        }
        out.put("topClicks", top);

        List<Map<String, Object>> pv = new ArrayList<>();
        for (Object[] r : repository.pageviewsByDay(from)) {
            Map<String, Object> row = new HashMap<>();
            row.put("date", String.valueOf(r[0]));
            row.put("count", (Long) r[1]);
            pv.add(row);
        }
        out.put("pageviewsByDay", pv);

        return out;
    }
}
