package com.hduong.finance_manager.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class ProfileResponse {
    private Long id;
    private String fullName;
    private String username;
    private String email;
    private String phone;
    private String avatarUrl;
    private String bio;
    private LocalDate dateOfBirth;
    private String gender;
    private String role;

    // Extended profile
    private String address;
    private String city;
    private String country;
    private Double latitude;
    private Double longitude;
    private String occupation;
    private String preferredCurrency;
    private String timezone;
    private String preferredLanguage;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
