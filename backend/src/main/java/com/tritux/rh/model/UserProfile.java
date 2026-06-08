package com.tritux.rh.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfile {

    @Id
    @Column(name = "keycloak_id", nullable = false, unique = true)
    private String keycloakId;  // sub du JWT Keycloak — clé primaire directe

    @Column(name = "first_name")
    private String firstName;

    @Column(name = "last_name")
    private String lastName;

    @Column(name = "role")
    private String role;

    // Chemin relatif vers le fichier image, ex: "uploads/avatars/abc123.jpg"
    @Column(name = "avatar_path")
    private String avatarPath;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}