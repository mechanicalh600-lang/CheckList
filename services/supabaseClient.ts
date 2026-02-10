import { InspectionForm } from '../types';
import { supabase, supabaseAnonKey, supabaseUrl } from './supabase/client';
import {
    adminResetUserPassword,
    authenticateUser,
    changeUserPassword,
} from './supabase/auth';
import { uploadFile, uploadProfileImage } from './supabase/storage';

export {
    adminResetUserPassword,
    authenticateUser,
    changeUserPassword,
    supabase,
    uploadFile,
    uploadProfileImage,
};

type InspectionsCacheEntry = {
    expiresAt: number;
    data: InspectionForm[];
};

const INSPECTIONS_CACHE_TTL_MS = 20_000;
const inspectionsCache = new Map<string, InspectionsCacheEntry>();

const buildInspectionsCacheKey = (userCode?: string, startDate?: string, endDate?: string) =>
    `${userCode || 'all'}|${startDate || 'none'}|${endDate || 'none'}`;

const clearInspectionsCache = () => {
    inspectionsCache.clear();
};

/**
 * بررسی اتصال به دیتابیس
 */
export const checkConnection = async (): Promise<boolean> => {
    try {
        if (!supabaseUrl || !supabaseAnonKey) return false;
        
        const { count, error } = await supabase
            .from('inspections')
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error('Supabase connection error:', JSON.stringify(error));
            return false;
        }
        return true;
    } catch (e) {
        console.error('Connection exception:', e);
        return false;
    }
};

const generateTrackingCode = async (): Promise<string> => {
    try {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('fa-IR-u-nu-latn', { year: 'numeric', month: '2-digit' });
        const parts = formatter.formatToParts(now);
        
        const yearPart = parts.find(p => p.type === 'year')?.value || '1400';
        const monthPart = parts.find(p => p.type === 'month')?.value || '01';
        
        const shortYear = yearPart.slice(1); 
        const prefix = `${shortYear}${monthPart}`; 

        const { data } = await supabase
            .from('inspections')
            .select('tracking_code')
            .like('tracking_code', `${prefix}%`)
            .order('tracking_code', { ascending: false })
            .limit(1);

        let nextNum = 1;
        if (data && data.length > 0) {
            const lastCode = data[0].tracking_code;
            const lastNumStr = lastCode.replace(prefix, '');
            const lastNum = parseInt(lastNumStr, 10);
            if (!isNaN(lastNum)) {
                nextNum = lastNum + 1;
            }
        }

        return `${prefix}${String(nextNum).padStart(4, '0')}`;
    } catch (e) {
        const random = Math.floor(Math.random() * 1000);
        return `ERR-${Date.now()}-${random}`;
    }
};

export const saveInspection = async (form: InspectionForm, analysis: string) => {
    let trackingCode = '';
    let inspectionData = null;
    let saveError = null;
    
    for (let attempt = 0; attempt < 5; attempt++) {
        trackingCode = await generateTrackingCode();
        
        const { data, error } = await supabase
            .from('inspections')
            .insert([{
                equipment_id: form.equipmentId,
                equipment_name: form.equipmentName,
                inspector_name: form.inspectorName,
                inspector_code: form.inspectorCode,
                activity_name: form.activityName,
                tracking_code: trackingCode,
                status: 'بازبینی',
                analysis_result: analysis,
                timestamp: new Date(form.timestamp).toISOString()
            }])
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                console.warn(`Tracking code collision (${trackingCode}), retrying...`);
                await new Promise(r => setTimeout(r, Math.random() * 500));
                continue;
            } else {
                saveError = error;
                break; 
            }
        }
        
        inspectionData = data;
        break; 
    }

    if (!inspectionData) {
        console.error("Save Inspection Error", JSON.stringify(saveError));
        return { success: false, message: saveError?.message || "خطا در ذخیره اطلاعات پایه" };
    }

    const inspectionId = inspectionData.id;

    const itemsPayload = await Promise.all(form.items.map(async (item) => {
        let photoUrl = null;
        let videoUrl = null;

        if (item.photo) {
                photoUrl = await uploadFile('inspection-media', `photo_${inspectionId}_${item.id}.jpg`, item.photo);
        }
        if (item.video) {
                videoUrl = await uploadFile('inspection-media', `video_${inspectionId}_${item.id}.mp4`, item.video);
        }

        return {
            inspection_id: inspectionId,
            task: item.task,
            status: item.status,
            comment: item.comment || '', 
            photo_url: photoUrl,
            video_url: videoUrl
        };
    }));

    let { error: itemsError } = await supabase
        .from('checklist_results')
        .insert(itemsPayload);

    if (itemsError) {
        console.error("Save Items Strategy 1 Failed:", JSON.stringify(itemsError));
        const simplifiedPayload = itemsPayload.map(({ photo_url, video_url, ...rest }) => rest);
        const { error: retryError } = await supabase
            .from('checklist_results')
            .insert(simplifiedPayload);
        itemsError = retryError;
        if (itemsError) {
             console.error("Save Items Strategy 2 Failed (No Media):", JSON.stringify(itemsError));
             if (itemsError.code === '42P01') { 
                  console.warn("Table checklist_results not found, trying inspection_items...");
                  const { error: fallbackError } = await supabase
                    .from('inspection_items')
                    .insert(itemsPayload);
                  if (fallbackError) {
                      console.error("Strategy 3 Failed (Legacy Table):", fallbackError);
                      return { success: false, message: fallbackError.message || "خطا در ذخیره آیتم‌های چک‌لیست (Legacy)" };
                  }
                  itemsError = null; 
             } else {
                 return { success: false, message: itemsError.message || "خطا در ذخیره آیتم‌های چک‌لیست" };
             }
        }
    }

    clearInspectionsCache();
    return { success: true, trackingCode };
};

