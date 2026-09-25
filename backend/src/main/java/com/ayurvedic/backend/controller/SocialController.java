package com.ayurvedic.backend.controller;

import com.ayurvedic.backend.domain.PractitionerFollow;
import com.ayurvedic.backend.domain.PractitionerPost;
import com.ayurvedic.backend.domain.PractitionerProfile;
import com.ayurvedic.backend.domain.User;
import com.ayurvedic.backend.dto.CreatePostRequest;
import com.ayurvedic.backend.dto.CreateCommentRequest;
import com.ayurvedic.backend.dto.CommentResponse;
import com.ayurvedic.backend.dto.FollowResponse;
import com.ayurvedic.backend.dto.LikeResponse;
import com.ayurvedic.backend.dto.PostResponse;
import com.ayurvedic.backend.repository.PractitionerFollowRepository;
import com.ayurvedic.backend.repository.PractitionerPostRepository;
import com.ayurvedic.backend.repository.PractitionerProfileRepository;
import com.ayurvedic.backend.repository.PostCommentRepository;
import com.ayurvedic.backend.repository.PostLikeRepository;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/social")
public class SocialController {

    private final PractitionerPostRepository postRepository;
    private final PractitionerFollowRepository followRepository;
    private final PractitionerProfileRepository profileRepository;
    private final PostLikeRepository likeRepository;
    private final PostCommentRepository commentRepository;

    public SocialController(PractitionerPostRepository postRepository,
                            PractitionerFollowRepository followRepository,
                            PractitionerProfileRepository profileRepository,
                            PostLikeRepository likeRepository,
                            PostCommentRepository commentRepository) {
        this.postRepository = postRepository;
        this.followRepository = followRepository;
        this.profileRepository = profileRepository;
        this.likeRepository = likeRepository;
        this.commentRepository = commentRepository;
    }

    @GetMapping("/feed")
    public ResponseEntity<List<PostResponse>> feed(@AuthenticationPrincipal User currentUser) {
        List<PractitionerPost> posts = postRepository.findAllByOrderByCreatedAtDesc();
        return ResponseEntity.ok(posts.stream().map(post -> toResponse(post, currentUser)).toList());
    }

