import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calculator, Search, BookOpen, History as HistoryIcon, ChevronRight, Zap, ShieldCheck, Send, Sparkles, FileText, LayoutGrid, Plus, Trash2, Lock, User, LogOut, Calendar, ExternalLink, ChevronDown, Activity, Clock, ArrowRight, RotateCcw, FileCode, X, Edit3, Save, DollarSign, Settings, Wifi, WifiOff, AlertTriangle, UserPlus, Users, Key, Shield, ShieldAlert
} from 'lucide-react';
import { ElectricityCalculationService, PRICE_PERIODS, DEFAULT_PRICES } from './services/calculationService';
import { AIService } from './services/aiService';
import { AuthAPI, CalculationAPI, HealthAPI, AdminAPI } from './services/api';

// --- Constants ---
const AUTH_KEY = 'truythu_auth';
const HISTORY_KEY = 'truythu_history';
const MONTH_NAMES = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

const LEGAL_DOCS = [
    { id: 'luatDienLuc2024', name: 'Luật Điện lực 2024', sub: '61/2024/QH15', keywords: ['2024', '61/2024'], icon: ShieldCheck, color: 'text-emerald-500' },
    { id: 'thongTu60_2025', name: 'Thông tư 60/2025/TT-BCT', sub: 'Quy định giá bán điện', keywords: ['60/2025', '60'], icon: FileText, color: 'text-indigo-500' },
    { id: 'quyDinhGiaBanDien2025', name: 'QĐ 1279/QĐ-BCT', sub: 'Biểu giá bán lẻ 2025', keywords: ['1279', 'biểu giá'], icon: Calculator, color: 'text-amber-500' },
];

const DEFAULT_MONTH = (index) => ({
    id: Date.now() + index,
    name: `Tháng ${index + 1}`,
    consumption: '',
    otherFee: '0',
    tyLeReality: { tyLeSinhHoat: 1, tyLeSanXuat: 0, tyLeKinhDoanh: 0, tyLeHCSNBenhVien: 0, tyLeHCSNChieuSang: 0 },
    tyLeApplied: { tyLeSinhHoat: 1, tyLeSanXuat: 0, tyLeKinhDoanh: 0, tyLeHCSNBenhVien: 0, tyLeHCSNChieuSang: 0 }
});

// --- UI Components ---
const GlassCard = ({ children, className = "" }) => (
    <div className={`bg-white/80 backdrop-blur-xl border border-white/40 rounded-[2.5rem] shadow-xl shadow-indigo-100/20 ${className}`}>{children}</div>
);

const NavItem = ({ icon: Icon, label, active, onClick }) => (
    <button onClick={onClick} className="flex flex-col items-center justify-center p-2 flex-1">
        <div className={`p-2.5 rounded-2xl transition-all duration-300 ${active ? 'bg-indigo-600 text-white shadow-lg -translate-y-1' : 'text-slate-400'}`}>
            <Icon size={22} strokeWidth={active ? 2.5 : 2} />
        </div>
        <span className={`text-[10px] font-black mt-1 uppercase tracking-tighter ${active ? 'text-indigo-600' : 'text-slate-400'}`}>{label}</span>
    </button>
);

