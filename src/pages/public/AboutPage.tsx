import React from 'react';
import { Link } from 'react-router-dom';
import { DemoSwitcher } from '../../components/common/DemoSwitcher.tsx';
import { Navbar } from '../../components/common/Navbar.tsx';
import {
  Server,
  Layers,
  Database,
  ShieldCheck,
  CheckCircle2,
  Workflow,
  Cpu,
  Clock,
  ListOrdered,
  Users,
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      <DemoSwitcher />
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full uppercase tracking-wider">
            Academic &amp; Technical Architecture
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mt-3">
            Patient Appointment &amp; Queue Management System
          </h1>
          <p className="text-base text-slate-600 mt-3 leading-relaxed">
            A production-grade full-stack MERN web application engineered to solve hospital overcrowding, eliminate physical waiting lines, and optimize clinical consultations.
          </p>
        </div>

        {/* 1. Architecture Stack */}
        <section className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs mb-10">
          <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            <span>1. Core MERN Architecture &amp; Technologies</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-slate-100 bg-slate-50 p-5 rounded-2xl">
              <div className="flex items-center gap-2 text-blue-600 font-bold mb-2 text-sm">
                <Layers className="w-4 h-4" />
                <span>Frontend (Client)</span>
              </div>
              <ul className="text-xs text-slate-600 space-y-2">
                <li>• <strong>React 19 with Vite:</strong> Component-driven reactive SPA.</li>
                <li>• <strong>Tailwind CSS:</strong> Utility-first responsive design following medical theme.</li>
                <li>• <strong>Axios Client:</strong> Centralized REST communication with JWT interceptors.</li>
                <li>• <strong>Socket.IO Client:</strong> Live queue state subscription &amp; audio alerts.</li>
                <li>• <strong>Recharts:</strong> Hospital KPI visual analytics &amp; volume trends.</li>
                <li>• <strong>Lucide React:</strong> Standardized accessible clinical iconography.</li>
              </ul>
            </div>

            <div className="border border-slate-100 bg-slate-50 p-5 rounded-2xl">
              <div className="flex items-center gap-2 text-emerald-600 font-bold mb-2 text-sm">
                <Server className="w-4 h-4" />
                <span>Backend &amp; Database (Server)</span>
              </div>
              <ul className="text-xs text-slate-600 space-y-2">
                <li>• <strong>Node.js &amp; Express.js:</strong> Modular RESTful API architecture.</li>
                <li>• <strong>MongoDB &amp; Mongoose ODM:</strong> Schemas with compound indexing.</li>
                <li>• <strong>JWT Authentication:</strong> Secure JSON Web Tokens with 7-day expiration.</li>
                <li>• <strong>bcrypt:</strong> Cryptographic password hashing with salt rounds.</li>
                <li>• <strong>Concurrency Protection:</strong> Uniqueness constraints prevent double slot booking.</li>
                <li>• <strong>Socket.IO Server:</strong> Instant event broadcasting (`queue_updated`, `patient_called`).</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 2. Intelligent Queue Algorithm */}
        <section className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs mb-10">
          <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-600" />
            <span>2. The Intelligent Queue Management Algorithm</span>
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            Unlike simple static calendars, CareQueue maintains an active mathematical state for each doctor, session, and day.
          </p>

          <div className="space-y-4">
            <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100">
              <h3 className="text-sm font-bold text-indigo-950 mb-1 flex items-center gap-2">
                <ListOrdered className="w-4 h-4 text-indigo-600" />
                Dynamic Token Generation
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed">
                Tokens are generated per department and physician (e.g. <code>CARD-001</code>, <code>CARD-002</code>). When an appointment is confirmed, it is assigned the next sequential integer token.
              </p>
            </div>

            <div className="p-4 bg-teal-50/60 rounded-2xl border border-teal-100">
              <h3 className="text-sm font-bold text-teal-950 mb-1 flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-600" />
                Estimated Wait Time Formula
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed">
                <code>Wait Time = Patients Ahead in Active Queue × Doctor's Configured Average Consultation Duration</code>
                <br />
                For example, if Dr. Vance averages 15 mins/patient and there are 3 patients ahead, the patient's estimated wait is 45 minutes. When a patient completes or cancels, remaining wait times automatically decrement.
              </p>
            </div>

            <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-100">
              <h3 className="text-sm font-bold text-amber-950 mb-1 flex items-center gap-2">
                <Workflow className="w-4 h-4 text-amber-600" />
                Handling Exceptions (Cancellations &amp; No-Shows)
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed">
                If a patient cancels their slot or the doctor marks a patient as absent (No-show), the appointment state is preserved for audit trails, while the active queue dynamically collapses and shifts subsequent patients forward.
              </p>
            </div>
          </div>
        </section>

        {/* 3. Three-Role Workflow */}
        <section className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs mb-10">
          <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>3. Three-Role Operational Matrix</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600">
            <div className="border border-sky-100 bg-sky-50/40 p-4 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-sky-900 text-sm">Patient Experience</h3>
                <Link to="/register" className="text-[11px] font-semibold text-blue-600 hover:underline">
                  Register &rarr;
                </Link>
              </div>
              <ul className="space-y-1.5">
                <li>✓ Register &amp; manage health profile</li>
                <li>✓ Filter doctors by specialty &amp; room</li>
                <li>✓ Book real 15-minute slots</li>
                <li>✓ Live token tracking on mobile/desktop</li>
                <li>✓ Real-time audio chime upon being called</li>
                <li>✓ Cancel appointment if needed</li>
              </ul>
            </div>

            <div className="border border-emerald-100 bg-emerald-50/40 p-4 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-emerald-900 text-sm">Doctor Clinical Console</h3>
                <Link to="/doctor/register" className="text-[11px] font-semibold text-emerald-600 hover:underline">
                  Register &rarr;
                </Link>
              </div>
              <ul className="space-y-1.5">
                <li>✓ Self-service Doctor Registration</li>
                <li>✓ View today's OPD list &amp; reason</li>
                <li>✓ One-click "Call Next Patient"</li>
                <li>✓ Real-time consultation timer</li>
                <li>✓ Enter clinical notes &amp; prescription</li>
                <li>✓ Mark consultations completed or no-show</li>
                <li>✓ Customize consultation duration &amp; room</li>
              </ul>
            </div>

            <div className="border border-indigo-100 bg-indigo-50/40 p-4 rounded-2xl">
              <h3 className="font-bold text-indigo-900 text-sm mb-2">Hospital Administration</h3>
              <ul className="space-y-1.5">
                <li>✓ Real-time cross-department queue board</li>
                <li>✓ KPI charts: daily volume, departments</li>
                <li>✓ Doctor roster &amp; account provisioning</li>
                <li>✓ Department and clinic management</li>
                <li>✓ Full security audit trail of all actions</li>
                <li>✓ Prevent concurrent conflicts</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 4. College Viva / Presentation Notes */}
        <section className="bg-gradient-to-br from-slate-900 to-blue-950 text-white p-8 rounded-3xl shadow-lg">
          <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>Presentation &amp; Viva Highlights</span>
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed mb-4">
            Key points for project demonstrations, viva voce, and college evaluation:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
            <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
              <strong className="text-white block mb-1">Concurrency Defense:</strong>
              Compound unique index on <code>(doctorId, appointmentDate, timeSlot)</code> prevents race condition bookings even under concurrent user requests.
            </div>
            <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
              <strong className="text-white block mb-1">Dual-Engine Persistence:</strong>
              Mongoose schema models with automatic fallback to high-reliability zero-friction in-memory store ensure instant demonstration without external DB failures.
            </div>
            <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
              <strong className="text-white block mb-1">Real-time WebSockets:</strong>
              Socket.IO bidirectional event bus notifies connected patient devices within milliseconds of a doctor pressing "Call Next".
            </div>
            <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
              <strong className="text-white block mb-1">Strict RBAC:</strong>
              Multi-level JWT middleware checks roles on every write operation, ensuring patients cannot access doctor actions or tamper with queue position.
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
