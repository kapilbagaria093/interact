/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { LayoutDashboard, CheckSquare, RefreshCcw, AlertTriangle, Users2, Activity, Heart } from 'lucide-react';
import { CommunityStats } from '../types';

export default function StatsDashboard() {
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats');
        if (res.ok) {
          const json = await res.json();
          setStats(json);
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading || !stats) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm flex flex-col items-center justify-center text-gray-400 gap-3">
        <RefreshCcw className="w-6 h-6 animate-spin text-indigo-600" />
        <span className="text-xs">Consolidating civic metrics...</span>
      </div>
    );
  }

  // Draw pure SVG Monthly Timeline
  const padding = 40;
  const chartWidth = 400;
  const chartHeight = 150;
  
  // Find max values for scale
  const maxVal = Math.max(...stats.monthlyResolved.map(d => Math.max(d.reported, d.resolved)), 10);
  
  // Project coordinates
  const pointsReported = stats.monthlyResolved.map((d, index) => {
    const x = padding + (index * (chartWidth - padding * 2)) / (stats.monthlyResolved.length - 1);
    const y = chartHeight - padding - (d.reported / maxVal) * (chartHeight - padding * 2);
    return { x, y, label: d.month, val: d.reported };
  });

  const pointsResolved = stats.monthlyResolved.map((d, index) => {
    const x = padding + (index * (chartWidth - padding * 2)) / (stats.monthlyResolved.length - 1);
    const y = chartHeight - padding - (d.resolved / maxVal) * (chartHeight - padding * 2);
    return { x, y, val: d.resolved };
  });

  const reportedPathStr = pointsReported.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const resolvedPathStr = pointsResolved.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col h-full overflow-hidden">
      
      {/* Header */}
      <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-emerald-950/5 to-transparent shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-800 font-display">Community Impact Dashboard</h2>
            <p className="text-xs text-gray-500">Live indicators representing real collaborative contributions</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-gray-50/30">
        
        {/* Core KPIs Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-5">
              <CheckSquare className="w-16 h-16 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Resolved Issues</p>
              <h4 className="text-2xl font-black text-emerald-600 mt-1">{stats.resolvedIssues}</h4>
            </div>
            <span className="text-[9px] text-gray-400 mt-2 font-medium">
              {Math.round((stats.resolvedIssues / (stats.totalIssues || 1)) * 100)}% Resolution Rate
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-5">
              <AlertTriangle className="w-16 h-16 text-amber-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Active Reports</p>
              <h4 className="text-2xl font-black text-amber-500 mt-1">{stats.activeIssues}</h4>
            </div>
            <span className="text-[9px] text-gray-400 mt-2 font-medium">Pending action or in-progress</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-5">
              <Users2 className="w-16 h-16 text-indigo-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Verifications Count</p>
              <h4 className="text-2xl font-black text-indigo-600 mt-1">{stats.verificationCount}</h4>
            </div>
            <span className="text-[9px] text-gray-400 mt-2 font-medium">Community confidence votes</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden flex flex-col justify-between bg-gradient-to-br from-white to-rose-50/20">
            <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-5">
              <Heart className="w-16 h-16 text-rose-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Total Hero Impact</p>
              <h4 className="text-2xl font-black text-rose-500 mt-1">{stats.communityImpactScore}</h4>
            </div>
            <span className="text-[9px] text-gray-400 mt-2 font-medium">Consolidated civic score</span>
          </div>
        </div>

        {/* Chart 1: Curved Monthly Timeline using Pure SVG */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
          <div className="flex items-center gap-1 text-xs font-bold text-gray-700 uppercase tracking-wider">
            <Activity className="w-4 h-4 text-indigo-500" />
            Monthly Activity Trend
          </div>

          <div className="relative w-full overflow-hidden">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto">
              {/* Grids */}
              <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} stroke="#f3f4f6" strokeWidth={1} />
              <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="#e5e7eb" strokeWidth={1.5} />
              
              {/* Paths */}
              <path d={reportedPathStr} fill="none" stroke="#6366f1" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
              <path d={resolvedPathStr} fill="none" stroke="#10b981" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

              {/* Data Points */}
              {pointsReported.map((p, i) => (
                <g key={`rp-${i}`}>
                  <circle cx={p.x} cy={p.y} r={3.5} fill="#6366f1" stroke="#ffffff" strokeWidth={1.5} />
                  {/* Month Label */}
                  <text x={p.x} y={chartHeight - 15} textAnchor="middle" fontSize="9" fill="#9ca3af" fontFamily="monospace">
                    {p.label}
                  </text>
                  {/* Hover Values */}
                  <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="8" fontWeight="bold" fill="#4338ca" fontFamily="monospace">
                    {p.val}
                  </text>
                </g>
              ))}

              {pointsResolved.map((p, i) => (
                <g key={`rs-${i}`}>
                  <circle cx={p.x} cy={p.y} r={3.5} fill="#10b981" stroke="#ffffff" strokeWidth={1.5} />
                  {/* Hover Values */}
                  <text x={p.x} y={p.y + 12} textAnchor="middle" fontSize="8" fontWeight="bold" fill="#047857" fontFamily="monospace">
                    {p.val}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          {/* Chart Legends */}
          <div className="flex items-center justify-center gap-4 text-[10px] font-bold text-gray-500 font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-indigo-500 block" />
              <span>REPORTED ISSUES</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-emerald-500 block" />
              <span>RESOLVED ISSUES</span>
            </div>
          </div>
        </div>

        {/* Chart 2: Category Bar Breakdown */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
            Issue Categorization Distribution
          </h3>
          <div className="space-y-2.5">
            {stats.categoryStats.map((item, index) => {
              const maxCount = Math.max(...stats.categoryStats.map(s => s.count), 1);
              const percentage = (item.count / maxCount) * 100;
              
              return (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-gray-700">
                    <span>{item.category}</span>
                    <span className="font-mono text-gray-500">{item.count} reports</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="p-4 bg-gray-50 border-t border-gray-100 text-[10px] text-gray-400 font-mono text-center shrink-0 uppercase tracking-wide">
        Civic Analytics Platform • Secured Sync Active
      </div>

    </div>
  );
}
