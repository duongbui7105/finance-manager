package com.hduong.finance_manager.dto;

import java.math.BigDecimal;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MonthlySummaryResponse {
    private int year;
    private int month;
    private String monthName;      // e.g. "April"
    private BigDecimal income;
    private BigDecimal expense;
    private BigDecimal balance;
}