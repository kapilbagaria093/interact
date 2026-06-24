/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, 
  MapPin, 
  Trophy, 
  LayoutDashboard, 
  User as UserIcon, 
  Sparkles, 
  AlertCircle,
  Clock,
  Flame,
  CheckCircle2,
  Filter,
  PlusCircle,
  RefreshCcw,
  Target
} from 'lucide-react';

import { Issue, User, IssueCategory, IssueSeverity, IssueStatus } from './types';
import InteractiveMap from './components/InteractiveMap';
import IssueDetailsModal from './components/IssueDetailsModal';
import IssueReportForm from './components/IssueReportForm';
import Leaderboard from './components/Leaderboard';
import StatsDashboard from './components/StatsDashboard';
import ProfileView from './components/ProfileView';
import Placeholders from './components/Placeholders';

// High-contrast vibrant Neo-Brutalist themes with map modifiers
export interface BrutalistTheme {
  id: string;
  name: string;
  emoji: string;
  bgClass: string;          // Main dashboard body background
  cardClass: string;        // Inner card backgrounds and hard outline/shadows
  accentClass: string;      // Primary interactive widgets
  secondaryClass: string;   // Secondary interactive elements
  badgeClass: string;       // Saturated tag overlays
  textTitleColor: string;   // Bold titles
  mapFilter: string;        // Saturated, comic-book, cartoon map filter
}

export const BRUTAL_THEMES: BrutalistTheme[] = [
  {
    id: 'pop-acid',
    name: 'Pop Acid ⚡',
    emoji: '⚡',
    bgClass: 'bg-[#ffff25]', // Bright acid yellow
    cardClass: 'bg-white text-black border-[3px] border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]',
    accentClass: 'bg-[#ff007f] hover:bg-[#e60072] text-white border-[3px] border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all',
    secondaryClass: 'bg-[#33ffff] hover:bg-[#00e6e6] text-black border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]',
    badgeClass: 'bg-[#33ffff] text-black border border-black px-2 py-0.5 font-black uppercase text-[10px]',
    textTitleColor: 'text-[#ff007f]',
    mapFilter: 'saturate-[2.5] contrast-[1.3] brightness-[0.95] hue-rotate-[10deg]',
  },
  {
    id: 'cyber-lime',
    name: 'Cyber Lime 🦖',
    emoji: '🦖',
    bgClass: 'bg-[#00ff55]', // Bio-hazard lime green
    cardClass: 'bg-[#121212] text-[#00ff55] border-[3px] border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]',
    accentClass: 'bg-[#ff00ff] hover:bg-[#d600d6] text-white border-[3px] border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all',
    secondaryClass: 'bg-[#00ffff] hover:bg-[#00cccc] text-black border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]',
    badgeClass: 'bg-[#ff00ff] text-white border border-black px-2 py-0.5 font-black uppercase text-[10px]',
    textTitleColor: 'text-[#ff00ff]',
    mapFilter: 'saturate-[2.2] contrast-[1.3] brightness-[1.15] hue-rotate-[135deg]',
  },
  {
    id: 'retro-sunrise',
    name: 'Retro Sunset 🌅',
    emoji: '🌅',
    bgClass: 'bg-[#ff4f00]', // Extreme glowing orange
    cardClass: 'bg-[#fffdf5] text-[#330066] border-[3px] border-[#330066] shadow-[5px_5px_0px_0px_#330066]',
    accentClass: 'bg-[#7a04eb] hover:bg-[#6403c2] text-white border-[3px] border-[#330066] shadow-[3px_3px_0px_#330066] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all',
    secondaryClass: 'bg-[#ffd700] hover:bg-[#e6c200] text-black border-2 border-[#330066] shadow-[2px_2px_0px_#330066]',
    badgeClass: 'bg-[#ffd700] text-black border border-[#330066] px-2 py-0.5 font-black uppercase text-[10px]',
    textTitleColor: 'text-[#7a04eb]',
    mapFilter: 'saturate-[2.8] contrast-[1.35] brightness-[0.9] sepia-[0.1] hue-rotate-[300deg]',
  },
  {
    id: 'brutal-candy',
    name: 'Brutal Candy 🍭',
    emoji: '🍭',
    bgClass: 'bg-[#ff66cc]', // Intense pink
    cardClass: 'bg-[#ebffff] text-[#4d004d] border-[3px] border-[#4d004d] shadow-[5px_5px_0px_0px_#4d004d]',
    accentClass: 'bg-[#ff3300] hover:bg-[#cc2900] text-white border-[3px] border-[#4d004d] shadow-[3px_3px_0px_#4d004d] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all',
    secondaryClass: 'bg-[#ffeb3b] hover:bg-[#fdd835] text-black border-2 border-[#4d004d] shadow-[2px_2px_0px_#4d004d]',
    badgeClass: 'bg-[#ffeb3b] text-black border border-[#4d004d] px-2 py-0.5 font-black uppercase text-[10px]',
    textTitleColor: 'text-[#ff3300]',
    mapFilter: 'saturate-[3.0] contrast-[1.4] brightness-[1.0] hue-rotate-[240deg]',
  }
];

