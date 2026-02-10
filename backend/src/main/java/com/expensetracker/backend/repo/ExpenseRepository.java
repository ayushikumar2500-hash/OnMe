package com.expensetracker.backend.repo;

import com.expensetracker.backend.entity.ExpenseEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExpenseRepository extends JpaRepository<ExpenseEntity, Long> {
    List<ExpenseEntity> findByGroup_Id(Long groupId);
}
