package com.hduong.finance_manager.ai;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hduong.finance_manager.ai.dto.AiChatRequest;
import com.hduong.finance_manager.ai.dto.AiChatResponse;
import com.hduong.finance_manager.ai.dto.AutoCategorizeRequest;
import com.hduong.finance_manager.ai.dto.ReceiptScanRequest;
import com.hduong.finance_manager.ai.dto.SmartInputRequest;
import com.hduong.finance_manager.ai.dto.SmartInputResponse;
import com.hduong.finance_manager.common.ApiResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    // POST /api/ai/chat
    // send a message, get financial advice back
    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<AiChatResponse>> chat(
            @Valid @RequestBody AiChatRequest request) {
        return ResponseEntity.ok(
                ApiResponse.ok(aiService.chat(request.getMessage()), "AI response generated"));
    }

    // GET /api/ai/insights
    // auto-generate insights based on user's transaction data
    @GetMapping("/insights")
    public ResponseEntity<ApiResponse<AiChatResponse>> insights() {
        return ResponseEntity.ok(
                ApiResponse.ok(aiService.generateInsights(), "Insights generated"));
    }

    // POST /api/ai/categorize
    // suggest a category for a transaction note
    @PostMapping("/categorize")
    public ResponseEntity<ApiResponse<AiChatResponse>> categorize(
            @Valid @RequestBody AutoCategorizeRequest request) {
        return ResponseEntity.ok(
                ApiResponse.ok(
                        aiService.autoCategorize(request.getNote(), request.getAmount()),
                        "Category suggested"));
    }

    // POST /api/ai/smart-input
@PostMapping("/smart-input")
public ResponseEntity<ApiResponse<SmartInputResponse>> smartInput(
        @Valid @RequestBody SmartInputRequest request) {
    return ResponseEntity.ok(
            ApiResponse.ok(
                    aiService.parseSmartInput(request.getText()),
                    "Phân tích thành công"));
}

// POST /api/ai/scan-receipt
@PostMapping("/scan-receipt")
public ResponseEntity<ApiResponse<SmartInputResponse>> scanReceipt(
        @Valid @RequestBody ReceiptScanRequest request) {
    return ResponseEntity.ok(
            ApiResponse.ok(
                    aiService.scanReceipt(
                            request.getBase64Image(),
                            request.getMimeType()),
                    "Quét hóa đơn thành công"));
}
}