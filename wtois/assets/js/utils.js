// Reusable UI utilities
function showLoader(buttonId, loadingText = 'Processing...') {
    const btn = document.getElementById(buttonId);
    if(btn) {
        btn.dataset.originalText = btn.innerHTML;
        btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> ${loadingText}`;
        btn.disabled = true;
    }
}

function hideLoader(buttonId) {
    const btn = document.getElementById(buttonId);
    if(btn) {
        btn.innerHTML = btn.dataset.originalText;
        btn.disabled = false;
    }
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-PH', options);
}

function getStatusBadge(status) {
    const colors = {
        'DRAFT': 'bg-secondary',
        'SUBMITTED': 'bg-primary',
        'DOCUMENTS_VERIFIED': 'bg-info',
        'MISSING_DOCUMENTS': 'bg-danger',
        'APPROVED': 'bg-success',
        'REJECTED': 'bg-danger'
    };
    return `<span class="badge ${colors[status] || 'bg-secondary'}">${status.replace(/_/g, ' ')}</span>`;
}