package com.hduong.finance_manager.controller;

import com.hduong.finance_manager.common.ApiResponse;
import com.hduong.finance_manager.dto.*;
import com.hduong.finance_manager.entity.Budget;
import com.hduong.finance_manager.entity.SavingsGoal;
import com.hduong.finance_manager.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // ── Profile ──────────────────────────────────────────

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<ProfileResponse>> getProfile() {
        return ResponseEntity.ok(ApiResponse.ok(userService.getProfile()));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<ProfileResponse>> updateProfile(
            @Valid @RequestBody UpdateProfileRequest req) {
        return ResponseEntity.ok(
                ApiResponse.ok(userService.updateProfile(req), "Cập nhật hồ sơ thành công"));
    }

    @PutMapping("/password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @Valid @RequestBody ChangePasswordRequest req) {
        userService.changePassword(req);
        return ResponseEntity.ok(ApiResponse.message("Đổi mật khẩu thành công"));
    }

    // ── Budget ───────────────────────────────────────────

    @GetMapping("/budget")
    public ResponseEntity<ApiResponse<Budget>> getBudget() {
        return ResponseEntity.ok(ApiResponse.ok(userService.getBudget()));
    }

    @PutMapping("/budget")
    public ResponseEntity<ApiResponse<Budget>> saveBudget(
            @Valid @RequestBody BudgetRequest req) {
        return ResponseEntity.ok(
                ApiResponse.ok(userService.saveBudget(req), "Ngân sách đã được lưu"));
    }

    // ── Savings Goals ────────────────────────────────────

    @GetMapping("/savings-goals")
    public ResponseEntity<ApiResponse<List<SavingsGoal>>> getSavingsGoals() {
        return ResponseEntity.ok(ApiResponse.ok(userService.getSavingsGoals()));
    }

    @PostMapping("/savings-goals")
    public ResponseEntity<ApiResponse<SavingsGoal>> createSavingsGoal(
            @Valid @RequestBody SavingsGoalRequest req) {
        return ResponseEntity.ok(
                ApiResponse.ok(userService.createSavingsGoal(req), "Tạo mục tiêu thành công"));
    }

    @PutMapping("/savings-goals/{id}")
    public ResponseEntity<ApiResponse<SavingsGoal>> updateSavingsGoal(
            @PathVariable Long id,
            @Valid @RequestBody SavingsGoalRequest req) {
        return ResponseEntity.ok(
                ApiResponse.ok(userService.updateSavingsGoal(id, req), "Cập nhật mục tiêu thành công"));
    }

    @DeleteMapping("/savings-goals/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSavingsGoal(@PathVariable Long id) {
        userService.deleteSavingsGoal(id);
        return ResponseEntity.ok(ApiResponse.message("Đã xóa mục tiêu"));
    }
}
