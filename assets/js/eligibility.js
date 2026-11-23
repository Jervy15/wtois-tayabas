const TERMINAL_APP_STATUSES = ['APPROVED', 'REJECTED', 'CANCELLED', 'INSPECTION_FAILED'];

async function getApplicantEligibilityState(userId) {
    const [{ data: mtops, error: mtopErr }, { data: apps, error: appErr }] = await Promise.all([
        supabase
            .from('mtop_records')
            .select('id, mtop_number, issue_date, expiration_date, status, previous_mtop_id, vehicle_id, created_at')
            .eq('applicant_id', userId)
            .order('created_at', { ascending: false }),
        supabase
            .from('applications')
            .select('id, application_number, transaction_type, current_status, previous_mtop_id, submitted_at')
            .eq('applicant_id', userId)
            .order('submitted_at', { ascending: false })
    ]);

    if (mtopErr) throw new Error(mtopErr.message);
    if (appErr) throw new Error(appErr.message);

    const allMtops = mtops || [];
    const allApps = apps || [];

    const activeMtop = allMtops.find(m => (m.status || '').toUpperCase() === 'ACTIVE') || null;
    const inFlightApps = allApps.filter(a => !TERMINAL_APP_STATUSES.includes((a.current_status || '').toUpperCase()));
    const inFlightMtopIds = new Set(
        inFlightApps
            .map(a => a.previous_mtop_id)
            .filter(Boolean)
    );

    // New MTOP eligibility: no ACTIVE MTOP and no application currently in process
    let canApplyNew = true;
    let newBlockedReason = '';
    if (activeMtop) {
        canApplyNew = false;
        newBlockedReason = `You currently have an ACTIVE MTOP franchise (${activeMtop.mtop_number}). Use MTOP Renewal or Drop MTOP instead of submitting a New MTOP application.`;
    } else if (inFlightApps.length > 0) {
        const latestInFlight = inFlightApps[0];
        canApplyNew = false;
        newBlockedReason = `You already have an in-process ${latestInFlight.transaction_type} application (${latestInFlight.application_number}, status: ${latestInFlight.current_status}).`;
    }

    // Renewal eligibility: only non-DROPPED, non-RENEWED MTOPs without an in-flight Renewal/Dropping application
    const eligibleRenewalMtops = allMtops.filter(m => {
        const st = (m.status || '').toUpperCase();
        if (st === 'DROPPED' || st === 'RENEWED') return false;
        if (inFlightMtopIds.has(m.id)) return false;
        return st === 'EXPIRED' || st === 'ACTIVE';
    });

    let canRenew = eligibleRenewalMtops.length > 0;
    let renewBlockedReason = '';
    if (!canRenew) {
        if (inFlightApps.some(a => (a.transaction_type || '').toUpperCase() === 'DROPPING')) {
            renewBlockedReason = 'MTOP Renewal is unavailable while a Dropping request is in process.';
        } else if (allMtops.some(m => (m.status || '').toUpperCase() === 'DROPPED') && !activeMtop) {
            renewBlockedReason = 'A DROPPED MTOP franchise cannot be renewed.';
        } else if (inFlightApps.some(a => (a.transaction_type || '').toUpperCase() === 'RENEWAL')) {
            renewBlockedReason = 'You already have an MTOP Renewal application currently in process.';
        } else {
            renewBlockedReason = 'You have no eligible MTOP franchise available for renewal.';
        }
    }

    // Dropping eligibility: only ACTIVE or EXPIRED MTOPs without an in-flight Dropping/Renewal application
    const eligibleDroppingMtops = allMtops.filter(m => {
        const st = (m.status || '').toUpperCase();
        if (st !== 'ACTIVE' && st !== 'EXPIRED') return false;
        if (inFlightMtopIds.has(m.id)) return false;
        return true;
    });

    let canDrop = eligibleDroppingMtops.length > 0;
    let dropBlockedReason = '';
    if (!canDrop) {
        if (inFlightApps.some(a => (a.transaction_type || '').toUpperCase() === 'DROPPING')) {
            dropBlockedReason = 'You already have an MTOP Dropping request in process.';
        } else if (allMtops.some(m => (m.status || '').toUpperCase() === 'DROPPED') && !activeMtop) {
            dropBlockedReason = 'Your franchise is already DROPPED.';
        } else {
            dropBlockedReason = 'You have no ACTIVE or EXPIRED MTOP franchise eligible for dropping.';
        }
    }

    return {
        allMtops,
        allApps,
        activeMtop,
        inFlightApps,
        canApplyNew,
        newBlockedReason,
        eligibleRenewalMtops,
        canRenew,
        renewBlockedReason,
        eligibleDroppingMtops,
        canDrop,
        dropBlockedReason
    };
}