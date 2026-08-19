package com.hduong.finance_manager.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CategoryRequest {

    @NotBlank(message = "Category name is required")
    private String name;

    private String icon;  // optional, for UI display (e.g., "food", "education")
}
