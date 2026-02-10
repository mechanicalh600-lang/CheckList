import { useCallback, useMemo, useState } from 'react';
import {
  Activity,
  AssetMaster,
  ChecklistItemData,
  Equipment,
  GeneratedTask,
  InspectionForm,
  InspectionReportData,
  InspectionStatus,
  User,
} from '../types';
import { analyzeInspectionReport, generateChecklistForEquipment } from '../services/geminiService';
import {
  getAssetSchedules,
  getChecklistForJobCard,
  getInspectionDetailsByIds,
  saveInspection,
} from '../services/supabaseClient';

interface InspectionViews {
  LOGIN: string;
  HOME: string;
  ACTIVITY_SELECT: string;
  FORM: string;
  SUBMITTING: string;
  SUCCESS: string;
}

interface UseInspectionFlowArgs {
  user: User | null;
  dbAssets: AssetMaster[];
  loadHistory: (user: User, start?: string, end?: string) => Promise<void>;
  filterDateRange: { start: string; end: string };
  setView: (view: string) => void;
  views: InspectionViews;
}

export const useInspectionFlow = ({
  user,
  dbAssets,
  loadHistory,
  filterDateRange,
  setView,
  views,
}: UseInspectionFlowArgs) => {
  interface AssetScheduleRow {
    job_card_code: string;
    job_card_name?: string;
    asset_number: string;
    plan_code?: string;
  }

  const [currentEquipment, setCurrentEquipment] = useState<Equipment | null>(null);
  const [availableActivities, setAvailableActivities] = useState<Activity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [checklistItems, setChecklistItems] = useState<ChecklistItemData[]>([]);
  const [loadingChecklist, setLoadingChecklist] = useState(false);
  const [analysisResult, setAnalysisResult] = useState('');
  const [generatedTrackingCode, setGeneratedTrackingCode] = useState('');
  const [submissionDateObject, setSubmissionDateObject] = useState<Date | null>(null);
  const [reportInspector, setReportInspector] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingText, setLoadingText] = useState('در حال پردازش...');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [returnToAdmin, setReturnToAdmin] = useState(false);

  const filteredAssets = useMemo(() => {
    if (!searchTerm) return [];
    const term = searchTerm.toUpperCase();
    return dbAssets
      .filter(
        (asset) =>
          asset.code.includes(term) ||
          asset.name.includes(searchTerm) ||
          (asset.description && asset.description.includes(searchTerm))
      )
      .slice(0, 50);
  }, [searchTerm, dbAssets]);

  const handleScan = useCallback(
    async (code: string) => {
      const equipmentEntry = dbAssets.find((e) => e.code === code);
      if (!equipmentEntry) {
        alert('تجهیز با این کد در دیتابیس یافت نشد');
        return;
      }

      const equipmentData: Equipment = {
        id: code,
        name: equipmentEntry.name,
        description: equipmentEntry.description || 'تجهیز شناسایی نشده',
        lastMaintained: '---',
      };

      setCurrentEquipment(equipmentData);
      const schedules = (await getAssetSchedules(code)) as AssetScheduleRow[];
      const scheduledActivities: Activity[] = schedules.map((s) => ({
        code: s.job_card_code,
        name: s.job_card_name || 'فعالیت بدون نام',
        equipmentTag: s.asset_number,
        planCode: s.plan_code,
      }));
      const uniqueActivities = Array.from(
        new Map(scheduledActivities.map((a) => [a.code, a])).values()
      );

      if (uniqueActivities.length > 0) {
        setAvailableActivities(uniqueActivities);
        setView(views.ACTIVITY_SELECT);
      } else {
        setAvailableActivities([]);
        alert('هیچ کارت فعالیت (Job Card) برای این تجهیز تعریف نشده است');
        setView(views.HOME);
      }
    },
    [dbAssets, setView, views.ACTIVITY_SELECT, views.HOME]
  );

  const startInspection = useCallback(
    async (equipment: Equipment, activity?: Activity) => {
      setSelectedActivity(activity || null);
      setView(views.FORM);
      setLoadingChecklist(true);

      const activityName = activity ? activity.name : undefined;
      const activityCode = activity ? activity.code : undefined;
      let generatedTasks;

      if (activityCode) {
        try {
          const dbChecklist = await getChecklistForJobCard(activityCode);
          if (dbChecklist && dbChecklist.length > 0) generatedTasks = dbChecklist;
        } catch (e) {
          console.error('Error fetching checklist from DB', e);
        }
      }

      if (!generatedTasks || generatedTasks.length === 0) {
        generatedTasks = await generateChecklistForEquipment(equipment.name, activityName, activityCode);
      }

      const initialItems: ChecklistItemData[] = (generatedTasks as GeneratedTask[]).map(
        (task, index: number) => ({
        id: `item-${index}`,
        task: task.task,
        description: task.description,
        status: InspectionStatus.PENDING,
        comment: '',
        })
      );
      setChecklistItems(initialItems);
      setLoadingChecklist(false);
    },
    [setView, views.FORM]
  );

  const handleUpdateItem = useCallback((updatedItem: ChecklistItemData) => {
    setChecklistItems((prev) => prev.map((item) => (item.id === updatedItem.id ? updatedItem : item)));
  }, []);

  const isItemComplete = useCallback((item: ChecklistItemData) => {
    if (item.status === InspectionStatus.PENDING) return false;
    if (item.status === InspectionStatus.FAIL && (!item.comment || item.comment.trim() === '')) return false;
    return true;
  }, []);

  const calculateProgress = useCallback(() => {
    if (checklistItems.length === 0) return 0;
    const completed = checklistItems.filter(isItemComplete).length;
    return Math.round((completed / checklistItems.length) * 100);
  }, [checklistItems, isItemComplete]);

  const getIncompleteCount = useCallback(() => {
    return checklistItems.length - checklistItems.filter(isItemComplete).length;
  }, [checklistItems, isItemComplete]);

  const handleSubmit = useCallback(async () => {
    if (!currentEquipment || !user) return;
    setView(views.SUBMITTING);
    setSubmitError(null);
    setLoadingText('نگهداری و تعمیرات پیشگیرانه ضامن تداوم تولید');
    const now = new Date();
    setSubmissionDateObject(now);

    const formData: InspectionForm = {
      equipmentId: currentEquipment.id,
      equipmentName: currentEquipment.name,
      activityName: selectedActivity?.name,
      timestamp: Date.now(),
      inspectorName: user.name,
      inspectorCode: user.code,
      items: checklistItems,
    };

    try {
      localStorage.setItem('pending_inspection', JSON.stringify(formData));
    } catch (e) {
      console.warn('Local backup failed', e);
    }

    try {
      let analysis = '';
      try {
        analysis = await analyzeInspectionReport(formData);
        setAnalysisResult(analysis);
      } catch (e) {
        console.warn('AI Analysis skipped');
        analysis = 'تحلیل هوشمند انجام نشد.';
      }

      setLoadingText('در حال ایجاد کد رهگیری و ذخیره...');
      const hasMedia = checklistItems.some((i) => i.photo || i.video);
      if (hasMedia) setLoadingText('در حال آپلود تصاویر و فیلم‌ها...');

      const result = await saveInspection(formData, analysis);
      if (result.success) {
        setGeneratedTrackingCode(result.trackingCode || '---');
        localStorage.removeItem('pending_inspection');
        await loadHistory(user, filterDateRange.start, filterDateRange.end);
        setView(views.SUCCESS);
      } else {
        throw new Error(
          typeof result === 'object' && result && 'message' in result && typeof result.message === 'string'
            ? result.message
            : 'خطا در ذخیره اطلاعات'
        );
      }
    } catch (error: any) {
      console.error('Submission failed', error);
      setSubmitError(error.message || 'خطای ناشناخته در ارتباط با سرور');
    }
  }, [
    currentEquipment,
    user,
    setView,
    views.SUBMITTING,
    selectedActivity?.name,
    checklistItems,
    loadHistory,
    filterDateRange.start,
    filterDateRange.end,
    views.SUCCESS,
  ]);

  const handleShareReport = useCallback(async () => {
    if (!currentEquipment || (!user && !reportInspector) || !submissionDateObject) return;

    const failedItems = checklistItems.filter((i) => i.status === InspectionStatus.FAIL);
    const passedItems = checklistItems.filter((i) => i.status === InspectionStatus.PASS);
    const dayName = new Intl.DateTimeFormat('fa-IR', { weekday: 'long' }).format(submissionDateObject);
    const datePart = new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(submissionDateObject);
    const timePart = new Intl.DateTimeFormat('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(submissionDateObject);
    const inspectorName = reportInspector || user?.name || 'Unknown';
    const inspectorCode = reportInspector ? '' : user?.code ? `(${user.code})` : '';
    const shareText = `📢 *گزارش بازرسی تجهیز*\n--------------------------------\n🔢 *کد رهگیری:* ${generatedTrackingCode}\n🗓 *زمان:* ${dayName} ${datePart} - ساعت ${timePart}\n\n👤 *بازرس:* ${inspectorName} ${inspectorCode}\n🏭 *تجهیز:* ${currentEquipment.name}\n🏷 *نام محلی/کد:* ${currentEquipment.description || currentEquipment.id}\n🔧 *فعالیت:* ${selectedActivity?.name || 'بازرسی عمومی'}\n\n📊 *آمار وضعیت:*\n✅ سالم: ${passedItems.length} مورد\n❌ خرابی: ${failedItems.length} مورد\n\n${failedItems.length > 0 ? `⚠️ *شرح خرابی‌ها:*\n${failedItems.map((i, idx) => `${idx + 1}. ${i.task}\n   📝 توضیح: ${i.comment}`).join('\n')}\n` : '✨ *هیچ خرابی مشاهده نشد.*'}\n\n🤖 *تحلیل هوشمند:*\n${analysisResult}\n--------------------------------\n🔺 *ارسال شده از رای‌نو*`.trim();

    if (navigator.share) {
      try {
        await navigator.share({ title: `گزارش بازرسی ${currentEquipment.name}`, text: shareText });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(shareText);
      alert('متن گزارش کپی شد.');
    }
  }, [
    currentEquipment,
    user,
    reportInspector,
    submissionDateObject,
    checklistItems,
    generatedTrackingCode,
    selectedActivity?.name,
    analysisResult,
  ]);

  const resetApp = useCallback(() => {
    setView(user ? views.HOME : views.LOGIN);
    setCurrentEquipment(null);
    setChecklistItems([]);
    setAnalysisResult('');
    setSelectedActivity(null);
    setSearchTerm('');
    setGeneratedTrackingCode('');
    setReportInspector(null);
    setReturnToAdmin(false);
    localStorage.removeItem('pending_inspection');
  }, [setView, user, views.HOME, views.LOGIN]);

  const clearInspectionFlow = useCallback(() => {
    setCurrentEquipment(null);
    setAvailableActivities([]);
    setSelectedActivity(null);
    setChecklistItems([]);
    setLoadingChecklist(false);
    setAnalysisResult('');
    setGeneratedTrackingCode('');
    setSubmissionDateObject(null);
    setReportInspector(null);
    setSearchTerm('');
    setLoadingText('در حال پردازش...');
    setSubmitError(null);
    setReturnToAdmin(false);
    localStorage.removeItem('pending_inspection');
  }, []);

  const getTraditionalName = useCallback(
    (equipmentId: string) => {
      const asset = dbAssets.find((a) => a.code === equipmentId);
      return asset?.description || asset?.name || equipmentId;
    },
    [dbAssets]
  );

  const handleViewReport = useCallback(
    async (report: InspectionReportData, isFromAdmin: boolean = false) => {
      let reportWithDetails = report;
      if ((!report.items || report.items.length === 0) && report.id) {
        const [detailedReport] = await getInspectionDetailsByIds([report.id]);
        if (detailedReport) {
          reportWithDetails = detailedReport;
        }
      }

      const asset = dbAssets.find((a) => a.code === reportWithDetails.equipmentId);
      setCurrentEquipment({
        id: reportWithDetails.equipmentId,
        name: reportWithDetails.equipmentName,
        description: asset?.description || asset?.traditionalName || '',
        lastMaintained: '',
      });
      setSelectedActivity({
        code: '',
        name: reportWithDetails.activityName || 'بازرسی عمومی',
        equipmentTag: reportWithDetails.equipmentId,
      });
      setChecklistItems(reportWithDetails.items || []);
      setGeneratedTrackingCode(reportWithDetails.trackingCode || '---');
      setSubmissionDateObject(new Date(reportWithDetails.timestamp));
      setAnalysisResult(reportWithDetails.analysisResult || 'تحلیل در دسترس نیست.');
      setReportInspector(reportWithDetails.inspectorName);
      setReturnToAdmin(isFromAdmin);
      setView(views.SUCCESS);
    },
    [dbAssets, setView, views.SUCCESS]
  );

  return {
    currentEquipment,
    availableActivities,
    selectedActivity,
    checklistItems,
    loadingChecklist,
    analysisResult,
    generatedTrackingCode,
    submissionDateObject,
    reportInspector,
    searchTerm,
    loadingText,
    submitError,
    returnToAdmin,
    setReturnToAdmin,
    filteredAssets,
    setSearchTerm,
    handleScan,
    startInspection,
    handleUpdateItem,
    calculateProgress,
    getIncompleteCount,
    handleSubmit,
    handleShareReport,
    resetApp,
    clearInspectionFlow,
    getTraditionalName,
    handleViewReport,
  };
};
