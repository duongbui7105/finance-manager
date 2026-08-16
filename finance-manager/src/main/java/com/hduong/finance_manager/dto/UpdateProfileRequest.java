package com.hduong.finance_manager.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.time.LocalDate;

@Data
public class UpdateProfileRequest {

    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 100, message = "Full name must be 2-100 characters")
    private String fullName;

    @Size(max = 50)
    private String username;

    @Pattern(regexp = "^(\\+?[0-9]{9,15})?$", message = "Invalid phone number")
    private String phone;

    @Size(max = 500, message = "Bio must be under 500 characters")
    private String bio;

    private LocalDate dateOfBirth;
    private String gender;

    @Size(max = 1000)
    private String avatarUrl;

    // Extended fields
    @Size(max = 300)
    private String address;

    @Size(max = 100)
    private String city;

    @Size(max = 100)
    private String country;

    private Double latitude;
    private Double longitude;

    @Size(max = 100)
    private String occupation;

    @Size(max = 10)
    private String preferredCurrency;

    @Size(max = 60)
    private String timezone;

    @Size(max = 10)
    private String preferredLanguage;
}
