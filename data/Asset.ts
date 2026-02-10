
export interface EquipmentEntry {
  code: string;
  name: string;
  traditionalName?: string;
}

// Data should now be imported via the Admin Panel CSV Import feature.
const RAW_ASSET_DATA = `AssetNumber,AssetDescription,TridationalName`;

const parseAssets = (csvData: string): EquipmentEntry[] => {
  return [];
};

export const EQUIPMENT_LIST: EquipmentEntry[] = [];
