package com.tritux.rh.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tritux.rh.model.CandidateExterne;
import com.tritux.rh.model.GoogleCalendarToken;
import com.tritux.rh.repository.CandidateExterneRepository;
import com.tritux.rh.repository.GoogleCalendarTokenRepository;
import com.tritux.rh.repository.JobOfferRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

import java.io.IOException;
import java.nio.file.*;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CandidateExterneService {

    private final CandidateExterneRepository candidateExterneRepository;
    private final JobOfferRepository jobOfferRepository;
    private final GoogleCalendarTokenRepository googleCalendarTokenRepository;
    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;

    @Value("${python.service.url}")
    private String pythonServiceUrl;

    @Value("${uploads.externes.dir}")
    private String uploadsExternesDir;

    @Value("${n8n.interview.webhook.url}")
    private String n8nInterviewWebhookUrl;

    /**
     * Point d'entrée principal : reçoit la candidature depuis le site web,
     * sauvegarde le fichier, crée l'entité, extrait le texte via FastAPI,
     * puis envoie à n8n pour le scoring (non bloquant).
     */
    public CandidateExterne applyFromWebsite(
            MultipartFile file,
            String fullName,
            String email,
            String phone,
            String country,
            UUID jobOfferId) throws IOException {

        // 1. Sauvegarder le fichier PDF dans uploads/externes/
        Files.createDirectories(Paths.get(uploadsExternesDir));
        String filename = System.currentTimeMillis() + "_" + file.getOriginalFilename();
        Path filePath = Paths.get(uploadsExternesDir, filename);
        Files.write(filePath, file.getBytes());

        // 2. Créer et sauvegarder l'entité avec status = NEW
        CandidateExterne candidate = CandidateExterne.builder()
                .fullName(fullName)
                .email(email)
                .phone(phone)
                .country(country)
                .cvPath(filePath.toString())
                .jobOfferId(jobOfferId)
                .status("NEW")
                .build();

        CandidateExterne saved = candidateExterneRepository.save(candidate);

        // 3. Lire les bytes du fichier MAINTENANT, avant que Tomcat nettoie le fichier
        // temporaire
        final byte[] fileBytes = file.getBytes();
        final String originalFilename = file.getOriginalFilename();

        // 4. Extraction texte + scoring en arrière-plan (non bloquant)
        triggerScoringAsync(saved, fileBytes, originalFilename, jobOfferId);

        return saved;
    }

    /**
     * Approuver un candidat externe :
     * - change son statut en SHORTLISTED
     * - récupère le token Google Calendar du RH
     * - déclenche le workflow n8n 5 (scheduler + email)
     *
     * @param candidateId  UUID du candidat
     * @param meetType     "online" | "onsite"
     * @param rhEmail      email du RH connecté (depuis JWT Keycloak)
     */
    public CandidateExterne approve(UUID candidateId, String meetType, String rhEmail) {
        // 1. Récupérer le candidat
        CandidateExterne candidate = getById(candidateId);

        // 2. Récupérer le titre du poste
        String jobTitle = "Poste Tritux";
        try {
            var offer = jobOfferRepository.findById(candidate.getJobOfferId());
            if (offer.isPresent()) {
                jobTitle = offer.get().getTitleFr();
            }
        } catch (Exception e) {
            log.warn("[Approve] Impossible de récupérer l'offre: {}", e.getMessage());
        }

        // 3. Récupérer le token Google Calendar du RH
        String accessToken = "";
        try {
            var tokenOpt = googleCalendarTokenRepository.findByEmail(rhEmail);
            if (tokenOpt.isPresent()) {
                GoogleCalendarToken token = tokenOpt.get();
                // Vérifier si le token est encore valide (avec 60s de marge)
                if (token.getExpiresAt() != null &&
                    Instant.now().isBefore(token.getExpiresAt().minusSeconds(60))) {
                    accessToken = token.getAccessToken();
                } else {
                    log.warn("[Approve] Token Google expiré pour {}. Le calendrier sera ignoré.", rhEmail);
                }
            } else {
                log.warn("[Approve] Aucun token Google Calendar pour {}. Le calendrier sera ignoré.", rhEmail);
            }
        } catch (Exception e) {
            log.warn("[Approve] Erreur récupération token Google: {}", e.getMessage());
        }

        // 4. Mettre à jour le statut
        candidate.setStatus("SHORTLISTED");
        CandidateExterne saved = candidateExterneRepository.save(candidate);

        // 5. Déclencher le workflow n8n en arrière-plan (non bloquant)
        final String finalJobTitle = jobTitle;
        final String finalAccessToken = accessToken;
        new Thread(() -> triggerInterviewScheduler(
                candidate, finalJobTitle, meetType, rhEmail, finalAccessToken
        )).start();

        return saved;
    }

    /**
     * Appelle le webhook n8n du Workflow 5 pour planifier l'entretien et envoyer l'email.
     */
    private void triggerInterviewScheduler(
            CandidateExterne candidate,
            String jobTitle,
            String meetType,
            String rhEmail,
            String accessToken) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("candidateId",    candidate.getId().toString());
            payload.put("candidateName",  candidate.getFullName());
            payload.put("candidateEmail", candidate.getEmail());
            payload.put("jobTitle",       jobTitle);
            payload.put("meetType",       meetType);
            payload.put("rhEmail",        rhEmail);
            payload.put("accessToken",    accessToken);

            WebClient client = webClientBuilder.baseUrl(n8nInterviewWebhookUrl).build();

            String response = client.post()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(objectMapper.writeValueAsString(payload))
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            log.info("[Approve] Workflow n8n 5 déclenché pour candidat {} — réponse: {}",
                    candidate.getId(), response);

        } catch (Exception e) {
            log.error("[Approve] Erreur déclenchement workflow n8n 5 pour {}: {}",
                    candidate.getId(), e.getMessage());
        }
    }

    /**
     * Appelle FastAPI POST /api/extract-and-score (extraction texte + appel n8n
     * Groq).
     * FastAPI orchestre tout et retourne { candidate_id, score, scoringDetails }.
     * Non bloquant — les erreurs sont loguées, le candidat reste sauvegardé avec
     * score = null.
     */
    private void triggerScoringAsync(CandidateExterne candidate, byte[] fileBytes, String originalFilename,
            UUID jobOfferId) {
        new Thread(() -> {
            try {
                // Récupérer les infos de l'offre
                String jobTitle = "";
                String jobDescription = "";
                try {
                    var jobOffer = jobOfferRepository.findById(jobOfferId);
                    if (jobOffer.isPresent()) {
                        jobTitle = jobOffer.get().getTitleFr();
                        jobDescription = jobOffer.get().getDescriptionFr() != null
                                ? jobOffer.get().getDescriptionFr()
                                : "";
                    }
                } catch (Exception e) {
                    log.warn("[CandidateExterneService] Impossible de récupérer l'offre {}: {}", jobOfferId,
                            e.getMessage());
                }

                // Appel unique à FastAPI — extraction + n8n scoring en une seule requête
                callExtractAndScore(candidate.getId(), fileBytes, originalFilename, jobTitle, jobDescription);

            } catch (Exception e) {
                log.error("[CandidateExterneService] Erreur scoring pour candidat {}: {}", candidate.getId(),
                        e.getMessage());
            }
        }).start();
    }

    /**
     * Envoie le fichier PDF à FastAPI /api/extract-and-score avec les infos de
     * l'offre.
     */
    private void callExtractAndScore(UUID candidateId, byte[] fileBytes, String originalFilename, String jobTitle,
            String jobDescription) {
        try {
            WebClient client = webClientBuilder.baseUrl(pythonServiceUrl).build();

            MultipartBodyBuilder bodyBuilder = new MultipartBodyBuilder();
            bodyBuilder.part("file", new ByteArrayResource(fileBytes) {
                @Override
                public String getFilename() {
                    return originalFilename != null ? originalFilename : "cv.pdf";
                }
            }).contentType(MediaType.APPLICATION_OCTET_STREAM);
            bodyBuilder.part("candidate_id", candidateId.toString());
            bodyBuilder.part("job_title", jobTitle);
            bodyBuilder.part("job_description", jobDescription);

            String jsonResponse = client.post()
                    .uri("/api/extract-and-score")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(BodyInserters.fromMultipartData(bodyBuilder.build()))
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            if (jsonResponse == null) {
                log.warn("[CandidateExterneService] Réponse FastAPI vide pour candidat {}", candidateId);
                return;
            }

            // Parser la réponse et mettre à jour le candidat
            JsonNode result = objectMapper.readTree(jsonResponse);

            final Integer finalScore;
            if (result.has("score") && !result.get("score").isNull()) {
                int raw = result.get("score").asInt();
                finalScore = Math.max(0, Math.min(100, raw));
            } else {
                finalScore = null;
            }

            final String scoringDetails = result.has("scoringDetails")
                    ? result.get("scoringDetails").asText("{}")
                    : "{}";

            candidateExterneRepository.findById(candidateId).ifPresent(c -> {
                c.setScore(finalScore);
                c.setScoringDetails(scoringDetails);
                candidateExterneRepository.save(c);
                log.info("[CandidateExterneService] Score {} attribué au candidat {}", finalScore, candidateId);
            });

        } catch (Exception e) {
            log.error("[CandidateExterneService] Erreur callExtractAndScore pour {}: {}", candidateId, e.getMessage());
        }
    }

    public List<CandidateExterne> getByJobOffer(UUID jobOfferId) {
        return candidateExterneRepository.findByJobOfferIdOrderByScoreDesc(jobOfferId);
    }

    public CandidateExterne getById(UUID id) {
        return candidateExterneRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Candidat externe non trouvé: " + id));
    }

    public CandidateExterne updateStatus(UUID id, String status) {
        CandidateExterne candidate = getById(id);
        candidate.setStatus(status);
        return candidateExterneRepository.save(candidate);
    }

    public void delete(UUID id) {
        CandidateExterne candidate = getById(id);

        // Supprimer le fichier CV du disque si présent
        if (candidate.getCvPath() != null) {
            try {
                Files.deleteIfExists(Paths.get(candidate.getCvPath()));
            } catch (IOException e) {
                log.warn("[CandidateExterneService] Impossible de supprimer le fichier CV : {}", e.getMessage());
            }
        }

        candidateExterneRepository.deleteById(id);
        log.info("[CandidateExterneService] Candidat {} supprimé", id);
    }
}