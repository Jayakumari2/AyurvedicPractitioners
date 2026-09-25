package com.ayurvedic.backend.dto;

import java.time.LocalDateTime;

public record PostResponse(
        Long id,
        Long practitionerUserId,
        String practitionerName,
        String specialization,
        String title,
        String content,
        String topic,
        LocalDateTime createdAt,
        String mediaUrl,
        String mediaType,
        long likeCount,
        boolean likedByCurrentUser,
        long commentCount) {
}