const mapInspectionRowToForm = (row: any): InspectionForm => {
    const rawItems = Array.isArray(row.items) ? row.items : [];
    const uniqueItems = Array.from(new Map(rawItems.map((item: any) => [String(item.id), item])).values());

    return {
        id: row.id,
        equipmentId: row.equipment_id,
        equipmentName: row.equipment_name,
        activityName: row.activity_name,
        timestamp: row.timestamp
            ? new Date(row.timestamp).getTime()
            : (row.created_at ? new Date(row.created_at).getTime() : Date.now()),
        inspectorName: row.inspector_name,
        inspectorCode: row.inspector_code,
        trackingCode: row.tracking_code,
        status: row.status,
        analysisResult: row.analysis_result,
        checklistTotal: row.checklist_total ?? uniqueItems.length,
        passCount: row.pass_count ?? uniqueItems.filter((item: any) => item.status === 'PASS').length,
        failCount: row.fail_count ?? uniqueItems.filter((item: any) => item.status === 'FAIL').length,
        pendingCount: row.pending_count ?? uniqueItems.filter((item: any) => item.status === 'PENDING').length,
        passPercent: typeof row.pass_percent === 'number'
            ? row.pass_percent
            : undefined,
        failTasksSample: Array.isArray(row.fail_tasks_sample) ? row.fail_tasks_sample : [],
        isOverviewOnly: uniqueItems.length === 0,
        items: uniqueItems.map((r: any) => ({
            id: r.id,
            task: r.task,
            status: r.status,
            comment: r.comment || '',
        })),
    };
};

export const getInspectionDetailsByIds = async (inspectionIds: string[]) => {
    if (!inspectionIds.length) return [];
    const { data, error } = await supabase.rpc('get_inspections_details_by_ids', { p_ids: inspectionIds });
    if (error) {
        console.error('Error fetching inspection details by ids:', error);
        return [];
    }
    return (data || []).map(mapInspectionRowToForm);
};

