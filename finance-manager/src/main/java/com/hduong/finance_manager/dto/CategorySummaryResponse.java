package com.hduong.finance_manager.dto;

import java.math.BigDecimal;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CategorySummaryResponse {
    private String categoryName;
    private String categoryIcon;
    private BigDecimal total;
    private double percentage;     // % of total spending
}