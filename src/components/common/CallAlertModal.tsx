import React from 'react';
import { useQueue } from '../../context/QueueContext.tsx';
import { BellRing, X, DoorOpen, User, CheckCircle2 } from 'lucide-react';

export const CallAlertModal: React.FC = () => {
  const { activeAlert, dismissAlert } = useQueue();

  if (!activeAlert) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border-4 border-blue-500 max-w-md w-full overflow-hidden transform transition-all scale-100">
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-6 relative">
          <button
            onClick={dismissAlert}
            className="absolute top-4 right-4 p-1 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition"
            aria-label="Close alert"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md animate-bounce">
              <BellRing className="w-8 h-8 text-yellow-300" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest font-bold text-blue-200">Hospital Queue Call</p>
              <h3 className="text-2xl font-black">NOW SERVING</h3>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5 text-center">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Queue Token</p>
            <p className="text-4xl font-black text-blue-950 my-1">{activeAlert.tokenDisplay}</p>
            <div className="flex items-center justify-center gap-1.5 text-sm font-medium text-slate-700">
              <User className="w-4 h-4 text-blue-600" />
              <span>{activeAlert.patientName}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-left">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-medium block">Consultation Room</span>
              <span className="text-sm font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                <DoorOpen className="w-4 h-4 text-emerald-600" />
                {activeAlert.roomNumber}
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-medium block">Attending Physician</span>
              <span className="text-sm font-bold text-slate-800 truncate block mt-0.5">
                {activeAlert.doctorName}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Please proceed immediately to the consultation suite. If you are not present, your token may be skipped.
          </p>

          <button
            onClick={dismissAlert}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow-md flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            Acknowledged / On My Way
          </button>
        </div>
      </div>
    </div>
  );
};
