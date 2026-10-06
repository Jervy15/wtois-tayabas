// Core Authentication & Route Guard Module

// Detect if running on GitHub Pages to inject the repository subfolder
const BASE_PATH = window.location.hostname.includes('github.io') ? '/wtois-tayabas' : '';

async function checkAuthAndRoute() {
    const { data: { session }, error } = await supabase.auth.getSession();
    const currentPath = window.location.pathname;
    
    const isPublicPage = currentPath.includes('login.html') || 
                         currentPath.includes('register.html') || 
                         currentPath === '/' || 
                         currentPath === BASE_PATH + '/';

    if (!session && !isPublicPage) {
        window.location.href = BASE_PATH + '/login.html';
        return null;
    }

    if (session) {
        // Fetch profile to determine routing
        const { data: profile } = await supabase
            .from('profiles')
            .select('account_type, account_status')
            .eq('id', session.user.id)
            .single();

        if (!profile || profile.account_status !== 'ACTIVE') {
            await supabase.auth.signOut();
            alert("Account inactive or not found.");
            window.location.href = BASE_PATH + '/login.html';
            return null;
        }

        // Enforce Portal Separation
        if (profile.account_type === 'APPLICANT' && currentPath.includes('/employee/')) {
            window.location.href = BASE_PATH + '/applicant/dashboard.html';
        } else if (profile.account_type === 'EMPLOYEE' && currentPath.includes('/applicant/')) {
            window.location.href = BASE_PATH + '/employee/dashboard.html';
        }

        // Redirect away from login if already authenticated
        if (isPublicPage) {
            window.location.href = profile.account_type === 'APPLICANT' 
                ? BASE_PATH + '/applicant/dashboard.html' 
                : BASE_PATH + '/employee/dashboard.html';
        }
        return { session, profile };
    }
    return null;
}

async function logout() {
    await supabase.auth.signOut();
    window.location.href = BASE_PATH + '/login.html';
}