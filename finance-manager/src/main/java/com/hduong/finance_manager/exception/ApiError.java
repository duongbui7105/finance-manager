package com.hduong.finance_manager.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)  // hides null fields from response
public class ApiError {
    private int status;
    private String message;
    private List<String> errors;
    private LocalDateTime timestamp;
}