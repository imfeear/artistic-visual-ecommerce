package com.ecommerce.ArtisticEcommerce.security;

import com.ecommerce.ArtisticEcommerce.entity.Admin;
import com.ecommerce.ArtisticEcommerce.repository.AdminRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class AdminUserDetailsService implements UserDetailsService {

    private final AdminRepository repo;

    public AdminUserDetailsService(AdminRepository repo) {
        this.repo = repo;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Admin a = repo.findByUsername(username)
            .orElseThrow(() -> new UsernameNotFoundException("Admin não encontrado"));
        return new User(
            a.getUsername(),
            a.getPasswordHash(),
            a.isEnabled(), true, true, true,
            List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );
    }
}
