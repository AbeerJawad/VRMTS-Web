import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import { API_BASE_URL as getApiBaseUrl } from '@/lib/api';
import { Layers, Upload, FileText, Box, Save, Wand2 } from 'lucide-react';
import type { LabType } from '@/lib/moduleAssets';


import {
  getModuleAssetsMapping,
  setModuleAssetsMapping,
} from '@/lib/moduleAssets';

const API_BASE_URL = getApiBaseUrl;

type ModelOption = { key: string; label: string };

// Must match files under frontend/public/models/*.fbx
const MODEL_OPTIONS: ModelOption[] = [
  { key: 'AnatomyModel_Mesh.fbx', label: 'AnatomyModel_Mesh.fbx' },
  { key: 'SkeletalSystem100.fbx', label: 'SkeletalSystem100.fbx' },
  { key: 'Saggittal.fbx', label: 'Saggittal.fbx (Lab 1 plane)' },
  { key: 'transverse.fbx', label: 'transverse.fbx (Lab 1 plane)' },
  { key: 'coronal.fbx', label: 'coronal.fbx (Lab 1 plane)' },
];

function labRoute(labType: LabType) {
  return labType === 'lab1' ? '/lab1explore' : '/lab2explore';
}

export default function FacultyCreateModulePrototype() {
  const navigate = useNavigate();

  const [moduleId, setModuleId] = useState<string>('1');
  const [labType, setLabType] = useState<LabType>('lab1');
  const [modelKey, setModelKey] = useState<string>(MODEL_OPTIONS[0].key);

  const [manualPdfObjectUrl, setManualPdfObjectUrl] = useState<string>('');
  const [manualFileName, setManualFileName] = useState<string>('');

  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  const [savedPreview, setSavedPreview] = useState(false);

  const canSave = useMemo(() => {
    return !!moduleId.trim() && !!modelKey.trim() && !!manualPdfObjectUrl;
  }, [moduleId, modelKey, manualPdfObjectUrl]);

  const handlePdfChange = (file: File | null) => {
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please select a PDF file.');
      return;
    }

    // Frontend-only prototype: store blob URL for current session
    const url = URL.createObjectURL(file);
    setManualPdfObjectUrl(url);
    setManualFileName(file.name);
  };

  const handleSave = () => {
    if (!canSave) {
      alert('Select module id, model, and a PDF manual first.');
      return;
    }

    // No DB changes: store mapping in localStorage
    const mapping = getModuleAssetsMapping();

    mapping[moduleId] = {
      labType,
      modelKey,
      manualPdfUrl: manualPdfObjectUrl,
    };

    // Note: the stored key is manualPdfUrl but our type is manualPdfUrl.
    setModuleAssetsMapping(mapping as any);

    setSavedPreview(true);

    // Navigate to the correct lab display route.
    navigate(`${labRoute(labType)}?moduleId=${encodeURIComponent(moduleId)}`);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold tracking-tight">Faculty Module Creation (Prototype)</h1>
          <p className="text-sm text-neutral-400 mt-2">
            Frontend-only: saves module ↔ model ↔ manual mapping into localStorage. No database changes.
          </p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-5">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">Module ID</label>
              <input
                value={moduleId}
                onChange={(e) => setModuleId(e.target.value)}
                className="mt-2 w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm"
                placeholder="e.g., 1"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">Lab Type</label>
              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setLabType('lab1')}
                  className={`px-4 py-2 rounded-lg border text-sm font-bold transition-all ${
                    labType === 'lab1' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  Lab 1
                </button>
                <button
                  type="button"
                  onClick={() => setLabType('lab2')}
                  className={`px-4 py-2 rounded-lg border text-sm font-bold transition-all ${
                    labType === 'lab2' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  Lab 2
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">Module Title (display only)</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-2 w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm"
                placeholder="e.g., Skeletal System Lab"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">Description (display only)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-2 w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm min-h-[90px]"
                placeholder="Short description..."
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">Select a 3D Model (from /public/models)</label>
              <div className="mt-2 flex items-center gap-3">
                <Box className="w-4 h-4 text-neutral-500" />
                <select
                  value={modelKey}
                  onChange={(e) => setModelKey(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm"
                >
                  {MODEL_OPTIONS.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">Upload Lab Manual PDF</label>
              <div className="mt-2 flex items-center justify-between gap-4">
                <label
                  className="flex-1 cursor-pointer flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm hover:bg-neutral-900 transition-colors"
                >
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>{manualFileName ? `Selected: ${manualFileName}` : 'Choose PDF...'}</span>
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    className="hidden"
                    onChange={(e) => handlePdfChange(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>

              {manualPdfObjectUrl && (
                <div className="mt-3">
                  <a
                    href={manualPdfObjectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-400 hover:text-emerald-300"
                  >
                    <FileText className="w-4 h-4" />
                    Preview PDF
                  </a>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  // Prototype: reset
                  setManualPdfObjectUrl('');
                  setManualFileName('');
                  setSavedPreview(false);
                }}
                className="flex-1 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-sm font-bold"
              >
                Reset
              </button>

              <button
                type="button"
                disabled={!canSave}
                onClick={handleSave}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-black uppercase tracking-widest transition-all ${
                  canSave ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-neutral-950 hover:from-cyan-400 hover:to-teal-400' : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                }`}
              >
                <Save className="inline-block w-4 h-4 mr-2" />
                Save mapping
              </button>
            </div>

            {savedPreview && (
              <div className="mt-1 text-xs text-neutral-400">
                Saved. Open the lab route:
                <div className="mt-1 text-neutral-200 font-bold">
                  {labRoute(labType)}?moduleId={moduleId}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 text-xs text-neutral-500 leading-relaxed">
          <Wand2 className="inline w-4 h-4 mr-2 text-neutral-400" />
          This is a UI prototype only. Uploaded PDFs are stored as in-memory blob URLs and may not persist after refresh.
        </div>
      </div>
    </div>
  );
}

