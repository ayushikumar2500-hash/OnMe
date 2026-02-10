package com.expensetracker.backend.controller;

import com.expensetracker.backend.dto.CreateExpenseRequest;
import com.expensetracker.backend.dto.DebtDto;
import com.expensetracker.backend.dto.ExpenseDto;
import com.expensetracker.backend.dto.GroupDto;
import com.expensetracker.backend.entity.ExpenseEntity;
import com.expensetracker.backend.entity.ExpenseSplitEntity;
import com.expensetracker.backend.entity.GroupEntity;
import com.expensetracker.backend.entity.UserEntity;
import com.expensetracker.backend.repo.ExpenseRepository;
import com.expensetracker.backend.repo.GroupRepository;
import com.expensetracker.backend.repo.UserRepository;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
public class ExpenseController {

    private final ExpenseRepository expenseRepo;
    private final GroupRepository groupRepo;
    private final UserRepository userRepo;
    private final GroupController groupController;

    public ExpenseController(
            ExpenseRepository expenseRepo,
            GroupRepository groupRepo,
            UserRepository userRepo,
            GroupController groupController
    ) {
        this.expenseRepo = expenseRepo;
        this.groupRepo = groupRepo;
        this.userRepo = userRepo;
        this.groupController = groupController;
    }

    @GetMapping("/groups/{groupId}/expenses")
    public List<ExpenseDto> listExpenses(@PathVariable long groupId) {
        List<ExpenseEntity> expenses = expenseRepo.findByGroup_Id(groupId);

        List<ExpenseDto> out = new ArrayList<>();
        for (ExpenseEntity e : expenses) {
            Map<Long, Double> splits = new LinkedHashMap<>();
            for (ExpenseSplitEntity s : e.splits) {
                splits.put(s.user.id, s.amountOwed);
            }

            out.add(new ExpenseDto(
                    e.id,
                    e.group.id,
                    e.paidBy.id,
                    e.amount,
                    e.description,
                    splits
            ));
        }
        return out;
    }

    @PostMapping("/groups/{groupId}/expenses")
    public ExpenseDto createExpense(@PathVariable long groupId, @RequestBody CreateExpenseRequest req) {

        GroupEntity group = groupRepo.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found: " + groupId));

        UserEntity paidBy = userRepo.findById(req.paidByUserId)
                .orElseThrow(() -> new RuntimeException("User not found: " + req.paidByUserId));

        // Determine splits
        Map<Long, Double> splitsToUse = req.splits;

        if (req.splitType != null && req.splitType.equalsIgnoreCase("EQUAL")) {
            GroupDto g = groupController.getGroup(groupId);
            int n = g.memberUserIds.size();
            if (n == 0) throw new RuntimeException("Group has no members");

            double share = Math.round((req.amount / n) * 100.0) / 100.0;

            Map<Long, Double> equal = new LinkedHashMap<>();
            for (Long uid : g.memberUserIds) equal.put(uid, share);
            splitsToUse = equal;
        }

        ExpenseEntity e = new ExpenseEntity();
        e.group = group;
        e.paidBy = paidBy;
        e.amount = req.amount;
        e.description = req.description;

        // Create split rows
        if (splitsToUse != null) {
            for (Map.Entry<Long, Double> entry : splitsToUse.entrySet()) {
                Long uid = entry.getKey();
                Double owed = entry.getValue();

                UserEntity u = userRepo.findById(uid)
                        .orElseThrow(() -> new RuntimeException("User not found: " + uid));

                ExpenseSplitEntity s = new ExpenseSplitEntity();
                s.expense = e;
                s.user = u;
                s.amountOwed = owed;

                e.splits.add(s);
            }
        }

        ExpenseEntity saved = expenseRepo.save(e);

        Map<Long, Double> splitsOut = new LinkedHashMap<>();
        for (ExpenseSplitEntity s : saved.splits) {
            splitsOut.put(s.user.id, s.amountOwed);
        }

        return new ExpenseDto(
                saved.id,
                saved.group.id,
                saved.paidBy.id,
                saved.amount,
                saved.description,
                splitsOut
        );
    }

    @GetMapping("/groups/{groupId}/balances")
    public List<DebtDto> getBalances(@PathVariable long groupId) {
        List<ExpenseEntity> expenses = expenseRepo.findByGroup_Id(groupId);

        Map<Long, Double> net = new HashMap<>();

        for (ExpenseEntity e : expenses) {
            // payer paid the full amount
            net.put(e.paidBy.id, net.getOrDefault(e.paidBy.id, 0.0) + e.amount);

            // each split user owes their part
            for (ExpenseSplitEntity s : e.splits) {
                long uid = s.user.id;
                net.put(uid, net.getOrDefault(uid, 0.0) - s.amountOwed);
            }
        }

        // settle using cents
        List<long[]> creditors = new ArrayList<>();
        List<long[]> debtors = new ArrayList<>();

        for (Map.Entry<Long, Double> entry : net.entrySet()) {
            long userId = entry.getKey();
            long cents = Math.round(entry.getValue() * 100.0);

            if (cents > 0) creditors.add(new long[]{userId, cents});
            else if (cents < 0) debtors.add(new long[]{userId, -cents});
        }

        List<DebtDto> debts = new ArrayList<>();
        int i = 0, j = 0;

        while (i < debtors.size() && j < creditors.size()) {
            long debtorId = debtors.get(i)[0];
            long debtorOwes = debtors.get(i)[1];

            long creditorId = creditors.get(j)[0];
            long creditorIsOwed = creditors.get(j)[1];

            long pay = Math.min(debtorOwes, creditorIsOwed);

            if (pay > 0) debts.add(new DebtDto(debtorId, creditorId, pay / 100.0));

            debtors.get(i)[1] = debtorOwes - pay;
            creditors.get(j)[1] = creditorIsOwed - pay;

            if (debtors.get(i)[1] == 0) i++;
            if (creditors.get(j)[1] == 0) j++;
        }

        return debts;
    }
}
