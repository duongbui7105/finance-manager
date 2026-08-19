package com.hduong.finance_manager.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hduong.finance_manager.common.ApiResponse;
import com.hduong.finance_manager.dto.CategoryRequest;
import com.hduong.finance_manager.dto.CategoryResponse;
import com.hduong.finance_manager.service.CategoryService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    /**
     * Get all categories (system + user's own)
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getAll() {
        List<CategoryResponse> categories = categoryService.getAll();
        return ResponseEntity.ok(ApiResponse.ok(categories));
    }

    /**
     * Get only user's custom categories
     */
    @GetMapping("/user")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getUserCategories() {
        List<CategoryResponse> categories = categoryService.getUserCategories();
        return ResponseEntity.ok(ApiResponse.ok(categories));
    }

    /**
     * Get only system categories
     */
    @GetMapping("/system")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getSystemCategories() {
        List<CategoryResponse> categories = categoryService.getSystemCategories();
        return ResponseEntity.ok(ApiResponse.ok(categories));
    }

    /**
     * Get category by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CategoryResponse>> getById(@PathVariable Long id) {
        CategoryResponse category = categoryService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(category));
    }

    /**
     * Create a new user-defined category
     */
    @PostMapping
    public ResponseEntity<ApiResponse<CategoryResponse>> create(@Valid @RequestBody CategoryRequest request) {
        CategoryResponse category = categoryService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(category));
    }

    /**
     * Update a user-defined category
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CategoryResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody CategoryRequest request) {
        CategoryResponse category = categoryService.update(id, request);
        return ResponseEntity.ok(ApiResponse.ok(category));
    }

    /**
     * Delete a user-defined category (only if not in use)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        categoryService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}