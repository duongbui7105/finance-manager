package com.hduong.finance_manager.dto;

import java.math.BigDecimal;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DailySummaryResponse {
    private int day;
    private BigDecimal income;
    private BigDecimal expense;
}