package com.ayurvedic.backend.repository;

import com.ayurvedic.backend.domain.PractitionerPost;
import com.ayurvedic.backend.domain.PractitionerProfile;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PractitionerPostRepository extends JpaRepository<PractitionerPost, Long> {
    List<PractitionerPost> findAllByOrderByCreatedAtDesc();
    List<PractitionerPost> findByPractitionerProfileVerificationStatusOrderByCreatedAtDesc(PractitionerProfile.VerificationStatus status);
}