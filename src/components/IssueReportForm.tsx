/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Camera, Upload, MapPin, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { IssueCategory, IssueSeverity } from '../types';

interface IssueReportFormProps {
  lat: number;
  lng: number;
  address: string;
  onClose: () => void;
  onSubmit: (report: {
    category: IssueCategory;
    severity: IssueSeverity;
    summary: string;
    description: string;
    beforeImage: string;
    latitude: number;
    longitude: number;
    locationName: string;
  }) => void;
}

const CATEGORIES: IssueCategory[] = [
  'Pothole',
  'Garbage',
  'Water Leakage',
  'Broken Streetlight',
  'Damaged Public Property',
  'Illegal Dumping',
  'Road Obstruction',
];

const SEVERITIES: IssueSeverity[] = ['Low', 'Medium', 'High', 'Critical'];

export default function IssueReportForm({
  lat,
  lng,
  address,
  onClose,
  onSubmit,
}: IssueReportFormProps) {
  const [dragActive, setDragActive] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState(address);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Form Fields (filled by AI)
  const [category, setCategory] = useState<IssueCategory>('Pothole');
  const [severity, setSeverity] = useState<IssueSeverity>('Medium');
  const [aiSummary, setAiSummary] = useState('');
  const [isAiFilled, setIsAiFilled] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Convert File to Base64
  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setImage(base64);
      triggerAiAnalysis(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Trigger Gemini AI Image Analysis on the server
  const triggerAiAnalysis = async (imageBase64: string) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setIsAiFilled(false);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64,
          description: description,
        }),
      });

      if (!response.ok) {
        throw new Error('AI inspection service temporarily unavailable.');
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setCategory(data.category as IssueCategory);
      setSeverity(data.severity as IssueSeverity);
      setAiSummary(data.summary);
      setIsAiFilled(true);
    } catch (err: any) {
      console.error(err);
      setAnalysisError(err.message || 'Inspection failed');
      // Set reasonable defaults as fallback
      setAiSummary('Failed to run auto-classification. Please select category and severity manually.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) {
      alert('Please upload an image first.');
      return;
    }
    
    onSubmit({
      category,
      severity,
      summary: aiSummary || `Reported ${category} at ${locationName}`,
      description,
      beforeImage: image,
      latitude: lat,
      longitude: lng,
      locationName,
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Form Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
        <div>
          <h2 className="text-lg font-bold text-gray-900 font-display">Report New Civic Issue</h2>
          <p className="text-xs text-gray-500">Initiate AI analysis to register an infrastructure report</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-lg hover:bg-gray-50"
          id="close-report-form-btn"
        >
          ✕
        </button>
      </div>

      {/* Scrollable Form Body */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 bg-gray-50/50">
        
        {/* Step 1: Image Upload */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
            1. Evidence Image <span className="text-rose-500">*</span>
          </label>
          
          {!image ? (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-3 ${
                dragActive
                  ? 'border-indigo-600 bg-indigo-50/50 scale-[0.99]'
                  : 'border-gray-200 bg-white hover:border-gray-400 hover:bg-gray-50'
              }`}
              id="drop-zone"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                className="hidden"
              />
              <div className="p-3 bg-indigo-50 rounded-full text-indigo-600">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  Drag and drop your image here, or <span className="text-indigo-600">browse</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">Supports PNG, JPG, JPEG up to 10MB</p>
              </div>
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden border border-gray-100 bg-white aspect-video shadow-sm">
              <img src={image} alt="Upload preview" className="w-full h-full object-cover" />
              
              {/* Scanning visual overlay when analyzing */}
              {isAnalyzing && (
                <div className="absolute inset-0 bg-indigo-950/40 backdrop-blur-[1px] flex flex-col items-center justify-center text-white gap-3">
                  <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent top-0 animate-[bounce_2s_infinite]"></div>
                  <div className="p-3 bg-white/10 rounded-full backdrop-blur-md animate-pulse">
                    <Sparkles className="w-6 h-6 text-indigo-300" />
                  </div>
                  <p className="text-sm font-semibold tracking-wide">AI Analyzer Inspecting Image...</p>
                  <p className="text-[10px] text-indigo-200">Generating category and severity score</p>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setImage(null);
                  setAiSummary('');
                  setIsAiFilled(false);
                }}
                className="absolute top-3 right-3 bg-gray-900/80 text-white text-xs px-2.5 py-1.5 rounded-lg backdrop-blur-sm hover:bg-gray-900 transition-colors"
              >
                Change Image
              </button>
            </div>
          )}
        </div>

        {/* Step 2: Location Details */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
            2. Report Location
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <MapPin className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-gray-800 shadow-sm"
                placeholder="Locating on map..."
              />
            </div>
          </div>
          <div className="flex justify-between items-center text-[10px] text-gray-400 px-1 font-mono">
            <span>Latitude: {lat.toFixed(6)}</span>
            <span>Longitude: {lng.toFixed(6)}</span>
          </div>
        </div>

        {/* Step 3: Additional User Context */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
            3. Context Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-gray-800 shadow-sm resize-none"
            placeholder="E.g., Deep hole right near the park crosswalk, poses severe risk to bicycle riders at night."
          />
        </div>

        {/* Step 4: AI Analysis Results Card */}
        {image && (
          <div className={`p-4 rounded-xl border transition-all duration-500 ${
            isAnalyzing 
              ? 'bg-indigo-50/50 border-indigo-100 animate-pulse' 
              : isAiFilled 
                ? 'bg-indigo-50/40 border-indigo-100/60 shadow-inner' 
                : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                AI Inspector Analysis
              </span>
              {isAiFilled && (
                <span className="text-[9px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-bold font-mono uppercase tracking-wider">
                  Success
                </span>
              )}
            </div>

            {isAnalyzing ? (
              <div className="flex items-center gap-2 text-xs text-indigo-600 py-3">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating secure reports and categorizing metadata...</span>
              </div>
            ) : analysisError ? (
              <div className="space-y-3">
                <div className="flex gap-2 text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-100">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Gemini API limits or credentials issues.</span>
                    <p className="mt-0.5">We have applied offline heuristic-based rules to safely classify your report.</p>
                  </div>
                </div>
                {/* Editable Fallbacks */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Category</span>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as IssueCategory)}
                      className="w-full text-xs p-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Severity</span>
                    <select
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value as IssueSeverity)}
                      className="w-full text-xs p-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {SEVERITIES.map((sev) => (
                        <option key={sev} value={sev}>{sev}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Editable Metadata derived by AI */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-indigo-900/60 uppercase">Category Choice</span>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as IssueCategory)}
                      className="w-full text-xs p-2 bg-white border border-indigo-200/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-800 font-semibold"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-indigo-900/60 uppercase">Severity Choice</span>
                    <select
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value as IssueSeverity)}
                      className={`w-full text-xs p-2 bg-white border border-indigo-200/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold ${
                        severity === 'Critical' ? 'text-rose-600' : severity === 'High' ? 'text-amber-600' : 'text-slate-700'
                      }`}
                    >
                      {SEVERITIES.map((sev) => (
                        <option key={sev} value={sev}>{sev}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-indigo-900/60 uppercase">AI-Generated Summary</span>
                  <textarea
                    value={aiSummary}
                    onChange={(e) => setAiSummary(e.target.value)}
                    rows={2}
                    className="w-full p-2.5 text-xs bg-white border border-indigo-200/40 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-700 shadow-sm"
                    placeholder="Provide a short summary..."
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!image || isAnalyzing}
            className={`flex-1 py-2 text-sm font-semibold text-white rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              !image || isAnalyzing
                ? 'bg-gray-300 cursor-not-allowed shadow-none'
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-sm hover:shadow-indigo-500/10 hover:shadow-md'
            }`}
            id="submit-report-btn"
          >
            <Camera className="w-4 h-4" />
            Submit Issue Report
          </button>
        </div>
      </form>
    </div>
  );
}
