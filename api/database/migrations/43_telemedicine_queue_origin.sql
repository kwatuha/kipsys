-- Link telemedicine sessions to queue_entries when the visit starts from the telemedicine queue.
-- Run after 40_telemedicine_sessions_schema.sql

ALTER TABLE telemedicine_sessions
  MODIFY COLUMN originType ENUM('appointment','inpatient','standalone','queue') NOT NULL,
  ADD COLUMN queueEntryId INT NULL AFTER admissionId;

ALTER TABLE telemedicine_sessions
  ADD INDEX idx_tm_queue_entry (queueEntryId);
