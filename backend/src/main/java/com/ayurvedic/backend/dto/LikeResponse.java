package com.ayurvedic.backend.dto;

public record LikeResponse(Long postId, boolean liked, long likeCount) {
}