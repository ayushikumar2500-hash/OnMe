package com.expensetracker.backend.dto;

import java.util.List;

public class CreateGroupRequest {
    public String name;
    public List<Long> memberUserIds;
}
