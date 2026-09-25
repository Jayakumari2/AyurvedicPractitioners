package com.ayurvedic.backend.repository;

import com.ayurvedic.backend.domain.Appointment;
import com.ayurvedic.backend.domain.PatientProfile;
import com.ayurvedic.backend.domain.PractitionerProfile;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByPatientProfile(PatientProfile patientProfile);
    List<Appointment> findByPractitionerProfile(PractitionerProfile practitionerProfile);
    boolean existsByPractitionerProfileIdAndDateAndStartTimeAndStatusNot(Long practitionerProfileId, LocalDate date, LocalTime startTime, String status);
    List<Appointment> findByPractitionerProfileId(Long practitionerProfileId);
}
