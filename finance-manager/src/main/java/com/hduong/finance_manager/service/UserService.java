package com.hduong.finance_manager.service;

import com.hduong.finance_manager.dto.*;
import com.hduong.finance_manager.entity.Budget;
import com.hduong.finance_manager.entity.SavingsGoal;
import com.hduong.finance_manager.entity.User;
import com.hduong.finance_manager.exception.BadRequestException;
import com.hduong.finance_manager.exception.NotFoundException;
import com.hduong.finance_manager.repository.BudgetRepository;
import com.hduong.finance_manager.repository.SavingsGoalRepository;
import com.hduong.finance_manager.repository.UserRepository;
import com.hduong.finance_manager.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final BudgetRepository budgetRepository;
    private final SavingsGoalRepository savingsGoalRepository;
    private final PasswordEncoder passwordEncoder;

    private User getCurrentUser() {
        return userRepository.findByEmail(SecurityUtils.getCurrentUserEmail())
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    // ── Profile ──────────────────────────────────────────
    public ProfileResponse getProfile() {
        return toProfileResponse(getCurrentUser());
    }

    public ProfileResponse updateProfile(UpdateProfileRequest req) {
        User user = getCurrentUser();
        user.setFullName(req.getFullName());
        if (req.getUsername() != null) user.setUsername(req.getUsername());
        user.setPhone(req.getPhone());
        user.setBio(req.getBio());
        user.setDateOfBirth(req.getDateOfBirth());
        if (req.getAvatarUrl() != null) user.setAvatarUrl(req.getAvatarUrl());
        if (req.getGender() != null && !req.getGender().isBlank()) {
            try {
                user.setGender(User.Gender.valueOf(req.getGender().toUpperCase()));
            } catch (IllegalArgumentException ignored) {}
        } else {
            user.setGender(null);
        }
        // Extended fields
        if (req.getAddress()  != null) user.setAddress(req.getAddress());
        if (req.getCity()     != null) user.setCity(req.getCity());
        if (req.getCountry()  != null) user.setCountry(req.getCountry());
        if (req.getLatitude() != null) user.setLatitude(req.getLatitude());
        if (req.getLongitude()!= null) user.setLongitude(req.getLongitude());
        if (req.getOccupation()        != null) user.setOccupation(req.getOccupation());
        if (req.getPreferredCurrency() != null) user.setPreferredCurrency(req.getPreferredCurrency());
        if (req.getTimezone()          != null) user.setTimezone(req.getTimezone());
        if (req.getPreferredLanguage() != null) user.setPreferredLanguage(req.getPreferredLanguage());
        userRepository.save(user);
        log.info("Profile updated for user: {}", user.getEmail());
        return toProfileResponse(user);
    }

    public void changePassword(ChangePasswordRequest req) {
        User user = getCurrentUser();
        if (!passwordEncoder.matches(req.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Mật khẩu hiện tại không đúng");
        }
        if (!req.getNewPassword().equals(req.getConfirmPassword())) {
            throw new BadRequestException("Mật khẩu mới không khớp");
        }
        if (req.getNewPassword().length() < 8) {
            throw new BadRequestException("Mật khẩu mới phải có ít nhất 8 ký tự");
        }
        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);
        log.info("Password changed for user: {}", user.getEmail());
    }

    // ── Budget ───────────────────────────────────────────
    public Budget getBudget() {
        User user = getCurrentUser();
        return budgetRepository.findByUserId(user.getId())
                .orElseGet(() -> Budget.builder()
                        .user(user)
                        .alertEnabled(true)
                        .alertThreshold(80)
                        .build());
    }

    public Budget saveBudget(BudgetRequest req) {
        User user = getCurrentUser();
        Budget budget = budgetRepository.findByUserId(user.getId())
                .orElseGet(() -> Budget.builder().user(user).build());
        budget.setMonthlyLimit(req.getMonthlyLimit());
        budget.setDailyLimit(req.getDailyLimit());
        budget.setAlertEnabled(req.isAlertEnabled());
        budget.setAlertThreshold(req.getAlertThreshold() > 0 ? req.getAlertThreshold() : 80);
        Budget saved = budgetRepository.save(budget);
        log.info("Budget saved for user: {}", user.getEmail());
        return saved;
    }

    // ── Savings Goals ────────────────────────────────────
    public List<SavingsGoal> getSavingsGoals() {
        return savingsGoalRepository.findByUserIdOrderByCreatedAtDesc(getCurrentUser().getId());
    }

    public SavingsGoal createSavingsGoal(SavingsGoalRequest req) {
        User user = getCurrentUser();
        SavingsGoal goal = SavingsGoal.builder()
                .user(user)
                .name(req.getName())
                .targetAmount(req.getTargetAmount())
                .currentAmount(req.getCurrentAmount() != null
                        ? req.getCurrentAmount() : BigDecimal.ZERO)
                .deadline(req.getDeadline())
                .color(req.getColor() != null ? req.getColor() : "#6366f1")
                .icon(req.getIcon()  != null ? req.getIcon()  : "piggy-bank")
                .build();
        return savingsGoalRepository.save(goal);
    }

    public SavingsGoal updateSavingsGoal(Long id, SavingsGoalRequest req) {
        User user = getCurrentUser();
        SavingsGoal goal = savingsGoalRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy mục tiêu tiết kiệm"));
        goal.setName(req.getName());
        goal.setTargetAmount(req.getTargetAmount());
        if (req.getCurrentAmount() != null) goal.setCurrentAmount(req.getCurrentAmount());
        goal.setDeadline(req.getDeadline());
        if (req.getColor() != null) goal.setColor(req.getColor());
        if (req.getIcon()  != null) goal.setIcon(req.getIcon());
        goal.setCompleted(goal.getCurrentAmount().compareTo(goal.getTargetAmount()) >= 0);
        return savingsGoalRepository.save(goal);
    }

    public void deleteSavingsGoal(Long id) {
        User user = getCurrentUser();
        SavingsGoal goal = savingsGoalRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy mục tiêu tiết kiệm"));
        savingsGoalRepository.delete(goal);
    }

    // ── Helper ───────────────────────────────────────────
    private ProfileResponse toProfileResponse(User user) {
        return ProfileResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .username(user.getUsername())
                .email(user.getEmail())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .bio(user.getBio())
                .dateOfBirth(user.getDateOfBirth())
                .gender(user.getGender() != null ? user.getGender().name() : null)
                .role(user.getRole().name())
                .address(user.getAddress())
                .city(user.getCity())
                .country(user.getCountry())
                .latitude(user.getLatitude())
                .longitude(user.getLongitude())
                .occupation(user.getOccupation())
                .preferredCurrency(user.getPreferredCurrency())
                .timezone(user.getTimezone())
                .preferredLanguage(user.getPreferredLanguage())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