const getInspectionsDetailed = async (userCode?: string, startDate?: string, endDate?: string) => {
    const cacheKey = buildInspectionsCacheKey(userCode, startDate, endDate);
    const cached = inspectionsCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
        return cached.data;
    }

    // 1. Fetch Inspections first (Parent Table)
    let query = supabase
        .from('inspections')
        .select('id, equipment_id, equipment_name, activity_name, timestamp, created_at, inspector_name, inspector_code, tracking_code, status, analysis_result');
    
    if (userCode) query = query.eq('inspector_code', userCode);
    if (startDate) query = query.gte('timestamp', startDate);
    if (endDate) query = query.lte('timestamp', endDate);
    
    // NO LIMIT as requested - Retrieve ALL records
    query = query.order('timestamp', { ascending: false });

    const { data: inspections, error: inspError } = await query;

    if (inspError) {
        console.error("Error fetching inspections:", inspError);
        return [];
    }

    if (!inspections || inspections.length === 0) {
        return [];
    }

    // Capture IDs for RPC batch-detail loading (single DB call instead of N+1 chunks)
    const inspectionIds = inspections.map((i: any) => i.id);

    const { data: detailedRows, error: detailsError } = await supabase
        .rpc('get_inspections_details_by_ids', { p_ids: inspectionIds });

    if (detailsError) {
        console.warn('RPC get_inspections_details_by_ids failed, falling back to direct item fetch.', detailsError);
    } else if (detailedRows && detailedRows.length > 0) {
        const detailedMap = new Map(detailedRows.map((row: any) => [row.id, row]));

        const mapped = inspections.map((inspection: any) => mapInspectionRowToForm(detailedMap.get(inspection.id) || inspection));

        inspectionsCache.set(cacheKey, {
            expiresAt: Date.now() + INSPECTIONS_CACHE_TTL_MS,
            data: mapped,
        });
        return mapped;
    }

    // Legacy fallback path (for environments where RPC/table shape is not ready yet)
    const { data: checklistItems, error: checklistError } = await supabase
        .from('checklist_results')
        .select('*')
        .in('inspection_id', inspectionIds);

    if (checklistError && checklistError.code !== '42P01') {
        console.warn('Fetch error checklist_results fallback:', checklistError);
    }

    const { data: legacyItems, error: legacyError } = await supabase
        .from('inspection_items')
        .select('*')
        .in('inspection_id', inspectionIds);

    if (legacyError && legacyError.code !== '42P01' && legacyError.code !== 'PGRST205') {
        console.warn('Fetch error inspection_items fallback:', legacyError);
    }

    const allItems = [...(checklistItems || []), ...(legacyItems || [])];
    const itemsMap = new Map<string, any[]>();
    for (const item of allItems) {
        const inspId = item.inspection_id;
        if (!itemsMap.has(inspId)) itemsMap.set(inspId, []);
        itemsMap.get(inspId)!.push(item);
    }

    const mapped = inspections.map((d: any) => {
        const rawItems = itemsMap.get(d.id) || [];
        const uniqueItems = Array.from(new Map(rawItems.map((item: any) => [item.id, item])).values());

        return {
            id: d.id,
            equipmentId: d.equipment_id,
            equipmentName: d.equipment_name,
            activityName: d.activity_name,
            timestamp: d.timestamp ? new Date(d.timestamp).getTime() : (d.created_at ? new Date(d.created_at).getTime() : Date.now()),
            inspectorName: d.inspector_name,
            inspectorCode: d.inspector_code,
            trackingCode: d.tracking_code,
            status: d.status,
            analysisResult: d.analysis_result,
            checklistTotal: uniqueItems.length,
            passCount: uniqueItems.filter((item: any) => item.status === 'PASS').length,
            failCount: uniqueItems.filter((item: any) => item.status === 'FAIL').length,
            pendingCount: uniqueItems.filter((item: any) => item.status === 'PENDING').length,
            passPercent: uniqueItems.length
                ? Number(((uniqueItems.filter((item: any) => item.status === 'PASS').length * 100) / uniqueItems.length).toFixed(2))
                : 0,
            failTasksSample: uniqueItems
                .filter((item: any) => item.status === 'FAIL')
                .slice(0, 5)
                .map((item: any) => item.task),
            isOverviewOnly: false,
            items: uniqueItems.map((r: any) => ({
                id: r.id,
                task: r.task,
                status: r.status,
                comment: r.comment,
            })),
        };
    });

    inspectionsCache.set(cacheKey, {
        expiresAt: Date.now() + INSPECTIONS_CACHE_TTL_MS,
        data: mapped,
    });
    return mapped;
};

