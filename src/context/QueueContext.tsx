import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getSocket } from '../services/socket.ts';

interface CalledPatientAlert {
  doctorId: string;
  tokenDisplay: string;
  patientName: string;
  roomNumber: string;
  doctorName: string;
}

interface QueueContextType {
  lastUpdated: number;
  triggerQueueRefresh: () => void;
  activeAlert: CalledPatientAlert | null;
  dismissAlert: () => void;
}

const QueueContext = createContext<QueueContextType | undefined>(undefined);

// Web Audio API Synthesizer for Hospital Chime (Two-tone Hospital ding-dong)
const playChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      gain.gain.setValueAtTime(0.2, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };

    // First tone (G5) then second tone (E5) - traditional hospital chime
    playTone(784, 0, 0.4);
    playTone(659, 0.4, 0.6);
  } catch (e) {
    // Audio autoplay restrictions or muted tab
  }
};

export const QueueProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
  const [activeAlert, setActiveAlert] = useState<CalledPatientAlert | null>(null);

  const triggerQueueRefresh = () => {
    setLastUpdated(Date.now());
  };

  const dismissAlert = () => {
    setActiveAlert(null);
  };

  useEffect(() => {
    const socket = getSocket();

    const handleQueueUpdated = () => {
      setLastUpdated(Date.now());
    };

    const handlePatientCalled = (data: CalledPatientAlert) => {
      setActiveAlert(data);
      playChime();
      setLastUpdated(Date.now());
    };

    socket.on('queue_updated', handleQueueUpdated);
    socket.on('patient_called', handlePatientCalled);

    // Reliable 10-second polling fallback
    const interval = setInterval(() => {
      setLastUpdated(Date.now());
    }, 10000);

    return () => {
      socket.off('queue_updated', handleQueueUpdated);
      socket.off('patient_called', handlePatientCalled);
      clearInterval(interval);
    };
  }, []);

  return (
    <QueueContext.Provider
      value={{
        lastUpdated,
        triggerQueueRefresh,
        activeAlert,
        dismissAlert,
      }}
    >
      {children}
    </QueueContext.Provider>
  );
};

export const useQueue = () => {
  const context = useContext(QueueContext);
  if (!context) {
    throw new Error('useQueue must be used within a QueueProvider');
  }
  return context;
};
