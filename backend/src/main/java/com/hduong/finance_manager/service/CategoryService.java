package com.hduong.finance_manager.service;

import com.hduong.finance_manager.dto.CategoryRequest;
import com.hduong.finance_manager.dto.CategoryResponse;
import com.hduong.finance_manager.entity.Category;
import com.hduong.finance_manager.entity.User;
import com.hduong.finance_manager.exception.BadRequestException;
import com.hduong.finance_manager.exception.ForbiddenException;
import com.hduong.finance_manager.exception.NotFoundException;
import com.hduong.finance_manager.repository.CategoryRepository;
import com.hduong.finance_manager.repository.TransactionRepository;
import com.hduong.finance_manager.repository.UserRepository;
import com.hduong.finance_manager.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;

    // ── Helpers ───────────────────────────────────────────
    private User getCurrentUser() {
        return userRepository.findByEmail(SecurityUtils.getCurrentUserEmail())
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    private CategoryResponse toResponse(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .icon(category.getIcon())
                .isSystemCategory(category.getUser() == null)
                .userId(category.getUser() != null ? category.getUser().getId() : null)
                .build();
    }

    // ── CRUD Operations ───────────────────────────────────

    /**
     * Get all categories (system + user's own)
     */
    public List<CategoryResponse> getAll() {
        User user = getCurrentUser();
        
        // Get system categories (user = null)
        List<Category> systemCategories = categoryRepository.findByUserIsNull();
        
        // Get user's custom categories
        List<Category> userCategories = categoryRepository.findByUserId(user.getId());
        
        // Combine both lists
        List<CategoryResponse> all = systemCategories.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        
        all.addAll(userCategories.stream()
                .map(this::toResponse)
                .collect(Collectors.toList()));
        
        return all;
    }

    /**
     * Get only user's custom categories
     */
    public List<CategoryResponse> getUserCategories() {
        User user = getCurrentUser();
        return categoryRepository.findByUserId(user.getId()).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get only system categories
     */
    public List<CategoryResponse> getSystemCategories() {
        return categoryRepository.findByUserIsNull().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Create a new user-defined category
     */
    @Transactional
    public CategoryResponse create(CategoryRequest request) {
        User user = getCurrentUser();
        
        log.info("Creating category '{}' for user {}", request.getName(), user.getEmail());
        
        Category category = Category.builder()
                .name(request.getName())
                .icon(request.getIcon())
                .user(user)
                .build();
        
        category = categoryRepository.save(category);
        return toResponse(category);
    }

    /**
     * Update a user-defined category
     */
    @Transactional
    public CategoryResponse update(Long id, CategoryRequest request) {
        User user = getCurrentUser();
        
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Category not found with id: " + id));
        
        // Check if it's a system category
        if (category.getUser() == null) {
            throw new BadRequestException("Cannot modify system categories");
        }
        
        // Check ownership
        if (!category.getUser().getId().equals(user.getId())) {
            log.warn("User {} attempted to update category {} owned by another user",
                    user.getEmail(), id);
            throw new ForbiddenException("You do not have access to this category");
        }
        
        log.info("Updating category {} for user {}", id, user.getEmail());
        
        category.setName(request.getName());
        category.setIcon(request.getIcon());
        
        category = categoryRepository.save(category);
        return toResponse(category);
    }

    /**
     * Delete a user-defined category
     * Only allowed if no transactions are using it
     */
    @Transactional
    public void delete(Long id) {
        User user = getCurrentUser();
        
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Category not found with id: " + id));
        
        // Check if it's a system category
        if (category.getUser() == null) {
            throw new BadRequestException("Cannot delete system categories");
        }
        
        // Check ownership
        if (!category.getUser().getId().equals(user.getId())) {
            log.warn("User {} attempted to delete category {} owned by another user",
                    user.getEmail(), id);
            throw new ForbiddenException("You do not have access to this category");
        }
        
        // Check if category is in use
        long transactionCount = transactionRepository.countByCategoryId(id);
        if (transactionCount > 0) {
            throw new BadRequestException(
                    String.format("Cannot delete category. It is being used by %d transaction(s)", transactionCount)
            );
        }
        
        log.info("Deleting category {} for user {}", id, user.getEmail());
        categoryRepository.delete(category);
    }

    /**
     * Get a single category by ID
     */
    public CategoryResponse getById(Long id) {
        User user = getCurrentUser();
        
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Category not found with id: " + id));
        
        // Check access: allow system categories or user's own
        if (category.getUser() != null && !category.getUser().getId().equals(user.getId())) {
            throw new ForbiddenException("You do not have access to this category");
        }
        
        return toResponse(category);
    }
}
