-- Remote consultation without ward admission or linked appointment (walk-in telehealth, phone triage, etc.)

ALTER TABLE telemedicine_sessions
  MODIFY COLUMN originType ENUM('appointment', 'inpatient', 'standalone') NOT NULL;
