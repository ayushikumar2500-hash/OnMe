package com.expensetracker.backend.controller;

import com.expensetracker.backend.dto.CreateUserRequest;
import com.expensetracker.backend.dto.UserDto;
import com.expensetracker.backend.entity.UserEntity;
import com.expensetracker.backend.repo.UserRepository;
import com.expensetracker.backend.repo.GroupRepository;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

import java.util.List;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
public class UserController {

    private final UserRepository userRepo;
    private final GroupRepository groupRepo;

    public UserController(UserRepository userRepo, GroupRepository groupRepo) {
        this.userRepo = userRepo;
        this.groupRepo = groupRepo;
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

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable long id) {
        var userOpt = userRepo.findById(id);
        if (userOpt.isEmpty()) return ResponseEntity.notFound().build();

        // Detach user from all groups to satisfy FK constraints
        UserEntity user = userOpt.get();
        groupRepo.findAll().forEach(g -> {
            if (g.members.removeIf(u -> u.id == user.id)) {
                groupRepo.save(g);
            }
        });

        userRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
