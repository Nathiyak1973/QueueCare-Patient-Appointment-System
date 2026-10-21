# Patient Appointment & Queue Management System (MERN Stack)

A hospital appointment scheduling and real-time intelligent queue management web application engineered with the **MERN (MongoDB, Express.js, React.js, Node.js)** stack.

Designed to eliminate physical waiting lines, prevent hospital overcrowding, streamline clinical consultations, and provide patients with live queue positions and estimated waiting times.

---

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 React 19 Single Page App (SPA)             │
│   Tailwind CSS  │  Recharts  │  Socket.IO Client  │ Axios   │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP REST & WebSockets
┌──────────────────────────────▼──────────────────────────────┐
│                  Express.js & Node.js Server                 │
│  - JWT Authentication & bcrypt                              │
│  - Role-Based Access Control (Patient, Doctor, Admin)       │
│  - Real-Time Queue Service & Concurrency Lock Engine         │
│  - Socket.IO Event Broadcaster (`patient_called`)           │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    MongoDB & Mongoose ODM                   │
│  - Compound Unique Indexes (Anti-double-booking)            │
│  - Models: User, Department, Appointment, QueueEntry,       │
│    Notification, AuditLog                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Core Operational Workflows

### Patient Workflow
1. **Registration & Auth**: Register account with medical profile (Age, Blood Group, Emergency Contact).
2. **Directory & Availability**: Browse specialist physicians filtered by Department (Cardiology, Neurology, Pediatrics, Orthopedics, General Medicine, Dermatology).
3. **Smart Booking**: Select date and choose an available 15-minute slot. Concurrency validation prevents race-condition double bookings.
4. **Token Generation**: Automatically receive a formatted queue token (e.g. `CARD-003`).
5. **Real-Time Tracking**: Track live queue position, number of patients ahead, and dynamic estimated wait time.
6. **Live Calling & Chime**: Receive an instant audio-visual chime on device when the doctor calls the token to proceed to the designated consultation suite.
7. **Consultation Records**: View post-consultation doctor notes and prescriptions.

### Doctor Workflow
1. **Physician Dashboard**: View today's scheduled consultations and real-time waiting backlog.
2. **Interactive Calling Console**:
   - One-click **"Call Next Patient in Line"** (triggers immediate audio notification to patient's device and updates waiting room screens).
   - Real-time consultation stopwatch timer.
   - Record clinical examination notes and prescription dosages.
   - Click **"Complete Consultation"** (saves records and advances queue).
   - Click **"Mark Patient Absent / No-Show"** (clears slot and recalibrates remaining patients' wait times).
3. **Schedule & Duration Customization**: Adjust average consultation duration per patient (e.g., 10m, 15m, 20m, 30m), which dynamically recalibrates waiting time projections across all patient tickets.

### Administrator Workflow
1. **Analytics Dashboard**: Monitor live hospital KPIs, appointment volume by department, and hourly queue arrival trends via Recharts.
2. **Physician Management**: Provision new doctor accounts, assign clinical suites and departments, and toggle active/inactive status.
3. **Department Management**: Add and manage hospital clinical wings and department codes.
4. **Master Queue Board**: Full-screen live hospital display for waiting room TVs showing "Now Serving" tokens across all consultation rooms.
5. **Audit Logs**: Tamper-proof security audit trail of all logins, bookings, cancellations, and doctor calls.

---

## 3. Intelligent Queue Management Algorithm

### Wait Time Formula:
$$\text{Estimated Wait Time} = \text{Patients Ahead in Queue} \times \text{Doctor's Average Consultation Duration}$$

* Example: If Dr. Vance has configured an average consultation duration of **15 minutes** and there is 1 patient currently in consultation + 2 patients ahead of you in line, your estimated wait is $(1 + 1) \times 15 = 30 \text{ minutes}$.
* **Dynamic Adjustment**: When a preceding patient finishes early, cancels, or is marked as a no-show, the queue automatically collapses and decrements wait times in real time.

---

## 4. Default Seed Test Credentials

For quick evaluation, use the top banner **1-Click Test Account Switcher** or log in manually:

| Role | Name | Email | Password |
|---|---|---|---|
| **Patient** | Sarah Jenkins | `patient@hospital.com` | `patient123` |
| **Doctor** | Dr. Robert Vance, MD | `doctor@hospital.com` | `doctor123` |
| **Administrator** | Chief Admin Evans | `admin@hospital.com` | `admin123` |

---

## 5. Technology Stack & Packages

- **Frontend**: React 19, Vite, Tailwind CSS, React Router v7, Axios, Lucide React, Recharts, Socket.IO Client.
- **Backend**: Node.js, Express.js, Socket.IO Server, JWT (`jsonwebtoken`), `bcryptjs`, CORS, Mongoose ODM.
- **Database**: Mongoose models with compound index concurrency safety and seamless in-memory fallback.

---

## 6. API Endpoints

### Authentication
- `POST /api/auth/register` - Create patient account
- `POST /api/auth/login` - Sign in and receive JWT token
- `GET /api/auth/me` - Get authenticated profile
- `PUT /api/auth/profile` - Update patient profile

### Doctors & Availability
- `GET /api/doctors` - List specialists by department / search
- `GET /api/doctors/:id` - Specialist details
- `GET /api/doctors/:id/slots?date=YYYY-MM-DD` - Real-time slot availability
- `PUT /api/doctors/:id` - Update schedule and consultation room

### Appointments
- `POST /api/appointments` - Book appointment and issue token
- `GET /api/appointments` - Role-filtered appointments
- `GET /api/appointments/:id` - Appointment details
- `PATCH /api/appointments/:id/cancel` - Cancel appointment and shift queue

### Live Queue
- `GET /api/queue/live?doctorId=...&date=...` - Live queue data for a clinic
- `GET /api/queue/hospital-overview` - Hospital-wide waiting room overview
- `GET /api/queue/token/:appointmentId` - Patient's live token position
- `POST /api/queue/call-next` - Doctor calls next patient
- `POST /api/queue/:appointmentId/complete` - Mark consultation completed
- `POST /api/queue/:appointmentId/no-show` - Mark patient absent/no-show

### Admin
- `GET /api/dashboard/admin` - Hospital analytics and volume metrics
- `POST /api/admin/doctors` - Provision doctor account
- `PATCH /api/admin/doctors/:id/toggle-status` - Activate/deactivate doctor
- `GET /api/admin/patients` - Patient directory
- `POST /api/admin/departments` - Add clinical wing
- `GET /api/admin/audit-logs` - System audit log trail
