package com.ayurvedic.backend.controller;

import com.ayurvedic.backend.domain.ConsultationRecord;
import com.ayurvedic.backend.domain.PatientProfile;
import com.ayurvedic.backend.domain.PractitionerProfile;
import com.ayurvedic.backend.domain.User;
import com.ayurvedic.backend.repository.ConsultationRecordRepository;
import com.ayurvedic.backend.repository.PatientProfileRepository;
import com.ayurvedic.backend.repository.PractitionerProfileRepository;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class ConsultationController {

    private final ConsultationRecordRepository consultationRecordRepository;
    private final PractitionerProfileRepository practitionerProfileRepository;
    private final PatientProfileRepository patientProfileRepository;

    public ConsultationController(ConsultationRecordRepository consultationRecordRepository,
                                 PractitionerProfileRepository practitionerProfileRepository,
                                 PatientProfileRepository patientProfileRepository) {
        this.consultationRecordRepository = consultationRecordRepository;
        this.practitionerProfileRepository = practitionerProfileRepository;
        this.patientProfileRepository = patientProfileRepository;
    }

    @PostMapping("/consultations")
    @PreAuthorize("hasRole('PRACTITIONER')")
    public ResponseEntity<ConsultationRecord> createConsultationRecord(@AuthenticationPrincipal User currentUser,
                                                                      @Valid @RequestBody ConsultationRecord record) {
        PractitionerProfile practitioner = practitionerProfileRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("Practitioner profile not found"));
        record.setPractitionerProfile(practitioner);

        if (record.getPatientProfile() == null || record.getAppointment() == null) {
            throw new IllegalArgumentException("Patient and appointment are required");
        }

        return ResponseEntity.ok(consultationRecordRepository.save(record));
    }

    @GetMapping("/patients/{patientUserId}/consultations")
    @PreAuthorize("hasAnyRole('PATIENT', 'PRACTITIONER')")
    public ResponseEntity<List<ConsultationRecord>> getPatientConsultationRecords(@PathVariable Long patientUserId,
                                                                                @AuthenticationPrincipal User currentUser) {
        PatientProfile patientProfile = patientProfileRepository.findByUserId(patientUserId)
                .orElseThrow(() -> new IllegalArgumentException("Patient profile not found"));
        if (!currentUser.getId().equals(patientUserId) && !currentUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_PRACTITIONER"))) {
            throw new IllegalArgumentException("You are not authorized to access this patient's records");
        }
        return ResponseEntity.ok(consultationRecordRepository.findByPatientProfileId(patientProfile.getId()));
    }
}
