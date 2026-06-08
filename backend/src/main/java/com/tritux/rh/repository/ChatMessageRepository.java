package com.tritux.rh.repository;

import com.tritux.rh.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    /** Derniers N messages triés par date croissante */
    List<ChatMessage> findTop100ByOrderByCreatedAtAsc();
}