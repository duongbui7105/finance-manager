package com.hduong.finance_manager.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.hduong.finance_manager.common.ApiResponse;
import com.hduong.finance_manager.dto.CategorySummaryResponse;
import com.hduong.finance_manager.dto.DailySummaryResponse;
import com.hduong.finance_manager.dto.MonthlySummaryResponse;
import com.hduong.finance_manager.service.ReportService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/monthly")
    public ResponseEntity<ApiResponse<List<MonthlySummaryResponse>>> monthly(
            @RequestParam(defaultValue = "#{T(java.time.LocalDate).now().year}") int year) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.getMonthlySummary(year)));
    }

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<CategorySummaryResponse>>> categories(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.getCategoryBreakdown(from, to)));
    }

    @GetMapping("/daily")
    public ResponseEntity<ApiResponse<List<DailySummaryResponse>>> daily(
            @RequestParam int year,
            @RequestParam int month) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.getDailySummary(year, month)));
    }
}