package com.tritux.rh.controller;

import com.tritux.rh.model.UserProfile;
import com.tritux.rh.service.UserProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserProfileService userProfileService;

    /**
     * GET /api/profile
     * Retourne le profil de l'utilisateur connecté.
     */
    @GetMapping
    public ResponseEntity<UserProfile> getMyProfile(@AuthenticationPrincipal Jwt jwt) {
        String keycloakId = jwt.getSubject();
        return ResponseEntity.ok(userProfileService.getOrCreate(keycloakId));
    }

    /**
     * PUT /api/profile
     * Met à jour prénom, nom, rôle.
     * Body JSON : { "firstName": "...", "lastName": "...", "role": "..." }
     */
    @PutMapping
    public ResponseEntity<UserProfile> updateProfile(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody Map<String, String> body) {
        String keycloakId = jwt.getSubject();
        UserProfile updated = userProfileService.updateInfo(
                keycloakId,
                body.get("firstName"),
                body.get("lastName"),
                body.get("role")
        );
        return ResponseEntity.ok(updated);
    }

    /**
     * POST /api/profile/avatar
     * Upload la photo de profil de l'utilisateur connecté.
     */
    @PostMapping("/avatar")
    public ResponseEntity<UserProfile> uploadAvatar(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam("file") MultipartFile file) throws IOException {
        String keycloakId = jwt.getSubject();
        UserProfile updated = userProfileService.uploadAvatar(keycloakId, file);
        return ResponseEntity.ok(updated);
    }

    /**
     * DELETE /api/profile/avatar
     * Supprime la photo de profil.
     */
    @DeleteMapping("/avatar")
    public ResponseEntity<UserProfile> removeAvatar(@AuthenticationPrincipal Jwt jwt) {
        String keycloakId = jwt.getSubject();
        return ResponseEntity.ok(userProfileService.removeAvatar(keycloakId));
    }

    /**
     * GET /api/profile/avatar/{keycloakId}
     * Sert l'image d'un utilisateur — accessible par tous les collègues authentifiés.
     * Utilisé dans le chat pour afficher la photo de l'expéditeur.
     */
    @GetMapping("/avatar/{keycloakId}")
    public ResponseEntity<Resource> getAvatar(@PathVariable String keycloakId) {
        UserProfile profile = userProfileService.getOrCreate(keycloakId);
        String path = profile.getAvatarPath();

        if (path == null) return ResponseEntity.notFound().build();

        File file = new File(path);
        if (!file.exists()) return ResponseEntity.notFound().build();

        // Détecter le type MIME depuis l'extension
        String contentType = "image/jpeg";
        if (path.endsWith(".png"))  contentType = "image/png";
        if (path.endsWith(".webp")) contentType = "image/webp";
        if (path.endsWith(".gif"))  contentType = "image/gif";

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .body(new FileSystemResource(file));
    }
}