
import { AssetSchedule } from '@/types';

// Data should now be imported via the Admin Panel CSV Import feature.
const RAW_ASSET_SCHEDULING_DATA = `JobCardName,JobCardCode,AssetNumber,PlanCode`;

const parseAssetSchedules = (csvData: string): AssetSchedule[] => {
  return [];
};

export const ASSET_SCHEDULES: AssetSchedule[] = [];
