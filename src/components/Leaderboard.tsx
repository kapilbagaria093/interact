/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Trophy, ShieldAlert, Award, Star, Flame, Zap } from 'lucide-react';

interface LeaderboardProps {
  activeTab: 'reporters' | 'verifiers' | 'heroes';
  onTabChange: (tab: 'reporters' | 'verifiers' | 'heroes') => void;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  avatar: string;
  count: number;
  score: number;
  level?: number;
}

export default function Leaderboard({ activeTab, onTabChange }: LeaderboardProps) {
  const [data, setData] = useState<{
    topReporters: LeaderboardEntry[];
    topVerifiers: LeaderboardEntry[];
    communityHeroes: LeaderboardEntry[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/leaderboard');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [activeTab]);

  const getRankStyle = (index: number) => {
    switch (index) {
      case 0:
        return {
          bg: 'bg-amber-500/10 border-amber-300',
          text: 'text-amber-600',
          badge: 'bg-amber-500 text-white shadow-amber-500/10 shadow-sm',
          medal: '🏆',
        };
      case 1:
        return {
          bg: 'bg-slate-300/10 border-slate-300',
          text: 'text-slate-600',
          badge: 'bg-slate-400 text-white shadow-slate-400/10 shadow-sm',
          medal: '🥈',
        };
      case 2:
        return {
          bg: 'bg-amber-700/10 border-amber-600/35',
          text: 'text-amber-800',
          badge: 'bg-amber-700 text-white shadow-amber-700/10 shadow-sm',
          medal: '🥉',
        };
      default:
        return {
          bg: 'bg-white border-gray-100',
          text: 'text-gray-500',
          badge: 'bg-gray-100 text-gray-700',
          medal: null,
        };
    }
  };

  const currentList = () => {
    if (!data) return [];
    if (activeTab === 'reporters') return data.topReporters;
    if (activeTab === 'verifiers') return data.topVerifiers;
    return data.communityHeroes;
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col h-full overflow-hidden">
      
      {/* Leaderboard Header */}
      <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-indigo-900/5 to-indigo-950/0 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-800 font-display">Civic Hall of Fame</h2>
            <p className="text-xs text-gray-500">Recognizing neighborhood heroes by civic contributions</p>
          </div>
        </div>

        {/* Categories Tabs */}
        <div className="flex bg-gray-100 p-1.5 rounded-xl mt-4">
          <button
            onClick={() => onTabChange('heroes')}
            className={`flex-1 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all ${
              activeTab === 'heroes'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Heroes
          </button>
          <button
            onClick={() => onTabChange('reporters')}
            className={`flex-1 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all ${
              activeTab === 'reporters'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Reporters
          </button>
          <button
            onClick={() => onTabChange('verifiers')}
            className={`flex-1 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all ${
              activeTab === 'verifiers'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Verifiers
          </button>
        </div>
      </div>

      {/* Leaderboard Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-gray-50/40">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
            <Zap className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="text-xs">Updating rankings and scores...</span>
          </div>
        ) : currentList().length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-xs">
            No contributions loaded.
          </div>
        ) : (
          currentList().map((entry, index) => {
            const style = getRankStyle(index);
            return (
              <div
                key={entry.id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all hover:scale-[1.01] ${style.bg} shadow-sm`}
              >
                {/* Position Badge */}
                <div className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center ${style.badge}`}>
                  {style.medal ? style.medal : index + 1}
                </div>

                {/* Avatar */}
                <img
                  src={entry.avatar}
                  alt={entry.name}
                  className="w-9 h-9 rounded-full object-cover border border-gray-100 bg-gray-100"
                />

                {/* Profile Name & Level */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-gray-800 truncate">{entry.name}</span>
                    {entry.level && (
                      <span className="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full font-bold">
                        Lvl {entry.level}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-0.5">
                    <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span>Active Contributor</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="text-right">
                  <p className="text-xs font-black text-gray-800 font-mono flex items-center justify-end gap-1">
                    {activeTab === 'heroes' ? (
                      <>
                        <Flame className="w-3.5 h-3.5 text-orange-500" />
                        {entry.score} <span className="text-[9px] font-normal text-gray-400">IMPACT</span>
                      </>
                    ) : activeTab === 'reporters' ? (
                      <>
                        <Star className="w-3.5 h-3.5 text-amber-500" />
                        {entry.count} <span className="text-[9px] font-normal text-gray-400">REPORTS</span>
                      </>
                    ) : (
                      <>
                        <Award className="w-3.5 h-3.5 text-indigo-500" />
                        {entry.count} <span className="text-[9px] font-normal text-gray-400">VERIFIED</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Leaderboard Footer */}
      <div className="p-4 bg-gray-50 border-t border-gray-100 text-[10px] text-gray-400 font-mono text-center shrink-0 uppercase tracking-wide">
        Updates automatically with community actions
      </div>

    </div>
  );
}
