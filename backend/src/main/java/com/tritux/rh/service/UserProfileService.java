package com.tritux.rh.service;

import com.tritux.rh.model.UserProfile;
import com.tritux.rh.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserProfileService {

    private final UserProfileRepository userProfileRepository;

    @Value("${uploads.avatars.dir:uploads/avatars/}")
    private String avatarsDir;

    // ── Récupère ou crée un profil vide ───────────────────────────────────
    public UserProfile getOrCreate(String keycloakId) {
        return userProfileRepository.findById(keycloakId)
                .orElseGet(() -> {
                    UserProfile p = UserProfile.builder()
                            .keycloakId(keycloakId)
                            .role("Responsable RH")
                            .build();
                    return userProfileRepository.save(p);
                });
    }

    // ── Met à jour nom / prénom / rôle ────────────────────────────────────
    public UserProfile updateInfo(String keycloakId, String firstName, String lastName, String role) {
        UserProfile profile = getOrCreate(keycloakId);
        if (firstName != null) profile.setFirstName(firstName);
        if (lastName  != null) profile.setLastName(lastName);
        if (role      != null) profile.setRole(role);
        return userProfileRepository.save(profile);
    }

    // ── Upload avatar ─────────────────────────────────────────────────────
    public UserProfile uploadAvatar(String keycloakId, MultipartFile file) throws IOException {
        // Valider type MIME
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Le fichier doit être une image");
        }
        // Valider taille (2 Mo max)
        if (file.getSize() > 2 * 1024 * 1024) {
            throw new IllegalArgumentException("Image trop lourde (max 2 Mo)");
        }

        // Créer le dossier si nécessaire
        Path dir = Paths.get(avatarsDir);
        Files.createDirectories(dir);

        // Générer un nom unique
        String ext = Optional.ofNullable(file.getOriginalFilename())
                .filter(n -> n.contains("."))
                .map(n -> n.substring(n.lastIndexOf('.')))
                .orElse(".jpg");
        String fileName = keycloakId + "_" + UUID.randomUUID() + ext;
        Path filePath = dir.resolve(fileName);

        // Supprimer l'ancienne photo si elle existe
        UserProfile profile = getOrCreate(keycloakId);
        if (profile.getAvatarPath() != null) {
            File old = new File(profile.getAvatarPath());
            if (old.exists()) old.delete();
        }

        // Sauvegarder le nouveau fichier
        Files.write(filePath, file.getBytes());
        profile.setAvatarPath(filePath.toString());
        return userProfileRepository.save(profile);
    }

    // ── Supprimer avatar ──────────────────────────────────────────────────
    public UserProfile removeAvatar(String keycloakId) {
        UserProfile profile = getOrCreate(keycloakId);
        if (profile.getAvatarPath() != null) {
            File old = new File(profile.getAvatarPath());
            if (old.exists()) old.delete();
            profile.setAvatarPath(null);
        }
        return userProfileRepository.save(profile);
    }
}