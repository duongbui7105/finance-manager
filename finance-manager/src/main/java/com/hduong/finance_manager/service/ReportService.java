package com.hduong.finance_manager.service;

import com.hduong.finance_manager.dto.CategorySummaryResponse;
import com.hduong.finance_manager.dto.DailySummaryResponse;
import com.hduong.finance_manager.dto.MonthlySummaryResponse;
import com.hduong.finance_manager.entity.Transaction.TransactionType;
import com.hduong.finance_manager.entity.User;
import com.hduong.finance_manager.repository.TransactionRepository;
import com.hduong.finance_manager.repository.UserRepository;
import com.hduong.finance_manager.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.Month;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        return userRepository.findByEmail(SecurityUtils.getCurrentUserEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // ── Monthly summary for a full year ───────────────────
    public List<MonthlySummaryResponse> getMonthlySummary(int year) {
        User user = getCurrentUser();
        List<Object[]> rows = transactionRepository.getMonthlySummary(user.getId(), year);

        // build a map: month -> {income, expense}
        Map<Integer, BigDecimal[]> map = new LinkedHashMap<>();
        for (int m = 1; m <= 12; m++) {
            map.put(m, new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO});
        }

        for (Object[] row : rows) {
            int month        = ((Number) row[0]).intValue();
            TransactionType type = TransactionType.valueOf((String) row[2].toString());
            BigDecimal total = (BigDecimal) row[3];

            if (type == TransactionType.INCOME)  map.get(month)[0] = total;
            if (type == TransactionType.EXPENSE) map.get(month)[1] = total;
        }

        List<MonthlySummaryResponse> result = new ArrayList<>();
        map.forEach((month, amounts) -> {
            BigDecimal income  = amounts[0];
            BigDecimal expense = amounts[1];
            result.add(MonthlySummaryResponse.builder()
                    .year(year)
                    .month(month)
                    .monthName(Month.of(month).name().charAt(0)
                            + Month.of(month).name().substring(1).toLowerCase())
                    .income(income)
                    .expense(expense)
                    .balance(income.subtract(expense))
                    .build());
        });

        return result;
    }

    // ── Spending by category ───────────────────────────────
    public List<CategorySummaryResponse> getCategoryBreakdown(LocalDate from, LocalDate to) {
        User user = getCurrentUser();
        List<Object[]> rows = transactionRepository.getExpenseByCategory(user.getId(), from, to);

        // calculate grand total first for percentages
        BigDecimal grandTotal = rows.stream()
                .map(r -> (BigDecimal) r[2])
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<CategorySummaryResponse> result = new ArrayList<>();
        for (Object[] row : rows) {
            BigDecimal total = (BigDecimal) row[2];
            double pct = grandTotal.compareTo(BigDecimal.ZERO) == 0 ? 0 :
                    total.divide(grandTotal, 4, RoundingMode.HALF_UP)
                         .multiply(BigDecimal.valueOf(100))
                         .doubleValue();

            result.add(CategorySummaryResponse.builder()
                    .categoryName((String) row[0])
                    .categoryIcon((String) row[1])
                    .total(total)
                    .percentage(Math.round(pct * 10.0) / 10.0)
                    .build());
        }

        return result;
    }

    // ── Daily breakdown for one month (chart data) ─────────
    public List<DailySummaryResponse> getDailySummary(int year, int month) {
        User user = getCurrentUser();
        List<Object[]> rows = transactionRepository.getDailySummary(user.getId(), year, month);

        Map<Integer, BigDecimal[]> map = new LinkedHashMap<>();
        for (Object[] row : rows) {
            int day = ((Number) row[0]).intValue();
            TransactionType type = TransactionType.valueOf(row[1].toString());
            BigDecimal total = (BigDecimal) row[2];

            map.putIfAbsent(day, new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO});
            if (type == TransactionType.INCOME)  map.get(day)[0] = total;
            if (type == TransactionType.EXPENSE) map.get(day)[1] = total;
        }

        List<DailySummaryResponse> result = new ArrayList<>();
        map.forEach((day, amounts) -> result.add(DailySummaryResponse.builder()
                .day(day)
                .income(amounts[0])
                .expense(amounts[1])
                .build()));

        return result;
    }
}
