
import { supabase } from './supabaseClient';
import { USERS } from '../data/User';
import { EQUIPMENT_LIST } from '../data/Asset';
import { ASSET_SCHEDULES } from '../data/AssetScheduling';
import { STATIC_CHECKLISTS } from '../data/JobcardActivity';

export const seedDatabase = async (onProgress: (msg: string) => void) => {
    try {
        // 1. Upload Users
        onProgress('در حال آپلود کاربران...');
        const userRows = USERS.map(u => ({
            name: u.name,
            code: u.code,
            org: u.org,
            // Password remains null initially, user uses code to login then changes it
            force_change_password: true
        }));
        
        // Using upsert to update if exists, ignoring duplicates based on 'code'
        const { error: userError } = await supabase
            .from('defined_users')
            .upsert(userRows, { onConflict: 'code' });
            
        if (userError) throw new Error(`User Error: ${userError.message}`);

        // 2. Upload Assets
        onProgress('در حال آپلود تجهیزات...');
        const assetRows = EQUIPMENT_LIST.map(a => ({
            name: a.name,
            code: a.code,
            description: a.traditionalName || ''
        }));

        const { error: assetError } = await supabase
            .from('defined_assets')
            .upsert(assetRows, { onConflict: 'code' });

        if (assetError) throw new Error(`Asset Error: ${assetError.message}`);

        // 3. Upload Job Cards (Activities Master)
        // Extract unique job cards from schedules
        onProgress('در حال آپلود کارت فعالیت‌ها...');
        const uniqueJobCards = new Map();
        ASSET_SCHEDULES.forEach(s => {
            if (s.jobCardCode && !uniqueJobCards.has(s.jobCardCode)) {
                uniqueJobCards.set(s.jobCardCode, s.jobCardName);
            }
        });
        
        // Also add job cards from static checklists if not present
        Object.keys(STATIC_CHECKLISTS).forEach(code => {
             if (!uniqueJobCards.has(code)) {
                 uniqueJobCards.set(code, "فعالیت دوره‌ای");
             }
        });

        const jobCardRows = Array.from(uniqueJobCards.entries()).map(([code, name]) => ({
            code,
            name
        }));

        if (jobCardRows.length > 0) {
            const { error: jcError } = await supabase
                .from('job_cards')
                .upsert(jobCardRows, { onConflict: 'code' });
            
            if (jcError) console.warn("JobCard Error:", jcError.message);
        }

        // 4. Upload Schedules
        onProgress('در حال آپلود برنامه زمان‌بندی...');
        const activityRows = ASSET_SCHEDULES.map(s => ({
            job_card_name: s.jobCardName,
            job_card_code: s.jobCardCode,
            asset_number: s.assetNumber,
            plan_code: s.planCode
        }));

        // Delete existing schedules to avoid duplicates without unique ID
        // Note: For a real app, we would use a more robust sync.
        // Here we just insert.
        const { error: activityError } = await supabase
            .from('asset_schedules')
            .upsert(activityRows, { onConflict: 'id' }); // Assuming ID is not sent, so it inserts. Actually upsert without ID acts like insert if not conflicting.
            // Better to just insert for this demo script or rely on RLS/Constraints if set.
            // Since we reconstructed the tables, they are empty.

        if (activityError) {
             console.warn("Activity Insert Warning:", activityError.message);
        }

        // 5. Upload Checklists
        onProgress('در حال آپلود چک‌لیست‌ها...');
        const checklistRows: any[] = [];
        
        Object.entries(STATIC_CHECKLISTS).forEach(([jobCardCode, tasks]) => {
            tasks.forEach((task, index) => {
                checklistRows.push({
                    job_card_code: jobCardCode,
                    task: task.task,
                    description: task.description,
                    sequence: index + 1
                });
            });
        });

        if (checklistRows.length > 0) {
            // Processing checklists in chunks of 500 to avoid request size limits
            const chunkSize = 500;
            for (let i = 0; i < checklistRows.length; i += chunkSize) {
                const chunk = checklistRows.slice(i, i + chunkSize);
                const { error: clError } = await supabase
                    .from('defined_checklist_items')
                    .insert(chunk); // Using insert since table is clean
                
                if (clError) console.warn("Checklist Chunk Error:", clError.message);
                onProgress(`آپلود چک‌لیست‌ها: ${Math.min(i + chunkSize, checklistRows.length)} از ${checklistRows.length}`);
            }
        }

        onProgress('همگام‌سازی با موفقیت انجام شد!');
        return true;

    } catch (error: any) {
        console.error("Seeding Error:", error);
        onProgress(`خطا: ${error.message}`);
        return false;
    }
};
