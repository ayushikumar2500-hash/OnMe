package com.expensetracker.backend.repo;

import com.expensetracker.backend.entity.ExpenseEntity;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ExpenseRepository extends JpaRepository<ExpenseEntity, Long> {
    @EntityGraph(attributePaths = {"paidBy", "group", "splits", "splits.user"})
    List<ExpenseEntity> findByGroup_IdAndArchivedFalse(long groupId);
    @EntityGraph(attributePaths = {"paidBy", "group", "splits", "splits.user"})
    List<ExpenseEntity> findByGroup_IdAndArchivedTrue(long groupId);
}
