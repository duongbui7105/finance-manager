package com.hduong.finance_manager.dto;

import com.hduong.finance_manager.entity.Account.AccountType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class AccountRequest {

    @NotBlank(message = "Account name is required")
    private String name;

    @NotNull(message = "Account type is required")
    private AccountType type;

    private BigDecimal balance;  // optional, defaults to 0

    private String currency;  // optional, defaults to VND

    private String icon;

    private String color;

    private String description;

    private Boolean active;  // optional, defaults to true
}
