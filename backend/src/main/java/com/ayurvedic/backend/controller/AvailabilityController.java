package com.ayurvedic.backend.controller;

import com.ayurvedic.backend.domain.AvailabilitySlot;
import com.ayurvedic.backend.domain.PractitionerProfile;
import com.ayurvedic.backend.domain.User;
import com.ayurvedic.backend.repository.AvailabilitySlotRepository;
import com.ayurvedic.backend.repository.PractitionerProfileRepository;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class AvailabilityController {

    private final AvailabilitySlotRepository availabilitySlotRepository;
    private final PractitionerProfileRepository practitionerProfileRepository;

    public AvailabilityController(AvailabilitySlotRepository availabilitySlotRepository,
                                 PractitionerProfileRepository practitionerProfileRepository) {
        this.availabilitySlotRepository = availabilitySlotRepository;
        this.practitionerProfileRepository = practitionerProfileRepository;
    }

    @PostMapping("/practitioners/availability")
    @PreAuthorize("hasRole('PRACTITIONER')")
    public ResponseEntity<List<AvailabilitySlot>> saveAvailability(@AuthenticationPrincipal User currentUser,
                                                                  @RequestBody List<AvailabilitySlot> slots) {
        PractitionerProfile profile = practitionerProfileRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("Practitioner profile not found"));

        for (AvailabilitySlot slot : slots) {
            slot.setPractitionerProfile(profile);
        }

        return ResponseEntity.ok(availabilitySlotRepository.saveAll(slots));
    }

    @GetMapping("/practitioners/availability")
    public ResponseEntity<List<AvailabilitySlot>> getAvailability(@RequestParam Long practitionerUserId,
                                                                @RequestParam String date) {
        PractitionerProfile profile = practitionerProfileRepository.findByUserId(practitionerUserId)
                .orElseThrow(() -> new IllegalArgumentException("Practitioner profile not found"));
        return ResponseEntity.ok(availabilitySlotRepository.findByPractitionerProfileIdAndDate(profile.getId(), LocalDate.parse(date)));
    }
}
