
const CONFIG = {
    GITHUB_USER: "atomicgamesbrasil",
    GITHUB_REPO: "siteoficial",
    GITHUB_BRANCH: "main",
    CHAT_API: 'https://atomic-thiago-backend.onrender.com/chat'
};
const BASE_IMG_URL = `https://raw.githubusercontent.com/${CONFIG.GITHUB_USER}/${CONFIG.GITHUB_REPO}/${CONFIG.GITHUB_BRANCH}/`;

// Initial Data
const initialProducts = [
    { id: "1", name: "PlayStation 5 Slim", category: "console", price: "R$ 3.799,00", image: BASE_IMG_URL + "img%20site/console-ps5.webp", desc: "Digital Edition, 1TB SSD. O console mais rápido da Sony." },
    { id: "2", name: "Xbox Series S", category: "console", price: "R$ 2.699,00", image: BASE_IMG_URL + "img%20site/console-xbox-s.webp", desc: "512GB SSD, Compacto e 100% digital." },
    { id: "6", name: "God of War Ragnarok", category: "games", price: "R$ 299,00", image: BASE_IMG_URL + "img%20site/game-gow.webp", desc: "PS5 Mídia Física. Aventura épica." },
    { id: "12", name: "Controle DualSense", category: "acessorios", price: "R$ 449,00", image: BASE_IMG_URL + "img%20site/acessorio-dualsense.webp", desc: "Original Sony. Controle sem fio." },
    { id: "13", name: "Mouse Gamer Red Dragon", category: "acessorios", price: "R$ 149,90", image: "https://placehold.co/400x400/292524/FFD700?text=MOUSE", desc: "Mouse Redragon de alta precisão." }
];

// Promo Banners Data (Simulating Admin Panel Payload)
const promoBanners = [
    { 
        id: "p1", 
        imgDesktop: "https://placehold.co/1200x400/1e293b/FFD700?text=Oferta+de+Inverno+Atomic", 
        imgMobile: "https://placehold.co/600x300/1e293b/FFD700?text=Oferta+de+Inverno", 
        alt: "Promoção de Inverno", 
        link: "https://wa.me/5521995969378?text=Vi+o+banner+de+inverno+no+site" 
    },
    { 
        id: "p2", 
        imgDesktop: "https://placehold.co/1200x400/991b1b/FFFFFF?text=Manutenção+Express", 
        imgMobile: "https://placehold.co/600x300/991b1b/FFFFFF?text=Manutenção+Express", 
        alt: "Manutenção de Consoles", 
        link: "#services" 
    }
];

const faqs = [
    { q: "Vocês aceitam consoles usados na troca?", a: "Sim! Avaliamos seu console usado (PS4, Xbox One, Switch) como parte do pagamento." },
    { q: "Qual o prazo de garantia dos serviços?", a: "Todos os nossos serviços de manutenção possuem 90 dias (3 meses) de garantia legal." },
    { q: "Vocês montam PC Gamer?", a: "Com certeza! Temos consultoria especializada para montar o PC ideal para seu orçamento." },
    { q: "Entregam em todo o Rio de Janeiro?", a: "Sim, trabalhamos com entregas expressas. Consulte taxa no WhatsApp." }
];

// State & DOM Elements Cache
let allProducts = [...initialProducts];
let cart = [];
let currentFilter = 'all';
let debounceTimer;
let els = {}; // Cached DOM elements

// Utils
const formatPrice = p => typeof p === 'number' ? p.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : (String(p).includes('R$') ? p : parseFloat(String(p).replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '')).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));

const showToast = (msg, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = document.createElement('i');
    icon.className = `ph-bold ${type === 'success' ? 'ph-check-circle' : 'ph-warning-circle'} text-xl`;
    const text = document.createElement('span');
    text.textContent = msg;
    toast.appendChild(icon);
    toast.appendChild(text);
    els.toastContainer.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateY(20px) scale(0.8)'; setTimeout(() => toast.remove(), 300); }, 3000);
};

