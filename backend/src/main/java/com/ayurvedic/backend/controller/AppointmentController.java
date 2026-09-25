package com.ayurvedic.backend.controller;

import com.ayurvedic.backend.domain.Appointment;
import com.ayurvedic.backend.domain.User;
import com.ayurvedic.backend.service.AppointmentService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.time.LocalTime;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class AppointmentController {

    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @PostMapping("/appointments")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<Appointment> bookAppointment(@AuthenticationPrincipal User currentUser,
                                                     @RequestParam Long practitionerUserId,
                                                     @RequestParam String date,
                                                     @RequestParam String startTime,
                                                     @RequestParam String endTime,
                                                     @RequestParam(required = false) String notes) {
        Appointment appointment = appointmentService.bookAppointment(
                currentUser.getId(), practitionerUserId, LocalDate.parse(date), LocalTime.parse(startTime), LocalTime.parse(endTime), notes);
        return ResponseEntity.ok(appointment);
    }

    @GetMapping("/patients/appointments")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<List<Appointment>> getMyAppointments(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(appointmentService.getAppointmentsForPatient(currentUser.getId()));
    }

    @GetMapping("/practitioners/appointments")
    @PreAuthorize("hasRole('PRACTITIONER')")
    public ResponseEntity<List<Appointment>> getPractitionerAppointments(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(appointmentService.getAppointmentsForPractitioner(currentUser.getId()));
    }

    @PutMapping("/appointments/{id}/confirm")
    @PreAuthorize("hasRole('PRACTITIONER')")
    public ResponseEntity<Appointment> confirmAppointment(@AuthenticationPrincipal User currentUser,
                                                        @PathVariable Long id) {
        return ResponseEntity.ok(appointmentService.confirmAppointment(id, currentUser.getId()));
    }

    @PutMapping("/appointments/{id}/cancel")
    @PreAuthorize("hasAnyRole('PATIENT', 'PRACTITIONER')")
    public ResponseEntity<Appointment> cancelAppointment(@AuthenticationPrincipal User currentUser,
                                                       @PathVariable Long id) {
        return ResponseEntity.ok(appointmentService.cancelAppointment(id, currentUser.getId()));
    }
}
