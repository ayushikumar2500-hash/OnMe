package com.expensetracker.backend.controller;

import com.expensetracker.backend.dto.CreateExpenseRequest;
import com.expensetracker.backend.dto.DebtDto;
import com.expensetracker.backend.dto.ExpenseDto;
import com.expensetracker.backend.entity.ExpenseEntity;
import com.expensetracker.backend.entity.ExpenseSplitEntity;
import com.expensetracker.backend.entity.GroupEntity;
import com.expensetracker.backend.entity.UserEntity;
import com.expensetracker.backend.repo.ExpenseRepository;
import com.expensetracker.backend.repo.GroupRepository;
import com.expensetracker.backend.repo.UserRepository;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.util.*;

@CrossOrigin(origins = "http://localhost:5173", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
@RestController
public class ExpenseController {

    private final ExpenseRepository expenseRepo;
    private final GroupRepository groupRepo;
    private final UserRepository userRepo;

    public ExpenseController(
            ExpenseRepository expenseRepo,
            GroupRepository groupRepo,
            UserRepository userRepo
    ) {
        this.expenseRepo = expenseRepo;
        this.groupRepo = groupRepo;
        this.userRepo = userRepo;
    }

    @Transactional(readOnly = true)
    @GetMapping("/groups/{groupId}/expenses")
    public ResponseEntity<List<Map<String, Object>>> listExpenses(@PathVariable long groupId) {
        try {
            List<ExpenseEntity> expenses = expenseRepo.findByGroup_IdAndArchivedFalse(groupId);
            List<Map<String, Object>> out = new ArrayList<>();
            for (ExpenseEntity e : expenses) {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", e.id);
                m.put("groupId", e.group != null ? e.group.id : groupId);
                m.put("paidByUserId", e.paidBy != null ? e.paidBy.id : null);
                m.put("amount", e.amount != null ? e.amount : 0.0);
                m.put("description", e.description != null ? e.description : "");
                out.add(m);
            }
            return ResponseEntity.ok(out);
        } catch (Exception ex) {
            return ResponseEntity.ok(Collections.emptyList());
        }
    }

    @Transactional(readOnly = true)
    @GetMapping("/groups/{groupId}/expenses/archived")
    public ResponseEntity<List<Map<String, Object>>> listArchivedExpenses(@PathVariable long groupId) {
        try {
            List<ExpenseEntity> expenses = expenseRepo.findByGroup_IdAndArchivedTrue(groupId);
            List<Map<String, Object>> out = new ArrayList<>();
            for (ExpenseEntity e : expenses) {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", e.id);
                m.put("groupId", e.group != null ? e.group.id : groupId);
                m.put("paidByUserId", e.paidBy != null ? e.paidBy.id : null);
                m.put("amount", e.amount != null ? e.amount : 0.0);
                m.put("description", e.description != null ? e.description : "");
                out.add(m);
            }
            return ResponseEntity.ok(out);
        } catch (Exception ex) {
            return ResponseEntity.ok(Collections.emptyList());
        }
    }

    @Transactional
    @PostMapping("/groups/{groupId}/expenses")
    public ResponseEntity<ExpenseDto> createExpense(@PathVariable long groupId, @RequestBody CreateExpenseRequest req) {
        try {
            GroupEntity group = groupRepo.findById(groupId)
                    .orElseThrow(() -> new RuntimeException("Group not found: " + groupId));

            if (req.description == null || req.paidByUserId <= 0 || req.amount <= 0) {
                return ResponseEntity.badRequest().build();
            }
            UserEntity paidBy = userRepo.findById(req.paidByUserId)
                    .orElseThrow(() -> new RuntimeException("User not found: " + req.paidByUserId));

            ExpenseEntity e = new ExpenseEntity();
            e.group = group;
            e.paidBy = paidBy;
            e.amount = req.amount;
            e.description = req.description;
            e.archived = false; // ensure new expenses are active, not old

            // Build splits: equal across members or use provided map
            Map<Long, Double> splits = req.splits;
            if (splits == null && req.splitType != null && req.splitType.equalsIgnoreCase("EQUAL")) {
                int n = group.members.size();
                if (n <= 0) return ResponseEntity.badRequest().build();
                double share = Math.round((req.amount / n) * 100.0) / 100.0;
                splits = new LinkedHashMap<>();
                for (UserEntity m : group.members) {
                    splits.put(m.id, share);
                }
            }
            if (splits != null) {
                for (Map.Entry<Long, Double> entry : splits.entrySet()) {
                    UserEntity u = userRepo.findById(entry.getKey())
                            .orElseThrow(() -> new RuntimeException("User not found: " + entry.getKey()));
                    ExpenseSplitEntity s = new ExpenseSplitEntity();
                    s.expense = e;
                    s.user = u;
                    s.amountOwed = entry.getValue();
                    e.splits.add(s);
                }
            }

            ExpenseEntity saved = expenseRepo.save(e);
            Map<Long, Double> dtoSplits = new LinkedHashMap<>();
            for (ExpenseSplitEntity s : saved.splits) {
                dtoSplits.put(s.user.id, s.amountOwed);
            }
            ExpenseDto dto = new ExpenseDto(
                    saved.id,
                    saved.group.id,
                    saved.paidBy.id,
                    saved.amount,
                    saved.description,
                    dtoSplits,
                    saved.archived // include archived flag to match constructor
            );
            return ResponseEntity.status(201).body(dto);
        } catch (Exception ex) {
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/groups/{groupId}/balances")
    public List<DebtDto> balances(@PathVariable long groupId) {
        GroupEntity group = groupRepo.findById(groupId)
            .orElseThrow(() -> new RuntimeException("Group not found: " + groupId));

        Map<Long, Double> net = new LinkedHashMap<>();
        for (UserEntity u : group.members) net.put(u.id, 0.0);

        List<ExpenseEntity> expenses = expenseRepo.findByGroup_IdAndArchivedFalse(groupId);
        for (ExpenseEntity e : expenses) {
            if (e.paidBy != null && e.amount != null) {
                net.put(e.paidBy.id, net.getOrDefault(e.paidBy.id, 0.0) + e.amount);
            }
            if (e.splits != null) {
                for (ExpenseSplitEntity s : e.splits) {
                    if (s.user != null) {
                        double owed = s.amountOwed == null ? 0.0 : s.amountOwed;
                        net.put(s.user.id, net.getOrDefault(s.user.id, 0.0) - owed);
                    }
                }
            }
        }

        List<Map.Entry<Long, Double>> creditors = new ArrayList<>();
        List<Map.Entry<Long, Double>> debtors = new ArrayList<>();
        for (Map.Entry<Long, Double> e : net.entrySet()) {
            double val = Math.round(e.getValue() * 100.0) / 100.0;
            if (val > 0.0) creditors.add(Map.entry(e.getKey(), val));
            else if (val < 0.0) debtors.add(Map.entry(e.getKey(), val));
        }
        creditors.sort((a,b) -> Double.compare(b.getValue(), a.getValue()));
        debtors.sort((a,b) -> Double.compare(a.getValue(), b.getValue()));

        List<DebtDto> out = new ArrayList<>();
        int i = 0, j = 0;
        while (i < creditors.size() && j < debtors.size()) {
            long cred = creditors.get(i).getKey();
            double cAmt = creditors.get(i).getValue();
            long debt = debtors.get(j).getKey();
            double dAmt = -debtors.get(j).getValue();
            double pay = Math.min(cAmt, dAmt);
            if (pay > 0.0) out.add(new DebtDto(debt, cred, Math.round(pay * 100.0) / 100.0));
            cAmt -= pay;
            dAmt -= pay;
            creditors.set(i, Map.entry(cred, cAmt));
            debtors.set(j, Map.entry(debt, -dAmt));
            if (cAmt <= 1e-9) i++;
            if (dAmt <= 1e-9) j++;
        }
        return out;
    }

    private boolean isBalancesEmpty(long groupId) {
        // Net per user: paid minus owed
        List<ExpenseEntity> expenses = expenseRepo.findByGroup_IdAndArchivedFalse(groupId);
        Map<Long, Double> net = new LinkedHashMap<>();
        for (ExpenseEntity e : expenses) {
            if (e.paidBy != null && e.amount != null) {
                net.put(e.paidBy.id, net.getOrDefault(e.paidBy.id, 0.0) + e.amount);
            }
            if (e.splits != null) {
                for (ExpenseSplitEntity s : e.splits) {
                    if (s.user != null && s.amountOwed != null) {
                        net.put(s.user.id, net.getOrDefault(s.user.id, 0.0) - s.amountOwed);
                    }
                }
            }
        }
        // If any user has non-zero net, balances not empty
        for (double v : net.values()) {
            if (Math.abs(v) > 1e-6) return false;
        }
        return true;
    }

    @Transactional
    @PostMapping("/groups/{groupId}/settle")
    public ResponseEntity<Void> settle(
            @PathVariable long groupId,
            @RequestBody Map<String, Object> req
    ) {
        try {
            Long fromUserId = ((Number) req.getOrDefault("fromUserId", 0)).longValue();
            Long toUserId = ((Number) req.getOrDefault("toUserId", 0)).longValue();
            Double amount = ((Number) req.getOrDefault("amount", 0)).doubleValue();
            if (fromUserId <= 0 || toUserId <= 0 || amount <= 0) {
                return ResponseEntity.badRequest().build();
            }
            GroupEntity group = groupRepo.findById(groupId)
                    .orElseThrow(() -> new RuntimeException("Group not found: " + groupId));
            UserEntity fromUser = userRepo.findById(fromUserId)
                    .orElseThrow(() -> new RuntimeException("User not found: " + fromUserId));
            UserEntity toUser = userRepo.findById(toUserId)
                    .orElseThrow(() -> new RuntimeException("User not found: " + toUserId));

            // Create settlement expense
            ExpenseEntity e = new ExpenseEntity();
            e.group = group;
            e.paidBy = fromUser;
            e.amount = amount;
            e.description = "Settlement";
            ExpenseSplitEntity s = new ExpenseSplitEntity();
            s.expense = e;
            s.user = toUser;
            s.amountOwed = amount;
            e.splits.add(s);
            expenseRepo.save(e);

            // If balances are now empty, archive all active expenses
            if (isBalancesEmpty(groupId)) {
                List<ExpenseEntity> actives = expenseRepo.findByGroup_IdAndArchivedFalse(groupId);
                for (ExpenseEntity x : actives) x.archived = true;
                if (!actives.isEmpty()) expenseRepo.saveAll(actives);
            }

            return ResponseEntity.noContent().build();
        } catch (Exception ex) {
            return ResponseEntity.status(500).build();
        }
    }

    @Transactional
    @PostMapping("/groups/{groupId}/clear-old")
    public ResponseEntity<Void> clearOld(@PathVariable long groupId) {
        try {
            // Delete all archived expenses for this group
            List<ExpenseEntity> archived = expenseRepo.findByGroup_IdAndArchivedTrue(groupId);
            if (!archived.isEmpty()) expenseRepo.deleteAll(archived);
            return ResponseEntity.noContent().build();
        } catch (Exception ex) {
            return ResponseEntity.status(500).build();
        }
    }

    @Transactional
    @DeleteMapping("/groups/{groupId}/expenses/{expenseId}")
    public ResponseEntity<Void> deleteExpense(@PathVariable long groupId, @PathVariable long expenseId) {
        try {
            if (expenseRepo.existsById(expenseId)) {
                expenseRepo.deleteById(expenseId);
                return ResponseEntity.noContent().build();
            }
            return ResponseEntity.notFound().build();
        } catch (Exception ex) {
            return ResponseEntity.status(500).build();
        }
    }
}
