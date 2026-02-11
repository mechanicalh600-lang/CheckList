
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ChevronLeft, RefreshCw, Trash2, AlertCircle, CheckCircle, ShieldCheck, Search, Database, Plus, Edit, UploadCloud, X, Save, KeyRound, User, Camera, ListChecks, ChevronDown, AlertTriangle, FileSpreadsheet, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { fetchTableData, insertData, updateData, deleteRows, upsertData, adminResetUserPassword, uploadFile, checkRecordExists } from '@/services/supabaseClient';
import { seedDatabase } from '@/services/seedService';
import { UserRole } from '@/types';
import XLSX from 'xlsx-js-style';

interface AdminDashboardProps {
    onBack: () => void;
    userRole: string;
    onViewReport: (report: any) => void;
}

const ROLES: {value: UserRole, label: string}[] = [
    { value: 'super_admin', label: 'مدیر ارشد (Super Admin)' },
    { value: 'admin', label: 'مدیر سیستم (Admin)' },
    { value: 'operator', label: 'اپراتور (Operator)' },
    { value: 'net', label: 'واحد نت (NET)' },
    { value: 'technical', label: 'واحد فنی (Technical)' },
    { value: 'cm', label: 'پایش وضعیت (CM)' },
    { value: 'wearhouse', label: 'انبار (Warehouse)' },
    { value: 'manager', label: 'مدیریت (Manager)' },
    { value: 'other', label: 'سایر' },
];