const getCategoryClass = cat => ({ console: 'category-console', games: 'category-games', acessorios: 'category-acessorios', hardware: 'category-hardware' }[cat] || 'category-games');

// Core Functions
// IMPORTANT: DO NOT ALTER THIS LOGIC TO PRESERVE GITHUB/PANEL INTEGRATION
async function loadGamesFromGitHub() {
    try {
        const res = await fetch(`${BASE_IMG_URL}produtos.json?t=${Date.now()}`);
        if (res.ok) {
            const data = await res.json();
            if (data.length) allProducts = data.map(p => ({
                id: (p.id || Date.now() + Math.random()).toString(),
                name: p.name || "Produto",
                category: p.category ? (p.category.toLowerCase().includes('console') ? 'console' : p.category.toLowerCase().includes('acess') ? 'acessorios' : p.category.toLowerCase().match(/pc|hardware/) ? 'hardware' : 'games') : 'games',
                price: formatPrice(p.price),
                image: (p.image || "").replace('/img/', '/img%20site/') || "https://placehold.co/400x400/e2e8f0/1e293b?text=ATOMIC",
                desc: p.desc || "Sem descrição."
            }));
        }
    } catch (e) { console.warn("Using fallback catalog"); }
    renderProducts(currentFilter, els.searchInput.value);
}

function renderPromos() {
    const container = document.getElementById('promoBannersContainer');
    if(!container) return;

    if(!promoBanners.length) {
        container.style.display = 'none';
        return;
    }

    const frag = document.createDocumentFragment();

    promoBanners.forEach(banner => {
        const link = document.createElement('a');
        link.href = banner.link;
        link.className = 'promo-banner snap-center shrink-0 block relative overflow-hidden rounded-2xl shadow-lg hover:shadow-gold/20 transition-all hover:scale-[1.02] group w-[90%] md:w-full';
        
        // Simple responsive image switching via JS for optimal logic control
        const img = document.createElement('img');
        img.src = window.innerWidth < 768 ? banner.imgMobile : banner.imgDesktop;
        img.alt = banner.alt;
        img.className = 'w-full h-full object-cover aspect-[2/1] md:aspect-[3/1] rounded-2xl'; 
        img.loading = 'lazy';

        // Add a "shine" effect
        const shine = document.createElement('div');
        shine.className = 'absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700';
        
        link.appendChild(img);
        link.appendChild(shine);
        frag.appendChild(link);
    });

    container.appendChild(frag);
}

