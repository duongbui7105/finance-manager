package com.hduong.finance_manager.controller;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.hduong.finance_manager.common.ApiResponse;
import com.hduong.finance_manager.common.PageResponse;
import com.hduong.finance_manager.dto.TransactionRequest;
import com.hduong.finance_manager.dto.TransactionResponse;
import com.hduong.finance_manager.entity.Transaction.TransactionType;
import com.hduong.finance_manager.service.TransactionService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    private Pageable buildPageable(int page, int size, String sort) {
        Sort.Direction dir = Sort.Direction.DESC;
        String field = "date";

        if (sort != null && sort.contains(",")) {
            String[] parts = sort.split(",");
            field = parts[0];
            dir = parts.length > 1 && parts[1].equalsIgnoreCase("asc")
                    ? Sort.Direction.ASC : Sort.Direction.DESC;
        }

        return PageRequest.of(page, size, Sort.by(dir, field));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TransactionResponse>> add(
            @Valid @RequestBody TransactionRequest request) {
        return ResponseEntity.ok(
                ApiResponse.ok(transactionService.add(request), "Transaction created"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TransactionResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody TransactionRequest request) {
        return ResponseEntity.ok(
                ApiResponse.ok(transactionService.update(id, request), "Transaction updated"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        transactionService.delete(id);
        return ResponseEntity.ok(ApiResponse.message("Transaction deleted"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<TransactionResponse>>> getAll(
            @RequestParam(defaultValue = "0")   int page,
            @RequestParam(defaultValue = "10")  int size,
            @RequestParam(required = false)     String sort,
            @RequestParam(required = false)     TransactionType type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {

        Pageable pageable = buildPageable(page, size, sort);

        PageResponse<TransactionResponse> result;
        if (type != null) {
            result = transactionService.filterByType(type, pageable);
        } else if (from != null && to != null) {
            result = transactionService.filterByDateRange(from, to, pageable);
        } else {
            result = transactionService.getAll(pageable);
        }

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<PageResponse<TransactionResponse>>> search(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false)    String sort) {
        Pageable pageable = buildPageable(page, size, sort);
        return ResponseEntity.ok(ApiResponse.ok(transactionService.search(keyword, pageable)));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<Map<String, BigDecimal>>> summary() {
        return ResponseEntity.ok(ApiResponse.ok(transactionService.getSummary()));
    }

    // POST /api/transactions/batch
    @PostMapping("/batch")
    public ResponseEntity<ApiResponse<List<TransactionResponse>>> batch(
        @Valid @RequestBody List<TransactionRequest> requests) {
    List<TransactionResponse> results = requests.stream()
            .map(transactionService::add)
            .toList();
    return ResponseEntity.ok(
            ApiResponse.ok(results,
                    "Đã lưu " + results.size() + " giao dịch"));
}
}