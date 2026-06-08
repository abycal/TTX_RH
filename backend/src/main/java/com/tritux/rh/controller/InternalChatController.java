package com.tritux.rh.controller;

import com.tritux.rh.model.ChatMessage;
import com.tritux.rh.model.UserProfile;
import com.tritux.rh.service.ChatMessageService;
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
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class InternalChatController {

    private final ChatMessageService chatService;
    private final UserProfileService userProfileService;

    private static final String UPLOAD_DIR = "uploads/chat/";

    // ── SSE subscription ──────────────────────────────────────────────────

    /**
     * GET /api/chat/stream
     * Le frontend s'y connecte via EventSource pour recevoir les nouveaux messages
     * en temps réel.
     */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream() {
        return chatService.subscribe();
    }

    // ── History ───────────────────────────────────────────────────────────

    /**
     * GET /api/chat/messages
     * Retourne les 100 derniers messages (chargement initial).
     */
    @GetMapping("/messages")
    public ResponseEntity<List<ChatMessage>> history() {
        return ResponseEntity.ok(chatService.getHistory());
    }

    // ── Send text message ─────────────────────────────────────────────────

    /**
     * POST /api/chat/messages
     * Body JSON : { "content": "..." }
     */
    @PostMapping("/messages")
    public ResponseEntity<ChatMessage> sendText(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody java.util.Map<String, String> body) {

        UserProfile profile = resolveProfile(jwt);

        ChatMessage msg = ChatMessage.builder()
                .senderKeycloakId(jwt.getSubject())
                .senderDisplayName(displayName(profile, jwt))
                .senderHasAvatar(profile != null && profile.getAvatarPath() != null)
                .content(body.get("content"))
                .messageType("TEXT")
                .build();

        return ResponseEntity.ok(chatService.saveAndBroadcast(msg));
    }

    // ── Send file / image ─────────────────────────────────────────────────

    /**
     * POST /api/chat/messages/file
     * Multipart : file + optional "caption"
     */
    @PostMapping("/messages/file")
    public ResponseEntity<ChatMessage> sendFile(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "caption", required = false) String caption) throws IOException {

        // Sauvegarder le fichier
        Path dir = Paths.get(UPLOAD_DIR);
        Files.createDirectories(dir);
        String ext = "";
        String orig = file.getOriginalFilename();
        if (orig != null && orig.contains("."))
            ext = orig.substring(orig.lastIndexOf('.'));
        String stored = UUID.randomUUID() + ext;
        Path dest = dir.resolve(stored);
        file.transferTo(dest);

        String msgType = file.getContentType() != null && file.getContentType().startsWith("image/")
                ? "IMAGE"
                : "FILE";

        UserProfile profile = resolveProfile(jwt);

        ChatMessage msg = ChatMessage.builder()
                .senderKeycloakId(jwt.getSubject())
                .senderDisplayName(displayName(profile, jwt))
                .senderHasAvatar(profile != null && profile.getAvatarPath() != null)
                .content(caption)
                .messageType(msgType)
                .filePath(dest.toString())
                .fileName(orig)
                .fileSize(file.getSize())
                .build();

        return ResponseEntity.ok(chatService.saveAndBroadcast(msg));
    }

    // ── Serve chat files ──────────────────────────────────────────────────

    /**
     * GET /api/chat/files/{filename}
     * Sert les images et fichiers envoyés dans le chat.
     */
    @GetMapping("/files/{filename}")
    public ResponseEntity<Resource> serveFile(@PathVariable String filename) {
        File file = Paths.get(UPLOAD_DIR).resolve(filename).toFile();
        if (!file.exists())
            return ResponseEntity.notFound().build();

        String contentType = "application/octet-stream";
        try {
            contentType = Files.probeContentType(file.toPath());
        } catch (IOException ignored) {
        }
        if (contentType == null)
            contentType = "application/octet-stream";

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .body(new FileSystemResource(file));
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private UserProfile resolveProfile(Jwt jwt) {
        try {
            return userProfileService.getOrCreate(jwt.getSubject());
        } catch (Exception e) {
            return null;
        }
    }

    private String displayName(UserProfile profile, Jwt jwt) {
        if (profile != null && profile.getFirstName() != null && profile.getLastName() != null) {
            return profile.getFirstName() + " " + profile.getLastName();
        }
        // Fallback sur les claims Keycloak
        String name = jwt.getClaimAsString("name");
        if (name != null && !name.isBlank())
            return name;
        String email = jwt.getClaimAsString("email");
        return email != null ? email : "Utilisateur";
    }

    /**
     * DELETE /api/chat/messages/{id}
     * Seul l'expéditeur peut supprimer son propre message.
     */
    @DeleteMapping("/messages/{id}")
    public ResponseEntity<Void> deleteMessage(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long id) {
        chatService.deleteAndBroadcast(id, jwt.getSubject());
        return ResponseEntity.noContent().build();
    }
}