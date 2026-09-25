package com.ayurvedic.backend.controller;

import com.ayurvedic.backend.domain.PractitionerProfile;
import com.ayurvedic.backend.domain.User;
import com.ayurvedic.backend.repository.PractitionerProfileRepository;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/practitioners")
public class PractitionerController {

    private final PractitionerProfileRepository practitionerProfileRepository;

    public PractitionerController(PractitionerProfileRepository practitionerProfileRepository) {
        this.practitionerProfileRepository = practitionerProfileRepository;
    }

    @PostMapping("/profile")
    @PreAuthorize("hasRole('PRACTITIONER')")
    public ResponseEntity<PractitionerProfile> createProfile(@AuthenticationPrincipal User currentUser,
                                                            @Valid @RequestBody PractitionerProfile profile) {
        if (practitionerProfileRepository.findByUserId(currentUser.getId()).isPresent()) {
            throw new IllegalArgumentException("Profile already exists");
        }
        profile.setUser(currentUser);
        return ResponseEntity.ok(practitionerProfileRepository.save(profile));
    }

    @PutMapping("/profile")
    @PreAuthorize("hasRole('PRACTITIONER')")
    public ResponseEntity<PractitionerProfile> updateProfile(@AuthenticationPrincipal User currentUser,
                                                           @Valid @RequestBody PractitionerProfile profile) {
        PractitionerProfile existing = practitionerProfileRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("Profile not found"));
        existing.setTitle(profile.getTitle());
        existing.setSpecialization(profile.getSpecialization());
        existing.setQualifications(profile.getQualifications());
        existing.setExperienceYears(profile.getExperienceYears());
        existing.setLicenseNumber(profile.getLicenseNumber());
        existing.setBio(profile.getBio());
        existing.setClinicAddress(profile.getClinicAddress());
        existing.setConsultationFee(profile.getConsultationFee());
        return ResponseEntity.ok(practitionerProfileRepository.save(existing));
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('PRACTITIONER')")
    public ResponseEntity<PractitionerProfile> getMyProfile(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(practitionerProfileRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("Profile not found")));
    }

    @GetMapping("/public")
    public ResponseEntity<List<PractitionerProfile>> listVerifiedPractitioners() {
        return ResponseEntity.ok(practitionerProfileRepository.findByVerificationStatus(
                PractitionerProfile.VerificationStatus.VERIFIED));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PractitionerProfile> getPractitioner(@PathVariable Long id) {
        return ResponseEntity.ok(practitionerProfileRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Practitioner not found")));
    }
}
