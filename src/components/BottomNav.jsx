import React from 'react';
import { Calculator, History as HistoryIcon, Search, ShieldAlert } from 'lucide-react';
import { NavItem } from './ui';

export default function BottomNav({ activeTab, currentUser, onTabChange }) {
    return (
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-40px)] max-w-lg h-24 bg-white/80 backdrop-blur-2xl border border-white/50 flex items-center justify-around px-4 z-[100] rounded-[2.5rem] shadow-2xl shadow-indigo-100/50">
            <NavItem icon={Calculator} label="Tính toán" active={activeTab === 'calc'} onClick={() => onTabChange('calc')} />
            <NavItem icon={Search} label="Tra cứu" active={activeTab === 'search'} onClick={() => onTabChange('search')} />
            <NavItem icon={HistoryIcon} label="Lịch sử" active={activeTab === 'history'} onClick={() => onTabChange('history')} />
            {currentUser?.role === 'admin' && (
                <NavItem icon={ShieldAlert} label="Hệ thống" active={activeTab === 'admin'} onClick={() => onTabChange('admin')} />
            )}
        </nav>
    );
}
