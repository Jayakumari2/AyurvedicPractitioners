package com.ayurvedic.backend.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.ayurvedic.backend.domain.PatientProfile;
import com.ayurvedic.backend.domain.AppointmentStatus;
import com.ayurvedic.backend.domain.PractitionerProfile;
import com.ayurvedic.backend.domain.User;
import com.ayurvedic.backend.domain.UserRole;
import com.ayurvedic.backend.repository.AppointmentRepository;
import com.ayurvedic.backend.repository.AvailabilitySlotRepository;
import com.ayurvedic.backend.repository.PatientProfileRepository;
import com.ayurvedic.backend.repository.PractitionerProfileRepository;
import com.ayurvedic.backend.repository.UserRepository;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AppointmentServiceTest {

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private AvailabilitySlotRepository availabilitySlotRepository;

    @Mock
    private PatientProfileRepository patientProfileRepository;

    @Mock
    private PractitionerProfileRepository practitionerProfileRepository;

    @Mock
    private UserRepository userRepository;

    @Test
    void shouldRejectDoubleBookedAppointment() {
        User patientUser = new User();
        patientUser.setId(1L);
        patientUser.setRole(UserRole.PATIENT);

        User practitionerUser = new User();
        practitionerUser.setId(2L);
        practitionerUser.setRole(UserRole.PRACTITIONER);

        PatientProfile patientProfile = new PatientProfile();
        patientProfile.setId(10L);
        patientProfile.setUser(patientUser);

        PractitionerProfile practitionerProfile = new PractitionerProfile();
        practitionerProfile.setId(20L);
        practitionerProfile.setUser(practitionerUser);

        when(patientProfileRepository.findByUserId(1L)).thenReturn(Optional.of(patientProfile));
        when(practitionerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(practitionerProfile));
        when(appointmentRepository.existsByPractitionerProfileIdAndDateAndStartTimeAndStatusNot(20L,
                LocalDate.of(2026, 9, 30),
                LocalTime.of(10, 0),
                AppointmentStatus.CANCELLED)).thenReturn(true);

        AppointmentService appointmentService = new AppointmentService(
                appointmentRepository,
                availabilitySlotRepository,
                patientProfileRepository,
                practitionerProfileRepository,
                userRepository);

        assertThatThrownBy(() -> appointmentService.bookAppointment(
                1L,
                2L,
                LocalDate.of(2026, 9, 30),
                LocalTime.of(10, 0),
                LocalTime.of(11, 0),
                "Initial consultation"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("already booked");
    }
}
