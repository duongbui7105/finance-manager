package com.hduong.finance_manager.controller;

import com.hduong.finance_manager.common.ApiResponse;
import com.hduong.finance_manager.dto.MarketDataResponse;
import com.hduong.finance_manager.service.MarketIntelligenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/market")
@RequiredArgsConstructor
public class MarketController {

    private final MarketIntelligenceService marketService;

    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<MarketDataResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(marketService.getAll()));
    }

    @GetMapping("/crypto")
    public ResponseEntity<ApiResponse<List<MarketDataResponse>>> getCrypto() {
        return ResponseEntity.ok(ApiResponse.ok(marketService.getByCategory("CRYPTO")));
    }

    @GetMapping("/forex")
    public ResponseEntity<ApiResponse<List<MarketDataResponse>>> getForex() {
        return ResponseEntity.ok(ApiResponse.ok(marketService.getByCategory("FOREX")));
    }

    @GetMapping("/commodities")
    public ResponseEntity<ApiResponse<List<MarketDataResponse>>> getCommodities() {
        return ResponseEntity.ok(ApiResponse.ok(marketService.getByCategory("COMMODITY")));
    }

    @GetMapping("/fuel")
    public ResponseEntity<ApiResponse<List<MarketDataResponse>>> getFuel() {
        return ResponseEntity.ok(ApiResponse.ok(marketService.getByCategory("FUEL")));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<Map<String, Object>>> refresh() {
        marketService.forceRefresh();
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
            "message", "Market data refresh triggered",
            "timestamp", LocalDateTime.now().toString()
        )));
    }

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> status() {
        LocalDateTime lu = marketService.getLastUpdated();
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
            "lastUpdated", lu != null ? lu.toString() : "never",
            "loading", marketService.isLoading(),
            "count", marketService.getAll().size()
        )));
    }
}
