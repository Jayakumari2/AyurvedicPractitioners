package com.ayurvedic.backend.controller;

import com.ayurvedic.backend.domain.PatientProfile;
import com.ayurvedic.backend.domain.User;
import com.ayurvedic.backend.repository.PatientProfileRepository;
import com.ayurvedic.backend.repository.UserRepository;
import jakarta.validation.Valid;
import java.util.Map;
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
@RequestMapping("/api/patients")
@PreAuthorize("hasRole('PATIENT')")
public class PatientController {

    private final PatientProfileRepository patientProfileRepository;
    private final UserRepository userRepository;

    public PatientController(PatientProfileRepository patientProfileRepository, UserRepository userRepository) {
        this.patientProfileRepository = patientProfileRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMyProfile(@AuthenticationPrincipal User currentUser) {
        PatientProfile profile = patientProfileRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("Patient profile not found"));
        return ResponseEntity.ok(profile);
    }

    @PostMapping("/profile")
    public ResponseEntity<PatientProfile> createProfile(@AuthenticationPrincipal User currentUser,
                                                        @Valid @RequestBody PatientProfile profile) {
        if (patientProfileRepository.findByUserId(currentUser.getId()).isPresent()) {
            throw new IllegalArgumentException("Profile already exists");
        }
        profile.setUser(currentUser);
        return ResponseEntity.ok(patientProfileRepository.save(profile));
    }

    @PutMapping("/profile")
    public ResponseEntity<PatientProfile> updateProfile(@AuthenticationPrincipal User currentUser,
                                                       @Valid @RequestBody PatientProfile profile) {
        PatientProfile existing = patientProfileRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("Profile not found"));
        existing.setPhone(profile.getPhone());
        existing.setDateOfBirth(profile.getDateOfBirth());
        existing.setGender(profile.getGender());
        existing.setAddress(profile.getAddress());
        existing.setEmergencyContact(profile.getEmergencyContact());
        existing.setMedicalHistory(profile.getMedicalHistory());
        return ResponseEntity.ok(patientProfileRepository.save(existing));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PatientProfile> getPatientProfile(@AuthenticationPrincipal User currentUser,
                                                          @PathVariable Long id) {
        if (!currentUser.getId().equals(id)) {
            throw new IllegalArgumentException("You can only access your own profile");
        }
        PatientProfile profile = patientProfileRepository.findByUserId(id)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found"));
        return ResponseEntity.ok(profile);
    }
}
