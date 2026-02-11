package com.expensetracker.backend.controller;

import com.expensetracker.backend.entity.UserEntity;
import com.expensetracker.backend.repo.UserRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class UserControllerSearchExtension {
    private final UserRepository userRepo;
    public UserControllerSearchExtension(UserRepository userRepo) { this.userRepo = userRepo; }

    @GetMapping("/users/search")
    public List<UserEntity> searchUsers(@RequestParam("q") String q) {
        if (q == null || q.isBlank()) return List.of();
        return userRepo.findByNameContainingIgnoreCase(q.trim());
    }
}