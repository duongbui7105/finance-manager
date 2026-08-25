package com.hduong.finance_manager.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "accounts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Account {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @NotBlank
    @Column(nullable = false)
    private String name;  // e.g., "Techcombank Savings", "Cash Wallet"

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AccountType type;

    @Builder.Default
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal balance = BigDecimal.ZERO;

    @Column(length = 10)
    @Builder.Default
    private String currency = "VND";

    @Column(length = 20)
    private String icon;  // optional icon for UI

    @Column(length = 20)
    private String color;  // optional color for UI

    private String description;  // optional notes

    @Builder.Default
    private boolean active = true;  // can deactivate accounts

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public enum AccountType {
        CHECKING,    // Tài khoản thanh toán
        SAVINGS,     // Tài khoản tiết kiệm
        CREDIT,      // Thẻ tín dụng
        INVESTMENT,  // Tài khoản đầu tư
        CASH,        // Tiền mặt
        LOAN         // Khoản vay
    }
}
