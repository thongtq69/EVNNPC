import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
    BookOpen, Calculator, History as HistoryIcon, Search, ShieldCheck, Send, Sparkles, FileText, LayoutGrid, Plus, Trash2, Lock, User, Calendar, ExternalLink, Activity, Clock, ArrowRight, RotateCcw, FileCode, X, Edit3, Save, AlertTriangle, UserPlus, Users, Key, Shield
} from 'lucide-react';
import { ElectricityCalculationService, PRICE_PERIODS, DEFAULT_PRICES } from './services/calculationService';
import { AIService } from './services/aiService';
import { AuthAPI, CalculationAPI, HealthAPI, AdminAPI, PriceAPI } from './services/api';
import LoginScreen from './components/LoginScreen';
import AppHeader from './components/AppHeader';
import BottomNav from './components/BottomNav';
import HistoryTab from './components/HistoryTab';
import { Collapsible, GlassCard, RatioInput } from './components/ui';

// --- Constants ---
const AUTH_KEY = 'truythu_auth';
const HISTORY_KEY = 'truythu_history';
const GUEST_USER = { username: 'Khách dùng nhanh', role: 'user', guest: true };
const MONTH_NAMES = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

const LEGAL_DOCS = [
    { id: 'luatDienLuc2024', name: 'Luật Điện lực 2024', sub: '61/2024/QH15', keywords: ['2024', '61/2024', 'luật điện lực'], icon: ShieldCheck, color: 'text-emerald-500' },
    { id: 'thongTu60_2025', name: 'Thông tư 60/2025/TT-BCT', sub: 'Quy định về giá bán điện', keywords: ['60/2025', 'tt60'], icon: FileText, color: 'text-indigo-500' },
    { id: 'quyDinhGiaBanDien2025', name: 'QĐ 1279/QĐ-BCT', sub: 'Biểu giá bán lẻ điện 2025', keywords: ['1279', 'qđ 1279'], icon: Calculator, color: 'text-amber-500' },
    { id: 'quyDinhKiemTraDienLuc2022', name: 'Thông tư 42/2022/TT-BCT', sub: 'Kiểm tra hoạt động điện lực', keywords: ['42/2022', 'kiểm tra điện lực'], icon: BookOpen, color: 'text-sky-500' },
    { id: 'nghiDinh17_2022', name: 'Nghị định 17/2022/NĐ-CP', sub: 'Xử phạt vi phạm hành chính', keywords: ['17/2022', 'xử phạt'], icon: AlertTriangle, color: 'text-rose-500' },
];

const DEFAULT_MONTH = (index) => ({
    id: Date.now() + index,
    name: `Tháng ${index + 1}`,
    consumption: '',
    otherFee: '0',
    tyLeReality: { tyLeSinhHoat: 1, tyLeSanXuat: 0, tyLeKinhDoanh: 0, tyLeHCSNBenhVien: 0, tyLeHCSNChieuSang: 0 },
    tyLeApplied: { tyLeSinhHoat: 1, tyLeSanXuat: 0, tyLeKinhDoanh: 0, tyLeHCSNBenhVien: 0, tyLeHCSNChieuSang: 0 }
});

const ratioKeys = ['tyLeSinhHoat', 'tyLeSanXuat', 'tyLeKinhDoanh', 'tyLeHCSNBenhVien', 'tyLeHCSNChieuSang'];

const ratioTotal = (ratio) => ratioKeys.reduce((sum, key) => sum + (Number(ratio?.[key]) || 0), 0);

const isRatioValid = (ratio) => Math.abs(ratioTotal(ratio) - 1) < 0.001;

