package com.ayurvedic.backend.repository;

import com.ayurvedic.backend.domain.PractitionerProfile;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PractitionerProfileRepository extends JpaRepository<PractitionerProfile, Long> {
    Optional<PractitionerProfile> findByUserId(Long userId);
    List<PractitionerProfile> findByVerificationStatus(PractitionerProfile.VerificationStatus status);
}
