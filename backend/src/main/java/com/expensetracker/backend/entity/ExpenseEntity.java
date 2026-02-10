package com.expensetracker.backend.entity;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "expenses")
public class ExpenseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "group_id")
    public GroupEntity group;

    @ManyToOne(optional = false)
    @JoinColumn(name = "paid_by_user_id")
    public UserEntity paidBy;

    public double amount;

    public String description;

    @OneToMany(mappedBy = "expense", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<ExpenseSplitEntity> splits = new ArrayList<>();
}
