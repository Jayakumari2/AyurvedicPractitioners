package com.ayurvedic.backend.repository;

import com.ayurvedic.backend.domain.AvailabilitySlot;
import com.ayurvedic.backend.domain.PractitionerProfile;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AvailabilitySlotRepository extends JpaRepository<AvailabilitySlot, Long> {
    List<AvailabilitySlot> findByPractitionerProfileAndDate(PractitionerProfile practitionerProfile, LocalDate date);
    List<AvailabilitySlot> findByPractitionerProfileIdAndDate(Long practitionerProfileId, LocalDate date);
}
