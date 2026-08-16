package com.hduong.finance_manager.ai.dto;

import java.util.List;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SmartInputResponse {
    private List<ParsedTransactionDto> transactions;
    private int                        count;
    private String                     summary;
}