import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { InspectionForm, User } from '@/types';
import { getInspections } from '@/services/supabaseClient';
import { getStartOfCurrentShamsiMonth } from '@/utils';

export const useHistory = (user: User | null) => {
  const [inspectionHistory, setInspectionHistory] = useState<InspectionForm[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [filterDateRange, setFilterDateRange] = useState<{ start: string; end: string }>({
    start: getStartOfCurrentShamsiMonth(),
    end: new Date().toISOString().split('T')[0],
  });
  const [historyPage, setHistoryPage] = useState(1);
  const [historyItemsPerPage, setHistoryItemsPerPage] = useState(10);
  const [selectedHistoryIndices, setSelectedHistoryIndices] = useState<number[]>([]);
  const filterDateRangeRef = useRef(filterDateRange);

  const historyTotalPages = Math.ceil(inspectionHistory.length / historyItemsPerPage) || 1;

  const paginatedHistory = useMemo(() => {
    const start = (historyPage - 1) * historyItemsPerPage;
    return inspectionHistory.slice(start, start + historyItemsPerPage);
  }, [inspectionHistory, historyPage, historyItemsPerPage]);

  const loadHistory = useCallback(async (currentUser: User, start?: string, end?: string) => {
    try {
      setIsLoadingHistory(true);
      setInspectionHistory([]);
      const isManagerial =
        ['super_admin', 'admin', 'manager', 'net', 'technical'].includes(currentUser.role || '') ||
        currentUser.code === 'admin';
      const fetchCode = isManagerial ? undefined : currentUser.code;

      const startDate = start ? new Date(start).toISOString() : undefined;
      const endDate = end ? new Date(end + 'T23:59:59').toISOString() : undefined;

      const data = await getInspections(fetchCode, startDate, endDate);
      setInspectionHistory(data);
    } catch (e) {
      console.error('Failed to load history from DB', e);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  const clearHistory = useCallback(() => {
    setInspectionHistory([]);
    setSelectedHistoryIndices([]);
    setHistoryPage(1);
  }, []);

  const toggleHistorySelection = useCallback((index: number) => {
    setSelectedHistoryIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  }, []);

  const selectAllHistory = useCallback(() => {
    if (selectedHistoryIndices.length === inspectionHistory.length) {
      setSelectedHistoryIndices([]);
    } else {
      setSelectedHistoryIndices(inspectionHistory.map((_, i) => i));
    }
  }, [selectedHistoryIndices.length, inspectionHistory]);

  useEffect(() => {
    filterDateRangeRef.current = filterDateRange;
  }, [filterDateRange]);

  useEffect(() => {
    if (user) {
      const currentRange = filterDateRangeRef.current;
      void loadHistory(user, currentRange.start, currentRange.end);
    } else {
      clearHistory();
    }
  }, [user, loadHistory, clearHistory]);

  useEffect(() => {
    setHistoryPage(1);
  }, [inspectionHistory]);

  return {
    inspectionHistory,
    isLoadingHistory,
    filterDateRange,
    setFilterDateRange,
    historyPage,
    setHistoryPage,
    historyItemsPerPage,
    setHistoryItemsPerPage,
    historyTotalPages,
    paginatedHistory,
    selectedHistoryIndices,
    setSelectedHistoryIndices,
    toggleHistorySelection,
    selectAllHistory,
    loadHistory,
    clearHistory,
  };
};
