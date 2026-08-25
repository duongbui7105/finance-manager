package com.hduong.finance_manager.ai.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AutoCategorizeRequest {

    @NotBlank(message = "Transaction note is required")
    private String note;

    private String amount;
}