
import { User } from '../types';

// Data should now be imported via the Admin Panel CSV Import feature.
// This array is kept empty to reduce bundle size.
const RAW_USER_DATA = `EmployeeName,EmployeeCode,MasterORGName`;

const parseUsers = (csvData: string): User[] => {
  return [];
};

export const USERS: User[] = [];
