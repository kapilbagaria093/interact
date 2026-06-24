import React, { useState } from 'react';
import { Flame, Star, Award, ShieldAlert, Sparkles, Calendar, TrendingUp, Edit2, LogOut, Check, X, RefreshCcw } from 'lucide-react';
import { User } from '../types';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
  'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=150',
];

interface ProfileViewProps {
  user: User;
  token: string | null;
  onSignOut: () => void;
  onProfileUpdate: (updatedUser: User) => void;
}

export default function ProfileView({ user, token, onSignOut, onProfileUpdate }: ProfileViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [avatar, setAvatar] = useState(user.avatar);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate level progress (each level is 100 points)
  const levelProgress = user.points % 100;

  // Generate GitHub style contribution dates for the last 6 weeks (42 days)
  const generateContributionGrid = () => {
    const grid = [];
    const now = new Date();
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
    if (count <= 1) return 'bg-[#33ffff] hover:bg-[#00cccc] border border-black';
    if (count <= 2) return 'bg-[#00ff55] hover:bg-[#00cc44] border border-black';
    if (count <= 4) return 'bg-[#ff007f] hover:bg-[#cc0066] border border-black';
    return 'bg-black hover:bg-gray-800 border border-black';
  };

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

  const handleUpdateProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    if (!token) {
      setError('Not authenticated.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, avatar })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update profile.');
      }

      const data = await res.json();
      onProfileUpdate(data.user);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Error saving changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] flex flex-col h-full overflow-hidden text-black">
      
      {/* Upper Bio Area */}
      <div className="p-5 border-b-2 border-black bg-gray-50 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] bg-black text-[#ffff25] px-2 py-0.5 border border-black rounded uppercase tracking-widest font-black">
            Ledger Identity
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setError(null);
                setIsEditing(!isEditing);
              }}
              className="p-1.5 bg-white hover:bg-gray-100 border-2 border-black rounded-lg text-xs font-black flex items-center gap-1 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
            >
              {isEditing ? <X className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
              <span>{isEditing ? 'Cancel' : 'Edit'}</span>
            </button>
            <button
              onClick={onSignOut}
              className="p-1.5 bg-[#ff3355] hover:bg-[#dd2244] text-white border-2 border-black rounded-lg text-xs font-black flex items-center gap-1 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {isEditing ? (
          <form onSubmit={handleUpdateProfileSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500 text-white text-[10px] font-bold p-2 border-2 border-black rounded-lg">
                {error}
              </div>
            )}
            
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase">Display Name / Pseudonym</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-white border-2 border-black text-xs font-bold py-1.5 px-3 rounded-lg focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase block">Avatar Profile Picture</label>
              <div className="flex items-center gap-3">
                <img
                  src={avatar}
                  alt="Avatar preview"
                  className="w-12 h-12 rounded-full border-2 border-black object-cover shrink-0 shadow-[2px_2px_0px_rgba(0,0,0,1)]"
                />
                <div className="flex flex-wrap gap-1">
                  {PRESET_AVATARS.map((av, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setAvatar(av)}
                      className={`w-7 h-7 rounded-full overflow-hidden border-2 ${
                        avatar === av ? 'border-[#ff007f] scale-110 shadow-sm' : 'border-black hover:border-gray-500'
                      }`}
                    >
                      <img src={av} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <label className="text-[9px] font-black text-gray-500 uppercase">Or Custom Image URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  className="w-full bg-white border-2 border-black text-[11px] font-semibold py-1 px-2.5 rounded-lg focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-[#00ff55] hover:bg-[#00dd44] border-2 border-black font-black text-xs py-2 rounded-xl shadow-[3px_3px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {saving ? (
                <>
                  <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                  <span>FORGING CREDENTIALS...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>SAVE LEDGER UPDATES</span>
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-16 h-16 rounded-full border-[3px] border-black object-cover shadow-[3px_3px_0px_rgba(0,0,0,1)] bg-gray-50"
              />
              <span className="absolute -bottom-1 -right-1 bg-[#ff007f] text-white font-mono font-black text-[10px] w-6 h-6 rounded-full flex items-center justify-center border-2 border-black shadow-sm">
                {user.level}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-base font-black text-black font-display uppercase tracking-tight truncate">{user.name}</h2>
              <p className="text-xs text-[#ff007f] font-black flex items-center gap-1 mt-0.5 uppercase">
                <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                Level {user.level} Civic Hero
              </p>
              <p className="text-[9px] text-gray-500 mt-1 uppercase tracking-wider font-mono font-bold">
                Joined {new Date(user.joinedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}

        {/* Level XP Bar */}
        {!isEditing && (
          <div className="mt-5 space-y-1.5">
            <div className="flex justify-between items-center text-[10px] font-black text-black uppercase font-mono">
              <span>Next Level Progress</span>
              <span>{levelProgress} / 100 XP</span>
            </div>
            <div className="w-full bg-white h-3.5 border-2 border-black rounded-lg overflow-hidden p-[2px]">
              <div 
                className="bg-[#00ff55] border border-black h-full rounded-md transition-all duration-700" 
                style={{ width: `${levelProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Stats Breakdown Grid */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/20">
        
        {/* Quad Stats Bar */}
        <div className="grid grid-cols-4 gap-1.5">
          <div className="bg-white p-2 rounded-xl border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] text-center">
            <span className="text-[8px] sm:text-[9px] font-black text-gray-500 uppercase block">Reports</span>
            <p className="text-sm sm:text-base font-black text-black mt-0.5">{user.reportedCount}</p>
          </div>
          <div className="bg-white p-2 rounded-xl border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] text-center">
            <span className="text-[8px] sm:text-[9px] font-black text-gray-500 uppercase block">Verified</span>
            <p className="text-sm sm:text-base font-black text-[#ff007f] mt-0.5">{user.verifiedCount}</p>
          </div>
          <div className="bg-white p-2 rounded-xl border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] text-center">
            <span className="text-[8px] sm:text-[9px] font-black text-gray-500 uppercase block">Resolved</span>
            <p className="text-sm sm:text-base font-black text-[#00ff55] mt-0.5">{user.resolvedCount}</p>
          </div>
          <div className="bg-white p-2 rounded-xl border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] text-center">
            <span className="text-[8px] sm:text-[9px] font-black text-gray-500 uppercase block">Funded</span>
            <p className="text-sm sm:text-base font-black text-indigo-600 mt-0.5">${user.fundingTotal || 0}</p>
          </div>
        </div>

        {/* Reputation Score Card */}
        <div className="bg-black p-3.5 rounded-xl text-white flex items-center justify-between border border-black shadow-[3px_3px_0px_rgba(0,0,0,1)]">
          <div className="space-y-0.5 text-left">
            <span className="text-[9px] font-black uppercase tracking-widest text-[#33ffff] font-mono">Reputation & Trust</span>
            <h4 className="text-lg font-black font-display text-[#ffff25]">{user.points} XP</h4>
            <p className="text-[9px] text-gray-400 font-bold uppercase font-mono">Civic Ledger Registered</p>
          </div>
          <div className="text-right">
            <span className="text-[9px] font-black uppercase tracking-widest text-[#33ffff] font-mono">Impact Score</span>
            <p className="text-lg font-black text-[#ff007f] font-mono">#{user.impactScore}</p>
          </div>
        </div>

        {/* GitHub style Contribution Calendar */}
        <div className="bg-white p-3 rounded-xl border-2 border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] space-y-2">
          <div className="flex items-center gap-1.5 text-[10px] font-black text-black uppercase tracking-wider">
            <Calendar className="w-4 h-4 text-[#ff007f]" />
            Civic Contribution Ledger
          </div>
          
          <div className="grid grid-cols-7 gap-1 w-fit mx-auto pt-1">
            {gridData.map((cell, idx) => (
              <div
                key={idx}
                className={`w-4 h-4 rounded-sm transition-all cursor-pointer ${getIntensityClass(cell.count)}`}
                title={`${cell.dateStr}: ${cell.count} contributions`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between text-[8px] font-mono font-black text-gray-500 pt-1 uppercase">
            <span>42 Days Ago</span>
            <div className="flex items-center gap-1">
              <span>Less</span>
              <span className="w-2.5 h-2.5 bg-gray-100 rounded-sm" />
              <span className="w-2.5 h-2.5 bg-[#33ffff] rounded-sm" />
              <span className="w-2.5 h-2.5 bg-[#00ff55] rounded-sm" />
              <span className="w-2.5 h-2.5 bg-[#ff007f] rounded-sm" />
              <span className="w-2.5 h-2.5 bg-black rounded-sm" />
              <span>More</span>
            </div>
            <span>Today</span>
          </div>
        </div>

        {/* Earned Badges Showcase */}
        <div className="space-y-2">
          <h3 className="text-[10px] font-black uppercase tracking-wider text-black">Earned Badges</h3>
          {activeBadges.length === 0 ? (
            <div className="bg-white p-3 text-center rounded-xl border-2 border-black text-xs text-gray-400 font-bold italic uppercase">
              Complete your first report or verification to unlock badges!
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {activeBadges.map((badge, i) => (
                <div key={i} className="bg-white p-2.5 rounded-xl border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] flex flex-col items-center text-center gap-1">
                  <span className="text-2xl">{badge.icon}</span>
                  <div>
                    <h5 className="text-[10px] font-black text-black uppercase leading-tight">{badge.name}</h5>
                    <p className="text-[8px] font-bold text-gray-500 mt-0.5 leading-snug">{badge.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Footer */}
      <div className="p-3 bg-black text-[#ffff25] font-mono font-black text-center shrink-0 uppercase tracking-wide text-[9px] border-t-2 border-black">
        Civic Profile Verified • Secured Ledger
      </div>

    </div>
  );
}
