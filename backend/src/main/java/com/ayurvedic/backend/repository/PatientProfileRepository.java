package com.ayurvedic.backend.repository;

import com.ayurvedic.backend.domain.PatientProfile;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PatientProfileRepository extends JpaRepository<PatientProfile, Long> {
    Optional<PatientProfile> findByUserId(Long userId);
}
