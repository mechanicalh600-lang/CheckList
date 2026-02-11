
import { GeneratedTask } from "@/types";

// Data can be seeded by admin import, but we keep baseline templates for resilience.
const RAW_CHECKLIST_DATA = `Sequence,ActivityTitle,JobCardCode
1,بازرسی ظاهری و ایمنی,INSPECTION
2,بررسی صدا و لرزش غیرعادی,INSPECTION
3,کنترل نشتی و سطوح روانکار,INSPECTION
1,کنترل سطح روغن و گریس,LUBRICATION
2,گریس‌کاری نقاط مشخص شده,LUBRICATION
3,پاکسازی آلودگی اطراف گریس‌خورها,LUBRICATION
1,بررسی دمای نقاط بحرانی,THERMOGRAPHY
2,شناسایی اتصال داغ و ناهنجاری دمایی,THERMOGRAPHY
3,ثبت مقادیر دما و مقایسه با روند قبلی,THERMOGRAPHY
1,کنترل سفتی اتصالات و پیچ‌ها,PM
2,تمیزکاری موضعی و رفع آلودگی,PM
3,بررسی عملکرد تجهیز پس از سرویس,PM`;

const parseChecklistData = (csvData: string): Record<string, GeneratedTask[]> => {
  const lines = csvData
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length <= 1) {
    return {};
  }

  const parsed: Record<string, GeneratedTask[]> = {};
  for (let i = 1; i < lines.length; i += 1) {
    const [sequenceRaw, taskRaw, codeRaw] = lines[i].split(",");
    const task = taskRaw?.trim();
    const code = codeRaw?.trim();
    const sequence = Number(sequenceRaw?.trim());

    if (!task || !code || Number.isNaN(sequence)) {
      continue;
    }

    if (!parsed[code]) {
      parsed[code] = [];
    }

    parsed[code].push({
      task,
      description: task,
    });
  }

  return Object.fromEntries(
    Object.entries(parsed).map(([code, items]) => [code, items])
  );
};

export const STATIC_CHECKLISTS: Record<string, GeneratedTask[]> = parseChecklistData(RAW_CHECKLIST_DATA);
