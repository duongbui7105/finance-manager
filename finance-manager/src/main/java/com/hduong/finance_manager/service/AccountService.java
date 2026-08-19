package com.hduong.finance_manager.service;

import com.hduong.finance_manager.dto.AccountRequest;
import com.hduong.finance_manager.dto.AccountResponse;
import com.hduong.finance_manager.entity.Account;
import com.hduong.finance_manager.entity.Account.AccountType;
import com.hduong.finance_manager.entity.User;
import com.hduong.finance_manager.exception.ForbiddenException;
import com.hduong.finance_manager.exception.NotFoundException;
import com.hduong.finance_manager.repository.AccountRepository;
import com.hduong.finance_manager.repository.UserRepository;
import com.hduong.finance_manager.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepository;
    private final UserRepository userRepository;

    // ── Helpers ───────────────────────────────────────────
    private User getCurrentUser() {
        return userRepository.findByEmail(SecurityUtils.getCurrentUserEmail())
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    private AccountResponse toResponse(Account account) {
        return AccountResponse.builder()
                .id(account.getId())
                .name(account.getName())
                .type(account.getType())
                .balance(account.getBalance())
                .currency(account.getCurrency())
                .icon(account.getIcon())
                .color(account.getColor())
                .description(account.getDescription())
                .active(account.isActive())
                .createdAt(account.getCreatedAt())
                .updatedAt(account.getUpdatedAt())
                .userId(account.getUser().getId())
                .build();
    }

    // ── CRUD Operations ───────────────────────────────────

    /**
     * Get all accounts for current user
     */
    public List<AccountResponse> getAll() {
        User user = getCurrentUser();
        return accountRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get only active accounts
     */
    public List<AccountResponse> getActive() {
        User user = getCurrentUser();
        return accountRepository.findByUserIdAndActiveTrue(user.getId()).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get accounts by type
     */
    public List<AccountResponse> getByType(AccountType type) {
        User user = getCurrentUser();
        return accountRepository.findByUserIdAndType(user.getId(), type).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get account by ID
     */
    public AccountResponse getById(Long id) {
        User user = getCurrentUser();
        Account account = accountRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new NotFoundException("Account not found with id: " + id));
        return toResponse(account);
    }

    /**
     * Create a new account
     */
    @Transactional
    public AccountResponse create(AccountRequest request) {
        User user = getCurrentUser();
        
        log.info("Creating account '{}' of type {} for user {}", 
                request.getName(), request.getType(), user.getEmail());
        
        Account account = Account.builder()
                .user(user)
                .name(request.getName())
                .type(request.getType())
                .balance(request.getBalance() != null ? request.getBalance() : BigDecimal.ZERO)
                .currency(request.getCurrency() != null ? request.getCurrency() : "VND")
                .icon(request.getIcon())
                .color(request.getColor())
                .description(request.getDescription())
                .active(request.getActive() != null ? request.getActive() : true)
                .build();
        
        account = accountRepository.save(account);
        return toResponse(account);
    }

    /**
     * Update an account
     */
    @Transactional
    public AccountResponse update(Long id, AccountRequest request) {
        User user = getCurrentUser();
        
        Account account = accountRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new NotFoundException("Account not found with id: " + id));
        
        log.info("Updating account {} for user {}", id, user.getEmail());
        
        account.setName(request.getName());
        account.setType(request.getType());
        if (request.getBalance() != null) {
            account.setBalance(request.getBalance());
        }
        if (request.getCurrency() != null) {
            account.setCurrency(request.getCurrency());
        }
        account.setIcon(request.getIcon());
        account.setColor(request.getColor());
        account.setDescription(request.getDescription());
        if (request.getActive() != null) {
            account.setActive(request.getActive());
        }
        
        account = accountRepository.save(account);
        return toResponse(account);
    }

    /**
     * Delete an account
     */
    @Transactional
    public void delete(Long id) {
        User user = getCurrentUser();
        
        Account account = accountRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new NotFoundException("Account not found with id: " + id));
        
        log.info("Deleting account {} for user {}", id, user.getEmail());
        accountRepository.delete(account);
    }

    /**
     * Get account summary (total balance, assets, liabilities)
     */
    public Map<String, Object> getSummary() {
        User user = getCurrentUser();
        
        BigDecimal totalBalance = accountRepository.getTotalBalance(user.getId());
        
        // Assets: CHECKING, SAVINGS, INVESTMENT, CASH
        BigDecimal assets = BigDecimal.ZERO;
        assets = assets.add(accountRepository.getTotalByType(user.getId(), AccountType.CHECKING));
        assets = assets.add(accountRepository.getTotalByType(user.getId(), AccountType.SAVINGS));
        assets = assets.add(accountRepository.getTotalByType(user.getId(), AccountType.INVESTMENT));
        assets = assets.add(accountRepository.getTotalByType(user.getId(), AccountType.CASH));
        
        // Liabilities: CREDIT, LOAN (treated as negative)
        BigDecimal liabilities = BigDecimal.ZERO;
        liabilities = liabilities.add(accountRepository.getTotalByType(user.getId(), AccountType.CREDIT));
        liabilities = liabilities.add(accountRepository.getTotalByType(user.getId(), AccountType.LOAN));
        
        BigDecimal netWorth = assets.subtract(liabilities);
        
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalBalance", totalBalance);
        summary.put("assets", assets);
        summary.put("liabilities", liabilities);
        summary.put("netWorth", netWorth);
        
        return summary;
    }
}
