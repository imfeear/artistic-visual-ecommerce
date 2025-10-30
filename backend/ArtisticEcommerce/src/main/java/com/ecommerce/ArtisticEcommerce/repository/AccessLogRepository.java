package com.ecommerce.ArtisticEcommerce.repository;

import com.ecommerce.ArtisticEcommerce.entity.AccessLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface AccessLogRepository extends JpaRepository<AccessLog, Long> {

    Page<AccessLog> findAll(Pageable pageable);

    @Query("select count(a) from AccessLog a")
    long countAll();

    @Query("select count(distinct a.ip) from AccessLog a")
    long countDistinctIps();
}
