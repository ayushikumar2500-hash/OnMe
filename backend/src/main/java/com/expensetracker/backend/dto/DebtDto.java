package com.expensetracker.backend.dto;

public class DebtDto {
    public long fromUserId; // owes
    public long toUserId;   // is owed
    public double amount;

    public DebtDto(long fromUserId, long toUserId, double amount) {
        this.fromUserId = fromUserId;
        this.toUserId = toUserId;
        this.amount = amount;
    }
}