export const getInspectionsOverview = async (userCode?: string, startDate?: string, endDate?: string) => {
    const payload = {
        p_start: startDate || null,
        p_end: endDate || null,
        p_inspector_code: userCode || null,
        p_limit: 2000,
        p_offset: 0,
    };

    const { data, error } = await supabase.rpc('get_inspections_overview_v2', payload);
    if (error) {
        console.warn('RPC get_inspections_overview_v2 failed, falling back to detailed history.', error);
        return getInspectionsDetailed(userCode, startDate, endDate);
    }

    return (data || []).map((row: any) => ({
        id: row.id,
        equipmentId: row.equipment_id,
        equipmentName: row.equipment_name,
        activityName: row.activity_name,
        timestamp: row.timestamp
            ? new Date(row.timestamp).getTime()
            : Date.now(),
        inspectorName: row.inspector_name,
        inspectorCode: row.inspector_code,
        trackingCode: row.tracking_code,
        status: row.inspection_status || row.status,
        analysisResult: row.analysis_result,
        checklistTotal: Number(row.checklist_total || 0),
        passCount: Number(row.pass_count || 0),
        failCount: Number(row.fail_count || 0),
        pendingCount: Number(row.pending_count || 0),
        passPercent: Number(row.pass_percent || 0),
        failTasksSample: Array.isArray(row.fail_tasks_sample) ? row.fail_tasks_sample : [],
        isOverviewOnly: true,
        items: [],
    }));
};

export const getInspections = async (userCode?: string, startDate?: string, endDate?: string) => {
    return getInspectionsOverview(userCode, startDate, endDate);
};

// NEW: Function to get User Logs with Date Filtering
export const getUserLogs = async (startDate?: string, endDate?: string) => {
    let query = supabase.from('user_logs').select('*');

    if (startDate) {
        query = query.gte('login_timestamp', startDate);
    }
    if (endDate) {
        query = query.lte('login_timestamp', endDate);
    }

    // REMOVED LIMIT to fetch ALL matching records
    query = query.order('login_timestamp', { ascending: false });

    const { data, error } = await query;
    
    if (error) {
        console.error("Error fetching user logs:", JSON.stringify(error));
        return [];
    }

    return data || [];
};

export const getMasterUsers = async () => {
    const { data } = await supabase.from('defined_users').select('*');
    return data || [];
};

export const getMasterAssets = async () => {
        const { data } = await supabase.from('defined_assets').select('*');
        return data || [];
};

export const getAssetSchedules = async (assetCode: string) => {
        const { data } = await supabase.from('asset_schedules').select('*').eq('asset_number', assetCode);
        return data || [];
};

export const getChecklistForJobCard = async (jobCardCode: string) => {
        const { data } = await supabase
        .from('defined_checklist_items')
        .select('*')
        .eq('job_card_code', jobCardCode)
        .order('sequence', { ascending: true });
        return data || [];
};

export const getFullReport = async (startDate?: string, endDate?: string) => {
    return getInspectionsDetailed(undefined, startDate, endDate);
};

export const fetchTableData = async (table: string, filter?: any, sortColumn?: string) => {
    // Removed limit to allow full exports/viewing
    let query = supabase.from(table).select('*');
    if (filter) {
            Object.entries(filter).forEach(([key, value]) => {
            query = query.eq(key, value);
            });
    }

    const { data, error } = await query;
    if (error) {
        console.error(`Fetch ${table} error:`, JSON.stringify(error));
        return [];
    }
    
    const finalData = data || [];

    if (sortColumn && finalData.length > 0) {
        finalData.sort((a: any, b: any) => {
             const valA = a[sortColumn];
             const valB = b[sortColumn];
             if (!valA) return 1;
             if (!valB) return -1;
             if (valA < valB) return 1; 
             if (valA > valB) return -1;
             return 0;
        });
    } else if (table === 'defined_checklist_items') {
         finalData.sort((a: any, b: any) => (a.sequence || 0) - (b.sequence || 0));
    }
    
    return finalData;
};

export const insertData = async (table: string, data: any) => {
    const { error } = await supabase.from(table).insert([data]);
    if (error) throw error;
    return true;
};

export const updateData = async (table: string, id: any, data: any, idField: string = 'id') => {
    const { error } = await supabase.from(table).update(data).eq(idField, id);
    if (error) throw error;
    return true;
};

export const deleteRow = async (table: string, id: any, idField: string = 'id') => {
        const { error } = await supabase.from(table).delete().eq(idField, id);
        if (error) throw error;
        return true;
};

export const deleteRows = async (table: string, ids: any[], idField: string = 'id') => {
    const { error } = await supabase.from(table).delete().in(idField, ids);
    if (error) throw error;
    return true;
};

export const upsertData = async (table: string, data: any[], onConflict: string) => {
    const { error } = await supabase.from(table).upsert(data, { onConflict });
    if (error) throw error;
    return true;
};

export const updateInspectionStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('inspections').update({ status }).eq('id', id);
    if (error) throw error;
    clearInspectionsCache();
    return true;
};

