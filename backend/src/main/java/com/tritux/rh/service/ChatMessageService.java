package com.tritux.rh.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.tritux.rh.model.ChatMessage;
import com.tritux.rh.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatMessageService {

    private final ChatMessageRepository repository;

    /** Liste thread-safe des connexions SSE actives */
    private final CopyOnWriteArrayList<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    private final ObjectMapper mapper = new ObjectMapper()
            .registerModule(new JavaTimeModule());

    // ── SSE ───────────────────────────────────────────────────────────────

    public SseEmitter subscribe() {
        SseEmitter emitter = new SseEmitter(0L); // pas de timeout

        emitters.add(emitter);

        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(()    -> emitters.remove(emitter));
        emitter.onError(e      -> emitters.remove(emitter));

        // Envoyer un événement "ping" pour confirmer la connexion
        try {
            emitter.send(SseEmitter.event().name("ping").data("connected"));
        } catch (IOException e) {
            emitters.remove(emitter);
        }

        return emitter;
    }

    /** Diffuse un message à tous les clients connectés */
    private void broadcast(ChatMessage msg) {
        String json;
        try {
            json = mapper.writeValueAsString(msg);
        } catch (Exception e) {
            log.error("Serialization error", e);
            return;
        }

        List<SseEmitter> dead = new CopyOnWriteArrayList<>();
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name("message").data(json));
            } catch (IOException ex) {
                dead.add(emitter);
            }
        }
        emitters.removeAll(dead);
    }

    // ── CRUD ──────────────────────────────────────────────────────────────

    public List<ChatMessage> getHistory() {
        return repository.findTop100ByOrderByCreatedAtAsc();
    }

    public ChatMessage saveAndBroadcast(ChatMessage msg) {
        ChatMessage saved = repository.save(msg);
        broadcast(saved);
        return saved;
    }
    public void deleteAndBroadcast(Long messageId, String requesterKeycloakId) {
    repository.findById(messageId).ifPresent(msg -> {
        if (!msg.getSenderKeycloakId().equals(requesterKeycloakId)) {
            throw new org.springframework.security.access.AccessDeniedException("Not your message");
        }
        repository.delete(msg);

        // Notifier tous les clients de la suppression
        String payload = "{\"deleted\":true,\"id\":" + messageId + "}";
        List<SseEmitter> dead = new CopyOnWriteArrayList<>();
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name("delete").data(payload));
            } catch (IOException ex) {
                dead.add(emitter);
            }
        }
        emitters.removeAll(dead);
    });
}
}