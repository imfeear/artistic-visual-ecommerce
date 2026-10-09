package com.ecommerce.ArtisticEcommerce;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class hash {
  public static void main(String[] args) {
    System.out.println(new BCryptPasswordEncoder(10).encode("elefante10"));
  }
}
