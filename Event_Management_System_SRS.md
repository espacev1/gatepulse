# Software Requirements Specification (SRS)

## Event Management System with Digital Ticket Validation

------------------------------------------------------------------------

## 1. Introduction

### 1.1 Purpose

This document specifies the functional and non-functional requirements
for the Event Management System with Digital Ticket Validation Support.

The system enables: - Participant registration - Unique digital ticket
generation - Real-time attendance verification - Post-event analytics
reporting

### 1.2 Scope

The system is a web-based centralized application built using:

-   Frontend: Vite + React\
-   Backend: Node.js (Express)\
-   Database & Authentication: Supabase (PostgreSQL + Supabase Auth)

The system: - Is NOT cloud-native architecture\
- Is NOT IoT-based\
- Operates as a centralized web solution\
- Supports role-based access (Admin, Staff, Participant)

### 1.3 Definitions

  -----------------------------------------------------------------------
  Term                    Definition
  ----------------------- -----------------------------------------------
  QR Ticket               Digitally generated ticket containing unique
                          access token

  Validation              Process of verifying ticket authenticity and
                          attendance

  Attendance Log          Record of ticket scan attempts

  No-show                 Registered participant who did not attend
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 2. Overall Description

### 2.1 Product Perspective

The system consists of:

1.  Web frontend (React)
2.  REST API backend (Node.js)
3.  Supabase database & authentication
4.  QR-based validation mechanism

System Architecture:

User Browser → React Frontend → Node Backend → Supabase DB

### 2.2 User Classes

  User Type     Description
  ------------- ------------------------------------------------------
  Admin         Creates events, monitors attendance, views analytics
  Staff         Validates tickets during event
  Participant   Registers and receives digital ticket

### 2.3 Operating Environment

-   Web browsers (Chrome, Firefox, Edge)
-   Linux/Windows server for backend
-   Supabase PostgreSQL database
-   Node.js runtime

### 2.4 Constraints

-   Must use Supabase for authentication and storage
-   Must use Vite + React frontend
-   Must use JavaScript backend (Node.js)
-   Must not depend on IoT hardware
-   Must not use microservices/cloud-native architecture

------------------------------------------------------------------------

## 3. System Features & Functional Requirements

### 3.1 User Authentication

-   FR-1: The system shall allow users to register using email and
    password.
-   FR-2: The system shall authenticate users via Supabase Auth.
-   FR-3: The system shall assign roles (Admin, Staff, Participant).
-   FR-4: The system shall restrict access based on roles.

### 3.2 Event Management (Admin)

-   FR-5: Admin shall create events.
-   FR-6: Admin shall edit event details.
-   FR-7: Admin shall delete events.
-   FR-8: Admin shall view list of participants per event.

### 3.3 Participant Registration

-   FR-9: Participant shall view available events.
-   FR-10: Participant shall register for an event.
-   FR-11: System shall generate a unique ticket upon registration.
-   FR-12: System shall store registration details in database.

### 3.4 Digital Ticket Generation

-   FR-13: System shall generate a unique UUID ticket ID.
-   FR-14: System shall generate a secure QR code.
-   FR-15: System shall prevent duplicate ticket generation.
-   FR-16: System shall allow participant to view/download ticket.

### 3.5 Real-Time Ticket Validation

-   FR-17: Staff shall access ticket scanning interface.
-   FR-18: System shall scan QR code via device camera.
-   FR-19: System shall validate ticket authenticity.
-   FR-20: System shall prevent duplicate check-ins.
-   FR-21: System shall mark ticket as validated.
-   FR-22: System shall record attendance log.
-   FR-23: System shall update attendance count in real-time.

### 3.6 Attendance Monitoring

-   FR-24: System shall display total registrations.
-   FR-25: System shall display total checked-in participants.
-   FR-26: System shall calculate attendance percentage.
-   FR-27: System shall display real-time updates.

### 3.7 Post-Event Analytics

-   FR-28: System shall generate attendance report.
-   FR-29: System shall calculate attendance rate.
-   FR-30: System shall identify no-show participants.
-   FR-31: System shall determine peak check-in time.
-   FR-32: System shall allow export of report (CSV/PDF).

------------------------------------------------------------------------

## 4. External Interface Requirements

### 4.1 User Interface Requirements

-   Responsive web interface
-   Dashboard for Admin
-   Scan interface for Staff
-   Ticket view for Participant
-   Graphs for analytics

### 4.2 Hardware Interface

-   Device camera for QR scanning
-   No IoT devices required

### 4.3 Software Interface

-   Supabase Authentication
-   Supabase PostgreSQL
-   Node.js API
-   Browser camera API for QR scanning

------------------------------------------------------------------------

## 5. Non-Functional Requirements

### 5.1 Performance Requirements

-   NFR-1: System shall validate tickets within 2 seconds.
-   NFR-2: System shall support at least 500 concurrent users.
-   NFR-3: Real-time updates shall occur within 1 second.

### 5.2 Security Requirements

-   NFR-4: All communication shall use HTTPS.
-   NFR-5: QR tokens shall be securely signed.
-   NFR-6: Role-based access control must be enforced.
-   NFR-7: Database shall use Row-Level Security.

### 5.3 Reliability

-   NFR-8: System uptime shall be 99%.
-   NFR-9: System shall prevent data duplication.

### 5.4 Usability

-   NFR-10: System shall have intuitive navigation.
-   NFR-11: QR scanning shall require minimal user training.

### 5.5 Maintainability

-   NFR-12: Backend shall follow modular structure.
-   NFR-13: Code shall be documented.

### 5.6 Scalability

-   NFR-14: System shall support multiple events.
-   NFR-15: Database shall handle 10,000+ participants.

------------------------------------------------------------------------

## 6. Database Requirements

The system shall maintain the following entities:

-   Users
-   Events
-   Participants
-   Tickets
-   Attendance Logs

Each ticket must: - Be uniquely identifiable - Be associated with one
participant - Be validated only once

------------------------------------------------------------------------

## 7. System Workflow

1.  Admin creates event.
2.  Participant registers.
3.  System generates QR ticket.
4.  Staff scans ticket.
5.  System validates and logs attendance.
6.  Admin views analytics.

------------------------------------------------------------------------

## 8. Assumptions & Dependencies

-   Users have internet access.
-   Device has camera for scanning.
-   Supabase service is available.
-   Backend server is operational.

------------------------------------------------------------------------

## 9. Future Enhancements

-   Email/SMS ticket delivery
-   Multi-day event support
-   Badge printing
-   Offline ticket validation
-   Payment gateway integration

------------------------------------------------------------------------

End of Document
