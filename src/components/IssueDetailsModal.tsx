/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  CheckCircle, 
  ShieldCheck, 
  Users, 
  Coins, 
  CheckCircle2, 
  XCircle, 
  Flame, 
  Clock, 
  MapPin, 
  Camera, 
  ArrowRight,
  Sparkles,
  HeartHandshake
} from 'lucide-react';
import { Issue, User } from '../types';

interface IssueDetailsModalProps {
  issue: Issue;
  currentUser: User;
  onClose: () => void;
  onVerify: (type: 'Confirm' | 'Reject' | 'Fixed') => void;
  onResolve: (proof: { afterImage: string; afterDescription: string }) => void;
  onFund: (amount: number) => void;
  onVolunteer: () => void;
}

export default function IssueDetailsModal({
  issue,
  currentUser,
  onClose,
  onVerify,
  onResolve,
  onFund,
  onVolunteer,
}: IssueDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'actions' | 'future'>('info');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [volunteerLoading, setVolunteerLoading] = useState(false);
  const [fundAmount, setFundAmount] = useState('25');
  const [fundSuccess, setFundSuccess] = useState(false);

  // Resolution Workflow State
  const [isResolving, setIsResolving] = useState(false);
  const [resolutionPhoto, setResolutionPhoto] = useState<string | null>(null);
  const [resolutionDesc, setResolutionDesc] = useState('');
  const [resolveLoading, setResolveLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasAlreadyVerified = issue.verifications.some((v) => v.userId === currentUser.uid);

  const handleVerification = async (type: 'Confirm' | 'Reject' | 'Fixed') => {
    setVerifyLoading(true);
    try {
      await onVerify(type);
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleVolunteer = async () => {
    setVolunteerLoading(true);
    try {
      await onVolunteer();
    } finally {
      setVolunteerLoading(false);
    }
  };

  const handleFund = () => {
    const amt = parseFloat(fundAmount);
    if (isNaN(amt) || amt <= 0) return;
    onFund(amt);
    setFundSuccess(true);
    setTimeout(() => setFundSuccess(false), 3000);
  };

  const handleResolutionPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        setResolutionPhoto(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResolutionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionPhoto) return;
    setResolveLoading(true);
    try {
      await onResolve({
        afterImage: resolutionPhoto,
        afterDescription: resolutionDesc,
      });
      setIsResolving(false);
      setResolutionPhoto(null);
      setResolutionDesc('');
    } finally {
      setResolveLoading(false);
    }
  };

  // Status Badge Colors
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Resolved':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'In Progress':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'Verified':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default:
        return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  // Severity Colors
  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'High':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      
      {/* Hero Header with Image */}
      <div className="relative h-48 sm:h-56 bg-gray-900 shrink-0">
        <img 
          src={issue.beforeImage} 
          alt={issue.category} 
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-gray-950/35 to-transparent"></div>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-gray-950/60 hover:bg-gray-950 text-white p-1.5 rounded-full backdrop-blur-md transition-all border border-white/10"
        >
          ✕
        </button>

        {/* Floating Top Indicators */}
        <div className="absolute top-4 left-4 flex gap-1.5">
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border backdrop-blur-sm ${getStatusStyle(issue.status)}`}>
            {issue.status}
          </span>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border backdrop-blur-sm ${getSeverityStyle(issue.severity)}`}>
            {issue.severity}
          </span>
        </div>

        {/* Floating Bottom Info */}
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <p className="text-[10px] uppercase font-bold tracking-widest text-indigo-300 font-mono">
            ID: {issue.id}
          </p>
          <h1 className="text-xl font-bold font-display truncate mt-0.5">
            {issue.category}
          </h1>
          <p className="text-xs text-gray-200 flex items-center gap-1 mt-1 truncate">
            <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            {issue.locationName}
          </p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-gray-100 shrink-0 bg-white">
        <button
          onClick={() => { setActiveTab('info'); setIsResolving(false); }}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
            activeTab === 'info'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/10'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => { setActiveTab('actions'); setIsResolving(false); }}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
            activeTab === 'actions'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/10'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Verify & Resolve
        </button>
        <button
          onClick={() => { setActiveTab('future'); setIsResolving(false); }}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
            activeTab === 'future'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/10'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Co-Fund & Volunteer
        </button>
      </div>

      {/* Tab Contents - Scrollable */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-gray-50/50">
        
        {/* ==================== TAB 1: OVERVIEW ==================== */}
        {activeTab === 'info' && (
          <div className="space-y-4">
            
            {/* Priority Scoring Banner */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl p-4 flex items-center justify-between shadow-md border border-indigo-900/40">
              <div className="space-y-1">
                <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-300 font-mono">
                  Priority Scoring Engine
                </span>
                <p className="text-2xl font-black font-display flex items-baseline gap-1">
                  {issue.priorityScore}
                  <span className="text-xs font-semibold text-indigo-300">/ 100 PTS</span>
                </p>
                <p className="text-[10px] text-gray-400">
                  Computed dynamically using severity, trust and age metrics.
                </p>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-amber-400">
                <Flame className="w-6 h-6 animate-pulse" />
              </div>
            </div>

            {/* AI Summary Card */}
            <div className="bg-indigo-50/30 border border-indigo-100/40 p-3.5 rounded-xl space-y-1.5 shadow-sm">
              <div className="flex items-center gap-1 text-xs font-bold text-indigo-900">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                AI Generated Inspector Summary
              </div>
              <p className="text-xs text-gray-600 leading-relaxed italic">
                "{issue.summary}"
              </p>
            </div>

            {/* User Details */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Report Context</h3>
              <p className="text-sm text-gray-700 bg-white p-3.5 rounded-xl border border-gray-100 leading-relaxed shadow-sm">
                {issue.description || "No context description provided by reporter."}
              </p>
            </div>

            {/* Resolution Display (Side-by-Side if resolved) */}
            {issue.status === 'Resolved' && issue.afterImage && (
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Resolution Evidence</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg overflow-hidden border border-gray-200 relative aspect-square bg-gray-100 shadow-sm">
                    <img src={issue.beforeImage} alt="Before" className="w-full h-full object-cover" />
                    <span className="absolute bottom-2 left-2 bg-rose-600/90 text-white text-[9px] font-bold px-2 py-0.5 rounded">BEFORE</span>
                  </div>
                  <div className="rounded-lg overflow-hidden border border-gray-200 relative aspect-square bg-gray-100 shadow-sm">
                    <img src={issue.afterImage} alt="After" className="w-full h-full object-cover" />
                    <span className="absolute bottom-2 left-2 bg-emerald-600/90 text-white text-[9px] font-bold px-2 py-0.5 rounded">RESOLVED</span>
                  </div>
                </div>

                <div className="bg-emerald-50/30 border border-emerald-100/50 p-3.5 rounded-xl space-y-1.5">
                  <p className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    Resolved by {issue.resolverName}
                  </p>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {issue.afterDescription || "Issue marked resolved successfully."}
                  </p>
                </div>
              </div>
            )}

            {/* Reporter Profile Anchor */}
            <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
              <img src={issue.reporterAvatar} alt={issue.reporterName} className="w-9 h-9 rounded-full border object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Reported By</p>
                <p className="text-xs font-bold text-gray-800 truncate">{issue.reporterName}</p>
              </div>
              <span className="text-[10px] font-medium text-gray-500 flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                {new Date(issue.createdAt).toLocaleDateString()}
              </span>
            </div>

            {/* Platform Stats Integration */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm text-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Trust Score</p>
                <p className="text-xl font-black text-indigo-600 mt-1">{issue.trustScore}%</p>
                <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${issue.trustScore}%` }} />
                </div>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm text-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Verifications</p>
                <p className="text-xl font-black text-gray-800 mt-1">{issue.verifications.length}</p>
                <p className="text-[10px] text-gray-400 mt-2">Active confirmations</p>
              </div>
            </div>

          </div>
        )}

        {/* ==================== TAB 2: VERIFICATION & RESOLUTION ==================== */}
        {activeTab === 'actions' && (
          <div className="space-y-4">
            
            {/* Verification Section */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                1. Community Verification
              </div>
              
              <p className="text-xs text-gray-500 leading-relaxed">
                Trust scores increment dynamically with confirmation. Verify this report to prevent municipal spam and optimize local resource scheduling.
              </p>

              {hasAlreadyVerified ? (
                <div className="p-3 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold text-center border border-indigo-100/50">
                  ✓ You have verified this report. Thank you for your contribution!
                </div>
              ) : issue.status === 'Resolved' ? (
                <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold text-center border border-emerald-100/50">
                  This issue is already resolved. Verification is closed.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    onClick={() => handleVerification('Confirm')}
                    disabled={verifyLoading}
                    className="py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Confirm
                  </button>
                  <button
                    onClick={() => handleVerification('Reject')}
                    disabled={verifyLoading}
                    className="py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center justify-center gap-1 border border-gray-200"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reject
                  </button>
                  <button
                    onClick={() => handleVerification('Fixed')}
                    disabled={verifyLoading}
                    className="py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center justify-center gap-1 border border-gray-200"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    Fixed
                  </button>
                </div>
              )}
            </div>

            {/* Resolution section */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 uppercase tracking-wider">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                2. Resolution Workflows
              </div>

              {issue.status === 'Resolved' ? (
                <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg text-xs leading-relaxed space-y-1">
                  <span className="font-bold flex items-center gap-1 text-emerald-900">
                    ✓ Status: Fully Resolved
                  </span>
                  <p>Points have been successfully credited to active community participants. Visual maps updated in real time.</p>
                </div>
              ) : !isResolving ? (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Have you personally resolved this issue, or do you have photo evidence that the repair is complete? Upload resolution proof to earn 50 Hero points!
                  </p>
                  <button
                    onClick={() => setIsResolving(true)}
                    className="w-full py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-600/10"
                  >
                    <Camera className="w-4 h-4" />
                    Submit Resolution Proof
                  </button>
                </div>
              ) : (
                <form onSubmit={handleResolutionSubmit} className="space-y-3.5 pt-1">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">After Image Proof *</span>
                    {!resolutionPhoto ? (
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border border-dashed border-gray-200 bg-gray-50 hover:bg-gray-100/50 rounded-lg py-5 text-center cursor-pointer flex flex-col items-center justify-center gap-1.5"
                      >
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          accept="image/*" 
                          onChange={handleResolutionPhoto} 
                          className="hidden" 
                        />
                        <Camera className="w-5 h-5 text-gray-400" />
                        <span className="text-xs font-semibold text-gray-600">Select Resolution Photo</span>
                      </div>
                    ) : (
                      <div className="relative rounded-lg overflow-hidden aspect-video border bg-gray-100">
                        <img src={resolutionPhoto} alt="Resolution proof" className="w-full h-full object-cover" />
                        <button 
                          type="button" 
                          onClick={() => setResolutionPhoto(null)}
                          className="absolute top-2 right-2 bg-gray-900/80 hover:bg-gray-900 text-white text-[10px] px-2 py-1 rounded"
                        >
                          Change
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Resolution Description (Optional)</span>
                    <textarea
                      value={resolveLoading ? 'Uploading proof and awarding reputation...' : resolutionDesc}
                      onChange={(e) => setResolutionDesc(e.target.value)}
                      disabled={resolveLoading}
                      rows={2}
                      className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      placeholder="Explain how this issue was resolved..."
                    />
                  </div>

                  <div className="flex gap-2 text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => setIsResolving(false)}
                      className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!resolutionPhoto || resolveLoading}
                      className={`flex-1 py-2 text-white rounded-lg font-bold flex items-center justify-center gap-1 ${
                        !resolutionPhoto || resolveLoading ? 'bg-gray-300' : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                    >
                      Submit & Resolve
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Verifications Log Feed */}
            {issue.verifications.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Activity Log</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto no-scrollbar">
                  {issue.verifications.map((v, i) => (
                    <div key={i} className="bg-white px-3.5 py-2 rounded-lg border border-gray-100 flex items-center justify-between text-xs shadow-sm">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${v.type === 'Confirm' ? 'bg-indigo-600' : v.type === 'Reject' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                        <span className="font-semibold text-gray-700">{v.userName}</span>
                      </div>
                      <span className="text-gray-400 text-[10px]">{v.type}ed</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* ==================== TAB 3: CO-FUND & VOLUNTEER (PLACEHOLDERS) ==================== */}
        {activeTab === 'future' && (
          <div className="space-y-4">
            
            {/* Community Crowdfunding Campaign (Durable API wireup!) */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 uppercase tracking-wider">
                <Coins className="w-4 h-4 text-amber-500" />
                Community Funding Goal
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-gray-500">Progress Tracker</span>
                  <span className="text-gray-800">${issue.fundingCurrent || 0} / ${issue.fundingGoal || 100} USD</span>
                </div>
                {/* Progress Bar */}
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-amber-500 h-full rounded-full transition-all duration-1000" 
                    style={{ width: `${Math.min(100, (((issue.fundingCurrent || 0) / (issue.fundingGoal || 100)) * 100))}%` }} 
                  />
                </div>
              </div>

              {fundSuccess ? (
                <div className="p-3 bg-amber-50 text-amber-800 border border-amber-100 rounded-lg text-xs font-semibold text-center animate-bounce">
                  🎉 Contribution recorded! Thank you for backing this repair.
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-4 gap-1.5">
                    {['10', '25', '50', '100'].map((val) => (
                      <button
                        key={val}
                        onClick={() => setFundAmount(val)}
                        className={`py-1.5 text-xs rounded-lg font-bold border transition-colors ${
                          fundAmount === val
                            ? 'bg-amber-500 border-amber-500 text-white'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        ${val}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleFund}
                    disabled={issue.status === 'Resolved'}
                    className={`w-full py-2.5 text-xs font-bold text-white rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm ${
                      issue.status === 'Resolved'
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/10'
                    }`}
                  >
                    <span>Contribute Co-Funding</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Volunteer Program (Durable API wireup!) */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 uppercase tracking-wider">
                <Users className="w-4 h-4 text-emerald-600" />
                Active Volunteer Network
              </div>

              <div className="flex items-center justify-between p-3 bg-emerald-50/20 border border-emerald-100/50 rounded-xl">
                <div>
                  <p className="text-xs font-semibold text-emerald-900">Registered Volunteers</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Citizens mobilised for cleanup action</p>
                </div>
                <span className="text-2xl font-black text-emerald-700 font-mono">
                  {issue.volunteerCount || 0}
                </span>
              </div>

              <p className="text-xs text-gray-500 leading-relaxed">
                Join our volunteer network to schedule cleanups or repairs collaboratively.
              </p>

              <button
                onClick={handleVolunteer}
                disabled={volunteerLoading || issue.status === 'Resolved'}
                className={`w-full py-2.5 text-xs font-bold text-white rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm ${
                  issue.status === 'Resolved'
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/10'
                }`}
                id="volunteer-btn"
              >
                <HeartHandshake className="w-4 h-4 animate-pulse" />
                <span>Register Volunteer Interest</span>
              </button>
            </div>

          </div>
        )}

      </div>

      {/* Detail Footer */}
      <div className="p-4 bg-gray-50 border-t border-gray-100 text-[10px] text-gray-400 font-medium text-center font-mono shrink-0">
        CIVIC REPUTATION MULTIPLIER ACTIVE • DATA STORE SYNC SECURE
      </div>

    </div>
  );
}
