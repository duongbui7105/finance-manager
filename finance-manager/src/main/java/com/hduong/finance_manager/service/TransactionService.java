package com.hduong.finance_manager.service;

import com.hduong.finance_manager.common.PageResponse;
import com.hduong.finance_manager.dto.TransactionRequest;
import com.hduong.finance_manager.dto.TransactionResponse;
import com.hduong.finance_manager.entity.Category;
import com.hduong.finance_manager.entity.Transaction;
import com.hduong.finance_manager.entity.Transaction.TransactionType;
import com.hduong.finance_manager.entity.User;
import com.hduong.finance_manager.exception.ForbiddenException;
import com.hduong.finance_manager.exception.NotFoundException;
import com.hduong.finance_manager.repository.CategoryRepository;
import com.hduong.finance_manager.repository.TransactionRepository;
import com.hduong.finance_manager.repository.UserRepository;
import com.hduong.finance_manager.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    // ── Helpers ───────────────────────────────────────────
    private User getCurrentUser() {
        return userRepository.findByEmail(SecurityUtils.getCurrentUserEmail())
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    private Transaction getUserOwnedTransaction(Long id, User user) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Transaction not found with id: " + id));

        if (!transaction.getUser().getId().equals(user.getId())) {
            log.warn("User {} attempted to access transaction {} owned by another user",
                    user.getEmail(), id);
            throw new ForbiddenException("You do not have access to this transaction");
        }

        return transaction;
    }

    private Category getUserOwnedCategory(Long id, User user) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Category not found with id: " + id));

        // allow system categories (user == null) or user's own categories
        if (category.getUser() != null && !category.getUser().getId().equals(user.getId())) {
            log.warn("User {} attempted to access category {} owned by another user",
                    user.getEmail(), id);
            throw new ForbiddenException("You do not have access to this category");
        }

        return category;
    }

    private TransactionResponse toResponse(Transaction t) {
        return TransactionResponse.builder()
                .id(t.getId())
                .amount(t.getAmount())
                .type(t.getType())
                .date(t.getDate())
                .note(t.getNote())
                .categoryName(t.getCategory() != null ? t.getCategory().getName() : null)
                .categoryIcon(t.getCategory() != null ? t.getCategory().getIcon() : null)
                .build();
    }

    private PageResponse<TransactionResponse> toPageResponse(Page<Transaction> page) {
        return PageResponse.<TransactionResponse>builder()
                .content(page.getContent().stream().map(this::toResponse).toList())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    // ── CRUD ─────────────────────────────────────────────
    public TransactionResponse add(TransactionRequest request) {
        User user = getCurrentUser();
        Category category = getUserOwnedCategory(request.getCategoryId(), user);

        Transaction transaction = Transaction.builder()
                .amount(request.getAmount())
                .type(request.getType())
                .date(request.getDate())
                .note(request.getNote())
                .category(category)
                .user(user)
                .build();

        TransactionResponse response = toResponse(transactionRepository.save(transaction));
        log.info("Transaction created — user: {}, type: {}, amount: {}",
                user.getEmail(), request.getType(), request.getAmount());
        return response;
    }

    public TransactionResponse update(Long id, TransactionRequest request) {
        User user = getCurrentUser();
        Transaction transaction = getUserOwnedTransaction(id, user);
        Category category = getUserOwnedCategory(request.getCategoryId(), user);

        transaction.setAmount(request.getAmount());
        transaction.setType(request.getType());
        transaction.setDate(request.getDate());
        transaction.setNote(request.getNote());
        transaction.setCategory(category);

        TransactionResponse response = toResponse(transactionRepository.save(transaction));
        log.info("Transaction updated — id: {}, user: {}", id, user.getEmail());
        return response;
    }

    public void delete(Long id) {
        User user = getCurrentUser();
        Transaction transaction = getUserOwnedTransaction(id, user);
        transactionRepository.delete(transaction);
        log.info("Transaction deleted — id: {}, user: {}", id, user.getEmail());
    }

    // ── Paginated queries ─────────────────────────────────
    public PageResponse<TransactionResponse> getAll(Pageable pageable) {
        User user = getCurrentUser();
        return toPageResponse(transactionRepository.findByUserId(user.getId(), pageable));
    }

    public PageResponse<TransactionResponse> filterByType(TransactionType type, Pageable pageable) {
        User user = getCurrentUser();
        return toPageResponse(
                transactionRepository.findByUserIdAndType(user.getId(), type, pageable));
    }

    public PageResponse<TransactionResponse> filterByDateRange(
            LocalDate from, LocalDate to, Pageable pageable) {
        User user = getCurrentUser();
        return toPageResponse(
                transactionRepository.findByUserIdAndDateBetween(user.getId(), from, to, pageable));
    }

    public PageResponse<TransactionResponse> search(String keyword, Pageable pageable) {
        User user = getCurrentUser();
        return toPageResponse(
                transactionRepository.findByUserIdAndNoteContainingIgnoreCase(
                        user.getId(), keyword, pageable));
    }

    public Map<String, BigDecimal> getSummary() {
        User user = getCurrentUser();
        BigDecimal income  = transactionRepository.sumByUserIdAndType(user.getId(), TransactionType.INCOME);
        BigDecimal expense = transactionRepository.sumByUserIdAndType(user.getId(), TransactionType.EXPENSE);
        return Map.of(
                "totalIncome",  income,
                "totalExpense", expense,
                "balance",      income.subtract(expense)
        );
    }
}