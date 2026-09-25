package com.ayurvedic.backend.controller;

import com.ayurvedic.backend.domain.PractitionerProfile;
import com.ayurvedic.backend.domain.User;
import com.ayurvedic.backend.repository.PractitionerProfileRepository;
import com.ayurvedic.backend.repository.UserRepository;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository userRepository;
    private final PractitionerProfileRepository practitionerProfileRepository;

    public AdminController(UserRepository userRepository, PractitionerProfileRepository practitionerProfileRepository) {
        this.userRepository = userRepository;
        this.practitionerProfileRepository = practitionerProfileRepository;
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @GetMapping("/practitioners")
    public ResponseEntity<List<PractitionerProfile>> getPractitioners() {
        return ResponseEntity.ok(practitionerProfileRepository.findAll());
    }

    @PutMapping("/practitioners/{id}/verify")
    public ResponseEntity<PractitionerProfile> verifyPractitioner(@PathVariable Long id,
                                                                @RequestParam String status) {
        PractitionerProfile profile = practitionerProfileRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Practitioner not found"));
        profile.setVerificationStatus(PractitionerProfile.VerificationStatus.valueOf(status.toUpperCase()));
        return ResponseEntity.ok(practitionerProfileRepository.save(profile));
    }
}
