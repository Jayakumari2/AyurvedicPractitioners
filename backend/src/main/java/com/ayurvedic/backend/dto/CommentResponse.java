package com.ayurvedic.backend.dto;

import java.time.LocalDateTime;

public record CommentResponse(Long id, String authorName, String content, LocalDateTime createdAt) {
}