const Collapsible = ({ label, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white/50">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">{label}</span>
                <ChevronDown size={14} className={`text-slate-300 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>{isOpen && <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="px-4 pb-4 overflow-hidden">{children}</motion.div>}</AnimatePresence>
        </div>
    );
};

const RatioInput = ({ label, value, onChange }) => (
    <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-500">{label}</span>
        <div className="relative w-20">
            <input type="number" value={(value * 100).toFixed(0)} onChange={e => onChange(Number(e.target.value) / 100 || 0)} className="w-full bg-white rounded-lg p-1.5 pr-6 text-[11px] font-black text-right border border-slate-100" />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-300">%</span>
        </div>
    </div>
);

// --- Price Info Modal ---
const PriceInfoModal = ({ isOpen, onClose, periodId, setPeriodId, customPrices, setCustomPrices }) => {
    const currentPrices = customPrices[periodId] || DEFAULT_PRICES[periodId];

    const updatePrice = (key, value) => {
        setCustomPrices(prev => ({
            ...prev,
            [periodId]: { ...currentPrices, [key]: Number(value) }
        }));
    };

    if (!isOpen) return null;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[2.5rem] w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="bg-slate-50 px-8 py-6 flex items-center justify-between border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <RotateCcw size={18} className="text-slate-400 cursor-pointer hover:text-indigo-600" onClick={() => setCustomPrices(prev => ({ ...prev, [periodId]: DEFAULT_PRICES[periodId] }))} />
                        <h2 className="text-lg font-black font-outfit text-slate-800">Bảng giá điện</h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                </div>

                {/* Period Selector */}
                <div className="px-8 py-4 border-b border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Clock size={12} /> Chọn thời kỳ giá:</p>
                    <div className="flex gap-2">
                        {Object.values(PRICE_PERIODS).map(p => (
                            <button key={p.id} onClick={() => setPeriodId(p.id)} className={`flex-1 py-3 rounded-2xl font-black text-xs transition-all ${periodId === p.id ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-100 text-slate-500'}`}>
                                {p.shortName}
                                {periodId === p.id && <span className="block text-[8px] opacity-70 font-bold mt-0.5">Đang dùng</span>}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Prices List */}
                <div className="px-8 py-6 overflow-y-auto max-h-[50vh] space-y-6">
                    {/* Residential Tiers */}
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center justify-between">
                            Giá sinh hoạt bậc thang
                            <Edit3 size={14} className="text-indigo-400" />
                        </p>
                        <div className="space-y-3">
                            {[
                                { key: 'tier1', label: 'Bậc 1 (0-50 kWh)' },
                                { key: 'tier2', label: 'Bậc 2 (51-100 kWh)' },
                                { key: 'tier3', label: 'Bậc 3 (101-200 kWh)' },
                                { key: 'tier4', label: 'Bậc 4 (201-300 kWh)' },
                                { key: 'tier5', label: 'Bậc 5 (301-400 kWh)' },
                                { key: 'tier6', label: 'Bậc 6 (401+ kWh)' },
                            ].map(item => (
                                <div key={item.key} className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
                                    <span className="text-sm font-bold text-slate-700">{item.label}</span>
                                    <div className="flex items-center gap-1">
                                        <input type="number" value={currentPrices[item.key]} onChange={e => updatePrice(item.key, e.target.value)} className="w-20 text-right font-black text-indigo-600 bg-white rounded-lg p-2 border border-slate-100 text-sm" />
                                        <span className="text-[10px] text-slate-400 font-bold">đ/kWh</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Non-Residential */}
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Giá ngoài mục đích sinh hoạt</p>
                        <div className="space-y-3">
                            {[
                                { key: 'production', label: 'Sản xuất (SXBT)' },
                                { key: 'business', label: 'Kinh doanh (KDDV)' },
                                { key: 'hcsn_hospital', label: 'HCSN - Bệnh viện, trường học' },
                                { key: 'hcsn_lighting', label: 'HCSN - Chiếu sáng công cộng' },
                            ].map(item => (
                                <div key={item.key} className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
                                    <span className="text-sm font-bold text-slate-700">{item.label}</span>
                                    <div className="flex items-center gap-1">
                                        <input type="number" value={currentPrices[item.key]} onChange={e => updatePrice(item.key, e.target.value)} className="w-20 text-right font-black text-indigo-600 bg-white rounded-lg p-2 border border-slate-100 text-sm" />
                                        <span className="text-[10px] text-slate-400 font-bold">đ/kWh</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-4 bg-slate-50 border-t border-slate-100">
                    <button onClick={onClose} className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-lg">ÁP DỤNG</button>
                </div>
            </motion.div>
        </motion.div>
    );
};

// --- Main App ---
export default function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [activeTab, setActiveTab] = useState('calc');
    const [loading, setLoading] = useState(true);
    const [backendStatus, setBackendStatus] = useState('checking');
    const [showPriceModal, setShowPriceModal] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null); // null | 'saving' | 'saved' | 'error'

    // Admin State
    const [adminUsers, setAdminUsers] = useState([]);
    const [adminLoading, setAdminLoading] = useState(false);
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newRole, setNewRole] = useState('user');

    const fetchAdminUsers = async () => {
        try {
            setAdminLoading(true);
            const data = await AdminAPI.getUsers();
            setAdminUsers(data);
        } catch (err) {
            console.error('Fetch users error:', err);
        } finally {
            setAdminLoading(false);
        }
    };

    const handleCreateUser = async () => {
        if (!newUsername || !newPassword) {
            alert('Vui lòng nhập đầy đủ thông tin');
            return;
        }
        try {
            await AdminAPI.createUser({ username: newUsername, password: newPassword, role: newRole });
            alert('Đã tạo tài khoản ' + newUsername);
            setNewUsername('');
            setNewPassword('');
            setNewRole('user');
            fetchAdminUsers();
        } catch (error) {
            alert(error.response?.data?.error || 'Không thể tạo người dùng');
        }
    };

    useEffect(() => {
        if (activeTab === 'admin' && currentUser?.role === 'admin') {
            fetchAdminUsers();
        }
    }, [activeTab, currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

    // Mode & Period
    const [calcMode, setCalcMode] = useState('single');
    const [periodId, setPeriodId] = useState('from_05_2025');
    const [customPrices, setCustomPrices] = useState({ ...DEFAULT_PRICES });

    // Calculator Data
    const [customerCode, setCustomerCode] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [soHoApplied, setSoHoApplied] = useState(1);
    const [soHoReality, setSoHoReality] = useState(1);
    const [months, setMonths] = useState([DEFAULT_MONTH(0)]);

    // Year Mode
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonthIndices, setSelectedMonthIndices] = useState([]);
    const [yearlyMonthData, setYearlyMonthData] = useState({});

    const [result, setResult] = useState(null);
    const [history, setHistory] = useState([]);

    // AI Chat
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [citations, setCitations] = useState([]);
    const [selectedModel, setSelectedModel] = useState('kimi-k2.5-free');

    // Check backend & load data
    useEffect(() => {
        const init = async () => {
            // Check backend
            const health = await HealthAPI.check();
            setBackendStatus(health.status === 'ok' ? 'online' : 'offline');

            // Check auth
            if (AuthAPI.isLoggedIn()) {
                setIsAuthenticated(true);
                setCurrentUser(AuthAPI.getUser());
            }

            // Load local history
            const savedHistory = localStorage.getItem(HISTORY_KEY);
            if (savedHistory) setHistory(JSON.parse(savedHistory));

            setLoading(false);
        };
        init();
    }, []);

    const handleLogin = async (username, password) => {
        try {
            if (backendStatus === 'online') {
                const data = await AuthAPI.login(username, password);
                setCurrentUser({ username: data.username, role: data.role });
            } else {
                // Offline mode
                localStorage.setItem(AUTH_KEY, username || 'Professional');
                setCurrentUser({ username: username || 'Professional', role: 'user' });
            }
            setIsAuthenticated(true);
        } catch (err) {
            alert('Đăng nhập thất bại: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleLogout = () => {
        AuthAPI.logout();
        localStorage.removeItem(AUTH_KEY);
        setIsAuthenticated(false);
        setCurrentUser(null);
    };

    // --- Calculator Helpers ---
    const addMonth = () => setMonths([...months, DEFAULT_MONTH(months.length)]);
    const removeMonth = (id) => { if (months.length > 1) setMonths(months.filter(m => m.id !== id)); };
    const updateMonthField = (id, field, value) => setMonths(months.map(m => m.id === id ? { ...m, [field]: value } : m));
    const updateMonthRatio = (id, ratioType, field, value) => {
        setMonths(months.map(m => m.id === id ? { ...m, [ratioType]: { ...m[ratioType], [field]: value } } : m));
    };

    const toggleYearlyMonth = (mIdx) => {
        setSelectedMonthIndices(prev => prev.includes(mIdx) ? prev.filter(i => i !== mIdx) : [...prev, mIdx].sort((a, b) => a - b));
        if (!yearlyMonthData[mIdx]) {
            setYearlyMonthData(prev => ({ ...prev, [mIdx]: { consumption: '', otherFee: '0', tyLeApplied: { tyLeSinhHoat: 1, tyLeSanXuat: 0, tyLeKinhDoanh: 0, tyLeHCSNBenhVien: 0, tyLeHCSNChieuSang: 0 }, tyLeReality: { tyLeSinhHoat: 1, tyLeSanXuat: 0, tyLeKinhDoanh: 0, tyLeHCSNBenhVien: 0, tyLeHCSNChieuSang: 0 } } }));
        }
    };
    const updateYearlyField = (mIdx, field, value) => setYearlyMonthData(prev => ({ ...prev, [mIdx]: { ...prev[mIdx], [field]: value } }));
    const updateYearlyRatio = (mIdx, ratioType, field, value) => setYearlyMonthData(prev => ({ ...prev, [mIdx]: { ...prev[mIdx], [ratioType]: { ...prev[mIdx][ratioType], [field]: value } } }));

    const totalSanLuong = useMemo(() => {
        if (calcMode === 'year') return selectedMonthIndices.reduce((sum, idx) => sum + (parseFloat(yearlyMonthData[idx]?.consumption) || 0), 0);
        return months.reduce((sum, m) => sum + (parseFloat(m.consumption) || 0), 0);
    }, [months, calcMode, selectedMonthIndices, yearlyMonthData]);

    const totalPhiKhac = useMemo(() => {
        if (calcMode === 'year') return selectedMonthIndices.reduce((sum, idx) => sum + (parseFloat(yearlyMonthData[idx]?.otherFee) || 0), 0);
        return months.reduce((sum, m) => sum + (parseFloat(m.otherFee) || 0), 0);
    }, [months, calcMode, selectedMonthIndices, yearlyMonthData]);

    const handleCalculate = () => {
        const prices = customPrices[periodId] || DEFAULT_PRICES[periodId];
        const service = new ElectricityCalculationService(prices);
        let monthsData;

        if (calcMode === 'year') {
            if (selectedMonthIndices.length === 0) { alert('Vui lòng chọn ít nhất 1 tháng'); return; }
            monthsData = selectedMonthIndices.map(mIdx => {
                const data = yearlyMonthData[mIdx] || {};
                return { name: MONTH_NAMES[mIdx], consumption: parseFloat(data.consumption) || 0, otherFee: parseFloat(data.otherFee) || 0, tyLeApplied: data.tyLeApplied, tyLeReality: data.tyLeReality };
            });
        } else {
            monthsData = months.map(m => ({ name: m.name, consumption: parseFloat(m.consumption) || 0, otherFee: parseFloat(m.otherFee) || 0, tyLeApplied: m.tyLeApplied, tyLeReality: m.tyLeReality }));
        }

        const res = service.tinhChenhLech({ soHoApplied, soHoReality, months: monthsData });
        setResult(res);

        // Save to local history
        const newItem = { id: Date.now(), timestamp: new Date(), result: res, code: customerCode, name: customerName };
        const newHistory = [newItem, ...history].slice(0, 20);
        setHistory(newHistory);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
    };

    const handleSaveToServer = async () => {
        if (!result) return;
        setSaveStatus('saving');
        try {
            await CalculationAPI.save({
                customerName: customerName || 'Khách lẻ',
                customerCode,
                totalDungGia: result.tongTienDungGia,
                totalDaTinh: result.tongTienDaTinh,
                diff: result.diff,
                details: result
            });
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus(null), 2000);
        } catch (err) {
            setSaveStatus('error');
            console.error('Save error:', err);
        }
    };

    const handleReset = () => {
        setCustomerCode(''); setCustomerName(''); setSoHoApplied(1); setSoHoReality(1);
        setMonths([DEFAULT_MONTH(0)]); setResult(null);
        setSelectedMonthIndices([]); setYearlyMonthData({});
    };

    const loadSample = () => {
        setCustomerCode('KH123456'); setCustomerName('Nguyễn Văn A');
        setSoHoApplied(1); setSoHoReality(1);
        setMonths([{ ...DEFAULT_MONTH(0), consumption: '350' }]);
        setCalcMode('single');
    };

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        if (!query.trim()) return;
        setMessages(prev => [...prev, { role: 'user', content: query }]);
        const currentQuery = query;
        setQuery('');
        setIsTyping(true);
        setCitations([]);

        try {
            const result = await AIService.searchLegal(currentQuery, selectedModel);
            setMessages(prev => [...prev, { role: 'assistant', content: result }]);
            setCitations(LEGAL_DOCS.filter(doc => doc.keywords.some(k => result.toLowerCase().includes(k.toLowerCase()) || currentQuery.toLowerCase().includes(k.toLowerCase()))));
        } catch (err) {
            console.error('AI Error:', err);
            setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ Lỗi kết nối AI: ${err.response?.data?.error || err.message}. Vui lòng thử lại hoặc chọn model khác.` }]);
        }
        finally { setIsTyping(false); }
    };

    // --- Login Screen ---
    const [loginUsername, setLoginUsername] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" /></div>;

    if (!isAuthenticated) return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm z-10 text-center">
                <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-2xl mx-auto mb-6 ring-4 ring-white"><Zap size={32} fill="currentColor" /></div>
                <h1 className="text-3xl font-black font-outfit text-slate-800">Truy Thu Điện</h1>
                <div className="flex items-center justify-center gap-2 mt-2 mb-8">
                    {backendStatus === 'online' ? <><Wifi size={14} className="text-emerald-500" /><span className="text-emerald-500 text-[10px] font-black uppercase">Server Online</span></> : <><WifiOff size={14} className="text-amber-500" /><span className="text-amber-500 text-[10px] font-black uppercase">Offline Mode</span></>}
                </div>
                <GlassCard className="p-8 space-y-4">
                    <input type="text" placeholder="Tên đăng nhập" value={loginUsername} onChange={e => setLoginUsername(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-indigo-500 font-bold" />
                    <input type="password" placeholder="Mật khẩu" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-indigo-500 font-bold" />
                    <button onClick={() => handleLogin(loginUsername, loginPassword)} className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl">ĐĂNG NHẬP</button>
                </GlassCard>
            </motion.div>
        </div>
    );

    // --- MAIN RENDER ---
    return (
        <div className="bg-slate-50 min-h-screen text-slate-900 font-sans pb-32">
            <PriceInfoModal isOpen={showPriceModal} onClose={() => setShowPriceModal(false)} periodId={periodId} setPeriodId={setPeriodId} customPrices={customPrices} setCustomPrices={setCustomPrices} />

            <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/40 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl ring-2 ring-white"><Zap size={20} fill="currentColor" /></div>
                    <div><h1 className="text-lg font-black font-outfit text-slate-800">Truy Thu Điện</h1>
                        <div className="flex items-center gap-2">
                            {backendStatus === 'online' ? <><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /><p className="text-[9px] text-emerald-500 font-black uppercase">Online</p></> : <><div className="w-1.5 h-1.5 rounded-full bg-amber-500" /><p className="text-[9px] text-amber-500 font-black uppercase">Offline</p></>}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setShowPriceModal(true)} className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600"><DollarSign size={18} /></button>
                    <button onClick={handleLogout} className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-600"><LogOut size={18} /></button>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-5 pt-8">
                <AnimatePresence mode="wait">
                    {activeTab === 'calc' && (
                        <motion.div key="calc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                            {/* Top Controls */}
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div className="flex bg-slate-200/50 p-1 rounded-xl">
                                    {['single', 'year'].map(m => (
                                        <button key={m} onClick={() => setCalcMode(m)} className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${calcMode === m ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
                                            {m === 'single' ? 'Tùy chỉnh' : 'Theo năm'}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex bg-slate-200/50 p-1 rounded-xl">
                                    {Object.values(PRICE_PERIODS).map(p => (
                                        <button key={p.id} onClick={() => setPeriodId(p.id)} className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${periodId === p.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>{p.shortName}</button>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={loadSample} title="Tải dữ liệu mẫu" className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100"><FileCode size={18} /></button>
                                    <button onClick={handleReset} title="Đặt lại" className="p-2 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100"><RotateCcw size={18} /></button>
                                </div>
                            </div>

                            <GlassCard className="p-8 space-y-6">
                                {/* Customer Info */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2 sm:col-span-1 space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Mã khách hàng</label>
                                        <input type="text" placeholder="KH123..." value={customerCode} onChange={e => setCustomerCode(e.target.value)} className="w-full bg-slate-50 rounded-2xl p-4 font-bold border border-slate-100 outline-none focus:ring-2 focus:ring-indigo-500" />
                                    </div>
                                    <div className="col-span-2 sm:col-span-1 space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Tên khách hàng</label>
                                        <input type="text" placeholder="Nguyễn Văn A" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full bg-slate-50 rounded-2xl p-4 font-bold border border-slate-100 outline-none focus:ring-2 focus:ring-indigo-500" />
                                    </div>
                                </div>

                                {/* Household Count */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Số hộ áp dụng</label>
                                        <div className="flex items-center justify-between bg-slate-50 rounded-2xl p-2 border border-slate-100">
                                            <button onClick={() => setSoHoApplied(Math.max(0, soHoApplied - 1))} className="w-10 h-10 bg-white rounded-xl shadow-sm font-bold">-</button>
                                            <span className="font-black text-indigo-600 text-xl">{soHoApplied || 'KK'}</span>
                                            <button onClick={() => setSoHoApplied(soHoApplied + 1)} className="w-10 h-10 bg-white rounded-xl shadow-sm font-bold">+</button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Số hộ thực tế</label>
                                        <div className="flex items-center justify-between bg-slate-50 rounded-2xl p-2 border border-slate-100">
                                            <button onClick={() => setSoHoReality(Math.max(0, soHoReality - 1))} className="w-10 h-10 bg-white rounded-xl shadow-sm font-bold">-</button>
                                            <span className="font-black text-emerald-600 text-xl">{soHoReality || 'KK'}</span>
                                            <button onClick={() => setSoHoReality(soHoReality + 1)} className="w-10 h-10 bg-white rounded-xl shadow-sm font-bold">+</button>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 pt-6">
                                    {/* Mode: SINGLE */}
                                    {calcMode === 'single' && (
                                        <>
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-2"><Calendar size={18} className="text-indigo-500" /><h3 className="text-sm font-black text-slate-700 uppercase">Danh sách tháng</h3></div>
                                                <button onClick={addMonth} className="flex items-center gap-1.5 text-indigo-600 font-black text-[10px] bg-indigo-50 px-4 py-2 rounded-xl"><Plus size={14} /> Thêm</button>
                                            </div>
                                            <div className="space-y-4">
                                                {months.map((m, idx) => (
                                                    <motion.div layout key={m.id} className="bg-slate-50/50 rounded-[2rem] p-6 border border-slate-100/50 space-y-5 group">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-indigo-600 font-black text-xs shadow-sm border">{idx + 1}</div>
                                                                <input type="text" value={m.name} onChange={e => updateMonthField(m.id, 'name', e.target.value)} className="bg-transparent font-black text-slate-700 outline-none w-28" />
                                                            </div>
                                                            <button onClick={() => removeMonth(m.id)} className="text-rose-400 hover:text-rose-600"><Trash2 size={16} /></button>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-1.5"><p className="text-[9px] font-black uppercase text-slate-400 ml-1">Sản lượng (kWh)</p><input type="number" value={m.consumption} onChange={e => updateMonthField(m.id, 'consumption', e.target.value)} className="w-full bg-white rounded-xl p-3.5 text-sm font-black border border-slate-100 shadow-sm focus:ring-1 focus:ring-indigo-500 outline-none" /></div>
                                                            <div className="space-y-1.5"><p className="text-[9px] font-black uppercase text-slate-400 ml-1">Phí khác (đ)</p><input type="number" value={m.otherFee} onChange={e => updateMonthField(m.id, 'otherFee', e.target.value)} className="w-full bg-white rounded-xl p-3.5 text-sm font-black border border-slate-100 shadow-sm outline-none" /></div>
                                                        </div>
                                                        <Collapsible label="Tỷ lệ đã áp dụng (Sai)"><div className="grid gap-3 pt-2">{[{ k: 'tyLeSinhHoat', l: 'Sinh hoạt BT' }, { k: 'tyLeSanXuat', l: 'Sản xuất BT' }, { k: 'tyLeKinhDoanh', l: 'Kinh doanh DV' }, { k: 'tyLeHCSNBenhVien', l: 'HCSN (Bệnh viện)' }, { k: 'tyLeHCSNChieuSang', l: 'HCSN (Chiếu sáng)' }].map(item => <RatioInput key={item.k} label={item.l} value={m.tyLeApplied[item.k]} onChange={v => updateMonthRatio(m.id, 'tyLeApplied', item.k, v)} />)}</div></Collapsible>
                                                        <Collapsible label="Tỷ lệ thực tế (Đúng)"><div className="grid gap-3 pt-2">{[{ k: 'tyLeSinhHoat', l: 'Sinh hoạt BT' }, { k: 'tyLeSanXuat', l: 'Sản xuất BT' }, { k: 'tyLeKinhDoanh', l: 'Kinh doanh DV' }, { k: 'tyLeHCSNBenhVien', l: 'HCSN (Bệnh viện)' }, { k: 'tyLeHCSNChieuSang', l: 'HCSN (Chiếu sáng)' }].map(item => <RatioInput key={item.k} label={item.l} value={m.tyLeReality[item.k]} onChange={v => updateMonthRatio(m.id, 'tyLeReality', item.k, v)} />)}</div></Collapsible>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </>
                                    )}

                                    {/* Mode: YEAR */}
                                    {calcMode === 'year' && (
                                        <>
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-2"><Calendar size={18} className="text-indigo-500" /><h3 className="text-sm font-black text-slate-700 uppercase">Chọn năm & tháng</h3></div>
                                                <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="bg-white border border-slate-100 rounded-xl px-4 py-2 text-sm font-black">
                                                    {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                                                </select>
                                            </div>
                                            <div className="grid grid-cols-4 gap-2 mb-6">
                                                {MONTH_NAMES.map((name, idx) => (
                                                    <button key={idx} onClick={() => toggleYearlyMonth(idx)} className={`p-3 rounded-xl text-xs font-black border transition-all ${selectedMonthIndices.includes(idx) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-100 hover:border-indigo-200'}`}>
                                                        {name.replace('Tháng ', 'T')}
                                                    </button>
                                                ))}
                                            </div>
                                            {selectedMonthIndices.length > 0 && (
                                                <div className="space-y-4">
                                                    {selectedMonthIndices.map(mIdx => (
                                                        <motion.div layout key={mIdx} className="bg-slate-50/50 rounded-[2rem] p-6 border border-slate-100/50 space-y-5">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs">{mIdx + 1}</div>
                                                                <span className="font-black text-slate-700">{MONTH_NAMES[mIdx]} / {selectedYear}</span>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="space-y-1.5"><p className="text-[9px] font-black uppercase text-slate-400 ml-1">Sản lượng (kWh)</p><input type="number" value={yearlyMonthData[mIdx]?.consumption || ''} onChange={e => updateYearlyField(mIdx, 'consumption', e.target.value)} className="w-full bg-white rounded-xl p-3.5 text-sm font-black border border-slate-100 shadow-sm outline-none" /></div>
                                                                <div className="space-y-1.5"><p className="text-[9px] font-black uppercase text-slate-400 ml-1">Phí khác (đ)</p><input type="number" value={yearlyMonthData[mIdx]?.otherFee || '0'} onChange={e => updateYearlyField(mIdx, 'otherFee', e.target.value)} className="w-full bg-white rounded-xl p-3.5 text-sm font-black border border-slate-100 shadow-sm outline-none" /></div>
                                                            </div>
                                                            <Collapsible label="Tỷ lệ đã áp dụng (Sai)"><div className="grid gap-3 pt-2">{[{ k: 'tyLeSinhHoat', l: 'Sinh hoạt BT' }, { k: 'tyLeSanXuat', l: 'Sản xuất BT' }, { k: 'tyLeKinhDoanh', l: 'Kinh doanh DV' }].map(item => <RatioInput key={item.k} label={item.l} value={yearlyMonthData[mIdx]?.tyLeApplied?.[item.k] || 0} onChange={v => updateYearlyRatio(mIdx, 'tyLeApplied', item.k, v)} />)}</div></Collapsible>
                                                            <Collapsible label="Tỷ lệ thực tế (Đúng)"><div className="grid gap-3 pt-2">{[{ k: 'tyLeSinhHoat', l: 'Sinh hoạt BT' }, { k: 'tyLeSanXuat', l: 'Sản xuất BT' }, { k: 'tyLeKinhDoanh', l: 'Kinh doanh DV' }].map(item => <RatioInput key={item.k} label={item.l} value={yearlyMonthData[mIdx]?.tyLeReality?.[item.k] || 0} onChange={v => updateYearlyRatio(mIdx, 'tyLeReality', item.k, v)} />)}</div></Collapsible>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* Summary & Action */}
                                <div className="pt-2">
                                    <div className="bg-indigo-50 rounded-2xl p-4 mb-6 flex justify-between items-center border border-indigo-100/50">
                                        <div><p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">Tổng sản lượng</p><p className="text-xl font-black text-indigo-700">{totalSanLuong.toLocaleString()} <span className="text-xs opacity-50">kWh</span></p></div>
                                        <div className="text-right"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Tổng phí khác</p><p className="text-xl font-black text-slate-700">{totalPhiKhac.toLocaleString()} <span className="text-xs opacity-50">đ</span></p></div>
                                    </div>
                                    <button onClick={handleCalculate} className="w-full bg-indigo-600 py-5 rounded-[2rem] text-white font-black shadow-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-3">
                                        <Activity size={20} /> XEM PHÂN TÍCH TRUY THU
                                    </button>
                                </div>
                            </GlassCard>

                            {/* Result */}
                            {result && (
                                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                    <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px]" />
                                        <div className="relative">
                                            <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Chênh lệch truy thu</p>
                                            <h3 className="text-5xl font-black font-outfit mb-8">{Math.abs(result.diff).toLocaleString()} <span className="text-xl opacity-30">đ</span></h3>
                                            <div className="grid grid-cols-2 gap-4 mb-6">
                                                <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5"><p className="text-white/30 text-[9px] font-black uppercase mb-1">Tiền đã tính</p><p className="text-xl font-bold">{Math.round(result.tongTienDaTinh).toLocaleString()} đ</p></div>
                                                <div className="bg-emerald-500/10 p-6 rounded-[2rem] border border-emerald-500/10 text-emerald-400"><p className="text-emerald-500/40 text-[9px] font-black uppercase mb-1">Tiền đúng giá</p><p className="text-xl font-bold">{Math.round(result.tongTienDungGia).toLocaleString()} đ</p></div>
                                            </div>
                                            {backendStatus === 'online' && (
                                                <button onClick={handleSaveToServer} disabled={saveStatus === 'saving'} className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all ${saveStatus === 'saved' ? 'bg-emerald-500' : saveStatus === 'error' ? 'bg-rose-500' : 'bg-white/10 hover:bg-white/20'}`}>
                                                    <Save size={18} />
                                                    {saveStatus === 'saving' ? 'Đang lưu...' : saveStatus === 'saved' ? 'Đã lưu!' : saveStatus === 'error' ? 'Lỗi lưu!' : 'Lưu vào hệ thống'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <GlassCard className="p-8">
                                        <div className="flex items-center gap-2 mb-8 border-b border-slate-100 pb-4"><LayoutGrid size={20} className="text-indigo-500" /><h3 className="text-lg font-black font-outfit text-slate-800">Báo cáo chi tiết</h3></div>
                                        <div className="space-y-8">
                                            {result.chiTietTheoThang.map((m, i) => (
                                                <div key={i} className="relative pl-6 border-l-2 border-slate-100">
                                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-4 border-indigo-500" />
                                                    <div className="flex items-center justify-between mb-4"><p className="font-black text-slate-800 uppercase">{m.tenThang}</p><div className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-[10px] font-black">{m.sanLuongTotal} kWh</div></div>
                                                    <div className="space-y-2">
                                                        {m.chiTietBac.filter(b => b.kWh > 0).map((b, bi) => (
                                                            <div key={bi} className="flex items-center justify-between text-xs"><span className="font-bold text-slate-700">{b.tenBac}</span><span className="text-slate-400">{b.kWh.toFixed(1)} × {b.donGia.toLocaleString()}</span><span className="font-black text-slate-800">{b.tien.toLocaleString()} đ</span></div>
                                                        ))}
                                                    </div>
                                                    <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between"><span className="text-[10px] font-black text-slate-300 uppercase">Thành tiền</span><span className="text-sm font-black text-indigo-600">{m.tienDungGia.toLocaleString()} đ</span></div>
                                                </div>
                                            ))}
                                        </div>
                                    </GlassCard>
                                </motion.div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'search' && (
                        <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-[calc(100vh-210px)]">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-14 h-14 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl"><Sparkles size={28} /></div>
                                    <div><h2 className="text-2xl font-black font-outfit text-slate-800">Cố vấn Pháp lý</h2><p className="text-[10px] text-emerald-500 font-black uppercase">● AI Online</p></div>
                                </div>
                                <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)} className="bg-white border border-slate-100 rounded-xl px-3 py-2 text-xs font-black">
                                    <option value="kimi-k2.5-free">Kimi K2.5</option>
                                    <option value="glm-4.7-free">GLM-4.7</option>
                                </select>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-6 pr-2 pb-10">
                                {messages.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center opacity-30 text-center space-y-6"><div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center border-4 border-white shadow-inner"><Search size={40} className="text-indigo-400" /></div><p className="font-black text-xs uppercase tracking-[0.3em]">Hỏi bất cứ điều gì về Luật điện lực</p></div>
                                ) : (
                                    messages.map((m, idx) => <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[90%] rounded-[2.2rem] p-6 shadow-sm ${m.role === 'user' ? 'bg-slate-900 text-white font-bold' : 'bg-white border border-slate-100 text-slate-700'}`}><p className="text-[15px] leading-relaxed whitespace-pre-wrap">{m.content}</p></div></div>)
                                )}
                                {isTyping && <div className="flex gap-2 p-4 bg-indigo-50 border border-indigo-100/50 rounded-2xl w-fit items-center"><div className="flex gap-1"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" /><div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce delay-100" /><div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce delay-200" /></div><span className="text-[10px] font-black text-indigo-400 uppercase ml-1">AI đang xử lý...</span></div>}
                                {citations.length > 0 && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pt-8"><p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-2"><BookOpen size={14} /> Cơ sở trích dẫn</p><div className="grid gap-3">{citations.map(c => <div key={c.id} className="bg-white/80 p-5 rounded-[2rem] border border-slate-100 flex items-center gap-5"><div className={`w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center ${c.color}`}><c.icon size={22} /></div><div className="flex-1"><p className="font-black text-slate-800 text-xs">{c.name}</p><p className="text-[9px] font-bold text-slate-400 uppercase">{c.sub}</p></div><ExternalLink size={16} className="text-slate-200" /></div>)}</div></motion.div>}
                            </div>
                            <form onSubmit={handleSearch} className="relative mt-4"><input type="text" placeholder="Hỏi về Luật điện lực 2024..." value={query} onChange={e => setQuery(e.target.value)} className="w-full bg-white/80 backdrop-blur-md border border-slate-200 rounded-[2.5rem] p-6 pr-20 shadow-2xl outline-none focus:ring-4 focus:ring-indigo-600/10 font-bold" /><button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-xl flex items-center justify-center"><Send size={24} /></button></form>

                            <div className="mt-8 space-y-4 pb-8">
                                <div className="flex items-center gap-2 mb-4"><BookOpen size={18} className="text-indigo-500" /><h3 className="text-sm font-black text-slate-700 uppercase">Danh mục văn bản hỗ trợ</h3></div>
                                <div className="grid gap-3">
                                    {LEGAL_DOCS.map(doc => <GlassCard key={doc.id} className="p-4 group"><div className="flex items-center gap-4"><div className={`w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center ${doc.color} group-hover:scale-110 transition-transform`}><doc.icon size={24} /></div><div className="flex-1"><p className="font-black text-slate-800 text-sm">{doc.name}</p><p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">{doc.sub}</p></div><ExternalLink size={20} className="text-slate-200 group-hover:text-indigo-200" /></div></GlassCard>)}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'history' && (
                        <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                            <h2 className="text-2xl font-black font-outfit text-slate-800">Nhật ký Kiểm tra</h2>
                            {history.length === 0 ? (
                                <div className="h-64 flex flex-col items-center justify-center opacity-30 space-y-4"><HistoryIcon size={48} /><p className="font-black text-xs uppercase tracking-widest">Chưa có bản ghi</p></div>
                            ) : (
                                <div className="grid gap-4">{history.map(item => <GlassCard key={item.id} className="p-6"><div className="flex items-center justify-between mb-4"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600"><Clock size={20} /></div><div><p className="font-black text-slate-800 text-sm">{item.code || item.name || 'Khách lẻ'}</p><p className="text-[10px] text-slate-400 font-bold">{new Date(item.timestamp).toLocaleString()}</p></div></div><div className="text-right"><p className="text-[9px] font-black text-slate-400 uppercase">Truy thu</p><p className="text-lg font-black text-rose-500">{Math.abs(item.result.diff).toLocaleString()} đ</p></div></div><div className="flex items-center justify-between pt-4 border-t border-slate-50"><div className="flex gap-4 text-[10px] text-slate-500"><span>Tiêu thụ: <b>{item.result.chiTietTheoThang.reduce((a, b) => a + b.sanLuongTotal, 0)} kWh</b></span><span>Chu kỳ: <b>{item.result.chiTietTheoThang.length} tháng</b></span></div><ChevronRight size={16} className="text-slate-200" /></div></GlassCard>)}</div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'admin' && currentUser?.role === 'admin' && (
                        <motion.div key="admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                            <h2 className="text-2xl font-black font-outfit text-slate-800">Quản lý hệ thống</h2>

                            <GlassCard className="p-6 space-y-4">
                                <div className="flex items-center gap-2 mb-2"><UserPlus size={18} className="text-indigo-500" /><h3 className="text-sm font-black text-slate-700 uppercase">Tạo tài khoản mới</h3></div>
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Tên đăng nhập</label>
                                        <input type="text" placeholder="Ví dụ: nhanvien01" value={newUsername} onChange={e => setNewUsername(e.target.value)} className="w-full bg-white rounded-xl p-3.5 text-sm font-bold border border-slate-100 shadow-sm outline-none focus:ring-1 focus:ring-indigo-500" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Mật khẩu</label>
                                        <div className="relative">
                                            <Key size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input type="password" placeholder="Nhập mật khẩu" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-white rounded-xl p-3.5 pl-10 text-sm font-bold border border-slate-100 shadow-sm outline-none focus:ring-1 focus:ring-indigo-500" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Vai trò</label>
                                        <div className="flex gap-4">
                                            <button onClick={() => setNewRole('user')} className={`flex-1 p-3 rounded-xl font-bold text-sm border transition-all ${newRole === 'user' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-100'}`}>Nhân viên</button>
                                            <button onClick={() => setNewRole('admin')} className={`flex-1 p-3 rounded-xl font-bold text-sm border transition-all ${newRole === 'admin' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-100'}`}>Quản trị viên</button>
                                        </div>
                                    </div>
                                    <button onClick={handleCreateUser} className="w-full bg-indigo-600 text-white font-black py-4 rounded-xl shadow-lg mt-2">THÊM TÀI KHOẢN</button>
                                </div>
                            </GlassCard>

                            <GlassCard className="p-6">
                                <div className="flex items-center gap-2 mb-4"><Users size={18} className="text-indigo-500" /><h3 className="text-sm font-black text-slate-700 uppercase">Danh sách người dùng</h3></div>
                                {adminLoading ? (
                                    <div className="flex justify-center p-8"><div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" /></div>
                                ) : (
                                    <div className="space-y-3">
                                        {adminUsers.map(user => (
                                            <div key={user._id || user.username} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${user.role === 'admin' ? 'bg-amber-100 text-amber-500' : 'bg-indigo-100 text-indigo-500'}`}>
                                                        {user.role === 'admin' ? <Shield size={18} /> : <User size={18} />}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-800 text-sm">{user.username}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{user.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}</p>
                                                    </div>
                                                </div>
                                                {user.username !== 'admin' && (
                                                    <button className="p-2 text-rose-400 hover:text-rose-600 bg-white rounded-lg shadow-sm border border-slate-100"><Trash2 size={16} /></button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </GlassCard>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-40px)] max-w-lg h-24 bg-white/80 backdrop-blur-2xl border border-white/50 flex items-center justify-around px-4 z-[100] rounded-[2.5rem] shadow-2xl shadow-indigo-100/50">
                <NavItem icon={Calculator} label="Tính toán" active={activeTab === 'calc'} onClick={() => setActiveTab('calc')} />
                <NavItem icon={Search} label="Tra cứu" active={activeTab === 'search'} onClick={() => setActiveTab('search')} />
                <NavItem icon={HistoryIcon} label="Lịch sử" active={activeTab === 'history'} onClick={() => setActiveTab('history')} />
                {currentUser?.role === 'admin' && (
                    <NavItem icon={ShieldAlert} label="Hệ thống" active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} />
                )}
            </nav>
        </div>
    );
}
