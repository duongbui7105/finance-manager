package com.hduong.finance_manager.ai.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AiChatResponse {
    private String reply;
    private String model;
    private int promptTokens;
    private int completionTokens;
}