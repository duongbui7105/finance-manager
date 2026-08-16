package com.hduong.finance_manager.ai.dto;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class ParsedTransactionDto {
    private String      description;
    private BigDecimal  amount;
    private String      type;        // INCOME or EXPENSE
    private String      category;    // matches category name in DB
    private String      date;        // yyyy-MM-dd
    private String      note;
}