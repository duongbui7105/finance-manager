package com.hduong.finance_manager.repository;

import com.hduong.finance_manager.entity.Account;
import com.hduong.finance_manager.entity.Account.AccountType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, Long> {
    
    // Find all accounts for a user
    List<Account> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    // Find active accounts for a user
    List<Account> findByUserIdAndActiveTrue(Long userId);
    
    // Find accounts by type for a user
    List<Account> findByUserIdAndType(Long userId, AccountType type);
    
    // Find single account by ID and user ID (for ownership check)
    Optional<Account> findByIdAndUserId(Long id, Long userId);
    
    // Calculate total balance across all accounts
    @Query("SELECT COALESCE(SUM(a.balance), 0) FROM Account a WHERE a.user.id = :userId AND a.active = true")
    BigDecimal getTotalBalance(@Param("userId") Long userId);
    
    // Calculate total by account type
    @Query("SELECT COALESCE(SUM(a.balance), 0) FROM Account a WHERE a.user.id = :userId AND a.type = :type AND a.active = true")
    BigDecimal getTotalByType(@Param("userId") Long userId, @Param("type") AccountType type);
}