// --- Price Info Modal ---
const PriceInfoModal = ({ isOpen, onClose, periodId, setPeriodId, periods, customPrices, setCustomPrices, canEditPrices, onApply, applyLoading }) => {
    const fallbackPrice = Object.values(customPrices)[0] || Object.values(DEFAULT_PRICES)[0];
    const currentPrices = customPrices[periodId] || DEFAULT_PRICES[periodId] || fallbackPrice;

    const updatePrice = (key, value) => {
        if (!canEditPrices) {
            return;
        }
        setCustomPrices(prev => ({
            ...prev,
            [periodId]: { ...currentPrices, [key]: Number(value) }
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="bg-slate-50 px-8 py-6 flex items-center justify-between border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        {canEditPrices && (
                            <RotateCcw size={18} className="text-slate-400 cursor-pointer hover:text-indigo-600" onClick={() => setCustomPrices(prev => ({ ...prev, [periodId]: DEFAULT_PRICES[periodId] || currentPrices }))} />
                        )}
                        <h2 className="text-lg font-black font-outfit text-slate-800">Bảng giá điện</h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                </div>

                {/* Period Selector */}
                <div className="px-8 py-4 border-b border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Clock size={12} /> Chọn thời kỳ giá:</p>
                    <div className="flex gap-2">
                        {Object.values(periods).map(p => (
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
                            {canEditPrices && <Edit3 size={14} className="text-indigo-400" />}
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
                                        <input type="number" disabled={!canEditPrices} value={currentPrices[item.key]} onChange={e => updatePrice(item.key, e.target.value)} className={`w-20 text-right font-black rounded-lg p-2 border text-sm ${canEditPrices ? 'text-indigo-600 bg-white border-slate-100' : 'text-slate-500 bg-slate-100 border-slate-200 cursor-not-allowed'}`} />
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
                                        <input type="number" disabled={!canEditPrices} value={currentPrices[item.key]} onChange={e => updatePrice(item.key, e.target.value)} className={`w-20 text-right font-black rounded-lg p-2 border text-sm ${canEditPrices ? 'text-indigo-600 bg-white border-slate-100' : 'text-slate-500 bg-slate-100 border-slate-200 cursor-not-allowed'}`} />
                                        <span className="text-[10px] text-slate-400 font-bold">đ/kWh</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Thuế VAT</p>
                        <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
                            <span className="text-sm font-bold text-slate-700">VAT hiện tại</span>
                            <div className="flex items-center gap-1">
                                <input type="number" step="0.1" disabled={!canEditPrices} value={(Number(currentPrices.vat || 0) * 100).toFixed(1)} onChange={e => updatePrice('vat', (Number(e.target.value) || 0) / 100)} className={`w-20 text-right font-black rounded-lg p-2 border text-sm ${canEditPrices ? 'text-indigo-600 bg-white border-slate-100' : 'text-slate-500 bg-slate-100 border-slate-200 cursor-not-allowed'}`} />
                                <span className="text-[10px] text-slate-400 font-bold">%</span>
                            </div>
                        </div>
                    </div>

                    {!canEditPrices && (
                        <p className="text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-100 rounded-xl p-3">
                            Chỉ tài khoản admin mới có quyền chỉnh sửa bảng giá điện.
                        </p>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 py-4 bg-slate-50 border-t border-slate-100">
                    <button onClick={onApply} disabled={applyLoading} className={`w-full text-white font-black py-4 rounded-2xl shadow-lg ${applyLoading ? 'bg-indigo-400' : 'bg-indigo-600'}`}>
                        {applyLoading ? 'ĐANG LƯU...' : canEditPrices ? 'ÁP DỤNG' : 'ĐÓNG'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main App ---
export default function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [isGuestMode, setIsGuestMode] = useState(false);
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
    const canEditPrices = currentUser?.role === 'admin' && !isGuestMode;
    const [applyPriceLoading, setApplyPriceLoading] = useState(false);

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
    }, [activeTab, currentUser]);

    useEffect(() => {
        if (activeTab === 'history' && !isGuestMode && AuthAPI.isLoggedIn()) {
            fetchServerHistory();
        }
    }, [activeTab, isGuestMode]);

    // Mode & Period
    const [pricePeriods, setPricePeriods] = useState({ ...PRICE_PERIODS });
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
    const [serverHistory, setServerHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    // AI Chat
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [citations, setCitations] = useState([]);
    const [selectedModel, setSelectedModel] = useState('kimi-k2.5-free');
    const [aiStatus, setAiStatus] = useState('checking');
    const [aiHint, setAiHint] = useState('');
    const chatScrollRef = useRef(null);

    const fetchServerHistory = async () => {
        try {
            setHistoryLoading(true);
            const data = await CalculationAPI.getAll();
            setServerHistory(Array.isArray(data) ? data : []);
        } catch {
            setServerHistory([]);
        } finally {
            setHistoryLoading(false);
        }
    };

    // Check backend & load data
    useEffect(() => {
        const init = async () => {
            const health = await HealthAPI.check();
            setBackendStatus(health.status === 'ok' ? 'online' : 'offline');
            if (health.status === 'ok') {
                const aiReady = !!health?.env?.hasAI;
                setAiStatus(aiReady ? 'online' : 'fallback');
                setAiHint(aiReady ? '' : 'AI đang ở chế độ dự phòng do thiếu AI_API_KEY trên server.');
            } else {
                setAiStatus('offline');
                setAiHint('Backend chưa kết nối, không thể tra cứu AI.');
            }

            try {
                const priceConfig = await PriceAPI.getConfig();
                if (priceConfig?.periods) {
                    setPricePeriods(priceConfig.periods);
                }
                if (priceConfig?.prices) {
                    setCustomPrices(priceConfig.prices);
                }
                if (priceConfig?.currentPeriod) {
                    setPeriodId(priceConfig.currentPeriod);
                }
            } catch {
                // Keep frontend defaults when API price config is unavailable.
            }

            const savedHistory = localStorage.getItem(HISTORY_KEY);
            if (savedHistory) setHistory(JSON.parse(savedHistory));

            if (AuthAPI.isLoggedIn()) {
                setIsAuthenticated(true);
                setCurrentUser(AuthAPI.getUser());
                setIsGuestMode(false);
                await fetchServerHistory();
            } else if (localStorage.getItem(AUTH_KEY) === 'guest') {
                setIsAuthenticated(true);
                setCurrentUser(GUEST_USER);
                setIsGuestMode(true);
            }

            setLoading(false);
        };
        init();
    }, []);

    useEffect(() => {
        if (activeTab !== 'search') {
            return;
        }

        const el = chatScrollRef.current;
        if (el) {
            el.scrollTop = el.scrollHeight;
        }
    }, [messages, isTyping, citations, activeTab]);

    const handleQuickLogin = () => {
        localStorage.setItem(AUTH_KEY, 'guest');
        setCurrentUser(GUEST_USER);
        setIsGuestMode(true);
        setIsAuthenticated(true);
    };

    const handleLogin = async (username, password) => {
        if (!username || !password) {
            handleQuickLogin();
            return;
        }
        try {
            const data = await AuthAPI.login(username, password);
            localStorage.removeItem(AUTH_KEY);
            setCurrentUser({ username: data.username, role: data.role, guest: false });
            setIsGuestMode(false);
            setIsAuthenticated(true);
            await fetchServerHistory();
        } catch (err) {
            alert('Đăng nhập thất bại: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleLogout = () => {
        AuthAPI.logout();
        localStorage.removeItem(AUTH_KEY);
        setIsAuthenticated(false);
        setCurrentUser(null);
        setIsGuestMode(false);
        setServerHistory([]);
    };

    const handleApplyPrices = async () => {
        if (!canEditPrices) {
            setShowPriceModal(false);
            return;
        }

        try {
            setApplyPriceLoading(true);
            await PriceAPI.saveConfig({
                periods: pricePeriods,
                prices: customPrices,
                currentPeriod: periodId
            });
            setShowPriceModal(false);
            alert('Đã lưu và áp dụng bảng giá điện.');
        } catch (err) {
            if (err.response?.status === 404) {
                alert('Backend hiện tại chưa có API lưu bảng giá (/api/prices). Vui lòng cập nhật/deploy backend mới hoặc cấu hình VITE_API_BASE_URL trỏ đúng server local.');
            } else {
                alert(err.response?.data?.error || 'Không thể lưu bảng giá điện. Vui lòng thử lại.');
            }
        } finally {
            setApplyPriceLoading(false);
        }
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
        const prices = customPrices[periodId] || DEFAULT_PRICES[periodId] || Object.values(customPrices)[0] || Object.values(DEFAULT_PRICES)[0];
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

        if (monthsData.every(month => month.consumption <= 0)) {
            alert('Vui lòng nhập sản lượng điện cho ít nhất 1 tháng.');
            return;
        }

        const invalidMonth = monthsData.find(month => !isRatioValid(month.tyLeApplied) || !isRatioValid(month.tyLeReality));
        if (invalidMonth) {
            alert(`Tổng tỷ lệ tháng ${invalidMonth.name} phải bằng 100% cho cả Áp dụng và Thực tế.`);
            return;
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
        if (!result || isGuestMode) return;
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
            await fetchServerHistory();
            setTimeout(() => setSaveStatus(null), 2000);
        } catch (err) {
            setSaveStatus('error');
            console.error('Save error:', err);
            alert(err.response?.data?.error || 'Không thể lưu lên hệ thống. Vui lòng đăng nhập lại và thử lại.');
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
        const currentQuery = query.trim();
        if (currentQuery.length < 2) {
            alert('Vui lòng nhập nội dung tra cứu dài hơn.');
            return;
        }

        setMessages(prev => [...prev, { role: 'user', content: currentQuery }]);
        setQuery('');
        setIsTyping(true);
        setCitations([]);

        try {
            const result = await AIService.searchLegal(currentQuery, selectedModel);
            setMessages(prev => [...prev, { role: 'assistant', content: result.content }]);
            if (result.fallback) {
                setAiStatus('fallback');
                if (result.reason === 'invalid_api_key') {
                    setAiHint('AI key trên backend không hợp lệ. Cần cập nhật AI_API_KEY trên Vercel backend.');
                } else if (result.reason === 'missing_ai_key') {
                    setAiHint('Backend chưa cấu hình AI_API_KEY nên đang trả lời dự phòng.');
                } else {
                    setAiHint('AI upstream đang lỗi/tạm quá tải, hệ thống chuyển sang chế độ dự phòng.');
                }
            } else {
                setAiStatus('online');
                setAiHint('');
            }
            setCitations(LEGAL_DOCS.filter(doc => doc.keywords.some(k => result.content.toLowerCase().includes(k.toLowerCase()) || currentQuery.toLowerCase().includes(k.toLowerCase()))));
        } catch (err) {
            console.error('AI Error:', err);
            setAiStatus('offline');
            setAiHint('Tra cứu AI lỗi kết nối. Vui lòng thử lại sau.');
            setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ Lỗi kết nối AI: ${err.response?.data?.error || err.message}. Vui lòng thử lại hoặc chọn model khác.` }]);
        }
        finally { setIsTyping(false); }
    };

    // --- Login Screen ---
    const [loginUsername, setLoginUsername] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" /></div>;

    if (!isAuthenticated) return <LoginScreen backendStatus={backendStatus} loginUsername={loginUsername} loginPassword={loginPassword} onLoginUsernameChange={setLoginUsername} onLoginPasswordChange={setLoginPassword} onQuickLogin={handleQuickLogin} onAccountLogin={() => handleLogin(loginUsername, loginPassword)} />;

    // --- MAIN RENDER ---
    return (
        <div className="bg-slate-50 min-h-screen text-slate-900 font-sans pb-32">
            <PriceInfoModal isOpen={showPriceModal} onClose={() => setShowPriceModal(false)} periodId={periodId} setPeriodId={setPeriodId} periods={pricePeriods} customPrices={customPrices} setCustomPrices={setCustomPrices} canEditPrices={canEditPrices} onApply={handleApplyPrices} applyLoading={applyPriceLoading} />
            <AppHeader backendStatus={backendStatus} isGuestMode={isGuestMode} onOpenPrice={() => setShowPriceModal(true)} onLogout={handleLogout} />

            <main className="max-w-2xl mx-auto px-5 pt-8">
                <AnimatePresence mode="wait">
                    {activeTab === 'calc' && (
                        <div key="calc" className="space-y-8">
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
                                    {Object.values(pricePeriods).map(p => (
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
                                                    <div key={m.id} className="bg-slate-50/50 rounded-[2rem] p-6 border border-slate-100/50 space-y-5 group">
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
                                                    </div>
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
                                                        <div key={mIdx} className="bg-slate-50/50 rounded-[2rem] p-6 border border-slate-100/50 space-y-5">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs">{mIdx + 1}</div>
                                                                <span className="font-black text-slate-700">{MONTH_NAMES[mIdx]} / {selectedYear}</span>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="space-y-1.5"><p className="text-[9px] font-black uppercase text-slate-400 ml-1">Sản lượng (kWh)</p><input type="number" value={yearlyMonthData[mIdx]?.consumption || ''} onChange={e => updateYearlyField(mIdx, 'consumption', e.target.value)} className="w-full bg-white rounded-xl p-3.5 text-sm font-black border border-slate-100 shadow-sm outline-none" /></div>
                                                                <div className="space-y-1.5"><p className="text-[9px] font-black uppercase text-slate-400 ml-1">Phí khác (đ)</p><input type="number" value={yearlyMonthData[mIdx]?.otherFee || '0'} onChange={e => updateYearlyField(mIdx, 'otherFee', e.target.value)} className="w-full bg-white rounded-xl p-3.5 text-sm font-black border border-slate-100 shadow-sm outline-none" /></div>
                                                            </div>
                                                            <Collapsible label="Tỷ lệ đã áp dụng (Sai)"><div className="grid gap-3 pt-2">{[{ k: 'tyLeSinhHoat', l: 'Sinh hoạt BT' }, { k: 'tyLeSanXuat', l: 'Sản xuất BT' }, { k: 'tyLeKinhDoanh', l: 'Kinh doanh DV' }, { k: 'tyLeHCSNBenhVien', l: 'HCSN (Bệnh viện)' }, { k: 'tyLeHCSNChieuSang', l: 'HCSN (Chiếu sáng)' }].map(item => <RatioInput key={item.k} label={item.l} value={yearlyMonthData[mIdx]?.tyLeApplied?.[item.k] || 0} onChange={v => updateYearlyRatio(mIdx, 'tyLeApplied', item.k, v)} />)}</div></Collapsible>
                                                            <Collapsible label="Tỷ lệ thực tế (Đúng)"><div className="grid gap-3 pt-2">{[{ k: 'tyLeSinhHoat', l: 'Sinh hoạt BT' }, { k: 'tyLeSanXuat', l: 'Sản xuất BT' }, { k: 'tyLeKinhDoanh', l: 'Kinh doanh DV' }, { k: 'tyLeHCSNBenhVien', l: 'HCSN (Bệnh viện)' }, { k: 'tyLeHCSNChieuSang', l: 'HCSN (Chiếu sáng)' }].map(item => <RatioInput key={item.k} label={item.l} value={yearlyMonthData[mIdx]?.tyLeReality?.[item.k] || 0} onChange={v => updateYearlyRatio(mIdx, 'tyLeReality', item.k, v)} />)}</div></Collapsible>
                                                        </div>
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
                                <div className="space-y-6">
                                    <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px]" />
                                        <div className="relative">
                                            <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Chênh lệch truy thu</p>
                                            <h3 className="text-5xl font-black font-outfit mb-8">{Math.abs(result.diff).toLocaleString()} <span className="text-xl opacity-30">đ</span></h3>
                                            <div className="grid grid-cols-2 gap-4 mb-6">
                                                <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5"><p className="text-white/30 text-[9px] font-black uppercase mb-1">Tiền đã tính</p><p className="text-xl font-bold">{Math.round(result.tongTienDaTinh).toLocaleString()} đ</p></div>
                                                <div className="bg-emerald-500/10 p-6 rounded-[2rem] border border-emerald-500/10 text-emerald-400"><p className="text-emerald-500/40 text-[9px] font-black uppercase mb-1">Tiền đúng giá</p><p className="text-xl font-bold">{Math.round(result.tongTienDungGia).toLocaleString()} đ</p></div>
                                            </div>
                                            {backendStatus === 'online' && !isGuestMode && (
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
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'search' && (
                        <div key="search" className="flex flex-col gap-4">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-14 h-14 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl"><Sparkles size={28} /></div>
                                    <div>
                                        <h2 className="text-2xl font-black font-outfit text-slate-800">Cố vấn Pháp lý</h2>
                                        <p className={`text-[10px] font-black uppercase ${aiStatus === 'online' ? 'text-emerald-500' : aiStatus === 'fallback' ? 'text-amber-500' : 'text-rose-500'}`}>
                                            ● {aiStatus === 'online' ? 'AI Online' : aiStatus === 'fallback' ? 'AI Dự phòng' : 'AI Offline'}
                                        </p>
                                    </div>
                                </div>
                                <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)} className="bg-white border border-slate-100 rounded-xl px-3 py-2 text-xs font-black">
                                    <option value="kimi-k2.5-free">Kimi K2.5</option>
                                    <option value="minimax-m2.5-free">Minimax M2.5</option>
                                    <option value="trinity-large-preview-free">Trinity Large</option>
                                    <option value="glm-4.7-free">GLM-4.7</option>
                                </select>
                            </div>
                            {aiHint && (
                                <div className="mb-4 bg-amber-50 border border-amber-100 text-amber-700 text-[11px] font-bold rounded-xl px-4 py-3">
                                    {aiHint}
                                </div>
                            )}
                            <div ref={chatScrollRef} className="h-[42vh] min-h-[280px] overflow-y-auto space-y-4 pr-1 pb-2">
                                {messages.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center opacity-35 text-center space-y-4">
                                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center border-4 border-white shadow-inner"><Search size={34} className="text-indigo-400" /></div>
                                        <p className="font-black text-[11px] uppercase tracking-[0.2em]">Hỏi bất cứ điều gì về Luật điện lực</p>
                                    </div>
                                )}
                                {messages.map((m, idx) => (
                                    <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] rounded-3xl px-5 py-4 shadow-sm ${m.role === 'user' ? 'bg-slate-900 text-white font-bold' : 'bg-white border border-slate-100 text-slate-700'}`}>
                                            <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">{m.content}</p>
                                        </div>
                                    </div>
                                ))}
                                {isTyping && <div className="flex gap-2 p-4 bg-indigo-50 border border-indigo-100/50 rounded-2xl w-fit items-center"><div className="flex gap-1"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" /><div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce delay-100" /><div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce delay-200" /></div><span className="text-[10px] font-black text-indigo-400 uppercase ml-1">AI đang xử lý...</span></div>}
                                {citations.length > 0 && <div className="space-y-3 pt-4"><p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-2"><BookOpen size={14} /> Cơ sở trích dẫn</p><div className="grid gap-2">{citations.map(c => <div key={c.id} className="bg-white/80 p-4 rounded-2xl border border-slate-100 flex items-center gap-4"><div className={`w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center ${c.color}`}><c.icon size={20} /></div><div className="flex-1"><p className="font-black text-slate-800 text-xs">{c.name}</p><p className="text-[9px] font-bold text-slate-400 uppercase">{c.sub}</p></div><ExternalLink size={14} className="text-slate-200" /></div>)}</div></div>}
                            </div>
                            <form onSubmit={handleSearch} className="relative mt-1"><input type="text" placeholder="Hỏi về Luật điện lực 2024..." value={query} onChange={e => setQuery(e.target.value)} className="w-full bg-white/80 backdrop-blur-md border border-slate-200 rounded-[2.5rem] p-5 pr-20 shadow-2xl outline-none focus:ring-4 focus:ring-indigo-600/10 font-bold" /><button type="submit" disabled={isTyping || !query.trim()} className={`absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 text-white rounded-full shadow-xl flex items-center justify-center ${isTyping || !query.trim() ? 'bg-indigo-300' : 'bg-indigo-600'}`}><Send size={22} /></button></form>

                            {messages.length === 0 && <div className="mt-6 space-y-4 pb-8">
                                <div className="flex items-center gap-2 mb-4"><BookOpen size={18} className="text-indigo-500" /><h3 className="text-sm font-black text-slate-700 uppercase">Danh mục văn bản hỗ trợ</h3></div>
                                <div className="grid gap-3">
                                    {LEGAL_DOCS.map(doc => <GlassCard key={doc.id} className="p-4 group"><div className="flex items-center gap-4"><div className={`w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center ${doc.color} group-hover:scale-110 transition-transform`}><doc.icon size={24} /></div><div className="flex-1"><p className="font-black text-slate-800 text-sm">{doc.name}</p><p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">{doc.sub}</p></div><ExternalLink size={20} className="text-slate-200 group-hover:text-indigo-200" /></div></GlassCard>)}
                                </div>
                            </div>}
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div key="history">
                            <HistoryTab historyLoading={historyLoading} isGuestMode={isGuestMode} history={history} serverHistory={serverHistory} />
                        </div>
                    )}

                    {activeTab === 'admin' && currentUser?.role === 'admin' && (
                        <div key="admin" className="space-y-8">
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
                        </div>
                    )}
                </AnimatePresence>
            </main>

            <p className="text-center text-[10px] font-bold text-slate-400 pb-24">PC Hà Tĩnh - EVNNPC</p>

            <BottomNav activeTab={activeTab} currentUser={currentUser} onTabChange={setActiveTab} />
        </div>
    );
}
