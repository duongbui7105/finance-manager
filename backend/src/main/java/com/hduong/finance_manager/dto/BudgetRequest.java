package com.hduong.finance_manager.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class BudgetRequest {
    private BigDecimal monthlyLimit;
    private BigDecimal dailyLimit;
    private boolean alertEnabled;

    @Min(value = 1, message = "Alert threshold must be between 1 and 100")
    @Max(value = 100, message = "Alert threshold must be between 1 and 100")
    private int alertThreshold = 80;
}
