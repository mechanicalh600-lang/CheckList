
import { Activity } from '@/types';
import { ASSET_SCHEDULES } from './AssetScheduling';

// This file now derives activities directly from the Master Asset Schedule.
// This ensures that AssetScheduling.ts is the single source of truth for equipment-activity mapping.

export const ACTIVITIES: Activity[] = ASSET_SCHEDULES.map(schedule => ({
  code: schedule.jobCardCode,
  name: schedule.jobCardName,
  equipmentTag: schedule.assetNumber,
  planCode: schedule.planCode
}));
