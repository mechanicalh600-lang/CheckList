
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import gregorian from "react-date-object/calendars/gregorian";

export const toShamsi = (gregorianDate: string): string => {
    if (!gregorianDate) return "";
    // Check if it's already Shamsi-like (simple check)
    if (gregorianDate.includes('/')) return gregorianDate; 
    
    const date = new DateObject({ date: gregorianDate, calendar: gregorian });
    date.convert(persian);
    return date.format("YYYY/MM/DD");
}

export const toGregorian = (shamsiDate: string): string => {
    if (!shamsiDate) return "";
    // Check if it's already Gregorian-like
    if (shamsiDate.includes('-')) return shamsiDate;

    const date = new DateObject({ date: shamsiDate, calendar: persian, format: "YYYY/MM/DD" });
    date.convert(gregorian);
    return date.format("YYYY-MM-DD");
}

export const getShamsiDate = (): string => {
    const date = new DateObject({ calendar: persian });
    return date.format("YYYY/MM/DD");
}

export const getStartOfCurrentShamsiMonth = (): string => {
    const date = new DateObject({ calendar: persian });
    date.day = 1;
    // Convert to Gregorian for DB query interactions
    date.convert(gregorian);
    return date.format("YYYY-MM-DD");
}

export const jalaliToGregorian = (jYear: number, jMonth: number, jDay: number) => {
    const date = new DateObject({ calendar: persian, year: jYear, month: jMonth, day: jDay });
    date.convert(gregorian);
    return {
        gy: date.year,
        gm: date.month.number,
        gd: date.day
    };
}

export const isFutureDate = (shamsiDateStr: string): boolean => {
    const today = new DateObject({ calendar: persian });
    // Reset time to start of day for accurate comparison
    today.hour = 0; today.minute = 0; today.second = 0; today.millisecond = 0;
    
    const date = new DateObject({ date: shamsiDateStr, calendar: persian, format: "YYYY/MM/DD" });
    date.hour = 0; date.minute = 0; date.second = 0; date.millisecond = 0;
    
    return date > today;
}
