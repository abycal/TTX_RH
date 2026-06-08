package com.tritux.rh.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "chat_messages")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** ID Keycloak de l'expéditeur */
    @Column(nullable = false)
    private String senderKeycloakId;

    /** Prénom Nom au moment de l'envoi */
    @Column(nullable = false)
    private String senderDisplayName;

    /** true si l'expéditeur avait un avatar au moment de l'envoi */
    private boolean senderHasAvatar;

    /** Contenu textuel (null si message fichier uniquement) */
    @Column(columnDefinition = "TEXT")
    private String content;

    /** Type : TEXT | IMAGE | FILE */
    @Column(nullable = false)
    @Builder.Default
    private String messageType = "TEXT";

    /** Chemin sur le serveur (pour IMAGE et FILE) */
    private String filePath;

    /** Nom original du fichier */
    private String fileName;

    /** Taille en octets */
    private Long fileSize;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;
}