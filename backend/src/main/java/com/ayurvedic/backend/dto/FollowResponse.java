package com.ayurvedic.backend.dto;

public record FollowResponse(Long practitionerUserId, boolean following, long followerCount) {
}