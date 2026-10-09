package com.ecommerce.ArtisticEcommerce.interceptor;

import com.ecommerce.ArtisticEcommerce.entity.AccessLog;
import com.ecommerce.ArtisticEcommerce.service.AccessLogService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AccessLogInterceptor implements HandlerInterceptor {

    private final AccessLogService accessLogService;

    public AccessLogInterceptor(AccessLogService accessLogService) {
        this.accessLogService = accessLogService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String ip = request.getRemoteAddr();
        String ua = request.getHeader("User-Agent");
        String path = request.getRequestURI();
        String method = request.getMethod();

        AccessLog log = new AccessLog(path, method, ip, ua, "ACCESS", null);
        accessLogService.save(log);

        return true;
    }
}
