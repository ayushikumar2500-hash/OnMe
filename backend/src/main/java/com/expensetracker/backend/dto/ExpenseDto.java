package com.expensetracker.backend.dto;

import java.util.Map;

public class ExpenseDto {
    public Long id;
    public Long groupId;
    public Long paidByUserId;
    public Double amount;
    public String description;
    public Boolean archived;

    // userId -> amountOwed
    public Map<Long, Double> splits;

    public ExpenseDto(Long id, Long groupId, Long paidByUserId, Double amount, String description, Map<Long, Double> splits, Boolean archived) {
        this.id = id;
        this.groupId = groupId;
        this.paidByUserId = paidByUserId;
        this.amount = amount;
        this.description = description;
        this.splits = splits;
        this.archived = archived;
    }
}