function renderProducts(filter, term = "", forceAll = false) {
    const lowerTerm = term.toLowerCase();
    const filtered = allProducts.filter(p => 
        (filter === 'all' || (p.category || 'games').toLowerCase().includes(filter)) &&
        (!term || p.name.toLowerCase().includes(lowerTerm) || (p.desc && p.desc.toLowerCase().includes(lowerTerm)))
    );

    const limit = (window.innerWidth < 768) ? 6 : 10;
    const toShow = forceAll || term ? filtered : filtered.slice(0, limit);
    
    els.loadMore.classList.toggle('hidden', forceAll || term || filtered.length <= limit);
    els.noResults.classList.toggle('hidden', filtered.length > 0);
    
    els.productGrid.innerHTML = '';
    
    if (!filtered.length) return;

    const frag = document.createDocumentFragment();
    
    toShow.forEach((p, i) => {
        const card = document.createElement('article');
        card.className = 'product-card bg-card border border-base flex flex-col h-full group';
        card.style.animationDelay = `${i * 50}ms`;
        
        // Image Box
        const imgBox = document.createElement('div');
        imgBox.className = 'product-img-box';
        imgBox.role = 'button';
        imgBox.tabIndex = 0;
        imgBox.addEventListener('click', () => showProductDetail(p.id));
        imgBox.addEventListener('keydown', (e) => (e.key === 'Enter' || e.key === ' ') && showProductDetail(p.id));

        const img = document.createElement('img');
        img.src = p.image;
        img.alt = p.name;
        img.loading = 'lazy';
        // Improves CLS by letting browser know aspect ratio (assuming square-ish for catalog)
        img.width = 400; 
        img.height = 400;
        img.onerror = function() { this.src='https://placehold.co/400x400/e2e8f0/1e293b?text=ATOMIC' };

        const tag = document.createElement('span');
        tag.className = `category-tag ${getCategoryClass(p.category)} absolute top-3 left-3`;
        tag.textContent = p.category;

        imgBox.appendChild(img);
        imgBox.appendChild(tag);

        // Content Box
        const contentBox = document.createElement('div');
        contentBox.className = 'p-4 md:p-5 flex-grow flex flex-col';
        
        const title = document.createElement('h3');
        title.className = 'font-bold text-sm md:text-base mb-1 leading-tight group-hover:text-yellow-500 transition line-clamp-2';
        title.textContent = p.name;

        const desc = document.createElement('p');
        desc.className = 'text-xs text-muted mb-4 flex-grow line-clamp-2';
        desc.textContent = p.desc;

        const footer = document.createElement('div');
        footer.className = 'mt-auto flex items-center justify-between gap-2';
        
        const price = document.createElement('span');
        price.className = 'font-black text-base md:text-lg text-gradient';
        price.textContent = p.price;

        const addBtn = document.createElement('button');
        addBtn.className = 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all shadow-lg hover:scale-105';
        addBtn.ariaLabel = `Adicionar ${p.name} ao carrinho`;
        
        const icon = document.createElement('i');
        icon.className = 'ph-bold ph-plus text-lg';
        addBtn.appendChild(icon);
        
        addBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            addToCart(p.id);
        });

        footer.appendChild(price);
        footer.appendChild(addBtn);

        contentBox.appendChild(title);
        contentBox.appendChild(desc);
        contentBox.appendChild(footer);

        card.appendChild(imgBox);
        card.appendChild(contentBox);
        frag.appendChild(card);
    });
    
    els.productGrid.appendChild(frag);
}