export const checkRecordExists = async (table: string, column: string, value: any) => {
    const { count } = await supabase.from(table).select('*', { count: 'exact', head: true }).eq(column, value);
    return count ? count > 0 : false;
};

// IMPROVED getTopFailures
export const getTopFailures = async (startDate?: string, endDate?: string) => {
    // 1. Get Inspections in date range (Fetch minimal columns for speed)
    let inspQuery = supabase.from('inspections').select('id, equipment_id, equipment_name');
    if (startDate) inspQuery = inspQuery.gte('timestamp', startDate);
    if (endDate) inspQuery = inspQuery.lte('timestamp', endDate);
    
    const { data: inspections, error: inspError } = await inspQuery;

    if (inspError || !inspections || inspections.length === 0) {
        return [];
    }

    const inspectionIds = inspections.map((i: any) => i.id);
    const inspectionMap = new Map();
    inspections.forEach((i: any) => {
        inspectionMap.set(i.id, { 
            equipmentId: i.equipment_id,
            equipmentName: i.equipment_name 
        });
    });

    // 2. Get Failed Checklists for these inspections
    // Safe chunk size for IN query (URI length) and row limits
    // Since we filter by 'FAIL', result count is low, so we can use larger chunks for ID list
    const CHUNK_SIZE = 30; 
    const CONCURRENCY_LIMIT = 5;
    
    const chunks = [];
    for (let i = 0; i < inspectionIds.length; i += CHUNK_SIZE) {
        chunks.push(inspectionIds.slice(i, i + CHUNK_SIZE));
    }

    const failures: any[] = [];
    const activePromises: Promise<void>[] = [];

    const fetchFailuresChunk = async (chunk: string[]) => {
        const p1 = supabase
            .from('checklist_results')
            .select('*')
            .eq('status', 'FAIL')
            .in('inspection_id', chunk);
                
        const p2 = supabase
            .from('inspection_items')
            .select('*')
            .eq('status', 'FAIL')
            .in('inspection_id', chunk);
        
        const [r1, r2] = await Promise.all([p1, p2]);
        failures.push(...(r1.data || []), ...(r2.data || []));
    };

    for (const chunk of chunks) {
         while (activePromises.length >= CONCURRENCY_LIMIT) {
             await Promise.race(activePromises);
         }
         const p = fetchFailuresChunk(chunk).then(() => {}).catch(e => console.error(e));
         const pWrapper = p.then(() => activePromises.splice(activePromises.indexOf(pWrapper), 1));
         activePromises.push(pWrapper);
    }
    await Promise.all(activePromises);

    if (failures.length === 0) return [];

    // 3. Get Asset Descriptions (Local Names)
    const uniqueEquipIds = [...new Set(inspections.map((i: any) => i.equipment_id))];
    // Supabase 'in' limit is safe for ~50 items usually.
    // If uniqueEquipIds is huge, we should chunk this too, but assets list is usually manageable.
    // Optimization: Fetch all assets once and cache, or fetch only needed.
    // Here we fetch needed, assuming < 200 unique assets in top failures view.
    
    const assetMap = new Map();
    if (uniqueEquipIds.length > 0) {
        // Simple fetch for assets (usually small table relative to inspections)
        const { data: assets } = await supabase
            .from('defined_assets')
            .select('code, description')
            .in('code', uniqueEquipIds.slice(0, 200)); // Limit to first 200 to be safe
            
        if (assets) {
            assets.forEach((a: any) => assetMap.set(a.code, a.description));
        }
    }

    // 4. Aggregate: Group by "Task + EquipmentID"
    const counts: Record<string, { count: number, task: string, equipmentId: string, equipmentName: string, equipmentLocalName: string }> = {};
    
    failures.forEach((fail: any) => {
        const inspInfo = inspectionMap.get(fail.inspection_id);
        if (!inspInfo) return;
        
        const key = `${fail.task}__${inspInfo.equipmentId}`;
        
        if (!counts[key]) {
            const localName = assetMap.get(inspInfo.equipmentId) || '';
            counts[key] = { 
                count: 0, 
                task: fail.task, 
                equipmentId: inspInfo.equipmentId,
                equipmentName: inspInfo.equipmentName,
                equipmentLocalName: localName
            };
        }
        counts[key].count++;
    });

    return Object.values(counts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);
};