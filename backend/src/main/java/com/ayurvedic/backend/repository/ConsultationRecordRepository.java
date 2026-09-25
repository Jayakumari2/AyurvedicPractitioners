package com.ayurvedic.backend.repository;

import com.ayurvedic.backend.domain.ConsultationRecord;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConsultationRecordRepository extends JpaRepository<ConsultationRecord, Long> {
    List<ConsultationRecord> findByPatientProfileId(Long patientProfileId);
    List<ConsultationRecord> findByPractitionerProfileId(Long practitionerProfileId);
}
