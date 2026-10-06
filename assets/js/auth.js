// Core Authentication & Route Guard Module
async function checkAuthAndRoute() {
    const { data: { session }, error } = await supabase.auth.getSession();
    const currentPath = window.location.pathname;
    
    const isPublicPage = currentPath.includes('login.html') || currentPath.includes('register.html') || currentPath === '/' || currentPath.endsWith('wtois/');

    if (!session && !isPublicPage) {
        window.location.href = '/login.html';
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
            window.location.href = '/login.html';
            return null;
        }

        // Enforce Portal Separation
        if (profile.account_type === 'APPLICANT' && currentPath.includes('/employee/')) {
            window.location.href = '/applicant/dashboard.html';
        } else if (profile.account_type === 'EMPLOYEE' && currentPath.includes('/applicant/')) {
            window.location.href = '/employee/dashboard.html';
        }

        // Redirect away from login if already authenticated
        if (isPublicPage) {
            window.location.href = profile.account_type === 'APPLICANT' 
                ? '/applicant/dashboard.html' 
                : '/employee/dashboard.html';
        }
        return { session, profile };
    }
    return null;
}

async function logout() {
    await supabase.auth.signOut();
    window.location.href = '/login.html';
}