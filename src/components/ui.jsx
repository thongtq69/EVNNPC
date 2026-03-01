import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export const GlassCard = ({ children, className = '' }) => (
    <div className={`bg-white/80 backdrop-blur-xl border border-white/40 rounded-[2.5rem] shadow-xl shadow-indigo-100/20 ${className}`}>{children}</div>
);

export const NavItem = ({ icon, label, active, onClick }) => {
    const iconElement = React.createElement(icon, { size: 22, strokeWidth: active ? 2.5 : 2 });
    return (
        <button onClick={onClick} className="flex flex-col items-center justify-center p-2 flex-1">
            <div className={`p-2.5 rounded-2xl transition-all duration-300 ${active ? 'bg-indigo-600 text-white shadow-lg -translate-y-1' : 'text-slate-400'}`}>
                {iconElement}
            </div>
            <span className={`text-[10px] font-black mt-1 uppercase tracking-tighter ${active ? 'text-indigo-600' : 'text-slate-400'}`}>{label}</span>
        </button>
    );
};

export const Collapsible = ({ label, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white/50">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">{label}</span>
                <ChevronDown size={14} className={`text-slate-300 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <div className="px-4 pb-4 overflow-hidden">
                        {children}
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export const RatioInput = ({ label, value, onChange }) => (
    <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-500">{label}</span>
        <div className="relative w-20">
            <input type="number" value={(value * 100).toFixed(0)} onChange={e => onChange(Number(e.target.value) / 100 || 0)} className="w-full bg-white rounded-lg p-1.5 pr-6 text-[11px] font-black text-right border border-slate-100" />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-300">%</span>
        </div>
    </div>
);
