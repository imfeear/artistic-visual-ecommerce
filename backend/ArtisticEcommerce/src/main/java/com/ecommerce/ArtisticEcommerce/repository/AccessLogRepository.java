package com.ecommerce.ArtisticEcommerce.repository;

import com.ecommerce.ArtisticEcommerce.entity.AccessLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;

public interface AccessLogRepository extends JpaRepository<AccessLog, Long> {

    Page<AccessLog> findAll(Pageable pageable);

    @Query("select count(a) from AccessLog a")
    long countAll();

    @Query("select count(distinct a.ip) from AccessLog a")
    long countDistinctIps();

    @Query("select a.eventType, count(a) from AccessLog a where a.createdAt >= :from group by a.eventType")
    List<Object[]> countByTypeSince(LocalDateTime from);

    @Query("select coalesce(a.metadata, 'unknown'), count(a) " +
           "from AccessLog a where a.eventType = 'CLICK' and a.createdAt >= :from " +
           "group by a.metadata order by count(a) desc")
    List<Object[]> topClicksSince(LocalDateTime from);

    @Query("select function('date', a.createdAt) as d, count(a) " +
           "from AccessLog a where a.eventType = 'PAGEVIEW' and a.createdAt >= :from " +
           "group by function('date', a.createdAt) order by d")
    List<Object[]> pageviewsByDay(LocalDateTime from);

    @Query("select count(a) from AccessLog a where a.createdAt >= :from")
    long totalSince(LocalDateTime from);

    @Query("select count(distinct a.ip) from AccessLog a where a.createdAt >= :from")
    long uniqueIpsSince(LocalDateTime from);
}
