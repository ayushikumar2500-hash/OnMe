package com.expensetracker.backend.dto;

import java.util.Map;

public class CreateExpenseRequest {
    public long paidByUserId;
    public double amount;
    public String description;

    public String splitType;           // "EQUAL" or "CUSTOM"
    public Map<Long, Double> splits;   // used when CUSTOM
}
