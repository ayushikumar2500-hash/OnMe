package com.expensetracker.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "expense_splits")
public class ExpenseSplitEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "expense_id")
    public ExpenseEntity expense;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id")
    public UserEntity user;

    // Use wrapper to allow null checks and avoid primitive null comparison errors
    public Double amountOwed;
}
