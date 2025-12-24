'use client';

import React, { useState, useEffect, useRef } from 'react';
import { HandwritingSettings, CANVAS_WIDTH, CANVAS_HEIGHT } from '@/lib/types';
import { renderPage } from '@/lib/renderer';
import { Upload, FileText, Download, Loader2, AlertCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const API_URL = 'http://localhost:3001/api';

const DEFAULT_SETTINGS: HandwritingSettings = {
    text: "Hello! Upload a text, PDF, or Word file to convert it into messy handwriting.\n\nOr type directly here to test the preview...",
    fontFamily: "Caveat",
    fontSize: 24,
    lineSpacing: 1.5,
    letterSpacing: 2,
    wordSpacing: 5,
    color: "#000000",
    paperPattern: 'lined',
    paperColor: 'white',
    margins: { top: 50, right: 40, bottom: 50, left: 60 },
    randomization: {
        baselineJitter: 4,
        sizeJitter: 0.1,
        rotationJitter: 2,
        inkOpacity: 0.8,
        errorRate: 0.02,
        strokeWidth: 0.5,
    },
};

export default function Home() {
    const [settings, setSettings] = useState<HandwritingSettings>(DEFAULT_SETTINGS);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // App State
    const [textId, setTextId] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [jobId, setJobId] = useState<string | null>(null);
    const [jobStatus, setJobStatus] = useState<'idle' | 'queued' | 'active' | 'completed' | 'failed'>('idle');
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Load font
        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=Architects+Daughter&family=Caveat:wght@400..700&family=Gloria+Hallelujah&family=Handlee&family=Homemade+Apple&family=Indie+Flower&family=Kalam&family=Nothing+You+Could+Do&family=Patrick+Hand&family=Shadows+Into+Light&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);

        // Quick poll for job status if active
        let interval: NodeJS.Timeout;
        if (jobId && (jobStatus === 'queued' || jobStatus === 'active')) {
            interval = setInterval(checkJob, 1000);
        }
        return () => clearInterval(interval);
    }, [jobId, jobStatus]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = CANVAS_WIDTH * dpr;
        canvas.height = CANVAS_HEIGHT * dpr;
        canvas.style.width = `${CANVAS_WIDTH}px`;
        canvas.style.height = `${CANVAS_HEIGHT}px`;
        ctx.scale(dpr, dpr);

        const fontToLoad = `${settings.fontSize}px "${settings.fontFamily}"`;
        document.fonts.load(fontToLoad).then(() => {
            renderPage(ctx, settings.text, settings);
        }).catch(() => {
            // Fallback render if load fails (or just render anyway)
            renderPage(ctx, settings.text, settings);
        });

    }, [settings]);

    const updateSetting = (key: keyof HandwritingSettings, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const updateNested = (parent: 'randomization' | 'margins', key: string, value: number) => {
        setSettings(prev => ({
            ...prev,
            [parent]: {
                ...prev[parent],
                [key]: value
            }
        }));
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset file input to allow re-uploading the same file
        e.target.value = '';

        // Validate file size (10MB max)
        const MAX_SIZE = 10 * 1024 * 1024; // 10MB
        if (file.size > MAX_SIZE) {
            setError('File is too large. Maximum size is 10MB.');
            return;
        }

        // Validate file type
        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'
        ];

        if (!allowedTypes.includes(file.type)) {
            setError('Unsupported file type. Please upload PDF, DOCX, or TXT files.');
            return;
        }

        setIsUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            console.log(`Uploading file: ${file.name} (${file.size} bytes)`);

            const res = await fetch(`${API_URL}/upload`, {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                // Try to get error message from response
                const errorData = await res.json().catch(() => ({ error: 'Upload failed' }));
                throw new Error(errorData.error || `Upload failed with status ${res.status}`);
            }

            const data = await res.json();

            if (data.error) {
                throw new Error(data.error);
            }

            if (!data.success || !data.textId) {
                throw new Error('Invalid response from server');
            }

            console.log(`Upload successful: ${data.totalLength} characters extracted`);

            setTextId(data.textId);
            updateSetting('text', data.preview); // Show preview

            // Clear any previous errors
            setError(null);

        } catch (err: any) {
            console.error('Upload error:', err);
            const errorMessage = err.message || 'Upload failed. Please try again.';
            setError(errorMessage);

            // Show user-friendly error messages
            if (errorMessage.includes('Failed to fetch')) {
                setError('Cannot connect to server. Please check if the server is running.');
            } else if (errorMessage.includes('empty')) {
                setError('The file appears to be empty or contains no extractable text.');
            } else if (errorMessage.includes('only images')) {
                setError('PDF contains only images. Please upload a PDF with selectable text.');
            }
        } finally {
            setIsUploading(false);
        }
    };

    const generatePDF = async () => {
        if (!textId) {
            setError("Please upload a file to generate the full PDF.");
            return;
        }

        try {
            setJobStatus('queued');
            const res = await fetch(`${API_URL}/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ textId, settings })
            });
            const data = await res.json();
            setJobId(data.jobId);
        } catch (err) {
            setError("Failed to start generation");
            setJobStatus('idle');
        }
    };

    const checkJob = async () => {
        if (!jobId) return;
        try {
            const res = await fetch(`${API_URL}/jobs/${jobId}`);
            const data = await res.json();
            setJobStatus(data.state);
            setProgress(data.progress || 0);

            if (data.state === 'failed') {
                setError("Generation failed on server.");
            }
        } catch {
            // ignore
        }
    };

    const downloadPDF = () => {
        if (!jobId) return;
        window.open(`${API_URL}/jobs/${jobId}/download`, '_blank');
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50">
            <Navbar />

            {/* Floating Live Preview Badge - Moved here to overlap Navbar without being clipped */}
            <div className="absolute top-[50px] left-1/2 -translate-x-1/2 z-[60] flex items-center gap-4 pointer-events-none">
                <div className="bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-neutral-200/50 text-[10px] font-bold text-black shadow-lg shadow-black/5 flex items-center gap-2.5 ring-1 ring-black/5 pointer-events-auto">
                    <div className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor] ${isUploading ? 'bg-yellow-400 text-yellow-400 animate-pulse' : 'bg-green-500 text-green-500'}`}></div>
                    <span className="tracking-wide">LIVE PREVIEW</span>
                </div>
            </div>

            {/* MAIN CONTENT WRAPPER */}
            <div className="flex-1 flex overflow-hidden">

                {/* LEFT: Sidebar Controls */}
                <aside className="w-[420px] bg-[#f8fafc] border-r border-neutral-200 flex flex-col h-full shadow-xl z-20 relative">

                    {/* Scrollable Settings Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className="p-6 space-y-10">

                            {/* SECTION 1: INPUT */}
                            <section className="space-y-4">
                                <div className="flex items-end justify-between border-b border-neutral-200 pb-2">
                                    <h2 className="text-xs font-black uppercase tracking-widest text-neutral-500">01. Source Content</h2>
                                </div>

                                <div className="bg-gray-100/50 rounded-2xl p-1.5 flex gap-1.5 border border-neutral-200/50">
                                    <button
                                        className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 ${!textId
                                            ? 'bg-white text-black shadow-sm ring-1 ring-black/5'
                                            : 'text-neutral-500 hover:text-black hover:bg-white/50'
                                            }`}
                                        onClick={() => setTextId(null)}
                                    >
                                        Type / Paste
                                    </button>
                                    <button
                                        className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${textId
                                            ? 'bg-white text-black shadow-sm ring-1 ring-black/5'
                                            : 'text-neutral-500 hover:text-black hover:bg-white/50'
                                            }`}
                                        onClick={() => document.getElementById('file-upload')?.click()}
                                    >
                                        {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                                        {textId ? 'File Loaded' : 'Upload File'}
                                    </button>
                                    <input
                                        id="file-upload"
                                        type="file"
                                        accept=".txt,.docx,.pdf"
                                        className="hidden"
                                        onChange={handleFileUpload}
                                    />
                                </div>

                                {error && (
                                    <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-xs font-medium flex items-center gap-2 border border-red-100 animate-in fade-in slide-in-from-top-1">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <div className="relative group">
                                    <textarea
                                        className="w-full p-5 bg-white border border-neutral-200 rounded-2xl h-48 text-sm focus:ring-4 focus:ring-black/5 focus:border-black/50 focus:outline-none transition-all resize-none shadow-sm text-black leading-relaxed custom-scrollbar placeholder:text-neutral-400"
                                        style={{ fontFamily: settings.fontFamily, fontSize: '1.25rem' }}
                                        placeholder="Start typing nicely here..."
                                        value={settings.text}
                                        onChange={(e) => updateSetting('text', e.target.value)}
                                    />
                                    <div className="absolute bottom-3 right-3 text-[10px] text-neutral-400 bg-gray-100/50 px-2 py-1 rounded-md pointer-events-none font-mono">
                                        {settings.text.length} chars
                                    </div>
                                </div>
                            </section>

                            {/* SECTION 2: STYLE */}
                            <section className="space-y-6">
                                <div className="flex items-end justify-between border-b border-neutral-200 pb-2">
                                    <h2 className="text-xs font-black uppercase tracking-widest text-neutral-500">02. Handwriting Style</h2>
                                </div>

                                <div className="space-y-6">
                                    {/* Font Selector */}
                                    <div className="relative">
                                        <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide mb-2 block ml-1">Font Family</label>
                                        <div className="relative">
                                            <select
                                                value={settings.fontFamily}
                                                onChange={(e) => updateSetting('fontFamily', e.target.value)}
                                                className="w-full pl-4 pr-10 py-3.5 border border-neutral-200 rounded-xl text-sm bg-white hover:border-neutral-300 transition-colors appearance-none text-black font-semibold shadow-sm focus:ring-4 focus:ring-black/5 focus:outline-none cursor-pointer"
                                            >
                                                {['Caveat', 'Indie Flower', 'Patrick Hand', 'Shadows Into Light', 'Homemade Apple', 'Gloria Hallelujah', 'Kalam', 'Handlee', 'Architects Daughter', 'Nothing You Could Do'].map(font => (
                                                    <option key={font} value={font}>{font}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sliders Grid */}
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Size</label>
                                                <span className="text-[10px] font-mono bg-gray-100 px-1.5 py-0.5 rounded text-black font-bold">{settings.fontSize}px</span>
                                            </div>
                                            <input type="range" min="10" max="72" value={settings.fontSize}
                                                onChange={(e) => updateSetting('fontSize', Number(e.target.value))}
                                                className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-black hover:accent-black/80 transition-all"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Spacing</label>
                                                <span className="text-[10px] font-mono bg-gray-100 px-1.5 py-0.5 rounded text-black font-bold">{settings.letterSpacing}px</span>
                                            </div>
                                            <input type="range" min="-2" max="10" step="0.5" value={settings.letterSpacing}
                                                onChange={(e) => updateSetting('letterSpacing', Number(e.target.value))}
                                                className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-black hover:accent-black/80 transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Color Picker */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Ink Color</label>
                                            <span className="text-[10px] font-mono text-neutral-500 uppercase">{settings.color}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                            {['#000000', '#1a237e', '#b71c1c', '#1b5e20', '#4a4a4a', '#5D4037'].map(c => (
                                                <button
                                                    key={c}
                                                    onClick={() => updateSetting('color', c)}
                                                    className={`w-9 h-9 rounded-full border border-black/5 transition-all duration-300 hover:scale-110 shadow-sm ${settings.color === c ? 'ring-2 ring-offset-2 ring-black scale-110 shadow-md' : 'hover:shadow-md'}`}
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                            <div className="relative w-9 h-9 rounded-full overflow-hidden border border-neutral-200 shadow-sm hover:border-neutral-300 transition-colors group cursor-pointer">
                                                <span className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 opacity-50 group-hover:opacity-100 transition-opacity"></span>
                                                <input
                                                    type="color"
                                                    value={settings.color}
                                                    onChange={(e) => updateSetting('color', e.target.value)}
                                                    className="absolute -top-4 -left-4 w-16 h-16 cursor-pointer p-0 border-0 opacity-0"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* SECTION 3: PAPER & REALISM */}
                            <section className="space-y-6">
                                <div className="flex items-end justify-between border-b border-neutral-200 pb-2">
                                    <h2 className="text-xs font-black uppercase tracking-widest text-neutral-500">03. Paper & Realism</h2>
                                </div>

                                <div className="p-1 space-y-6">
                                    {/* Paper Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide block ml-1">Pattern</label>
                                            <div className="flex flex-col gap-2">
                                                {['plain', 'lined', 'grid'].map(p => (
                                                    <button
                                                        key={p}
                                                        onClick={() => updateSetting('paperPattern', p)}
                                                        className={`w-full py-2.5 px-4 text-xs font-semibold rounded-xl border text-left flex items-center justify-between transition-all ${settings.paperPattern === p
                                                            ? 'bg-black text-white border-black shadow-md'
                                                            : 'bg-white text-neutral-600 border-neutral-200 hover:border-black/30 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        <span className="capitalize">{p}</span>
                                                        {settings.paperPattern === p && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide block ml-1">Finish</label>
                                            <div className="flex flex-col gap-2">
                                                {[
                                                    { value: 'white', label: 'White' },
                                                    { value: 'warm', label: 'Warm' },
                                                    { value: 'vintage', label: 'Vintage' },
                                                    { value: 'grey-light', label: 'Grey Light' },
                                                    { value: 'grey-medium', label: 'Grey Medium' },
                                                    { value: 'grey-dark', label: 'Grey Dark' }
                                                ].map(({ value, label }) => (
                                                    <button
                                                        key={value}
                                                        onClick={() => updateSetting('paperColor', value)}
                                                        className={`w-full py-2.5 px-4 text-xs font-semibold rounded-xl border text-left flex items-center justify-between transition-all ${settings.paperColor === value
                                                            ? 'bg-black text-white border-black shadow-md'
                                                            : 'bg-white text-neutral-600 border-neutral-200 hover:border-black/30 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        <span>{label}</span>
                                                        {settings.paperColor === value && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Realism Sliders */}
                                    <div className="bg-gray-50 rounded-2xl p-5 space-y-5 border border-neutral-200/50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-1 h-3 bg-black rounded-full"></div>
                                            <h3 className="text-xs font-bold uppercase text-black tracking-wide">Human Imperfections</h3>
                                        </div>
                                        {[
                                            { label: 'Tilt', key: 'rotationJitter', min: 0, max: 20, step: 1, suffix: '°' },
                                            { label: 'Messiness', key: 'baselineJitter', min: 0, max: 10, step: 0.5, suffix: 'px' },
                                            { label: 'Mistakes', key: 'errorRate', min: 0, max: 0.1, step: 0.01, suffix: '', format: (v: number) => `${(v * 100).toFixed(0)}%` },
                                            { label: 'Ink Flow', key: 'inkOpacity', min: 0, max: 1, step: 0.1, suffix: '', format: (v: number) => `${(v * 100).toFixed(0)}%` }
                                        ].map(control => (
                                            <div key={control.key} className="space-y-2">
                                                <div className="flex justify-between items-end">
                                                    <label className="text-[10px] font-bold uppercase text-neutral-500 tracking-wide">{control.label}</label>
                                                    <span className="text-[10px] font-mono text-black bg-white px-1.5 rounded border border-neutral-200">
                                                        {/* @ts-ignore */}
                                                        {control.format ? control.format(settings.randomization[control.key]) : `${settings.randomization[control.key]}${control.suffix}`}
                                                    </span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min={control.min}
                                                    max={control.max}
                                                    step={control.step}
                                                    // @ts-ignore
                                                    value={settings.randomization[control.key]}
                                                    // @ts-ignore
                                                    onChange={(e) => updateNested('randomization', control.key, Number(e.target.value))}
                                                    className="w-full h-1.5 bg-white rounded-full appearance-none cursor-pointer accent-black border border-neutral-200"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>

                            <div className="h-10"></div> {/* Spacer */}
                        </div>
                    </div>

                    {/* Floating Action Button for Mobile / Fixed Bottom for Desktop */}
                    <div className="p-6 border-t border-neutral-100 bg-white sticky bottom-0 z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                        {jobStatus === 'completed' ? (
                            <button
                                onClick={downloadPDF}
                                className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold tracking-wide hover:bg-green-500 hover:shadow-green-500/30 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 shadow-xl active:scale-[0.98]"
                            >
                                <Download className="w-5 h-5" /> DOWNLOAD PDF
                            </button>
                        ) : jobStatus === 'active' || jobStatus === 'queued' ? (
                            <div className="w-full bg-gray-100 text-neutral-500 py-4 rounded-2xl font-medium flex items-center justify-center gap-3 animate-pulse border border-neutral-200">
                                <Loader2 className="w-5 h-5 animate-spin text-black" />
                                <span className="text-sm tracking-wide font-semibold">{jobStatus === 'queued' ? 'QUEUED...' : `PROCESSING ${Math.round(progress)}%`}</span>
                            </div>
                        ) : (
                            <button
                                onClick={generatePDF}
                                disabled={!textId}
                                className="w-full bg-black text-white py-4 rounded-2xl font-bold tracking-wide hover:bg-neutral-800 hover:shadow-xl hover:-translate-y-0.5 transition-all shadow-lg shadow-black/10 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2 group"
                            >
                                <span>CONVERT TO PDF</span>
                                {textId && <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] font-mono group-hover:bg-white/20 transition-colors">READY</span>}
                            </button>
                        )}
                    </div>
                </aside>

                {/* RIGHT: Main Preview */}
                <main className="flex-1 h-full relative bg-gray-50 flex flex-col">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none"></div>

                    <div className="flex-1 overflow-auto flex items-center justify-center p-16 custom-scrollbar">
                        <div className="relative shadow-2xl shadow-black/10 rounded-sm transition-transform duration-300 ring-1 ring-black/5 bg-white">
                            <canvas
                                ref={canvasRef}
                                className="bg-white max-w-full h-auto object-contain mx-auto"
                                style={{ maxHeight: 'calc(100vh - 120px)', minHeight: '600px' }}
                            />
                        </div>
                    </div>

                    <div className="p-4 text-center text-[10px] text-neutral-400 font-medium uppercase tracking-widest opacity-50">
                        Preview Quality • Final Output 150 DPI
                    </div>
                </main>
            </div>

            <Footer />
        </div>
    );
}

