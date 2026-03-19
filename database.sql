-- DentaCloud Database Schema
-- Stage 1: Login + Patient Management

-- Create enum for staff roles
CREATE TYPE staff_role AS ENUM ('admin', 'doctor', 'receptionist', 'assistant');

-- Staff Users Table
CREATE TABLE IF NOT EXISTS staff (
  id SERIAL PRIMARY KEY,
  staff_id VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role staff_role NOT NULL DEFAULT 'receptionist',
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Patients Table
CREATE TABLE IF NOT EXISTS patients (
  id SERIAL PRIMARY KEY,
  patient_id VARCHAR(20) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100),
  email VARCHAR(100),
  phone VARCHAR(20) NOT NULL,
  date_of_birth DATE,
  age INT,
  gender VARCHAR(20),
  blood_group VARCHAR(5),
  address TEXT,
  city VARCHAR(50),
  state VARCHAR(50),
  postal_code VARCHAR(10),
  country VARCHAR(50) DEFAULT 'India',
  emergency_contact_name VARCHAR(100),
  emergency_contact_phone VARCHAR(20),
  medical_history TEXT,
  allergies TEXT,
  referred_by VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INT REFERENCES staff(id)
);

-- Create indexes for faster searches
CREATE INDEX idx_patient_phone ON patients(phone);
CREATE INDEX idx_patient_id ON patients(patient_id);
CREATE INDEX idx_patient_name ON patients(first_name, last_name);
CREATE INDEX idx_staff_email ON staff(email);
CREATE INDEX idx_staff_id ON staff(staff_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER staff_update_timestamp
  BEFORE UPDATE ON staff
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER patients_update_timestamp
  BEFORE UPDATE ON patients
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();
