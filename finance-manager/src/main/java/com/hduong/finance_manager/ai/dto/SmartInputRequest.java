package com.hduong.finance_manager.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SmartInputRequest {

    @NotBlank(message = "Input text is required")
    @Size(max = 2000, message = "Input too long")
    private String text;
}