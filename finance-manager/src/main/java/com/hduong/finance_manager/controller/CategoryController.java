package com.hduong.finance_manager.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hduong.finance_manager.common.ApiResponse;
import com.hduong.finance_manager.entity.Category;
import com.hduong.finance_manager.repository.CategoryRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryRepository categoryRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Category>>> getAll() {
        List<Category> categories = categoryRepository.findByUserIsNull();
        return ResponseEntity.ok(ApiResponse.ok(categories));
    }
}