const SCHEMA: any = {
    USERS: {
        label: 'کاربران',
        table: 'defined_users',
        idField: 'code',
        columns: [
            { key: 'avatar_url', label: 'تصویر', type: 'image' },
            { key: 'code', label: 'کد پرسنلی', required: true },
            { key: 'name', label: 'نام و نام خانوادگی', required: true },
            { key: 'org', label: 'واحد سازمانی' },
            { key: 'role', label: 'نقش کاربری', type: 'select', options: ROLES },
        ],
        allowAdd: true,
        allowEdit: true,
        allowImport: true,
        allowDelete: true,
    },
    ASSETS: {
        label: 'تجهیزات',
        table: 'defined_assets',
        idField: 'code',
        columns: [
            { key: 'code', label: 'کد تجهیز', required: true },
            { key: 'name', label: 'نام تجهیز', required: true },
            { key: 'description', label: 'نام محلی/توضیحات' },
        ],
        allowAdd: true,
        allowEdit: true,
        allowImport: true,
        allowDelete: true,
    },
    JOBCARDS: {
        label: 'کارت فعالیت',
        table: 'job_cards',
        idField: 'code',
        columns: [
            { key: 'code', label: 'کد کارت فعالیت', required: true },
            { key: 'name', label: 'شرح فعالیت', required: true, widthClass: 'min-w-[420px]' },
        ],
        allowAdd: true,
        allowEdit: true,
        allowImport: true,
        allowDelete: true,
    },
    CHECKLISTS: {
        label: 'مدیریت چک‌لیست‌ها',
        table: 'defined_checklist_items',
        idField: 'id',
        columns: [
            { key: 'sequence', label: 'ترتیب', type: 'number' },
            { key: 'task', label: 'شرح چک لیست', required: true },
            { key: 'description', label: 'توضحات' },
        ],
        allowAdd: true,
        allowEdit: true,
        allowImport: true,
        allowDelete: true,
        upsertKey: 'id',
        parentTable: 'job_cards', 
    },
    SCHEDULES: {
        label: 'پلن اجرا (PM)',
        table: 'asset_schedules',
        idField: 'id',
        columns: [
            { key: 'plan_code', label: 'کد پلن', required: true },
            { key: 'asset_number', label: 'کد تجهیز', required: true },
            { key: 'job_card_code', label: 'کد کارت فعالیت', required: true },
            { key: 'job_card_name', label: 'نام فعالیت' },
        ],
        allowAdd: true,
        allowEdit: true,
        allowImport: true,
        allowDelete: true,
    }
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack, userRole, onViewReport }) => {
    const [activeTab, setActiveTab] = useState('USERS'); 
    const [loading, setLoading] = useState(false);
    const [seeding, setSeeding] = useState(false);
    const [dataList, setDataList] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<any>>(new Set());
    
    // Checklist Master-Detail State
    const [selectedJobCard, setSelectedJobCard] = useState<any>(null); 

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [formData, setFormData] = useState<any>({});
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const compareByCode = (a: any, b: any, key: string) => {
        const aValue = String(a?.[key] ?? '').trim();
        const bValue = String(b?.[key] ?? '').trim();
        return aValue.localeCompare(bValue, 'en', { numeric: true, sensitivity: 'base' });
    };

    const visibleTabs = useMemo(() => {
        return Object.keys(SCHEMA);
    }, []);

    useEffect(() => {
        if (!visibleTabs.includes(activeTab)) {
            setActiveTab(visibleTabs[0]);
        }
    }, [visibleTabs, activeTab]);

    const currentSchema = SCHEMA[visibleTabs.includes(activeTab) ? activeTab : visibleTabs[0]];

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // Computed Properties for Checklists
    const isChecklistDetail = activeTab === 'CHECKLISTS' && !!selectedJobCard;
    const isChecklistMaster = activeTab === 'CHECKLISTS' && !selectedJobCard;

    const displayColumns = useMemo(() => {
        if (isChecklistMaster) {
            return SCHEMA.JOBCARDS.columns;
        }
        return currentSchema.columns;
    }, [isChecklistMaster, currentSchema]);

    const filteredData = useMemo(() => {
        if (!searchTerm) return dataList;
        const lowerTerm = searchTerm.toLowerCase();
        return dataList.filter(item => {
            return Object.values(item).some(val => 
                String(val).toLowerCase().includes(lowerTerm)
            );
        });
    }, [dataList, searchTerm]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
    const paginatedData = useMemo(() => {
        return filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    }, [filteredData, currentPage, itemsPerPage]);

    const loadData = useCallback(async () => {
        setLoading(true);
        setStatusMessage(null);
        
        try {
            let data;
            
            if (activeTab === 'CHECKLISTS') {
                if (selectedJobCard) {
                    data = await fetchTableData('defined_checklist_items', { job_card_code: selectedJobCard.code });
                    data.sort((a: any, b: any) => (a.sequence || 0) - (b.sequence || 0));
                } else {
                    data = await fetchTableData('job_cards');
                    data.sort((a: any, b: any) => compareByCode(a, b, 'code'));
                }
            } else {
                data = await fetchTableData(currentSchema.table);
                if (activeTab === 'USERS') {
                    data.sort((a: any, b: any) => compareByCode(a, b, 'code'));
                } else if (activeTab === 'ASSETS') {
                    data.sort((a: any, b: any) => compareByCode(a, b, 'code'));
                } else if (activeTab === 'SCHEDULES') {
                    data.sort((a: any, b: any) => compareByCode(a, b, 'plan_code'));
                }
            }

            setDataList(data || []);
        } catch (error: any) {
            console.error("Load error", error);
            setStatusMessage({ type: 'error', text: `خطا در بارگذاری داده‌ها: ${error.message}` });
        } finally {
            setLoading(false);
        }
    }, [activeTab, selectedJobCard, currentSchema.table]);

    useEffect(() => { 
        void loadData(); 
        setSelectedIds(new Set());
        setCurrentPage(1);
        setSearchTerm(''); 
    }, [loadData]);

    const handleSeed = async () => {
        if (!confirm('آیا مطمئن هستید؟ این عملیات دیتابیس را با داده‌های اولیه همگام‌سازی می‌کند.')) return;
        setSeeding(true);
        setStatusMessage(null);
        const result = await seedDatabase((msg) => setStatusMessage({ type: 'success', text: msg }));
        setSeeding(false);
        if (result) {
            loadData();
        } else {
            setStatusMessage({ type: 'error', text: 'خطا در همگام‌سازی دیتابیس' });
        }
    };

    const handleDelete = async (ids: any[]) => {
        if (!confirm('آیا از حذف موارد انتخاب شده اطمینان دارید؟')) return;
        setLoading(true);
        try {
            const table = (activeTab === 'CHECKLISTS' && selectedJobCard) ? 'defined_checklist_items' : currentSchema.table;
            await deleteRows(table, ids, currentSchema.idField);
            setStatusMessage({ type: 'success', text: 'حذف با موفقیت انجام شد' });
            setSelectedIds(new Set());
            loadData();
        } catch (e: any) {
            setStatusMessage({ type: 'error', text: `خطا در حذف: ${e.message}` });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatusMessage(null);
        try {
            const rawFormData = { ...formData };
            if (activeTab === 'USERS' && avatarFile) {
                const userCode = rawFormData.code || editingItem?.code;
                if (!userCode) throw new Error("کد پرسنلی الزامی است");
                const fileExt = avatarFile.name.split('.').pop();
                const fileName = `avatar_${userCode}_${Date.now()}.${fileExt}`;
                const publicUrl = await uploadFile('avatars', fileName, avatarFile);
                if (publicUrl) rawFormData.avatar_url = publicUrl;
            }
            if (activeTab === 'CHECKLISTS' && selectedJobCard) {
                rawFormData.job_card_code = selectedJobCard.code;
            }
            const allowedKeys = currentSchema.columns.map((c: any) => c.key);
            if (activeTab === 'CHECKLISTS' && selectedJobCard) allowedKeys.push('job_card_code');
            if (currentSchema.idField) allowedKeys.push(currentSchema.idField); 
            const dataToSave: any = {};
            Object.keys(rawFormData).forEach(key => {
                if (allowedKeys.includes(key) || key === 'avatar_url') {
                     dataToSave[key] = rawFormData[key];
                }
            });
            if (!editingItem) {
                if (activeTab === 'SCHEDULES') {
                    const exists = await checkRecordExists('asset_schedules', 'plan_code', dataToSave.plan_code);
                    if (exists) throw new Error(`کد پلن ${dataToSave.plan_code} قبلا ثبت شده است.`);
                }
                else if (currentSchema.idField && activeTab !== 'CHECKLISTS') {
                    const exists = await checkRecordExists(currentSchema.table, currentSchema.idField, dataToSave[currentSchema.idField]);
                    if (exists) throw new Error(`رکوردی با شناسه ${dataToSave[currentSchema.idField]} قبلا ثبت شده است.`);
                }
            }
            const table = (activeTab === 'CHECKLISTS' && selectedJobCard) ? 'defined_checklist_items' : currentSchema.table;
            if (editingItem) {
                await updateData(table, editingItem[currentSchema.idField], dataToSave, currentSchema.idField);
                setStatusMessage({ type: 'success', text: 'ویرایش با موفقیت انجام شد' });
            } else {
                await insertData(table, dataToSave);
                setStatusMessage({ type: 'success', text: 'ثبت با موفقیت انجام شد' });
            }
            setShowModal(false);
            setAvatarFile(null);
            setAvatarPreview(null);
            loadData();
        } catch (e: any) {
            setStatusMessage({ type: 'error', text: `خطا در ذخیره: ${e.message}` });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordReset = async (userCode: string) => {
        if (!confirm(`آیا از بازنشانی رمز عبور کاربر ${userCode} اطمینان دارید؟`)) return;
        setLoading(true);
        const result = await adminResetUserPassword(userCode);
        setLoading(false);
        if (result.success) {
            setStatusMessage({ type: 'success', text: 'رمز عبور کاربر بازنشانی شد. (رمز پیش‌فرض: کد پرسنلی)' });
        } else {
            setStatusMessage({ type: 'error', text: result.message || 'خطا در بازنشانی رمز عبور' });
        }
    };

    const handleExportExcel = () => {
        if (!filteredData || filteredData.length === 0) {
            setStatusMessage({ type: 'error', text: 'داده‌ای برای دانلود وجود ندارد.' });
            return;
        }
        const exportData = filteredData.map(row => {
            const newRow: any = {};
            currentSchema.columns.forEach((col: any) => {
                let val = row[col.key];
                if (col.type === 'select' && col.options) {
                    const opt = col.options.find((o: any) => o.value === val);
                    val = opt ? opt.label : val;
                } else if (col.type === 'date' && val) {
                    val = new Date(val).toLocaleDateString('fa-IR');
                } else if (col.type === 'datetime' && val) {
                    val = new Date(val).toLocaleString('fa-IR');
                }
                newRow[col.label] = val;
            });
            return newRow;
        });
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        worksheet['!dir'] = 'rtl';
        worksheet['!views'] = [{ 
            state: 'frozen', 
            xSplit: 0, 
            ySplit: 1, 
            activeCell: 'A2',
            rightToLeft: true 
        }];
        const colWidths = currentSchema.columns.map((col: any) => {
            const maxContentLength = Math.max(
                col.label.length,
                ...exportData.map((row: any) => String(row[col.label] || "").length)
            );
            return { wch: Math.min(maxContentLength + 5, 50) }; 
        });
        worksheet['!cols'] = colWidths;
        const range = XLSX.utils.decode_range(worksheet['!ref'] || "A1");
        for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
                if (!worksheet[cell_address]) continue;
                const cell = worksheet[cell_address];
                const style: any = {
                    font: { name: "Tahoma", sz: 10 },
                    alignment: { vertical: "center", horizontal: "center" },
                    border: {
                        top: { style: "thin", color: { rgb: "CCCCCC" } },
                        bottom: { style: "thin", color: { rgb: "CCCCCC" } },
                        left: { style: "thin", color: { rgb: "CCCCCC" } },
                        right: { style: "thin", color: { rgb: "CCCCCC" } }
                    }
                };
                if (R === 0) {
                    style.font = { name: "Tahoma", sz: 11, bold: true, color: { rgb: "FFFFFF" } };
                    style.fill = { fgColor: { rgb: "1E293B" } }; 
                    style.alignment.wrapText = true;
                } else if (R % 2 === 0) {
                    style.fill = { fgColor: { rgb: "F8FAFC" } }; 
                }
                cell.s = style;
            }
        }
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
        const fileName = `${SCHEMA[activeTab].label}_${new Date().toLocaleDateString('fa-IR').replace(/\//g, '-')}.xlsx`;
        XLSX.writeFile(workbook, fileName);
    };

    // Helper Functions
    const toggleSelect = (id: any) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const selectAll = () => {
        if (selectedIds.size === filteredData.length && filteredData.length > 0) {
            setSelectedIds(new Set());
        } else {
            const idField = isChecklistMaster ? 'code' : currentSchema.idField;
            const newSet = new Set(filteredData.map(item => item[idField]));
            setSelectedIds(newSet);
        }
    };

    const openModal = (item: any = null) => {
        setEditingItem(item);
        setFormData(item ? { ...item } : {});
        setAvatarFile(null);
        setAvatarPreview(item?.avatar_url || null);
        setShowModal(true);
    };

    const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;
        const file = e.target.files[0];
        if (!file.name.toLowerCase().endsWith('.xlsx')) {
            setStatusMessage({ type: 'error', text: 'فرمت فایل باید XLSX باشد.' });
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }
        setLoading(true);
        
        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);
                
                // Determine target table and mapping
                const table = (activeTab === 'CHECKLISTS' && selectedJobCard) ? 'defined_checklist_items' : currentSchema.table;
                
                const labelToKey: any = {};
                currentSchema.columns.forEach((col: any) => {
                    labelToKey[col.label] = col.key;
                });
                
                const payload = data.map((row: any) => {
                    const newRow: any = {};
                    Object.keys(row).forEach(header => {
                        const key = labelToKey[header] || header; 
                        newRow[key] = row[header];
                    });
                    
                    if (activeTab === 'CHECKLISTS' && selectedJobCard) {
                        newRow.job_card_code = selectedJobCard.code;
                    }
                    if (activeTab === 'USERS') {
                        newRow.force_change_password = true;
                    }
                    
                    return newRow;
                });
                
                if (currentSchema.upsertKey) {
                    await upsertData(table, payload, currentSchema.upsertKey);
                } else if (currentSchema.idField) {
                     await upsertData(table, payload, currentSchema.idField);
                } else {
                     const { error } = await import('../services/supabaseClient').then(m => m.supabase.from(table).insert(payload));
                     if (error) throw error;
                }
                
                setStatusMessage({ type: 'success', text: `${payload.length} رکورد با موفقیت وارد شد` });
                loadData();
            } catch (error: any) {
                console.error("Import error", error);
                setStatusMessage({ type: 'error', text: `خطا در وارد کردن داده‌ها: ${error.message}` });
            } finally {
                setLoading(false);
                if (fileInputRef.current) fileInputRef.current.value = "";
            }
        };
        reader.readAsBinaryString(file);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col font-sans">
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 sticky top-0 z-30 shadow-sm flex items-center justify-between no-print">
                <div className="flex items-center gap-3">
                    <button onClick={() => isChecklistDetail ? setSelectedJobCard(null) : onBack()} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                        <ChevronRight className="rtl:rotate-180 dark:text-white" />
                    </button>
                    <div>
                        <h1 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                            <ShieldCheck className="text-red-600" />
                            پنل مدیریت
                        </h1>
                        {isChecklistDetail && <p className="text-xs text-slate-500 dark:text-slate-400">ویرایش چک‌لیست: {selectedJobCard.name}</p>}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {userRole === 'super_admin' && (
                        <button onClick={handleSeed} disabled={seeding} className="hidden sm:flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-700 transition-colors">
                            {seeding ? <RefreshCw className="animate-spin" size={16}/> : <Database size={16}/>}
                            <span>همگام‌سازی دیتابیس</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 px-4 pt-2 border-b border-slate-200 dark:border-slate-700 overflow-x-auto hide-scrollbar no-print">
                <div className="flex gap-6 min-w-max">
                    {visibleTabs.map(tabKey => (
                        <button
                            key={tabKey}
                            onClick={() => setActiveTab(tabKey)}
                            className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === tabKey ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                        >
                            {SCHEMA[tabKey].label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between sticky top-[73px] z-10 bg-slate-50 dark:bg-slate-900/95 backdrop-blur-sm no-print">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="جستجو در نتایج..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pr-10 pl-4 text-sm outline-none focus:border-blue-500 dark:text-white transition-all shadow-sm"
                    />
                </div>
                {/* Toolbar Actions (Add, Edit, etc) */}
                <div className="flex gap-2 w-full sm:w-auto">
                    {currentSchema.allowAdd && !isChecklistMaster && (
                        <button onClick={() => openModal()} className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-95">
                            <Plus size={18} />
                            <span>افزودن</span>
                        </button>
                    )}
                    {/* Dynamic Actions */}
                    {selectedIds.size === 1 && (
                        <>
                            {currentSchema.allowEdit && !isChecklistMaster && (
                                <button onClick={() => {
                                    const id = Array.from(selectedIds)[0];
                                    const item = filteredData.find(i => i[currentSchema.idField] === id);
                                    if (item) openModal(item);
                                }} className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-95">
                                    <Edit size={18} />
                                    <span className="hidden sm:inline">ویرایش</span>
                                </button>
                            )}
                            {activeTab === 'USERS' && (
                                <button onClick={() => {
                                    const id = Array.from(selectedIds)[0];
                                    handlePasswordReset(String(id));
                                }} className="flex-1 sm:flex-none bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all active:scale-95">
                                    <KeyRound size={18} />
                                    <span className="hidden sm:inline">رمز عبور</span>
                                </button>
                            )}
                            {isChecklistMaster && (
                                <button onClick={() => {
                                    const id = Array.from(selectedIds)[0];
                                    const item = filteredData.find(i => i.code === id);
                                    if (item) setSelectedJobCard(item);
                                }} className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition-all active:scale-95">
                                    <ListChecks size={18} />
                                    <span className="hidden sm:inline">آیتم‌ها</span>
                                </button>
                            )}
                        </>
                    )}
                    <button onClick={handleExportExcel} className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 transition-all active:scale-95">
                        <FileSpreadsheet size={18} />
                        <span>دریافت اکسل</span>
                    </button>
                    {currentSchema.allowImport && !isChecklistMaster && (
                        <label className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer">
                            <UploadCloud size={18} />
                            <span>بارگذاری اکسل</span>
                            <input type="file" ref={fileInputRef} onChange={handleImportExcel} accept=".xlsx" className="hidden" />
                        </label>
                    )}
                    {selectedIds.size > 0 && !isChecklistMaster && (
                        <button onClick={() => handleDelete(Array.from(selectedIds))} className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 animate-in fade-in slide-in-from-bottom-2">
                            <Trash2 size={18} />
                            <span>حذف ({selectedIds.size})</span>
                        </button>
                    )}
                    <button onClick={loadData} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {statusMessage && (
                <div className={`mx-4 mb-4 p-4 rounded-xl flex items-center gap-3 text-sm font-bold animate-in fade-in slide-in-from-top-2 no-print ${statusMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {statusMessage.type === 'success' ? <CheckCircle2 size={20}/> : <AlertCircle size={20}/>}
                    {statusMessage.text}
                </div>
            )}

            <div className="flex-1 px-4 pb-4 overflow-hidden flex flex-col">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex-1 flex flex-col no-print">
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-sm text-right">
                            <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    {(currentSchema.allowEdit || currentSchema.allowDelete) && (
                                        <th className="p-4 w-10">
                                            <button onClick={selectAll} className="text-slate-400 hover:text-blue-500">
                                                {selectedIds.size === filteredData.length && filteredData.length > 0 ? <CheckCircle size={20} /> : <div className="w-5 h-5 border-2 border-slate-300 rounded"></div>}
                                            </button>
                                        </th>
                                    )}
                                    {displayColumns.map((col: any) => (
                                        <th key={col.key} className={`p-4 whitespace-nowrap ${col.widthClass || ''}`}>{col.label}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {paginatedData.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="p-10 text-center text-slate-400">
                                            {loading ? 'در حال بارگذاری...' : 'داده‌ای یافت نشد'}
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedData.map((item, idx) => {
                                        const rowId = isChecklistMaster ? item.code : item[currentSchema.idField];
                                        const canSelectRow = currentSchema.allowEdit || currentSchema.allowDelete;
                                        return (
                                        <tr
                                            key={idx}
                                            onClick={() => {
                                                if (canSelectRow) toggleSelect(rowId);
                                            }}
                                            className={`transition-colors group border-b border-slate-100 dark:border-slate-700/50 ${
                                                idx % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-800/50'
                                            } hover:bg-blue-50 dark:hover:bg-slate-700/50 ${canSelectRow ? 'cursor-pointer' : ''}`}
                                        >
                                            {(currentSchema.allowEdit || currentSchema.allowDelete) && (
                                                <td className="p-4">
                                                    <button onClick={(e) => { e.stopPropagation(); toggleSelect(rowId); }} className={`transition-colors ${selectedIds.has(rowId) ? 'text-blue-600' : 'text-slate-300 group-hover:text-slate-400'}`}>
                                                        {selectedIds.has(rowId) ? <CheckCircle size={20} /> : <div className="w-5 h-5 border-2 border-slate-300 rounded"></div>}
                                                    </button>
                                                </td>
                                            )}
                                            {displayColumns.map((col: any) => (
                                                <td key={col.key} className="p-4 text-slate-700 dark:text-slate-300">
                                                    {col.type === 'status' ? (
                                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                            item[col.key] === 'اتمام یافته' ? 'bg-green-100 text-green-700' : 
                                                            item[col.key] === 'ارسال به cmms' ? 'bg-blue-100 text-blue-700' : 
                                                            'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                            {item[col.key] || '---'}
                                                        </span>
                                                    ) : col.type === 'image' ? (
                                                        <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                                                            {item[col.key] ? <img src={item[col.key]} className="w-full h-full object-cover" /> : <User className="w-full h-full p-2 text-slate-400" />}
                                                        </div>
                                                    ) : col.type === 'select' ? (
                                                        <span>{col.options?.find((o: any) => o.value === item[col.key])?.label || item[col.key]}</span>
                                                    ) : col.type === 'date' ? (
                                                        <span className="font-mono text-xs">{new Date(item[col.key]).toLocaleDateString('fa-IR')}</span>
                                                    ) : col.type === 'datetime' ? (
                                                        <span className="font-mono text-xs text-blue-600 dark:text-blue-400 dir-ltr">
                                                            {(() => {
                                                                const d = new Date(item[col.key]);
                                                                const datePart = d.toLocaleDateString('fa-IR');
                                                                const timePart = d.toLocaleTimeString('fa-IR', {hour: '2-digit', minute: '2-digit'});
                                                                return `${timePart} | ${datePart}`;
                                                            })()}
                                                        </span>
                                                    ) : (
                                                        <span
                                                            className={`block ${
                                                                ((isChecklistMaster || activeTab === 'JOBCARDS') && col.key === 'name')
                                                                    ? 'min-w-[420px] max-w-[720px] whitespace-normal break-words leading-relaxed'
                                                                    : 'truncate max-w-[200px]'
                                                            }`}
                                                            title={item[col.key]}
                                                        >
                                                            {item[col.key]}
                                                        </span>
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">نمایش</span>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => {
                                    setItemsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-white text-xs rounded-lg px-2 py-1 outline-none focus:border-blue-500"
                            >
                                <option value={10}>10</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                                <option value={200}>200</option>
                            </select>
                            <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap hidden sm:inline">ردیف</span>
                            <span className="text-xs text-slate-400 dark:text-slate-500 mx-1">|</span>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">مجموع: {filteredData.length} رکورد</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                            {/* First Page */}
                            <button 
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(1)}
                                className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 transition text-slate-600 dark:text-slate-300"
                                title="صفحه اول"
                            >
                                <ChevronsRight className="w-4 h-4 rtl:rotate-180" /> 
                            </button>

                            {/* Previous Page */}
                            <button 
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => p - 1)}
                                className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 transition text-slate-600 dark:text-slate-300"
                                title="صفحه قبل"
                            >
                                <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                            </button>

                            {/* Page Input */}
                            <div className="flex items-center gap-2 px-2">
                                <span className="text-sm text-slate-600 dark:text-slate-300">صفحه</span>
                                <input 
                                    type="number"
                                    min={1}
                                    max={totalPages}
                                    value={currentPage}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        if (!isNaN(val) && val >= 1 && val <= totalPages) {
                                            setCurrentPage(val);
                                        }
                                    }}
                                    className="w-12 text-center p-1 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-white"
                                />
                                <span className="text-sm text-slate-600 dark:text-slate-300">از {totalPages}</span>
                            </div>

                            {/* Next Page */}
                            <button 
                                disabled={currentPage >= totalPages}
                                onClick={() => setCurrentPage(p => p + 1)}
                                className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 transition text-slate-600 dark:text-slate-300"
                                title="صفحه بعد"
                            >
                                <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                            </button>

                            {/* Last Page */}
                            <button 
                                disabled={currentPage >= totalPages}
                                onClick={() => setCurrentPage(totalPages)}
                                className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 transition text-slate-600 dark:text-slate-300"
                                title="صفحه آخر"
                            >
                                <ChevronsLeft className="w-4 h-4 rtl:rotate-180" /> 
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal and Confirmation Code remains the same... */}
            {showModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => { if(e.target === e.currentTarget) setShowModal(false) }}>
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg dark:text-white">
                                {editingItem ? 'ویرایش رکورد' : 'افزودن رکورد جدید'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                <X size={20} className="dark:text-white"/>
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="space-y-4">
                            {activeTab === 'USERS' && (
                                <div className="flex flex-col items-center mb-6">
                                    <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 relative group overflow-hidden border-2 border-slate-200 dark:border-slate-700">
                                        {avatarPreview ? (
                                            <img src={avatarPreview} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-400"><User size={40}/></div>
                                        )}
                                        <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                            <Camera className="text-white" />
                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                                if (e.target.files?.[0]) {
                                                    setAvatarFile(e.target.files[0]);
                                                    setAvatarPreview(URL.createObjectURL(e.target.files[0]));
                                                }
                                            }} />
                                        </label>
                                    </div>
                                    <span className="text-xs text-slate-400 mt-2">تصویر پروفایل</span>
                                </div>
                            )}
                            {currentSchema.columns.filter((col: any) => col.key !== 'avatar_url' && col.key !== 'created_at' && col.key !== 'login_timestamp' && col.key !== 'timestamp').map((col: any) => (
                                <div key={col.key} className="space-y-1">
                                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                                        {col.label} {col.required && <span className="text-red-500">*</span>}
                                    </label>
                                    {col.type === 'select' ? (
                                        <div className="relative">
                                            <select
                                                required={col.required}
                                                value={formData[col.key] || ''}
                                                onChange={(e) => setFormData({...formData, [col.key]: e.target.value})}
                                                className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none focus:border-blue-500 dark:text-white"
                                            >
                                                <option value="">انتخاب کنید</option>
                                                {col.options?.map((opt: any) => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={16} />
                                        </div>
                                    ) : (
                                        <input
                                            type={col.type === 'number' ? 'number' : 'text'}
                                            required={col.required}
                                            disabled={col.key === currentSchema.idField && !!editingItem} 
                                            value={formData[col.key] || ''}
                                            onChange={(e) => setFormData({...formData, [col.key]: e.target.value})}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none focus:border-blue-500 dark:text-white disabled:opacity-50"
                                        />
                                    )}
                                </div>
                            ))}
                            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 mt-4">
                                {loading ? <RefreshCw className="animate-spin" /> : <Save size={18} />}
                                <span>{editingItem ? 'ذخیره تغییرات' : 'ثبت نهایی'}</span>
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
