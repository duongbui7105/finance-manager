package com.hduong.finance_manager.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.hduong.finance_manager.entity.Transaction.TransactionType;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TransactionResponse {
    private Long id;
    private BigDecimal amount;
    private TransactionType type;
    private LocalDate date;
    private String note;
    private String categoryName;
    private String categoryIcon;
}