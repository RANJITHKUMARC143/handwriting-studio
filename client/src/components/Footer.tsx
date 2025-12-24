'use client';

import React from 'react';

export default function Footer() {
    return (
        <footer className="bg-slate-50 border-t border-neutral-200/60 py-6 px-6">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">

                <div className="flex flex-col gap-1">
                    <p className="text-xs text-neutral-500 font-medium">
                        &copy; {new Date().getFullYear()} Handwriting Studio. All rights reserved.
                    </p>
                    <p className="text-[10px] text-neutral-400 font-medium tracking-wide">
                        Developed by <span className="text-neutral-600 font-bold">Curiospry Technologies Pvt Ltd</span>
                    </p>
                </div>

                <div className="flex items-center gap-6">
                    <a href="/terms" className="text-xs font-bold text-neutral-400 hover:text-black uppercase tracking-wider transition-colors">
                        Terms
                    </a>
                    <a href="/privacy" className="text-xs font-bold text-neutral-400 hover:text-black uppercase tracking-wider transition-colors">
                        Privacy
                    </a>
                    <a href="mailto:support@curiospry.com" className="text-xs font-bold text-neutral-400 hover:text-black uppercase tracking-wider transition-colors">
                        Contact Support
                    </a>
                </div>

            </div>
        </footer>
    );
}
