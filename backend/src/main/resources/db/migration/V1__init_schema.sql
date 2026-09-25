CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE patient_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    phone VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(50) NOT NULL,
    address TEXT,
    emergency_contact VARCHAR(255),
    medical_history TEXT,
    CONSTRAINT fk_patient_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE practitioner_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    specialization VARCHAR(255) NOT NULL,
    qualifications VARCHAR(255) NOT NULL,
    experience_years INT NOT NULL,
    license_number VARCHAR(255) NOT NULL,
    bio TEXT,
    clinic_address TEXT,
    consultation_fee DOUBLE PRECISION NOT NULL DEFAULT 0,
    verification_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    CONSTRAINT fk_practitioner_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE availability_slots (
    id BIGSERIAL PRIMARY KEY,
    practitioner_profile_id BIGINT NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    available BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_slot_practitioner FOREIGN KEY (practitioner_profile_id) REFERENCES practitioner_profiles(id)
);

CREATE TABLE appointments (
    id BIGSERIAL PRIMARY KEY,
    patient_profile_id BIGINT NOT NULL,
    practitioner_profile_id BIGINT NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_appointment_patient FOREIGN KEY (patient_profile_id) REFERENCES patient_profiles(id),
    CONSTRAINT fk_appointment_practitioner FOREIGN KEY (practitioner_profile_id) REFERENCES practitioner_profiles(id)
);

CREATE TABLE consultation_records (
    id BIGSERIAL PRIMARY KEY,
    appointment_id BIGINT NOT NULL,
    practitioner_profile_id BIGINT NOT NULL,
    patient_profile_id BIGINT NOT NULL,
    diagnosis TEXT NOT NULL,
    symptoms TEXT,
    treatment_plan TEXT,
    recommendations TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_record_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(id),
    CONSTRAINT fk_record_practitioner FOREIGN KEY (practitioner_profile_id) REFERENCES practitioner_profiles(id),
    CONSTRAINT fk_record_patient FOREIGN KEY (patient_profile_id) REFERENCES patient_profiles(id)
);