function updateCartUI() {
    els.cartCount.textContent = cart.length;
    els.cartCount.classList.toggle('hidden', !cart.length);
    els.checkoutBtn.disabled = !cart.length;
    
    els.cartItems.innerHTML = ''; // Safer clear
    
    if (!cart.length) {
        const empty = document.createElement('div');
        empty.className = 'text-center py-12';
        empty.innerHTML = '<div class="w-20 h-20 mx-auto mb-4 rounded-full bg-base flex items-center justify-center"><i class="ph-duotone ph-shopping-cart-simple text-4xl text-muted"></i></div><p class="text-muted font-medium">Seu carrinho está vazio</p>';
        els.cartItems.appendChild(empty);
        els.cartTotal.textContent = 'R$ 0,00';
        return;
    }

    let total = 0;
    const frag = document.createDocumentFragment();
    cart.forEach((item, idx) => {
        total += parseFloat(item.price.replace('R$', '').replace('.', '').replace(',', '.').trim()) || 0;
        
        const div = document.createElement('div');
        div.className = 'flex gap-4 bg-base p-4 rounded-2xl border border-base';
        
        const img = document.createElement('img');
        img.src = item.image;
        img.className = 'w-16 h-16 object-contain bg-white dark:bg-slate-800 rounded-xl shadow';
        img.onerror = function() { this.src='https://placehold.co/100?text=ATOMIC' };

        const info = document.createElement('div');
        info.className = 'flex-grow min-w-0';
        
        const pName = document.createElement('p'); pName.className = 'font-bold text-sm line-clamp-1'; pName.textContent = item.name;
        const pDesc = document.createElement('p'); pDesc.className = 'text-xs text-muted line-clamp-1'; pDesc.textContent = item.desc;
        const pPrice = document.createElement('p'); pPrice.className = 'text-sm font-bold text-gradient mt-1'; pPrice.textContent = item.price;
        
        info.appendChild(pName);
        info.appendChild(pDesc);
        info.appendChild(pPrice);

        const delBtn = document.createElement('button');
        delBtn.className = 'self-center p-2 text-red-500 hover:bg-red-100 rounded-xl transition';
        const icon = document.createElement('i'); icon.className = 'ph-bold ph-trash text-lg';
        delBtn.appendChild(icon);
        delBtn.ariaLabel = "Remover item";
        delBtn.addEventListener('click', () => removeFromCart(idx));

        div.appendChild(img);
        div.appendChild(info);
        div.appendChild(delBtn);
        frag.appendChild(div);
    });
    
    els.cartItems.appendChild(frag);
    els.cartTotal.textContent = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Logic Helpers
function addToCart(id) { 
    const p = allProducts.find(x => x.id == id); 
    if(p){ cart.push(p); updateCartUI(); showToast(`${p.name} adicionado!`); } 
}

function removeFromCart(idx) { 
    cart.splice(idx, 1); updateCartUI(); showToast('Produto removido', 'error'); 
}

function toggleCart() { 
    const open = els.cartModal.classList.toggle('open'); 
    els.cartOverlay.classList.toggle('open'); 
    document.body.style.overflow = open ? 'hidden' : ''; 
}

function toggleMobileMenu() { 
    const open = els.mobileMenu.classList.toggle('open'); 
    els.mobileOverlay.classList.toggle('open'); 
    document.body.style.overflow = open ? 'hidden' : ''; 
}

function checkoutWhatsApp() {
    if (!cart.length) return showToast('Carrinho vazio!', 'error');
    const msg = "Olá! Gostaria de fechar o pedido:\n\n" + cart.map(i => `• ${i.name} - ${i.price}`).join('\n') + `\n\n*Total: ${els.cartTotal.textContent}*`;
    window.open(`https://wa.me/5521995969378?text=${encodeURIComponent(msg)}`);
}

function showProductDetail(id) {
    const p = allProducts.find(x => x.id == id);
    if (!p) return;
    document.getElementById('modalProductImage').src = p.image;
    document.getElementById('modalProductName').textContent = p.name;
    document.getElementById('modalProductDescription').textContent = p.desc;
    document.getElementById('modalProductPrice').textContent = p.price;
    document.getElementById('modalProductCategory').className = `category-tag absolute top-4 left-4 ${getCategoryClass(p.category)}`;
    document.getElementById('modalProductCategory').textContent = p.category;
    
    // Clean up old event listener by replacing the button clone
    const oldBtn = document.getElementById('modalAddToCartBtn');
    const newBtn = oldBtn.cloneNode(true);
    oldBtn.parentNode.replaceChild(newBtn, oldBtn);
    
    newBtn.onclick = () => { addToCart(id); closeProductDetail(); };
    
    document.getElementById('modalWhatsappBtn').href = `https://wa.me/5521995969378?text=${encodeURIComponent(`Interesse em: ${p.name}`)}`;
    els.detailModal.classList.add('open'); 
    els.detailOverlay.classList.add('open'); 
    document.body.style.overflow = 'hidden';
}

function closeProductDetail() { 
    els.detailModal.classList.remove('open'); 
    els.detailOverlay.classList.remove('open'); 
    document.body.style.overflow = ''; 
}

function loadVideo() { 
    const f = document.getElementById('videoFacade'); 
    const container = document.getElementById('videoContainer');
    // Using createElement for iframe to be safe
    const iframe = document.createElement('iframe');
    iframe.className = "w-full h-full";
    iframe.src = `https://www.youtube.com/embed/${f.dataset.videoId}?autoplay=1&rel=0`;
    iframe.frameBorder = "0";
    iframe.allow = "autoplay; encrypted-media";
    iframe.allowFullscreen = true;
    
    container.innerHTML = '';
    container.appendChild(iframe);
    
    f.style.display = 'none'; 
    container.classList.remove('hidden');
}

// Charts
function initCharts(theme) {
    const dark = theme === 'dark';
    const color = dark ? '#f1f5f9' : '#0f172a';
    const gridColor = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
    
    if (window.repChart) window.repChart.destroy();
    if (window.servChart) window.servChart.destroy();
    
    const c1 = document.getElementById('reputationChart');
    if (c1) window.repChart = new Chart(c1.getContext('2d'), {
        type: 'radar',
        data: { 
            labels: ['Atendimento', 'Preço', 'Rapidez', 'Variedade', 'Confiança'], 
            datasets: [{ 
                label: 'Nota', 
                data: [4.8, 4.2, 4.6, 4.4, 4.9], 
                backgroundColor: 'rgba(255, 215, 0, 0.25)', 
                borderColor: '#FFD700', 
                borderWidth: 3,
                pointBackgroundColor: '#FFD700',
                pointBorderColor: dark ? '#1e293b' : '#fff',
                pointBorderWidth: 2,
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#FFD700',
                pointRadius: 4
            }] 
        },
        options: { 
            responsive: true,
            maintainAspectRatio: false,
            scales: { 
                r: { 
                    min: 0, 
                    max: 5, 
                    beginAtZero: true,
                    grid: { 
                        color: gridColor,
                        circular: true 
                    }, 
                    angleLines: { color: gridColor },
                    pointLabels: { 
                        color: color,
                        font: { size: 12, weight: '600', family: 'Inter' }
                    },
                    ticks: { 
                        display: false,
                        backdropColor: 'transparent'
                    } 
                } 
            }, 
            plugins: { legend: { display: false } } 
        }
    });

    const c2 = document.getElementById('servicesChart');
    if (c2) window.servChart = new Chart(c2.getContext('2d'), {
        type: 'doughnut',
        data: { labels: ['Manutenção', 'Jogos', 'Consoles', 'Peças'], datasets: [{ data: [40, 20, 25, 15], backgroundColor: ['#FFD700', '#10B981', '#3B82F6', '#8B5CF6'], borderWidth: 0 }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'right', labels: { color, usePointStyle: true, padding: 15, font: { family: 'Inter', size: 12 } } } } }
    });
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    // Cache Elements
    els = {
        toastContainer: document.getElementById('toastContainer'),
        cartCount: document.getElementById('cartCount'),
        cartItems: document.getElementById('cartItemsContainer'),
        cartTotal: document.getElementById('cartTotal'),
        checkoutBtn: document.getElementById('checkoutBtn'),
        cartModal: document.getElementById('cartModal'),
        cartOverlay: document.getElementById('cartOverlay'),
        mobileMenu: document.getElementById('mobileMenu'),
        mobileOverlay: document.getElementById('mobileMenuOverlay'),
        productGrid: document.getElementById('productGrid'),
        noResults: document.getElementById('noResults'),
        loadMore: document.getElementById('loadMoreContainer'),
        searchInput: document.getElementById('searchInput'),
        detailModal: document.getElementById('productDetailModal'),
        detailOverlay: document.getElementById('productDetailOverlay')
    };

    const theme = localStorage.getItem('theme') || 'light';
    document.documentElement.className = theme;
    
    // Render Static Content (FAQ)
    const faqContainer = document.getElementById('faqContainer');
    if(faqContainer) {
        faqContainer.innerHTML = '';
        faqs.forEach((f, i) => {
            const details = document.createElement('details');
            details.className = 'group bento-card overflow-hidden';
            if(i === 0) details.open = true;
            
            const summary = document.createElement('summary');
            summary.className = 'flex justify-between items-center font-medium cursor-pointer list-none p-5 md:p-6 bg-card transition-colors';
            
            const qSpan = document.createElement('span');
            qSpan.className = 'text-base font-bold pr-4';
            qSpan.textContent = f.q;
            
            const iconDiv = document.createElement('div');
            iconDiv.className = 'w-10 h-10 rounded-xl bg-base flex items-center justify-center transition-all flex-shrink-0';
            const icon = document.createElement('i');
            icon.className = 'ph-bold ph-caret-down text-lg transition-transform group-open:rotate-180';
            iconDiv.appendChild(icon);
            
            summary.appendChild(qSpan);
            summary.appendChild(iconDiv);
            
            const ansDiv = document.createElement('div');
            ansDiv.className = 'text-muted p-5 md:p-6 pt-0 leading-relaxed bg-base';
            ansDiv.textContent = f.a;
            
            details.appendChild(summary);
            details.appendChild(ansDiv);
            faqContainer.appendChild(details);
        });
    }
    
    initCharts(theme);
    loadGamesFromGitHub();
    renderPromos(); // Render the new promo banners

    // Intersection Observer
    const observer = new IntersectionObserver(entries => entries.forEach(e => e.isIntersecting && (e.target.classList.add('visible'), observer.unobserve(e.target))), { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    // Event Listeners (Replaced inline onclicks)
    document.getElementById('backToTop')?.addEventListener('click', () => window.scrollTo({top: 0, behavior: 'smooth'}));
    document.getElementById('videoFacade')?.addEventListener('click', loadVideo);
    
    // Product Modal
    document.getElementById('productDetailOverlay')?.addEventListener('click', closeProductDetail);
    document.getElementById('closeDetailBtn')?.addEventListener('click', closeProductDetail);
    
    // Mobile Menu
    document.getElementById('mobileMenuOverlay')?.addEventListener('click', toggleMobileMenu);
    document.getElementById('mobileMenuOpenBtn')?.addEventListener('click', toggleMobileMenu);
    document.getElementById('closeMobileMenuBtn')?.addEventListener('click', toggleMobileMenu);
    // Add listeners to links inside mobile menu to close it on click
    document.querySelectorAll('.mobile-menu a').forEach(link => {
        link.addEventListener('click', toggleMobileMenu);
    });

    // Cart
    document.getElementById('cartOverlay')?.addEventListener('click', toggleCart);
    document.getElementById('openCartBtn')?.addEventListener('click', toggleCart);
    document.getElementById('closeCartBtn')?.addEventListener('click', toggleCart);
    document.getElementById('checkoutBtn')?.addEventListener('click', checkoutWhatsApp);

    // Filters & Search
    document.getElementById('btnLoadMore')?.addEventListener('click', () => renderProducts(currentFilter, els.searchInput.value, true));
    document.querySelectorAll('.filter-btn').forEach(btn => btn.addEventListener('click', e => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        currentFilter = e.currentTarget.dataset.category;
        renderProducts(currentFilter, els.searchInput.value);
    }));
    els.searchInput?.addEventListener('input', e => { clearTimeout(debounceTimer); debounceTimer = setTimeout(() => renderProducts(currentFilter, e.target.value), 300); });
    
    // Theme
    document.getElementById('themeToggle')?.addEventListener('click', () => {
        const newTheme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
        document.documentElement.className = newTheme; localStorage.setItem('theme', newTheme); initCharts(newTheme);
    });

    // Service Form
    document.getElementById('serviceForm')?.addEventListener('submit', e => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const msg = `*SOLICITAÇÃO DE REPARO*\n\n👤 ${fd.get('clientName')}\n📱 ${fd.get('clientPhone')}\n🎮 ${fd.get('device')}\n⚠️ ${fd.get('issue')}`;
        window.open(`https://wa.me/5521995969378?text=${encodeURIComponent(msg)}`);
    });
    
    document.getElementById('serviceForm')?.addEventListener('change', () => {
        if(document.getElementById('deviceSelect').value && document.getElementById('issueSelect').value) {
            document.getElementById('serviceResult').classList.remove('hidden');
            document.getElementById('timeEstimate').textContent = document.getElementById('issueSelect').value === 'Limpeza' ? '24 Horas' : '3 a 5 dias úteis';
        }
    });

    // Scroll Handler
    let lastY = 0, ticking = false;
    window.addEventListener('scroll', () => {
        if(!ticking) {
            window.requestAnimationFrame(() => {
                const y = window.scrollY;
                document.getElementById('backToTop').classList.toggle('show', y > 400);
                document.getElementById('navbar').classList.toggle('nav-hidden', y > lastY && y > 80);
                lastY = y; ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            if (els.cartModal.classList.contains('open')) toggleCart();
            if (els.mobileMenu.classList.contains('open')) toggleMobileMenu();
            if (els.detailModal.classList.contains('open')) closeProductDetail();
        }
    });
});