export default function App() {
  // Application Data State
  const [issues, setIssues] = useState<Issue[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeUserId, setActiveUserId] = useState<string>('current-user');
  
  // UI Layout State
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [reportingCoords, setReportingCoords] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'leaderboards' | 'stats' | 'profile' | 'missions'>('map');
  const [leaderboardTab, setLeaderboardTab] = useState<'reporters' | 'verifiers' | 'heroes'>('heroes');
  
  // Custom Brutalist Theme State & Collapsed Sidebar
  const [selectedThemeId, setSelectedThemeId] = useState<string>('pop-acid');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  // Filters State
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [severityFilter, setSeverityFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'priority'>('priority');

  // Loading & Notification Feed
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const activeTheme = BRUTAL_THEMES.find(t => t.id === selectedThemeId) || BRUTAL_THEMES[0];

  // Load Data
  const loadData = async () => {
    try {
      const issuesRes = await fetch('/api/issues');
      if (issuesRes.ok) {
        const issuesData = await issuesRes.json();
        setIssues(issuesData);
        
        if (selectedIssue) {
          const updated = issuesData.find((i: Issue) => i.id === selectedIssue.id);
          if (updated) setSelectedIssue(updated);
        }
      }

      const usersRes = await fetch('/api/users');
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
        
        const active = usersData.find((u: User) => u.id === activeUserId);
        if (active) setCurrentUser(active);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeUserId]);

  const showNotification = (message: string, type: 'success' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Submit New Issue
  const handleReportSubmit = async (report: {
    category: IssueCategory;
    severity: IssueSeverity;
    summary: string;
    description: string;
    beforeImage: string;
    latitude: number;
    longitude: number;
    locationName: string;
  }) => {
    try {
      const response = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...report,
          reporterId: currentUser?.id,
          reporterName: currentUser?.name,
          reporterAvatar: currentUser?.avatar,
        }),
      });

      if (response.ok) {
        showNotification('Report registered successfully! +10 Civic Points.');
        setReportingCoords(null);
        loadData();
      } else {
        alert('Failed to submit report. Please try again.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Verify Issue
  const handleVerify = async (type: 'Confirm' | 'Reject' | 'Fixed') => {
    if (!selectedIssue || !currentUser) return;
    try {
      const response = await fetch(`/api/issues/${selectedIssue.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          userName: currentUser.name,
          type,
        }),
      });

      if (response.ok) {
        showNotification(`Verification logged as ${type}! +5 Civic Points.`);
        loadData();
      } else {
        const data = await response.json();
        showNotification(data.error || 'Already verified this issue.', 'info');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Resolve Issue
  const handleResolve = async (proof: { afterImage: string; afterDescription: string }) => {
    if (!selectedIssue || !currentUser) return;
    try {
      const response = await fetch(`/api/issues/${selectedIssue.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolverId: currentUser.id,
          resolverName: currentUser.name,
          afterImage: proof.afterImage,
          afterDescription: proof.afterDescription,
        }),
      });

      if (response.ok) {
        showNotification('Proof submitted! Issue marked RESOLVED. +50 Civic Points.');
        loadData();
      } else {
        alert('Resolution failed to record');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Co-Fund Issue
  const handleFund = async (amount: number) => {
    if (!selectedIssue) return;
    try {
      const response = await fetch(`/api/issues/${selectedIssue.id}/fund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });

      if (response.ok) {
        showNotification(`Co-funding backing of $${amount} received!`);
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Register Volunteer Interest
  const handleVolunteer = async () => {
    if (!selectedIssue) return;
    try {
      const response = await fetch(`/api/issues/${selectedIssue.id}/volunteer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser?.id }),
      });

      if (response.ok) {
        showNotification('Registered interest to volunteer! We will keep you updated.');
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter Issues
  const filteredIssues = issues.filter((issue) => {
    const matchCategory = categoryFilter === 'All' || issue.category === categoryFilter;
    const matchSeverity = severityFilter === 'All' || issue.severity === severityFilter;
    const matchStatus = statusFilter === 'All' || issue.status === statusFilter;
    return matchCategory && matchSeverity && matchStatus;
  }).sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return b.priorityScore - a.priorityScore;
  });

  const unresolvedIssuesCount = issues.filter(i => i.status !== 'Resolved').length;
  const resolvedIssuesCount = issues.filter(i => i.status === 'Resolved').length;

  return (
    <div className={`flex flex-col h-screen w-screen ${activeTheme.bgClass} overflow-hidden font-sans p-2 sm:p-3 md:p-4 transition-colors duration-500`}>
      
      {/* 1. Header / Top Bar (Compact Floating Neo-Brutalist Capsule) */}
      <header className="mb-3 bg-white border-[3px] border-black p-3 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] shrink-0 flex flex-wrap items-center justify-between gap-3 z-20">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-black text-[#ffff25] rounded-lg flex items-center justify-center font-black border-2 border-black rotate-[-3deg] shadow-[2px_2px_0px_0px_rgba(255,0,127,1)]">
            ⚡
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-black text-black tracking-tight font-display flex items-center gap-1.5 leading-none">
              CIVIC HERO <span className="text-[10px] bg-black text-[#ffff25] px-1 rounded uppercase tracking-widest font-black">MVP</span>
            </h1>
            <p className="text-[10px] text-gray-800 font-bold hidden sm:block">Report, Vote & Gamify Your Neighborhood Infrastructure</p>
          </div>
        </div>

        {/* Dynamic Theme Options Row */}
        <div className="flex items-center gap-1 bg-gray-100 border-2 border-black rounded-xl p-1 shrink-0">
          <span className="text-[9px] font-black uppercase text-black px-1.5 hidden md:inline">Themes:</span>
          {BRUTAL_THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => {
                setSelectedThemeId(theme.id);
                showNotification(`Theme set to ${theme.name}!`);
              }}
              title={theme.name}
              className={`w-7 h-7 flex items-center justify-center rounded-lg border-2 border-black text-sm transition-transform active:scale-90 ${
                selectedThemeId === theme.id 
                  ? 'bg-black text-white scale-110 shadow-sm' 
                  : 'bg-white hover:bg-gray-100'
              }`}
            >
              {theme.emoji}
            </button>
          ))}
        </div>

        {/* Session Roleplay Selector and Toggle Menu */}
        <div className="flex items-center gap-2">
          {currentUser && (
            <div className="flex items-center gap-2 bg-[#f0f0f0] border-2 border-black rounded-xl px-2 py-1 text-xs shrink-0 max-w-[170px] sm:max-w-none">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-5 h-5 rounded-md border border-black object-cover"
              />
              <select
                value={activeUserId}
                onChange={(e) => {
                  setActiveUserId(e.target.value);
                  showNotification(`Switched role to ${users.find(u => u.id === e.target.value)?.name}`);
                }}
                className="bg-transparent text-xs font-black text-black border-none focus:outline-none focus:ring-0 cursor-pointer max-w-[90px] sm:max-w-[120px] truncate"
              >
                {users.map((user) => (
                  <option key={user.id} value={user.id} className="text-black font-semibold bg-white">
                    {user.name} (Lvl {user.level})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Collapsible Panel Toggle Button */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="bg-[#00ffcc] hover:bg-[#00e6b8] text-black border-2 border-black font-black text-xs px-2.5 py-1.5 rounded-xl shadow-[3px_3px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center gap-1.5"
            title="Toggle Dashboard Sidebar"
          >
            <span>{sidebarCollapsed ? '📂 SHOW LIST' : '🗺️ COMPACT'}</span>
          </button>
        </div>
      </header>

      {/* 2. Global Feedback Notifications Overlay */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          >
            <div className="px-5 py-3 rounded-2xl bg-white text-black border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] flex items-center gap-2.5 text-xs font-black font-mono">
              <span className="text-sm">🔔</span>
              <span>{notification.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Main Dashboard Body Container */}
      <div className="flex-1 flex overflow-hidden relative gap-3">
        
        {/* LEFT COMPANION SIDEBAR / CONTROL PANEL */}
        <aside 
          className={`shrink-0 flex flex-col h-full z-10 transition-all duration-300 ${
            sidebarCollapsed 
              ? 'w-0 opacity-0 -translate-x-full pointer-events-none' 
              : 'w-full lg:w-[410px] opacity-100 translate-x-0'
          } ${
            // Absolute overlay on small screen so it doesn't crush the map, relative on desktop
            'absolute lg:relative top-0 left-0 h-full w-full lg:w-[410px]'
          }`}
        >
          <div className={`flex flex-col h-full rounded-3xl overflow-hidden border-[3px] border-black shadow-[6px_6px_0px_rgba(0,0,0,1)] bg-white`}>
            
            {/* Active Navigation Tabs */}
            <div className="flex border-b-[3px] border-black bg-gray-50 shrink-0">
              <button
                onClick={() => setActiveTab('map')}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider transition-all border-r-2 border-black flex flex-col items-center gap-1 ${
                  activeTab === 'map' ? 'bg-[#ff007f] text-white' : 'text-black hover:bg-gray-100'
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span>Issues</span>
              </button>
              <button
                onClick={() => setActiveTab('leaderboards')}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider transition-all border-r-2 border-black flex flex-col items-center gap-1 ${
                  activeTab === 'leaderboards' ? 'bg-[#ff007f] text-white' : 'text-black hover:bg-gray-100'
                }`}
              >
                <Trophy className="w-4 h-4" />
                <span>Leaders</span>
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider transition-all border-r-2 border-black flex flex-col items-center gap-1 ${
                  activeTab === 'stats' ? 'bg-[#ff007f] text-white' : 'text-black hover:bg-gray-100'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Analytics</span>
              </button>
              <button
                onClick={() => setActiveTab('missions')}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider transition-all border-r-2 border-black flex flex-col items-center gap-1 ${
                  activeTab === 'missions' ? 'bg-[#ff007f] text-white' : 'text-black hover:bg-gray-100'
                }`}
              >
                <Target className="w-4 h-4" />
                <span>Quests</span>
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider transition-all flex flex-col items-center gap-1 ${
                  activeTab === 'profile' ? 'bg-[#ff007f] text-white' : 'text-black hover:bg-gray-100'
                }`}
              >
                <UserIcon className="w-4 h-4" />
                <span>Profile</span>
              </button>
            </div>

            {/* Tab Views Body Rendering */}
            <div className="flex-1 overflow-hidden relative flex flex-col bg-white">
              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center text-black gap-2">
                  <RefreshCcw className="w-8 h-8 animate-spin text-black" />
                  <span className="text-xs font-black uppercase font-mono">Synchronizing ledger...</span>
                </div>
              ) : (
                <div className="flex-1 overflow-hidden flex flex-col h-full">
                  
                  {/* === TAB 1: REPORTS LISTING & FILTERING === */}
                  {activeTab === 'map' && (
                    <div className="flex-1 flex flex-col overflow-hidden h-full">
                      
                      {/* Filters Header */}
                      <div className="p-4 bg-gray-50 border-b-[3px] border-black space-y-3 shrink-0">
                        <div className="flex items-center justify-between text-xs text-black font-black uppercase font-mono">
                          <span className="flex items-center gap-1.5">
                            <Filter className="w-4 h-4 text-black" />
                            Filter Board ({filteredIssues.length})
                          </span>
                          <span className="text-[10px] bg-black text-[#00ff55] px-2 py-0.5 border border-black rounded-md font-black">
                            {unresolvedIssuesCount} ACTIVE • {resolvedIssuesCount} FIXED
                          </span>
                        </div>

                        {/* Dropdown Select Filters */}
                        <div className="grid grid-cols-3 gap-2 text-[11px]">
                          <div>
                            <label className="text-[9px] font-black text-black uppercase tracking-wider block mb-1">Category</label>
                            <select
                              value={categoryFilter}
                              onChange={(e) => setCategoryFilter(e.target.value)}
                              className="w-full bg-white border-2 border-black text-black py-1.5 px-2 rounded-xl focus:outline-none text-[11px] font-bold"
                            >
                              <option value="All">All Items</option>
                              <option value="Pothole">Pothole</option>
                              <option value="Garbage">Garbage</option>
                              <option value="Water Leakage">Water Leak</option>
                              <option value="Broken Streetlight">Streetlight</option>
                              <option value="Damaged Public Property">Property</option>
                              <option value="Illegal Dumping">Illegal Dump</option>
                              <option value="Road Obstruction">Obstruction</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[9px] font-black text-black uppercase tracking-wider block mb-1">Severity</label>
                            <select
                              value={severityFilter}
                              onChange={(e) => setSeverityFilter(e.target.value)}
                              className="w-full bg-white border-2 border-black text-black py-1.5 px-2 rounded-xl focus:outline-none text-[11px] font-bold"
                            >
                              <option value="All">All Sever</option>
                              <option value="Low">Low</option>
                              <option value="Medium">Medium</option>
                              <option value="High">High</option>
                              <option value="Critical">Critical</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[9px] font-black text-black uppercase tracking-wider block mb-1">Status</label>
                            <select
                              value={statusFilter}
                              onChange={(e) => setStatusFilter(e.target.value)}
                              className="w-full bg-white border-2 border-black text-black py-1.5 px-2 rounded-xl focus:outline-none text-[11px] font-bold"
                            >
                              <option value="All">All Status</option>
                              <option value="Reported">Reported</option>
                              <option value="Verified">Verified</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Resolved">Resolved</option>
                            </select>
                          </div>
                        </div>

                        {/* Sort Toggles */}
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] text-black font-black uppercase font-mono">Sort Order</span>
                          <div className="flex gap-2 text-[10px] font-black font-mono">
                            <button
                              onClick={() => setSortBy('priority')}
                              className={`px-3 py-1 rounded-lg border-2 border-black transition-colors ${
                                sortBy === 'priority' ? 'bg-black text-[#ffff25]' : 'bg-white text-black'
                              }`}
                            >
                              PRIORITY
                            </button>
                            <button
                              onClick={() => setSortBy('newest')}
                              className={`px-3 py-1 rounded-lg border-2 border-black transition-colors ${
                                sortBy === 'newest' ? 'bg-black text-[#ffff25]' : 'bg-white text-black'
                              }`}
                            >
                              NEWEST
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Scrollable Issues List */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                        {filteredIssues.length === 0 ? (
                          <div className="text-center py-20 text-gray-500 font-bold text-xs uppercase">
                            No reports matching current filter criteria.
                          </div>
                        ) : (
                          filteredIssues.map((issue) => (
                            <div
                              key={issue.id}
                              onClick={() => {
                                setSelectedIssue(issue);
                                // On mobile, auto-toggle sidebar when choosing issue details
                                if (window.innerWidth < 1024) {
                                  setSidebarCollapsed(true);
                                }
                              }}
                              className={`p-4 rounded-2xl border-[3px] border-black transition-all duration-200 cursor-pointer text-left flex flex-col gap-2 relative overflow-hidden ${
                                selectedIssue?.id === issue.id
                                  ? 'bg-[#ffffcc] shadow-[3px_3px_0px_rgba(0,0,0,1)]'
                                  : 'bg-white hover:bg-gray-50 shadow-[4px_4px_0px_rgba(0,0,0,1)]'
                              }`}
                            >
                              {/* Priority Badge Background Glow */}
                              <div className="absolute right-0 top-0 bg-black text-[#ffff25] font-mono font-black text-[10px] px-3 py-1 border-l-2 border-b-2 border-black">
                                {issue.priorityScore} PRIO
                              </div>

                              <div className="flex items-center gap-2">
                                <span className={`w-3.5 h-3.5 rounded-full border border-black ${
                                  issue.status === 'Resolved' ? 'bg-[#00ff66]' : issue.severity === 'Critical' ? 'bg-[#ff0055]' : 'bg-[#ffcc00]'
                                }`} />
                                <h4 className="text-xs font-black text-black font-display uppercase tracking-wider">{issue.category}</h4>
                              </div>

                              <p className="text-xs text-black font-medium line-clamp-2 leading-relaxed">
                                {issue.summary}
                              </p>

                              <div className="flex items-center justify-between text-[10px] text-gray-700 pt-2 border-t-2 border-dashed border-gray-200 mt-1 font-mono font-bold">
                                <span className="flex items-center gap-1 truncate max-w-[155px]">
                                  <MapPin className="w-3.5 h-3.5 text-black shrink-0" />
                                  {issue.locationName}
                                </span>
                                <span className="flex items-center gap-1 font-black text-black shrink-0">
                                  <Clock className="w-3.5 h-3.5" />
                                  {new Date(issue.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* === TAB 2: LEADERS === */}
                  {activeTab === 'leaderboards' && (
                    <div className="flex-1 p-4 h-full overflow-y-auto no-scrollbar">
                      <Leaderboard activeTab={leaderboardTab} onTabChange={setLeaderboardTab} />
                    </div>
                  )}

                  {/* === TAB 3: STATISTICS ANALYTICS === */}
                  {activeTab === 'stats' && (
                    <div className="flex-1 p-4 h-full overflow-y-auto no-scrollbar">
                      <StatsDashboard />
                    </div>
                  )}

                  {/* === TAB 4: ACTIVE MISSION QUESTS === */}
                  {activeTab === 'missions' && (
                    <div className="flex-1 p-4 h-full overflow-y-auto no-scrollbar">
                      <Placeholders />
                    </div>
                  )}

                  {/* === TAB 5: ACTIVE PROFILE SUMMARY === */}
                  {activeTab === 'profile' && currentUser && (
                    <div className="flex-1 p-4 h-full overflow-y-auto no-scrollbar">
                      <ProfileView user={currentUser} />
                    </div>
                  )}

                </div>
              )}
            </div>
          </div>
        </aside>

        {/* RIGHT SIDEBAR / FULL SCREEN INTERACTIVE MAP AREA */}
        <main className="flex-1 h-full relative overflow-hidden flex flex-col min-h-0">
          
          {/* Floating Expand Sidebar Button when collapsed */}
          {sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="absolute top-4 right-4 z-20 bg-black text-[#ffff25] border-[3px] border-black font-black text-xs px-3.5 py-2 rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:bg-[#ff007f] hover:text-white transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              📂 OPEN DASHBOARD
            </button>
          )}

          <InteractiveMap
            issues={filteredIssues}
            onSelectIssue={(issue) => {
              setSelectedIssue(issue);
              // Auto collapse on small displays
              if (window.innerWidth < 1024) {
                setSidebarCollapsed(true);
              }
            }}
            onMapClick={(lat, lng, address) => {
              setReportingCoords({ lat, lng, address });
              setSelectedIssue(null);
              // Auto collapse list to show full report form flow
              if (window.innerWidth < 1024) {
                setSidebarCollapsed(true);
              }
            }}
            selectedIssueId={selectedIssue?.id || null}
            cartoonFilterClass={activeTheme.mapFilter}
          />
        </main>

        {/* 4. MODAL / OVERLAYS DRAWER (Neo-Brutalist design frames) */}
        <AnimatePresence>
          {reportingCoords && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 150 }}
              className="absolute top-0 right-0 w-full sm:w-[480px] h-full bg-white z-40 border-l-[4px] border-black shadow-[-8px_0px_0px_rgba(0,0,0,1)]"
            >
              <IssueReportForm
                lat={reportingCoords.lat}
                lng={reportingCoords.lng}
                address={reportingCoords.address}
                onClose={() => setReportingCoords(null)}
                onSubmit={handleReportSubmit}
              />
            </motion.div>
          )}

          {selectedIssue && currentUser && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 150 }}
              className="absolute top-0 right-0 w-full sm:w-[480px] h-full bg-white z-40 border-l-[4px] border-black shadow-[-8px_0px_0px_rgba(0,0,0,1)]"
            >
              <IssueDetailsModal
                issue={selectedIssue}
                currentUser={currentUser}
                onClose={() => setSelectedIssue(null)}
                onVerify={handleVerify}
                onResolve={handleResolve}
                onFund={handleFund}
                onVolunteer={handleVolunteer}
              />
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
