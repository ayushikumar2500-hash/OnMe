package com.expensetracker.backend.controller;

import com.expensetracker.backend.dto.CreateUserRequest;
import com.expensetracker.backend.dto.UserDto;
import com.expensetracker.backend.entity.UserEntity;
import com.expensetracker.backend.repo.UserRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class UserController {

    private final UserRepository userRepo;

    public UserController(UserRepository userRepo) {
        this.userRepo = userRepo;
    }

    @GetMapping("/users")
    public List<UserDto> listUsers() {
        return userRepo.findAll().stream()
                .map(u -> new UserDto(u.id, u.name, u.email))
                .toList();
    }

    @PostMapping("/users")
    public UserDto createUser(@RequestBody CreateUserRequest req) {
        UserEntity u = new UserEntity();
        u.name = req.name;
        u.email = req.email;

        UserEntity saved = userRepo.save(u);
        return new UserDto(saved.id, saved.name, saved.email);
    }
}
