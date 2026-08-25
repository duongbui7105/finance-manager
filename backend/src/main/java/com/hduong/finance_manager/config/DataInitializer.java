package com.hduong.finance_manager.config;

import com.hduong.finance_manager.entity.Category;
import com.hduong.finance_manager.entity.User;
import com.hduong.finance_manager.repository.CategoryRepository;
import com.hduong.finance_manager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        initializeUsers();
        initializeCategories();
    }

    private void initializeUsers() {
        if (userRepository.count() > 0) {
            log.info("Users already exist, skipping initialization");
            return;
        }

        // Create test user
        User testUser = User.builder()
                .fullName("Test User")
                .email("test@gmail.com")
                .password(passwordEncoder.encode("123456"))
                .role(User.Role.USER)
                .build();
        userRepository.save(testUser);

        // Create admin user
        User adminUser = User.builder()
                .fullName("Admin User")
                .email("admin@gmail.com")
                .password(passwordEncoder.encode("admin123"))
                .role(User.Role.ADMIN)
                .build();
        userRepository.save(adminUser);

        log.info("✅ Initialized 2 test users:");
        log.info("   - test@gmail.com / 123456 (USER)");
        log.info("   - admin@gmail.com / admin123 (ADMIN)");
    }

    private void initializeCategories() {
        if (categoryRepository.count() > 0) {
            log.info("Categories already exist, skipping initialization");
            return;
        }

        // System categories have user = null
        List<Category> systemCategories = List.of(
                Category.builder()
                        .name("Food")
                        .icon("food")
                        .user(null)
                        .build(),
                Category.builder()
                        .name("Transport")
                        .icon("transport")
                        .user(null)
                        .build(),
                Category.builder()
                        .name("Shopping")
                        .icon("shopping")
                        .user(null)
                        .build(),
                Category.builder()
                        .name("Entertainment")
                        .icon("entertainment")
                        .user(null)
                        .build(),
                Category.builder()
                        .name("Health")
                        .icon("health")
                        .user(null)
                        .build(),
                Category.builder()
                        .name("Education")
                        .icon("education")
                        .user(null)
                        .build(),
                Category.builder()
                        .name("Bills")
                        .icon("bills")
                        .user(null)
                        .build(),
                Category.builder()
                        .name("Salary")
                        .icon("salary")
                        .user(null)
                        .build(),
                Category.builder()
                        .name("Investment")
                        .icon("investment")
                        .user(null)
                        .build(),
                Category.builder()
                        .name("Other")
                        .icon("other")
                        .user(null)
                        .build()
        );

        categoryRepository.saveAll(systemCategories);
        log.info("✅ Initialized {} system categories", systemCategories.size());
    }
}
