package com.hduong.finance_manager.repository;


import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.hduong.finance_manager.entity.Category;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByUserIsNull();                        // system defaults
    List<Category> findByUserId(Long userId);                 // user-created
}