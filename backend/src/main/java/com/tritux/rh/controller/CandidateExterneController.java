package com.tritux.rh.controller;

import com.tritux.rh.model.CandidateExterne;
import com.tritux.rh.service.CandidateExterneService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/candidats-externes")
@RequiredArgsConstructor
public class CandidateExterneController {

    private final CandidateExterneService candidateExterneService;

    /**
     * POST /api/candidats-externes/apply
     * Reçoit la candidature depuis le site web public (multipart/form-data).
     */
    @PostMapping("/apply")
    public ResponseEntity<Map<String, Object>> apply(
            @RequestParam("file") MultipartFile file,
            @RequestParam("fullName") String fullName,
            @RequestParam("email") String email,
            @RequestParam("phone") String phone,
            @RequestParam("country") String country,
            @RequestParam("jobOfferId") UUID jobOfferId) throws IOException {

        CandidateExterne candidate = candidateExterneService.applyFromWebsite(
                file, fullName, email, phone, country, jobOfferId);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "id", candidate.getId().toString()
        ));
    }

    /**
     * GET /api/candidats-externes/offre/{jobOfferId}
     * Liste des candidats d'une offre, triés par score décroissant.
     */
    @GetMapping("/offre/{jobOfferId}")
    public ResponseEntity<List<CandidateExterne>> getByJobOffer(@PathVariable UUID jobOfferId) {
        return ResponseEntity.ok(candidateExterneService.getByJobOffer(jobOfferId));
    }

    /**
     * GET /api/candidats-externes/{id}/cv
     * Prévisualisation du PDF original du candidat.
     */
    @GetMapping("/{id}/cv")
    public ResponseEntity<Resource> getCv(@PathVariable UUID id) {
        CandidateExterne candidate = candidateExterneService.getById(id);
        String path = candidate.getCvPath();
        if (path == null) return ResponseEntity.notFound().build();
        File file = new File(path);
        if (!file.exists()) return ResponseEntity.notFound().build();
        Resource resource = new FileSystemResource(file);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"cv.pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(resource);
    }

    /**
     * PATCH /api/candidats-externes/{id}/status
     * Mise à jour du statut : { "status": "SHORTLISTED" }
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<CandidateExterne> updateStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        String status = body.get("status");
        if (status == null || status.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(candidateExterneService.updateStatus(id, status));
    }

    /**
     * POST /api/candidats-externes/{id}/approve
     *
     * Approuve un candidat et déclenche le Workflow 5 (n8n) :
     *   1. Lit l'agenda Google du RH connecté
     *   2. Groq choisit un créneau libre
     *   3. Envoie un email HTML au candidat avec la convocation
     *
     * Body JSON : { "meetType": "online" | "onsite" }
     */
    @PostMapping("/{id}/approve")
    public ResponseEntity<Map<String, Object>> approve(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal Jwt jwt) {

        String meetType = body.getOrDefault("meetType", "online");
        if (!meetType.equals("online") && !meetType.equals("onsite")) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "meetType doit être 'online' ou 'onsite'"
            ));
        }

        // Récupérer l'email du RH depuis le JWT Keycloak
        String rhEmail = jwt.getClaimAsString("email");
        if (rhEmail == null || rhEmail.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Email RH introuvable dans le token JWT"
            ));
        }

        CandidateExterne updated = candidateExterneService.approve(id, meetType, rhEmail);

        return ResponseEntity.ok(Map.of(
                "success",     true,
                "candidateId", updated.getId().toString(),
                "status",      updated.getStatus(),
                "meetType",    meetType,
                "message",     "Candidat approuvé — email de convocation en cours d'envoi"
        ));
    }

    /**
     * DELETE /api/candidats-externes/{id}
     * Supprime un candidat et son fichier CV du disque.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        candidateExterneService.delete(id);
        return ResponseEntity.noContent().build();
    }
}