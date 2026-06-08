package com.tritux.rh.repository;

import com.tritux.rh.model.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserProfileRepository extends JpaRepository<UserProfile, String> {
    // La clé primaire est le keycloakId (String), pas un UUID
}