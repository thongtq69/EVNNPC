import React from 'react';
import { ChevronRight, Clock, History as HistoryIcon } from 'lucide-react';
import { GlassCard } from './ui';

export default function HistoryTab({ historyLoading, isGuestMode, history, serverHistory }) {
    const list = isGuestMode ? history : serverHistory;

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-black font-outfit text-slate-800">Nhật ký Kiểm tra</h2>
            {historyLoading ? (
                <div className="h-64 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" /></div>
            ) : list.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center opacity-30 space-y-4"><HistoryIcon size={48} /><p className="font-black text-xs uppercase tracking-widest">Chưa có bản ghi</p></div>
            ) : (
                <div className="grid gap-4">
                    {list.map(item => (
                        <GlassCard key={item.id || item._id} className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600"><Clock size={20} /></div>
                                    <div>
                                        <p className="font-black text-slate-800 text-sm">{isGuestMode ? (item.code || item.name || 'Khách lẻ') : (item.customerCode || item.customerName || 'Khách lẻ')}</p>
                                        <p className="text-[10px] text-slate-400 font-bold">{new Date(isGuestMode ? item.timestamp : item.createdAt).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-slate-400 uppercase">Truy thu</p>
                                    <p className="text-lg font-black text-rose-500">{Math.abs(isGuestMode ? item.result.diff : item.diff).toLocaleString()} đ</p>
                                </div>
                            </div>
                            {isGuestMode && (
                                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                    <div className="flex gap-4 text-[10px] text-slate-500">
                                        <span>Tiêu thụ: <b>{item.result.chiTietTheoThang.reduce((a, b) => a + b.sanLuongTotal, 0)} kWh</b></span>
                                        <span>Chu kỳ: <b>{item.result.chiTietTheoThang.length} tháng</b></span>
                                    </div>
                                    <ChevronRight size={16} className="text-slate-200" />
                                </div>
                            )}
                        </GlassCard>
                    ))}
                </div>
            )}
        </div>
    );
}
