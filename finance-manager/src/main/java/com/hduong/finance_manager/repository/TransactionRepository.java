package com.hduong.finance_manager.repository;

import com.hduong.finance_manager.entity.Transaction;
import com.hduong.finance_manager.entity.Transaction.TransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    // paginated — all
    Page<Transaction> findByUserId(Long userId, Pageable pageable);

    // paginated — by type
    Page<Transaction> findByUserIdAndType(Long userId, TransactionType type, Pageable pageable);

    // paginated — by date range
    Page<Transaction> findByUserIdAndDateBetween(
            Long userId, LocalDate from, LocalDate to, Pageable pageable);

    // paginated — search by note
    Page<Transaction> findByUserIdAndNoteContainingIgnoreCase(
            Long userId, String keyword, Pageable pageable);

    // reports (non-paginated, kept as is)
    @Query("SELECT MONTH(t.date), YEAR(t.date), t.type, COALESCE(SUM(t.amount), 0) " +
           "FROM Transaction t WHERE t.user.id = :userId AND YEAR(t.date) = :year " +
           "GROUP BY YEAR(t.date), MONTH(t.date), t.type ORDER BY MONTH(t.date)")
    List<Object[]> getMonthlySummary(@Param("userId") Long userId, @Param("year") int year);

    @Query("SELECT c.name, c.icon, COALESCE(SUM(t.amount), 0) " +
           "FROM Transaction t JOIN t.category c " +
           "WHERE t.user.id = :userId AND t.type = 'EXPENSE' " +
           "AND t.date BETWEEN :from AND :to " +
           "GROUP BY c.name, c.icon ORDER BY 3 DESC")
    List<Object[]> getExpenseByCategory(@Param("userId") Long userId,
                                         @Param("from") LocalDate from,
                                         @Param("to") LocalDate to);

    @Query("SELECT DAY(t.date), t.type, COALESCE(SUM(t.amount), 0) " +
           "FROM Transaction t WHERE t.user.id = :userId " +
           "AND YEAR(t.date) = :year AND MONTH(t.date) = :month " +
           "GROUP BY DAY(t.date), t.type ORDER BY DAY(t.date)")
    List<Object[]> getDailySummary(@Param("userId") Long userId,
                                    @Param("year") int year,
                                    @Param("month") int month);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t " +
           "WHERE t.user.id = :userId AND t.type = :type")
    BigDecimal sumByUserIdAndType(@Param("userId") Long userId,
                                   @Param("type") TransactionType type);
}