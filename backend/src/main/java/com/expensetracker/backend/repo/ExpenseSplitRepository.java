package com.expensetracker.backend.repo;


import com.expensetracker.backend.entity.ExpenseSplitEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExpenseSplitRepository extends JpaRepository<ExpenseSplitEntity, Long> {

    List<ExpenseSplitEntity> findByExpenseGroupId(Long groupId);
}
