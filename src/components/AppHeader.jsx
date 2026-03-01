import React from 'react';
import { DollarSign, LogOut, Wifi, WifiOff } from 'lucide-react';
import mobileLogo from '../assets/mobile-logo.png';

export default function AppHeader({ backendStatus, isGuestMode, onOpenPrice, onLogout }) {
    return (
        <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/40 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-xl ring-2 ring-white overflow-hidden">
                    <img src={mobileLogo} alt="Logo" className="w-full h-full object-cover" />
                </div>
                <div>
                    <h1 className="text-lg font-black font-outfit text-slate-800">Truy Thu Điện</h1>
                    <div className="flex items-center gap-2">
                        {backendStatus === 'online'
                            ? <><Wifi size={10} className="text-emerald-500" /><p className="text-[9px] text-emerald-500 font-black uppercase">Online</p></>
                            : <><WifiOff size={10} className="text-amber-500" /><p className="text-[9px] text-amber-500 font-black uppercase">Offline</p></>}
                        {isGuestMode && <p className="text-[9px] text-slate-400 font-black uppercase">Guest</p>}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={onOpenPrice} className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600"><DollarSign size={18} /></button>
                <button onClick={onLogout} className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-600"><LogOut size={18} /></button>
            </div>
        </header>
    );
}
