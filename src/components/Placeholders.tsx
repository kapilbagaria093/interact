/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Target, CheckCircle2, ShieldAlert, Award, ArrowUpRight, Check, Compass } from 'lucide-react';

interface Mission {
  id: string;
  title: string;
  desc: string;
  points: number;
  progress: number;
  total: number;
  status: 'active' | 'completed' | 'available';
  category: 'verify' | 'report' | 'resolve';
}

const INITIAL_MISSIONS: Mission[] = [
  {
    id: 'm-1',
    title: 'Streetlight Watch',
    desc: 'Verify 5 Broken Streetlights in your local area to restore brightness and community safety.',
    points: 100,
    progress: 2,
    total: 5,
    status: 'active',
    category: 'verify',
  },
  {
    id: 'm-2',
    title: 'Clean Entrance Initiative',
    desc: 'Report 3 Illegal Dumping or Garbage issues near public park entrances.',
    points: 150,
    progress: 1,
    total: 3,
    status: 'active',
    category: 'report',
  },
  {
    id: 'm-3',
    title: 'First Responder',
    desc: 'Resolve any High or Critical priority community water leakage or pothole.',
    points: 250,
    progress: 0,
    total: 1,
    status: 'available',
    category: 'resolve',
  },
  {
    id: 'm-4',
    title: 'Civic Guardian',
    desc: 'Complete 15 total verification and report actions on the dashboard.',
    points: 500,
    progress: 15,
    total: 15,
    status: 'completed',
    category: 'verify',
  },
];

export default function Placeholders() {
  const [missions, setMissions] = useState<Mission[]>(INITIAL_MISSIONS);
  const [claimedIds, setClaimedIds] = useState<string[]>([]);

  const handleClaim = (id: string) => {
    setClaimedIds((prev) => [...prev, id]);
    // Simulate updating mission state
    setMissions((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: 'active', progress: 0 } : m))
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col h-full overflow-hidden">
      
      {/* Header */}
      <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-amber-500/5 to-transparent shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
            <Compass className="w-5 h-5 animate-[spin_60s_linear_infinite]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-800 font-display">Active Community Missions</h2>
            <p className="text-xs text-gray-500">Earn additional reputation points by achieving micro-targets</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/40">
        
        {/* Mission List */}
        {missions.map((mission) => {
          const isClaimed = claimedIds.includes(mission.id);
          const percent = Math.min(100, (mission.progress / mission.total) * 100);

          return (
            <div
              key={mission.id}
              className={`p-4 rounded-xl border transition-all duration-300 relative overflow-hidden bg-white shadow-sm flex flex-col gap-3 ${
                mission.status === 'completed'
                  ? 'border-emerald-100 bg-emerald-50/5'
                  : mission.status === 'active'
                    ? 'border-indigo-100'
                    : 'border-gray-200'
              }`}
            >
              {/* Floating Point Ribbon */}
              <div className="absolute top-0 right-0 bg-indigo-50 text-indigo-700 font-mono font-black text-xs px-3 py-1.5 rounded-bl-xl border-l border-b border-indigo-100/40">
                +{mission.points} XP
              </div>

              {/* Title & Desc */}
              <div className="pr-16">
                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                  mission.status === 'completed'
                    ? 'bg-emerald-100 text-emerald-800'
                    : mission.status === 'active'
                      ? 'bg-indigo-100 text-indigo-800'
                      : 'bg-gray-100 text-gray-600'
                }`}>
                  {mission.status}
                </span>
                <h4 className="text-sm font-bold text-gray-800 mt-2 font-display">{mission.title}</h4>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{mission.desc}</p>
              </div>

              {/* Progress Bar & Actions */}
              <div className="flex items-center justify-between gap-4 pt-1 border-t border-gray-100/60 mt-1">
                {mission.status === 'completed' ? (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Reward claimed successfully</span>
                  </div>
                ) : mission.status === 'active' ? (
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-gray-400 font-mono uppercase">
                      <span>Progress</span>
                      <span>{mission.progress} / {mission.total}</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => handleClaim(mission.id)}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    Accept Civic Mission
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}

      </div>

      {/* Footer */}
      <div className="p-4 bg-gray-50 border-t border-gray-100 text-[10px] text-gray-400 font-mono text-center shrink-0 uppercase tracking-wide">
        Missions reset weekly on Sunday UTC
      </div>

    </div>
  );
}
