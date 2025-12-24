'use client';

import React from 'react';
import { FileText, ExternalLink } from 'lucide-react';

export default function Navbar() {
    return (
        <nav className="h-16 border-b border-sky-200 bg-sky-200/80 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-6 shadow-sm">

            {/* BRAND */}
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20 ring-2 ring-primary/5">
                    <FileText className="w-5 h-5" />
                </div>
                <div>
                    <h1 className="text-lg font-bold tracking-tight text-black leading-none">Handwriting Studio</h1>
                    <p className="text-[10px] text-muted-foreground font-medium tracking-wide uppercase leading-none mt-0.5">AI Document Generator</p>
                </div>
            </div>

            {/* LINKS */}
            <div className="flex items-center gap-6">
                <a
                    href="https://www.curio-spry.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm font-medium text-white bg-black hover:bg-neutral-800 transition-colors px-4 py-2 rounded-full"
                >
                    <span>Visit Curiospry</span>
                    <ExternalLink className="w-4 h-4" />
                </a>
            </div>
        </nav>
    );
}
