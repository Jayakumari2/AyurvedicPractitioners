package com.ayurvedic.backend.repository;

import com.ayurvedic.backend.domain.PractitionerFollow;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PractitionerFollowRepository extends JpaRepository<PractitionerFollow, Long> {
    boolean existsByFollowerIdAndPractitionerProfileId(Long followerId, Long practitionerProfileId);
    void deleteByFollowerIdAndPractitionerProfileId(Long followerId, Long practitionerProfileId);
    List<PractitionerFollow> findByFollowerId(Long followerId);
    long countByPractitionerProfileId(Long practitionerProfileId);
}