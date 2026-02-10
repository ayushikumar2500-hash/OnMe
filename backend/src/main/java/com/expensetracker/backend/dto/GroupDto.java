package com.expensetracker.backend.dto;

import java.util.List;

public class GroupDto {
    public long id;
    public String name;
    public List<Long> memberUserIds;

    public GroupDto(long id, String name, List<Long> memberUserIds) {
        this.id = id;
        this.name = name;
        this.memberUserIds = memberUserIds;
    }
}
