/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Target, CheckCircle2, Award, ArrowUpRight, Compass, Loader2, AlertCircle } from 'lucide-react';

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

interface PlaceholdersProps {
  token: string | null;
  onMissionAction?: () => void;
}

export default function Placeholders({ token, onMissionAction }: PlaceholdersProps) {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchMissions = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/missions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        throw new Error('Failed to load civic missions from ledger');
      }
      const data = await res.json();
      setMissions(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while fetching missions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMissions();
  }, [token]);

  const handleAccept = async (id: string) => {
    if (!token) return;
    try {
      setActionLoading(id);
      setError(null);
      setSuccessMsg(null);
      const res = await fetch(`/api/missions/${id}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to accept civic mission');
      }
      setMissions(data.missions);
      setSuccessMsg(`Mission "${missions.find(m => m.id === id)?.title}" has been active-stamped on your profile.`);
      if (onMissionAction) {
        onMissionAction();
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Could not accept mission');
    } finally {
      setActionLoading(null);
    }
  };

  const handleClaim = async (id: string) => {
    if (!token) return;
    try {
      setActionLoading(id);
      setError(null);
      setSuccessMsg(null);
      const res = await fetch(`/api/missions/${id}/claim`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to claim mission reward');
      }
      setMissions(data.missions);
      setSuccessMsg(data.message);
      if (onMissionAction) {
        onMissionAction();
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Could not claim mission reward');
    } finally {
      setActionLoading(null);
    }
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

      {/* Alert/Status banner */}
      {(error || successMsg) && (
        <div className="px-5 pt-4 shrink-0">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/40">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <span className="text-xs font-bold uppercase font-mono tracking-wider">Syncing your credentials...</span>
          </div>
        ) : missions.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-xs">
            No missions available on the ledger right now. Check back later!
          </div>
        ) : (
          /* Mission List */
          missions.map((mission) => {
            const percent = Math.min(100, (mission.progress / mission.total) * 100);

            return (
              <div
                key={mission.id}
                id={`mission-card-${mission.id}`}
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
                  ) : mission.status === 'active' && mission.progress >= mission.total ? (
                    <button
                      id={`btn-claim-${mission.id}`}
                      onClick={() => handleClaim(mission.id)}
                      disabled={actionLoading !== null}
                      className="w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 text-white text-xs font-black rounded-lg transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                    >
                      {actionLoading === mission.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        <>
                          Claim Mission Reward (+{mission.points} XP)
                          <Award className="w-4 h-4" />
                        </>
                      )}
                    </button>
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
                      id={`btn-accept-${mission.id}`}
                      onClick={() => handleAccept(mission.id)}
                      disabled={actionLoading !== null}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      {actionLoading === mission.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        <>
                          Accept Civic Mission
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}

      </div>

      {/* Footer */}
      <div className="p-4 bg-gray-50 border-t border-gray-100 text-[10px] text-gray-400 font-mono text-center shrink-0 uppercase tracking-wide">
        Missions reset weekly on Sunday UTC
      </div>

    </div>
  );
}
