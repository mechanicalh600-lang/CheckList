
export type UserRole = 'super_admin' | 'admin' | 'operator' | 'net' | 'technical' | 'cm' | 'wearhouse' | 'manager' | 'other';

export interface User {
  name: string;
  code: string;
  org: string;
  avatar_url?: string;
  role?: UserRole; // نقش کاربر
}

export interface Equipment {
  id: string;
  name: string;
  description: string;
  lastMaintained?: string;
}

export interface Activity {
  code: string;
  name: string;
  equipmentTag: string;
  planCode?: string;
}

export enum InspectionStatus {
  PENDING = 'PENDING',
  PASS = 'PASS',
  FAIL = 'FAIL',
  NA = 'NA'
}

export interface ChecklistItemData {
  id: string;
  task: string;
  description?: string;
  status: InspectionStatus;
  comment: string;
  photo?: File | null;
  video?: File | null;
}

export interface InspectionForm {
  id?: string;
  equipmentId: string;
  equipmentName: string;
  activityName?: string;
  timestamp: number;
  inspectorName: string;
  inspectorCode: string;
  items: ChecklistItemData[];
  trackingCode?: string;
  status?: string;
  checklistTotal?: number;
  passCount?: number;
  failCount?: number;
  pendingCount?: number;
  passPercent?: number;
  failTasksSample?: string[];
  isOverviewOnly?: boolean;
  analysisResult?: string;
}

export interface GeneratedTask {
  task: string;
  description: string;
}

export interface AssetSchedule {
  jobCardName: string;
  jobCardCode: string;
  assetNumber: string;
  planCode: string;
}

export interface AssetMaster {
  code: string;
  name: string;
  description?: string;
  traditionalName?: string;
}

export interface InspectionReportData extends InspectionForm {
  analysisResult?: string;
}