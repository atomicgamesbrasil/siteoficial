// === UTILS MODULE ===

export const formatPrice = p => {
    if (typeof p === 'number') return p.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    if (String(p).includes('R$')) return p;
    return parseFloat(String(p).replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '')).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export const showToast = (msg, type = 'success') => {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icon = document.createElement('i');
    icon.className = `ph-bold ${type === 'success' ? 'ph-check-circle' : 'ph-warning-circle'} text-xl`;
    
    const text = document.createElement('span');
    text.textContent = msg;
    
    toast.appendChild(icon);
    toast.appendChild(text);
    container.appendChild(toast);
    
    // Animation timing matching CSS
    setTimeout(() => { 
        toast.style.opacity = '0'; 
        toast.style.transform = 'translateY(20px) scale(0.8)'; 
        setTimeout(() => toast.remove(), 300); 
    }, 3000);
};

export const getCategoryClass = cat => {
    const map = { 
        console: 'category-console', 
        games: 'category-games', 
        acessorios: 'category-acessorios', 
        hardware: 'category-hardware' 
    };
    return map[cat] || 'category-games';
};
