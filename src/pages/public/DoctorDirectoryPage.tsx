import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api.ts';
import { DemoSwitcher } from '../../components/common/DemoSwitcher.tsx';
import { Navbar } from '../../components/common/Navbar.tsx';
import {
  Search,
  Stethoscope,
  DoorOpen,
  Clock,
  Award,
  DollarSign,
  CalendarCheck,
  Building2,
} from 'lucide-react';

export const DoctorDirectoryPage: React.FC = () => {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [docRes, deptRes] = await Promise.all([
          api.get('/doctors'),
          api.get('/admin/departments'),
        ]);

        if (docRes.data.success) {
          setDoctors(docRes.data.doctors || []);
        }
        if (deptRes.data.success) {
          setDepartments(deptRes.data.departments || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredDoctors = doctors.filter((doc) => {
    const matchesDept =
      selectedDept === 'all' || doc.doctorDetails?.departmentId === selectedDept;
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      doc.name.toLowerCase().includes(q) ||
      doc.doctorDetails?.specialty.toLowerCase().includes(q) ||
      doc.department?.name.toLowerCase().includes(q);
    return matchesDept && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      <DemoSwitcher />
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Specialist Roster</p>
            <h1 className="text-3xl font-black text-slate-900 mt-1">Hospital Doctors &amp; Consultation Timings</h1>
            <p className="text-sm text-slate-600 mt-2">
              Find the right physician, review credentials, check consultation fees, and schedule an appointment with live queue tracking.
            </p>
          </div>
          <Link
            to="/doctor/register"
            className="self-start md:self-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-md flex items-center gap-2 shrink-0"
          >
            <Stethoscope className="w-4 h-4" />
            <span>Doctor Registration</span>
          </Link>
        </div>

        {/* Search & Filters */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="Search doctor or specialty..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Department Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedDept('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                selectedDept === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Specialties ({doctors.length})
            </button>
            {departments.map((dept) => (
              <button
                key={dept._id}
                onClick={() => setSelectedDept(dept._id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                  selectedDept === dept._id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {dept.name}
              </button>
            ))}
          </div>
        </div>

        {/* Doctor Grid */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm font-medium text-slate-500">Loading specialist registry...</p>
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
            <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No doctors match your criteria</h3>
            <p className="text-xs text-slate-500 mt-1">Try clearing your search query or selecting another department.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors.map((doc) => (
              <div
                key={doc._id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg shadow-inner">
                        {doc.name.replace('Dr. ', '').charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{doc.name}</h3>
                        <p className="text-xs font-semibold text-blue-600">
                          {doc.doctorDetails?.specialty}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600 my-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Department: <strong>{doc.department?.name || 'General OPD'}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{doc.doctorDetails?.qualification} ({doc.doctorDetails?.experienceYears} yrs exp)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DoorOpen className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Room: <strong>{doc.doctorDetails?.roomNumber}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Avg Consult Time: <strong>{doc.doctorDetails?.avgConsultationMinutes} mins</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Consultation Fee: <strong>${doc.doctorDetails?.consultationFee}</strong></span>
                    </div>
                  </div>

                  {doc.doctorDetails?.bio && (
                    <p className="text-xs text-slate-500 line-clamp-2 italic mb-4">
                      "{doc.doctorDetails.bio}"
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <Link
                    to={`/patient/book?doctorId=${doc._id}&deptId=${doc.doctorDetails?.departmentId}`}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs"
                  >
                    <CalendarCheck className="w-4 h-4" />
                    <span>Select &amp; View Slots</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
