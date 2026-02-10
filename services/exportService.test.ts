import { describe, expect, it } from 'vitest';
import { InspectionStatus, type InspectionForm } from '../types';
import { buildInspectionExcelRows, buildInspectionExportFilename } from './exportService';

describe('buildInspectionExcelRows', () => {
  it('maps inspection history to flattened excel rows', () => {
    const history: InspectionForm[] = [
      {
        equipmentId: 'EQ-01',
        equipmentName: 'Main Pump',
        activityName: 'PM Weekly',
        timestamp: new Date('2026-02-10T08:30:00Z').getTime(),
        inspectorName: 'Ali',
        inspectorCode: 'U-01',
        trackingCode: 'TRK-1',
        status: 'اتمام یافته',
        items: [
          { id: '1', task: 'Bearing check', status: InspectionStatus.PASS, comment: '' },
          { id: '2', task: 'Leak check', status: InspectionStatus.FAIL, comment: 'Oil leak' },
        ],
      },
    ];

    const rows = buildInspectionExcelRows(history);

    expect(rows).toHaveLength(2);
    expect(rows[0]['کد رهگیری']).toBe('TRK-1');
    expect(rows[0]['نام تجهیز']).toBe('Main Pump');
    expect(rows[0]['وضعیت آیتم']).toBe('سالم');
    expect(rows[0]['توضیحات/علت خرابی']).toBe('-');
    expect(rows[1]['وضعیت آیتم']).toBe('خراب');
    expect(rows[1]['توضیحات/علت خرابی']).toBe('Oil leak');
  });

  it('uses defaults for missing activity, tracking code, and report status', () => {
    const history: InspectionForm[] = [
      {
        equipmentId: 'EQ-02',
        equipmentName: 'Aux Fan',
        timestamp: new Date('2026-02-10T09:00:00Z').getTime(),
        inspectorName: 'Sara',
        inspectorCode: 'U-02',
        items: [{ id: '1', task: 'Visual check', status: InspectionStatus.NA, comment: '' }],
      },
    ];

    const [row] = buildInspectionExcelRows(history);

    expect(row.فعالیت).toBe('بازرسی عمومی');
    expect(row['کد رهگیری']).toBe('-');
    expect(row['وضعیت کل گزارش']).toBe('بازبینی');
    expect(row['وضعیت آیتم']).toBe(InspectionStatus.NA);
  });
});

describe('buildInspectionExportFilename', () => {
  it('returns xlsx filename with Inspection_Report prefix', () => {
    const filename = buildInspectionExportFilename(new Date('2026-02-10T09:25:00Z'));
    expect(filename.startsWith('Inspection_Report_')).toBe(true);
    expect(filename.endsWith('.xlsx')).toBe(true);
  });
});
