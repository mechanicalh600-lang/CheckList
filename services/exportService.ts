import { InspectionForm } from '../types';

type CellStyle = {
  font: {
    name: string;
    sz: number;
    bold?: boolean;
    color?: { rgb: string };
  };
  alignment: {
    vertical: 'center';
    horizontal: 'center';
    wrapText: boolean;
  };
  border: {
    top: { style: 'thin'; color: { rgb: string } };
    bottom: { style: 'thin'; color: { rgb: string } };
    left: { style: 'thin'; color: { rgb: string } };
    right: { style: 'thin'; color: { rgb: string } };
  };
  fill?: { fgColor: { rgb: string } };
};

type InspectionExcelRow = {
  'کد رهگیری': string;
  تاریخ: string;
  زمان: string;
  'نام تجهیز': string;
  'کد تجهیز': string;
  بازرس: string;
  فعالیت: string;
  'آیتم چک‌لیست': string;
  'وضعیت آیتم': string;
  'توضیحات/علت خرابی': string;
  'وضعیت کل گزارش': string;
};

export const buildInspectionExcelRows = (history: InspectionForm[]): InspectionExcelRow[] => {
  return history.flatMap((report) =>
    report.items.map((item) => ({
      'کد رهگیری': report.trackingCode || '-',
      تاریخ: new Date(report.timestamp).toLocaleDateString('fa-IR'),
      زمان: new Date(report.timestamp).toLocaleTimeString('fa-IR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      'نام تجهیز': report.equipmentName,
      'کد تجهیز': report.equipmentId,
      بازرس: report.inspectorName,
      فعالیت: report.activityName || 'بازرسی عمومی',
      'آیتم چک‌لیست': item.task,
      'وضعیت آیتم': item.status === 'PASS' ? 'سالم' : item.status === 'FAIL' ? 'خراب' : item.status,
      'توضیحات/علت خرابی': item.comment || '-',
      'وضعیت کل گزارش': report.status || 'بازبینی',
    }))
  );
};

export const buildInspectionExportFilename = (date = new Date()) => {
  const dateStr = date.toLocaleDateString('fa-IR-u-nu-latn').replace(/\//g, '-');
  const timeStr = date
    .toLocaleTimeString('fa-IR-u-nu-latn', { hour: '2-digit', minute: '2-digit', hour12: false })
    .replace(/:/g, '-');
  return `Inspection_Report_${dateStr}_${timeStr}.xlsx`;
};

export const exportInspectionHistoryToExcel = async (history: InspectionForm[]) => {
  const XLSXModule = await import('xlsx-js-style');
  const XLSX = XLSXModule.default ?? XLSXModule;

  const excelData = buildInspectionExcelRows(history);

  const ws = XLSX.utils.json_to_sheet(excelData);
  ws['!dir'] = 'rtl';
  if (!ws['!views']) ws['!views'] = [];
  ws['!views'][0] = { rightToLeft: true };

  ws['!cols'] = [
    { wch: 15 },
    { wch: 12 },
    { wch: 8 },
    { wch: 20 },
    { wch: 15 },
    { wch: 15 },
    { wch: 20 },
    { wch: 30 },
    { wch: 10 },
    { wch: 30 },
    { wch: 15 },
  ];

  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let row = range.s.r; row <= range.e.r; row += 1) {
    for (let col = range.s.c; col <= range.e.c; col += 1) {
      const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
      if (!ws[cellRef]) continue;

      const cell = ws[cellRef];
      const style: CellStyle = {
        font: { name: 'Vazirmatn', sz: 10 },
        alignment: { vertical: 'center', horizontal: 'center', wrapText: true },
        border: {
          top: { style: 'thin', color: { rgb: 'E2E8F0' } },
          bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
          left: { style: 'thin', color: { rgb: 'E2E8F0' } },
          right: { style: 'thin', color: { rgb: 'E2E8F0' } },
        },
      };

      if (row === 0) {
        style.fill = { fgColor: { rgb: '1E293B' } };
        style.font = { name: 'Vazirmatn', sz: 11, bold: true, color: { rgb: 'FFFFFF' } };
        style.alignment.wrapText = false;
      } else {
        if (row % 2 === 0) style.fill = { fgColor: { rgb: 'F8FAFC' } };
        if (cell.v === 'خراب') {
          style.font.color = { rgb: 'EF4444' };
          style.font.bold = true;
          style.fill = { fgColor: { rgb: 'FEF2F2' } };
        }
      }

      cell.s = style;
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'History');
  XLSX.writeFile(wb, buildInspectionExportFilename());
};
