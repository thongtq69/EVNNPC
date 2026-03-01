import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { GlassCard } from './ui';
import mobileLogo from '../assets/mobile-logo.png';

export default function LoginScreen({
    backendStatus,
    loginUsername,
    loginPassword,
    onLoginUsernameChange,
    onLoginPasswordChange,
    onQuickLogin,
    onAccountLogin,
}) {
    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="w-full max-w-sm z-10 text-center">
                <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-2xl mx-auto mb-6 ring-4 ring-white overflow-hidden">
                    <img src={mobileLogo} alt="Logo" className="w-full h-full object-cover" />
                </div>
                <h1 className="text-3xl font-black font-outfit text-slate-800">Truy Thu Điện</h1>
                <div className="flex items-center justify-center gap-2 mt-2 mb-8">
                    {backendStatus === 'online' ? <><Wifi size={14} className="text-emerald-500" /><span className="text-emerald-500 text-[10px] font-black uppercase">Server Online</span></> : <><WifiOff size={14} className="text-amber-500" /><span className="text-amber-500 text-[10px] font-black uppercase">Offline Mode</span></>}
                </div>
                <GlassCard className="p-8 space-y-4">
                    <button onClick={onQuickLogin} className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl">ĐĂNG NHẬP NHANH</button>
                    <p className="text-[11px] text-slate-500 font-bold">Không cần tài khoản, bấm là vào dùng ngay.</p>
                    {backendStatus === 'online' && (
                        <div className="pt-2 border-t border-slate-100 text-left">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-3">Đăng nhập quản trị (tùy chọn)</p>
                            <input type="text" placeholder="Tên đăng nhập" value={loginUsername} onChange={e => onLoginUsernameChange(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-indigo-500 font-bold mb-3" />
                            <input type="password" placeholder="Mật khẩu" value={loginPassword} onChange={e => onLoginPasswordChange(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-indigo-500 font-bold mb-3" />
                            <button onClick={onAccountLogin} className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-lg">ĐĂNG NHẬP BẰNG TÀI KHOẢN</button>
                        </div>
                    )}
                </GlassCard>
                <p className="mt-6 text-[11px] font-bold text-slate-400">PC Hà Tĩnh - EVNNPC</p>
            </div>
        </div>
    );
}
