import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { jalaliToGregorian, getShamsiDate, isFutureDate, toShamsi, toGregorian } from '@/utils';

interface Props {
  value: string;
  onChange: (date: string) => void;
  label?: string;
  error?: string;
  disableFuture?: boolean;
}

export const PersianDatePicker: React.FC<Props> = ({ value, onChange, label, error, disableFuture = true }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(1403);
  const [viewMonth, setViewMonth] = useState(1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Conversion: Gregorian (from App) -> Shamsi (for Display)
  const displayValue = value ? toShamsi(value) : '';

  useEffect(() => {
    if (displayValue) {
      const parts = displayValue.split('/').map(Number);
      if (parts.length === 3) {
        setViewYear(parts[0]);
        setViewMonth(parts[1]);
      }
    } else {
        const today = getShamsiDate().split('/').map(Number);
        setViewYear(today[0]);
        setViewMonth(today[1]);
    }
  }, [displayValue, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const monthNames = [
    "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
    "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
  ];
  
  const weekDays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

  const getDaysInMonth = (y: number, m: number) => {
    if (m <= 6) return 31;
    if (m <= 11) return 30;
    const isLeap = (y % 33 === 1 || y % 33 === 5 || y % 33 === 9 || y % 33 === 13 || y % 33 === 17 || y % 33 === 22 || y % 33 === 26 || y % 33 === 30);
    return isLeap ? 30 : 29;
  };

  const getFirstDayOfMonth = (y: number, m: number) => {
    const { gy, gm, gd } = jalaliToGregorian(y, m, 1);
    return new Date(gy, gm - 1, gd).getDay(); 
  };

  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const handleSelectDate = (d: number) => {
    const dateStr = `${viewYear}/${String(viewMonth).padStart(2, '0')}/${String(d).padStart(2, '0')}`;
    if (disableFuture && isFutureDate(dateStr)) return;
    
    // Conversion: Shamsi (from Calendar) -> Gregorian (for App/DB)
    onChange(toGregorian(dateStr));
    setIsOpen(false);
  };

  const handleToday = () => {
    const todayShamsi = getShamsiDate();
    onChange(toGregorian(todayShamsi));
    setIsOpen(false);
  };

  const startDayOfWeek = (getFirstDayOfMonth(viewYear, viewMonth) + 1) % 7; 
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);

  return (
    <div className="relative z-[70]" ref={wrapperRef}>
      {label && <label className="block text-xs font-medium mb-1.5 text-slate-700 dark:text-slate-300">{label}</label>}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-2.5 bg-white dark:bg-slate-800 rounded-xl border transition-all
        ${error 
          ? 'border-red-500 text-red-500' 
          : 'border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:border-blue-500/50'
        } ${isOpen ? 'ring-2 ring-blue-500/20 border-blue-500 shadow-sm' : ''}`}
      >
         <span className={`${!displayValue ? 'text-slate-400 text-sm' : 'text-sm font-medium'}`}>
             {displayValue || 'انتخاب تاریخ...'}
         </span>
         <Calendar className="w-4 h-4 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-[80] mt-2 w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-4 animate-fade-in-up">
          <div className="flex justify-between items-center mb-4">
            <button onClick={handlePrevMonth} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition"><ChevronRight className="w-4 h-4 dark:text-white"/></button>
            <span className="font-bold text-sm text-slate-800 dark:text-white">{monthNames[viewMonth - 1]} {viewYear}</span>
            <button onClick={handleNextMonth} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition"><ChevronLeft className="w-4 h-4 dark:text-white"/></button>
          </div>

          <div className="grid grid-cols-7 mb-2 text-center text-xs font-medium text-slate-400">
            {weekDays.map((day, index) => (
                <span key={index} className={index === 6 ? 'text-red-500 font-bold' : ''}>{day}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
             {Array.from({ length: startDayOfWeek }).map((_, i) => (
               <div key={`empty-${i}`} />
             ))}
             {Array.from({ length: daysInMonth }).map((_, i) => {
               const d = i + 1;
               const dateStr = `${viewYear}/${String(viewMonth).padStart(2, '0')}/${String(d).padStart(2, '0')}`;
               const isSelected = displayValue === dateStr;
               const isFuture = disableFuture && isFutureDate(dateStr);
               const isFriday = (startDayOfWeek + i) % 7 === 6;
               
               return (
                 <button
                   key={d}
                   type="button"
                   disabled={isFuture}
                   onClick={() => handleSelectDate(d)}
                   className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center transition-all
                     ${isSelected 
                       ? 'bg-blue-600 text-white shadow-md font-bold' 
                       : isFuture 
                         ? 'text-slate-200 dark:text-slate-600 cursor-not-allowed'
                         : isFriday
                           ? 'text-red-500 font-medium hover:bg-red-50 dark:hover:bg-red-900/20'
                           : 'hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                 >
                   {d}
                 </button>
               );
             })}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
            <button 
              type="button"
              onClick={handleToday}
              className="w-full py-2 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg font-bold transition-colors"
            >
              برو به امروز
            </button>
          </div>
        </div>
      )}
    </div>
  );
};