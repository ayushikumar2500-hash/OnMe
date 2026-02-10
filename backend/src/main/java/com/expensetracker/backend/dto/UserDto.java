package com.expensetracker.backend.dto;

public class UserDto {
    public long id;
    public String name;
    public String email;

    public UserDto(long id, String name, String email) {
        this.id = id;
        this.name = name;
        this.email = email;
    }
}
