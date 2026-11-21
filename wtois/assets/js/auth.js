// Shared Authentication, Route Guard, and Logout Helpers for WTOIS

function getLoginUrl() {
    const normalizedPath = window.location.pathname.replace(/\\/g, '/');
    if (
        normalizedPath.includes('/applicant/') ||
        normalizedPath.includes('/employee/') ||
        normalizedPath.includes('/admin/')
    ) {
        return '../login.html';
    }
    return 'login.html';
}

function getDashboardUrl(accountType) {
    const normalizedPath = window.location.pathname.replace(/\\/g, '/');
    const inSubfolder =
        normalizedPath.includes('/applicant/') ||
        normalizedPath.includes('/employee/') ||
        normalizedPath.includes('/admin/');

    const prefix = inSubfolder ? '../' : '';

    if (accountType === 'ADMIN') return `${prefix}admin/employees.html`;
    if (accountType === 'EMPLOYEE') return `${prefix}employee/dashboard.html`;
    return `${prefix}applicant/dashboard.html`;
}

async function logout() {
    try {
        await supabase.auth.signOut();
    } catch (err) {
        console.error('Sign out error:', err);
    } finally {
        window.location.href = getLoginUrl();
    }
}

async function checkAuthAndRoute() {
    const loginUrl = getLoginUrl();

    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session || !session.user) {
        window.location.href = loginUrl;
        return null;
    }

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, account_type, first_name, middle_name, last_name, email, account_status')
        .eq('id', session.user.id)
        .single();

    if (profileError || !profile) {
        await supabase.auth.signOut();
        window.location.href = loginUrl;
        return null;
    }

    if (profile.account_status && profile.account_status.toUpperCase() !== 'ACTIVE') {
        alert('Your account is currently inactive. Please contact the LGU Administrator.');
        await supabase.auth.signOut();
        window.location.href = loginUrl;
        return null;
    }

    const path = window.location.pathname.replace(/\\/g, '/');

    // Enforce portal separation by account_type
    if (path.includes('/admin/') && profile.account_type !== 'ADMIN') {
        window.location.href = getDashboardUrl(profile.account_type);
        return null;
    }

    if (path.includes('/employee/') && !['EMPLOYEE', 'ADMIN'].includes(profile.account_type)) {
        window.location.href = getDashboardUrl(profile.account_type);
        return null;
    }

    if (path.includes('/applicant/') && profile.account_type !== 'APPLICANT') {
        window.location.href = getDashboardUrl(profile.account_type);
        return null;
    }

    return { session, user: session.user, profile };
}

// Automatically attach logout handler to any #btnLogout or [data-logout] button
document.addEventListener('DOMContentLoaded', () => {
    const logoutButtons = document.querySelectorAll('#btnLogout, [data-logout]');
    logoutButtons.forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    });
});