package com.hduong.finance_manager.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CategoryResponse {
    private Long id;
    private String name;
    private String icon;
    private boolean isSystemCategory;  // true if user is null (system default)
    private Long userId;  // null for system categories
}
