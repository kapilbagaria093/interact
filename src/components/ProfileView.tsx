/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Flame, Star, Award, ShieldAlert, Sparkles, Calendar, TrendingUp } from 'lucide-react';
import { User } from '../types';

interface ProfileViewProps {
  user: User;
}

export default function ProfileView({ user }: ProfileViewProps) {
  
  // Calculate level progress (each level is 100 points)
  const levelProgress = user.points % 100;

  // Generate GitHub style contribution dates for the last 6 weeks (42 days)
  const generateContributionGrid = () => {
    const grid = [];
    const now = new Date();
    // Start 41 days ago (to get 42 days total)
    const startDate = new Date(now.getTime() - 41 * 24 * 60 * 60 * 1000);

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const count = user.contributions?.[dateStr] || 0;
      grid.push({ dateStr, date, count });
    }
    return grid;
  };

  const gridData = generateContributionGrid();

  const getIntensityClass = (count: number) => {
    if (count === 0) return 'bg-gray-100 hover:bg-gray-200';
    if (count <= 1) return 'bg-indigo-200 hover:bg-indigo-300';
    if (count <= 2) return 'bg-indigo-400 hover:bg-indigo-500';
    if (count <= 4) return 'bg-indigo-600 hover:bg-indigo-700';
    return 'bg-indigo-800 hover:bg-indigo-900';
  };

  // Get Badges based on achievements
  const getBadges = () => {
    const badges = [];
    if (user.reportedCount >= 1) {
      badges.push({ name: 'First Eye', icon: '👁️', desc: 'Reported first community issue' });
    }
    if (user.verifiedCount >= 5) {
      badges.push({ name: 'Active Verifier', icon: '🔍', desc: 'Verified 5+ community issues' });
    }
    if (user.resolvedCount >= 1) {
      badges.push({ name: 'Problem Solver', icon: '🛠️', desc: 'Resolved an issue with visual proof' });
    }
    if (user.points >= 200) {
      badges.push({ name: 'Elite Guardian', icon: '🛡️', desc: 'Acquired 200+ civic reputation points' });
    }
    return badges;
  };

  const activeBadges = getBadges();

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col h-full overflow-hidden">
      
      {/* Upper Bio Area */}
      <div className="p-6 border-b border-gray-100 bg-gradient-to-br from-indigo-950/5 via-indigo-900/0 to-transparent shrink-0">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-16 h-16 rounded-full border-2 border-indigo-600/30 object-cover shadow-sm bg-gray-50"
            />
            <span className="absolute -bottom-1 -right-1 bg-indigo-600 text-white font-mono font-black text-[10px] w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
              {user.level}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-gray-800 font-display truncate">{user.name}</h2>
            <p className="text-xs text-indigo-600 font-medium flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-3.5 h-3.5" />
              Level {user.level} Civic Hero
            </p>
            <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-mono">
              Joined {new Date(user.joinedAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Level XP Bar */}
        <div className="mt-5 space-y-1.5">
          <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase font-mono">
            <span>Next Level Progress</span>
            <span>{levelProgress} / 100 XP</span>
          </div>
          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-indigo-600 h-full rounded-full transition-all duration-700" 
              style={{ width: `${levelProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats Breakdown Grid */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-gray-50/40">
        
        {/* Quad Stats Bar */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm text-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase block">Reports</span>
            <p className="text-lg font-black text-indigo-600 mt-1">{user.reportedCount}</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm text-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase block">Verified</span>
            <p className="text-lg font-black text-indigo-600 mt-1">{user.verifiedCount}</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm text-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase block">Resolved</span>
            <p className="text-lg font-black text-emerald-600 mt-1">{user.resolvedCount}</p>
          </div>
        </div>

        {/* Reputation Score Card */}
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 p-4 rounded-xl text-white flex items-center justify-between shadow-md">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300 font-mono">Reputation & Trust</span>
            <h4 className="text-xl font-black font-display">{user.points} XP</h4>
            <p className="text-[10px] text-gray-400">Activity Multiplier 1.5x active</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300 font-mono">Impact Factor</span>
            <p className="text-xl font-black text-amber-400 font-mono">#{user.impactScore}</p>
          </div>
        </div>

        {/* GitHub style Contribution Calendar */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 uppercase tracking-wider">
            <Calendar className="w-4 h-4 text-indigo-600" />
            Civic Contribution History
          </div>
          
          <div className="grid grid-cols-7 gap-1.5 w-fit mx-auto pt-1">
            {gridData.map((cell, idx) => (
              <div
                key={idx}
                className={`w-4 h-4 rounded-sm transition-all cursor-pointer ${getIntensityClass(cell.count)}`}
                title={`${cell.dateStr}: ${cell.count} contributions`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 pt-1">
            <span>42 Days Ago</span>
            <div className="flex items-center gap-1">
              <span>Less</span>
              <span className="w-2.5 h-2.5 bg-gray-100 rounded-sm" />
              <span className="w-2.5 h-2.5 bg-indigo-200 rounded-sm" />
              <span className="w-2.5 h-2.5 bg-indigo-400 rounded-sm" />
              <span className="w-2.5 h-2.5 bg-indigo-600 rounded-sm" />
              <span className="w-2.5 h-2.5 bg-indigo-800 rounded-sm" />
              <span>More</span>
            </div>
            <span>Today</span>
          </div>
        </div>

        {/* Earned Badges Showcase */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Earned Badges</h3>
          {activeBadges.length === 0 ? (
            <div className="bg-white p-4 text-center rounded-xl border border-gray-100 text-xs text-gray-400 italic">
              Complete your first report or verification to unlock badges!
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3.5">
              {activeBadges.map((badge, i) => (
                <div key={i} className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center text-center gap-1.5">
                  <span className="text-3xl">{badge.icon}</span>
                  <div>
                    <h5 className="text-xs font-bold text-gray-800">{badge.name}</h5>
                    <p className="text-[10px] text-gray-400 mt-0.5 leading-snug">{badge.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Footer */}
      <div className="p-4 bg-gray-50 border-t border-gray-100 text-[10px] text-gray-400 font-mono text-center shrink-0 uppercase tracking-wide">
        Civic Profile Verified • Secured Ledger
      </div>

    </div>
  );
}
