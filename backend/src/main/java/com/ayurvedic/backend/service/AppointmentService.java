package com.ayurvedic.backend.service;

import com.ayurvedic.backend.domain.Appointment;
import com.ayurvedic.backend.domain.AppointmentStatus;
import com.ayurvedic.backend.domain.AvailabilitySlot;
import com.ayurvedic.backend.domain.PatientProfile;
import com.ayurvedic.backend.domain.PractitionerProfile;
import com.ayurvedic.backend.domain.User;
import com.ayurvedic.backend.repository.AppointmentRepository;
import com.ayurvedic.backend.repository.AvailabilitySlotRepository;
import com.ayurvedic.backend.repository.PatientProfileRepository;
import com.ayurvedic.backend.repository.PractitionerProfileRepository;
import com.ayurvedic.backend.repository.UserRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final AvailabilitySlotRepository availabilitySlotRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final PractitionerProfileRepository practitionerProfileRepository;
    private final UserRepository userRepository;

    public AppointmentService(AppointmentRepository appointmentRepository,
                              AvailabilitySlotRepository availabilitySlotRepository,
                              PatientProfileRepository patientProfileRepository,
                              PractitionerProfileRepository practitionerProfileRepository,
                              UserRepository userRepository) {
        this.appointmentRepository = appointmentRepository;
        this.availabilitySlotRepository = availabilitySlotRepository;
        this.patientProfileRepository = patientProfileRepository;
        this.practitionerProfileRepository = practitionerProfileRepository;
        this.userRepository = userRepository;
    }

    public Appointment bookAppointment(Long patientUserId, Long practitionerUserId, LocalDate date,
                                       LocalTime startTime, LocalTime endTime, String notes) {
        PatientProfile patient = patientProfileRepository.findByUserId(patientUserId)
                .orElseThrow(() -> new IllegalArgumentException("Patient profile not found"));

        PractitionerProfile practitioner = practitionerProfileRepository.findByUserId(practitionerUserId)
                .orElseThrow(() -> new IllegalArgumentException("Practitioner profile not found"));

        boolean exists = appointmentRepository.existsByPractitionerProfileIdAndDateAndStartTimeAndStatusNot(
            practitioner.getId(), date, startTime, AppointmentStatus.CANCELLED);
        if (exists) {
            throw new IllegalStateException("This slot is already booked for the practitioner");
        }

        List<AvailabilitySlot> slots = availabilitySlotRepository.findByPractitionerProfileIdAndDate(practitioner.getId(), date);
        boolean availableSlot = slots.stream().anyMatch(slot ->
                !slot.getStartTime().isAfter(startTime) && !slot.getEndTime().isBefore(endTime) && slot.isAvailable());

        if (!availableSlot) {
            throw new IllegalStateException("Practitioner is not available for this time slot");
        }

        Appointment appointment = new Appointment();
        appointment.setPatientProfile(patient);
        appointment.setPractitionerProfile(practitioner);
        appointment.setDate(date);
        appointment.setStartTime(startTime);
        appointment.setEndTime(endTime);
        appointment.setNotes(notes);
        appointment.setStatus(AppointmentStatus.PENDING);
        appointment.setCreatedAt(LocalDateTime.now());
        return appointmentRepository.save(appointment);
    }

    public Appointment confirmAppointment(Long appointmentId, Long practitionerUserId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found"));
        if (!appointment.getPractitionerProfile().getUser().getId().equals(practitionerUserId)) {
            throw new IllegalArgumentException("You are not authorized to manage this appointment");
        }
        appointment.setStatus(AppointmentStatus.CONFIRMED);
        return appointmentRepository.save(appointment);
    }

    public Appointment cancelAppointment(Long appointmentId, Long userId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found"));
        boolean patientMatch = appointment.getPatientProfile().getUser().getId().equals(userId);
        boolean practitionerMatch = appointment.getPractitionerProfile().getUser().getId().equals(userId);
        if (!patientMatch && !practitionerMatch) {
            throw new IllegalArgumentException("You are not authorized to cancel this appointment");
        }
        appointment.setStatus(AppointmentStatus.CANCELLED);
        return appointmentRepository.save(appointment);
    }

    public List<Appointment> getAppointmentsForPatient(Long patientUserId) {
        PatientProfile profile = patientProfileRepository.findByUserId(patientUserId)
                .orElseThrow(() -> new IllegalArgumentException("Patient profile not found"));
        return appointmentRepository.findByPatientProfile(profile);
    }

    public List<Appointment> getAppointmentsForPractitioner(Long practitionerUserId) {
        PractitionerProfile profile = practitionerProfileRepository.findByUserId(practitionerUserId)
                .orElseThrow(() -> new IllegalArgumentException("Practitioner profile not found"));
        return appointmentRepository.findByPractitionerProfile(profile);
    }
}
