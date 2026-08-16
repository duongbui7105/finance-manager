package com.hduong.finance_manager.service;

import com.hduong.finance_manager.dto.LoginRequest;
import com.hduong.finance_manager.dto.RegisterRequest;
import com.hduong.finance_manager.entity.User;
import com.hduong.finance_manager.exception.BadRequestException;
import com.hduong.finance_manager.exception.UnauthorizedException;
import com.hduong.finance_manager.repository.UserRepository;
import com.hduong.finance_manager.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public Map<String, String> register(RegisterRequest request) {
        log.info("Register attempt for email: {}", request.getEmail());

        if (userRepository.existsByEmail(request.getEmail())) {
            log.warn("Registration failed — email already in use: {}", request.getEmail());
            throw new BadRequestException("Email already in use");
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(User.Role.USER)
                .build();

        userRepository.save(user);
        log.info("User registered successfully: {}", user.getEmail());

        return Map.of("token", jwtUtil.generateToken(user));
    }

    public Map<String, String> login(LoginRequest request) {
        log.info("Login attempt for email: {}", request.getEmail());

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> {
                    log.warn("Login failed — email not found: {}", request.getEmail());
                    return new UnauthorizedException("Invalid email or password");
                });

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            log.warn("Login failed — wrong password for: {}", request.getEmail());
            throw new UnauthorizedException("Invalid email or password");
        }

        log.info("Login successful for: {}", user.getEmail());
        return Map.of("token", jwtUtil.generateToken(user));
    }
}