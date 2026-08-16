package com.hduong.finance_manager.ai.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ReceiptScanRequest {

    @NotBlank(message = "Image data is required")
    private String base64Image;   // base64 encoded image

    private String mimeType;      // image/jpeg or image/png
}