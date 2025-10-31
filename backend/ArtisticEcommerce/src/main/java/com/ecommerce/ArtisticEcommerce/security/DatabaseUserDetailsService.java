package com.ecommerce.ArtisticEcommerce.security;

import java.util.Arrays;
import java.util.stream.Collectors;

import com.ecommerce.ArtisticEcommerce.repository.AdminUserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

@Service
public class DatabaseUserDetailsService implements UserDetailsService {

    private final AdminUserRepository repo;

    public DatabaseUserDetailsService(AdminUserRepository repo) {
        this.repo = repo;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        var u = repo.findByUsername(username)
            .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        var authorities = Arrays.stream(u.getRoles().split(","))
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .map(SimpleGrantedAuthority::new)
            .collect(Collectors.toList());

        return User.builder()
            .username(u.getUsername())
            .password(u.getPasswordHash())
            .authorities(authorities)
            .disabled(!u.isEnabled())
            .build();
    }
}
