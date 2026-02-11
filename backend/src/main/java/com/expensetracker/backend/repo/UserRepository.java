package com.expensetracker.backend.repo;

import com.expensetracker.backend.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface UserRepository extends JpaRepository<UserEntity, Long> {
    List<UserEntity> findByNameContainingIgnoreCase(String name);
}
