package com.hduong.finance_manager.controller;

import com.hduong.finance_manager.common.ApiResponse;
import com.hduong.finance_manager.dto.AccountRequest;
import com.hduong.finance_manager.dto.AccountResponse;
import com.hduong.finance_manager.entity.Account.AccountType;
import com.hduong.finance_manager.service.AccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    /**
     * Get all accounts
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<AccountResponse>>> getAll() {
        List<AccountResponse> accounts = accountService.getAll();
        return ResponseEntity.ok(ApiResponse.ok(accounts));
    }

    /**
     * Get only active accounts
     */
    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<AccountResponse>>> getActive() {
        List<AccountResponse> accounts = accountService.getActive();
        return ResponseEntity.ok(ApiResponse.ok(accounts));
    }

    /**
     * Get accounts by type
     */
    @GetMapping("/type/{type}")
    public ResponseEntity<ApiResponse<List<AccountResponse>>> getByType(@PathVariable AccountType type) {
        List<AccountResponse> accounts = accountService.getByType(type);
        return ResponseEntity.ok(ApiResponse.ok(accounts));
    }

    /**
     * Get account summary (total balance, assets, liabilities, net worth)
     */
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSummary() {
        Map<String, Object> summary = accountService.getSummary();
        return ResponseEntity.ok(ApiResponse.ok(summary));
    }

    /**
     * Get account by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AccountResponse>> getById(@PathVariable Long id) {
        AccountResponse account = accountService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(account));
    }

    /**
     * Create a new account
     */
    @PostMapping
    public ResponseEntity<ApiResponse<AccountResponse>> create(@Valid @RequestBody AccountRequest request) {
        AccountResponse account = accountService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(account));
    }

    /**
     * Update an account
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AccountResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody AccountRequest request) {
        AccountResponse account = accountService.update(id, request);
        return ResponseEntity.ok(ApiResponse.ok(account));
    }

    /**
     * Delete an account
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        accountService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