    @PostMapping("/posts")
    @PreAuthorize("hasRole('PRACTITIONER')")
    public ResponseEntity<PostResponse> createPost(@AuthenticationPrincipal User currentUser,
                                                    @Valid @RequestBody CreatePostRequest request) {
        PractitionerProfile profile = profileRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("Create your practitioner profile before posting"));
        PractitionerPost post = new PractitionerPost();
        post.setPractitionerProfile(profile);
        post.setTitle(request.getTitle().trim());
        post.setContent(request.getContent().trim());
        post.setTopic(request.getTopic().trim());
        post.setMediaUrl(normalizeMediaUrl(request.getMediaUrl()));
        post.setMediaType(normalizeMediaType(request.getMediaType(), post.getMediaUrl()));
        return ResponseEntity.ok(toResponse(postRepository.save(post), currentUser));
    }

    @PostMapping("/posts/{postId}/like")
    @PreAuthorize("hasAnyRole('PATIENT', 'PRACTITIONER')")
    public ResponseEntity<LikeResponse> like(@AuthenticationPrincipal User currentUser,
                                             @PathVariable Long postId) {
        PractitionerPost post = findPost(postId);
        if (!likeRepository.existsByPostIdAndUserId(postId, currentUser.getId())) {
            com.ayurvedic.backend.domain.PostLike like = new com.ayurvedic.backend.domain.PostLike();
            like.setPost(post);
            like.setUser(currentUser);
            likeRepository.save(like);
        }
        return ResponseEntity.ok(new LikeResponse(postId, true, likeRepository.countByPostId(postId)));
    }

    @DeleteMapping("/posts/{postId}/like")
    @PreAuthorize("hasAnyRole('PATIENT', 'PRACTITIONER')")
    public ResponseEntity<LikeResponse> unlike(@AuthenticationPrincipal User currentUser,
                                               @PathVariable Long postId) {
        findPost(postId);
        likeRepository.deleteByPostIdAndUserId(postId, currentUser.getId());
        return ResponseEntity.ok(new LikeResponse(postId, false, likeRepository.countByPostId(postId)));
    }

    @GetMapping("/posts/{postId}/comments")
    public ResponseEntity<List<CommentResponse>> comments(@PathVariable Long postId) {
        findPost(postId);
        return ResponseEntity.ok(commentRepository.findByPostIdOrderByCreatedAtAsc(postId).stream()
                .map(comment -> new CommentResponse(comment.getId(), comment.getUser().getFullName(),
                        comment.getContent(), comment.getCreatedAt()))
                .toList());
    }

    @PostMapping("/posts/{postId}/comments")
    @PreAuthorize("hasAnyRole('PATIENT', 'PRACTITIONER')")
    public ResponseEntity<CommentResponse> addComment(@AuthenticationPrincipal User currentUser,
                                                       @PathVariable Long postId,
                                                       @Valid @RequestBody CreateCommentRequest request) {
        PractitionerPost post = findPost(postId);
        com.ayurvedic.backend.domain.PostComment comment = new com.ayurvedic.backend.domain.PostComment();
        comment.setPost(post);
        comment.setUser(currentUser);
        comment.setContent(request.getContent().trim());
        comment = commentRepository.save(comment);
        return ResponseEntity.ok(new CommentResponse(comment.getId(), currentUser.getFullName(),
                comment.getContent(), comment.getCreatedAt()));
    }

    @PostMapping("/practitioners/{practitionerUserId}/follow")
    @PreAuthorize("hasAnyRole('PATIENT', 'PRACTITIONER')")
    public ResponseEntity<FollowResponse> follow(@AuthenticationPrincipal User currentUser,
                                                 @PathVariable Long practitionerUserId) {
        PractitionerProfile profile = findProfile(practitionerUserId);
        if (currentUser.getId().equals(practitionerUserId)) {
            throw new IllegalArgumentException("You cannot follow yourself");
        }
        if (!followRepository.existsByFollowerIdAndPractitionerProfileId(currentUser.getId(), profile.getId())) {
            PractitionerFollow follow = new PractitionerFollow();
            follow.setFollower(currentUser);
            follow.setPractitionerProfile(profile);
            followRepository.save(follow);
        }
        return ResponseEntity.ok(followResponse(currentUser, profile));
    }

    @DeleteMapping("/practitioners/{practitionerUserId}/follow")
    @PreAuthorize("hasAnyRole('PATIENT', 'PRACTITIONER')")
    public ResponseEntity<FollowResponse> unfollow(@AuthenticationPrincipal User currentUser,
                                                   @PathVariable Long practitionerUserId) {
        PractitionerProfile profile = findProfile(practitionerUserId);
        followRepository.deleteByFollowerIdAndPractitionerProfileId(currentUser.getId(), profile.getId());
        return ResponseEntity.ok(followResponse(currentUser, profile));
    }

    @GetMapping("/following")
    public ResponseEntity<List<Long>> following(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(followRepository.findByFollowerId(currentUser.getId()).stream()
                .map(follow -> follow.getPractitionerProfile().getUser().getId())
                .toList());
    }

    private PractitionerProfile findProfile(Long practitionerUserId) {
        return profileRepository.findByUserId(practitionerUserId)
                .orElseThrow(() -> new IllegalArgumentException("Practitioner profile not found"));
    }

    private FollowResponse followResponse(User currentUser, PractitionerProfile profile) {
        return new FollowResponse(profile.getUser().getId(),
                followRepository.existsByFollowerIdAndPractitionerProfileId(currentUser.getId(), profile.getId()),
                followRepository.countByPractitionerProfileId(profile.getId()));
    }

    private PractitionerPost findPost(Long postId) {
        return postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));
    }

    private PostResponse toResponse(PractitionerPost post, User currentUser) {
        PractitionerProfile profile = post.getPractitionerProfile();
        return new PostResponse(post.getId(), profile.getUser().getId(), profile.getUser().getFullName(),
                profile.getSpecialization(), post.getTitle(), post.getContent(), post.getTopic(), post.getCreatedAt(),
                post.getMediaUrl(), post.getMediaType(), likeRepository.countByPostId(post.getId()),
                likeRepository.existsByPostIdAndUserId(post.getId(), currentUser.getId()),
                commentRepository.countByPostId(post.getId()));
    }

    private String normalizeMediaUrl(String mediaUrl) {
        if (mediaUrl == null || mediaUrl.isBlank()) return null;
        String trimmed = mediaUrl.trim();
        if (!trimmed.startsWith("https://") && !trimmed.startsWith("http://")) {
            throw new IllegalArgumentException("Media URL must start with http:// or https://");
        }
        return trimmed;
    }

    private String normalizeMediaType(String mediaType, String mediaUrl) {
        if (mediaUrl == null) return null;
        String normalized = mediaType == null ? "IMAGE" : mediaType.trim().toUpperCase();
        if (!List.of("IMAGE", "VIDEO", "GIF").contains(normalized)) {
            throw new IllegalArgumentException("Media type must be IMAGE, VIDEO, or GIF");
        }
        return normalized;
    }
}