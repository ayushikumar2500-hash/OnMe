package com.expensetracker.backend.controller;

import com.expensetracker.backend.dto.CreateGroupRequest;
import com.expensetracker.backend.dto.GroupDto;
import com.expensetracker.backend.entity.GroupEntity;
import com.expensetracker.backend.entity.UserEntity;
import com.expensetracker.backend.repo.GroupRepository;
import com.expensetracker.backend.repo.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;

@CrossOrigin(origins = "http://localhost:5173", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
@RestController
public class GroupController {

    private final GroupRepository groupRepo;
    private final UserRepository userRepo;

    public GroupController(GroupRepository groupRepo, UserRepository userRepo) {
        this.groupRepo = groupRepo;
        this.userRepo = userRepo;
    }

    @GetMapping("/groups")
    public List<GroupDto> listGroups() {
        return groupRepo.findAll().stream()
                .map(g -> new GroupDto(
                        g.id,
                        g.name,
                        g.members.stream().map(u -> u.id).toList()
                ))
                .toList();
    }

    @GetMapping("/groups/{groupId}")
    public GroupDto getGroup(@PathVariable long groupId) {
        GroupEntity g = groupRepo.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found: " + groupId));

        return new GroupDto(
                g.id,
                g.name,
                g.members.stream().map(u -> u.id).toList()
        );
    }

    @PostMapping("/groups")
    public GroupDto createGroup(@RequestBody CreateGroupRequest req) {
        GroupEntity g = new GroupEntity();
        g.name = req.name;

        if (req.memberUserIds != null && !req.memberUserIds.isEmpty()) {
            List<UserEntity> members = userRepo.findAllById(req.memberUserIds);
            g.members.addAll(members);
        }

        GroupEntity saved = groupRepo.save(g);

        return new GroupDto(
                saved.id,
                saved.name,
                saved.members.stream().map(u -> u.id).toList()
        );
    }

    @PutMapping("/groups/{groupId}")
    public GroupDto updateGroupName(@PathVariable long groupId, @RequestBody GroupDto req) {
        GroupEntity g = groupRepo.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found: " + groupId));
        g.name = req.name;
        GroupEntity saved = groupRepo.save(g);
        return new GroupDto(
                saved.id,
                saved.name,
                saved.members.stream().map(u -> u.id).toList()
        );
    }

    @DeleteMapping("/groups/{groupId}")
    public ResponseEntity<Void> deleteGroup(@PathVariable long groupId) {
        if (!groupRepo.existsById(groupId)) {
            return ResponseEntity.notFound().build();
        }
        groupRepo.deleteById(groupId);
        return ResponseEntity.noContent().build();
    }
}
