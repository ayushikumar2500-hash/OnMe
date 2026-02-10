package com.expensetracker.backend.dto;

import java.util.Map;

public class ExpenseDto {
    public long id;
    public long groupId;
    public long paidByUserId;
    public double amount;
    public String description;

    // userId -> amountOwed
    public Map<Long, Double> splits;

    public ExpenseDto(long id, long groupId, long paidByUserId, double amount, String description, Map<Long, Double> splits) {
        this.id = id;
        this.groupId = groupId;
        this.paidByUserId = paidByUserId;
        this.amount = amount;
        this.description = description;
        this.splits = splits;
    }
}
