// === GLOBAL PWA VARIABLES ===
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log("PWA install prompt captured");
});

const CONFIG = {
    GITHUB_USER: "atomicgamesbrasil",
    GITHUB_REPO: "siteoficial",
    GITHUB_BRANCH: "main",
    CHAT_API: 'https://atomic-thiago-backend.onrender.com/chat',
    PAINEL_API_BASE: "https://painel-atomic.onrender.com/api"
};
const BASE_IMG_URL = `https://raw.githubusercontent.com/${CONFIG.GITHUB_USER}/${CONFIG.GITHUB_REPO}/${CONFIG.GITHUB_BRANCH}/`;

// --- ANALYTICS ---
const trackAtomicEvent = (type) => {
    if (type === 'visit') {
        if (sessionStorage.getItem('atomic_visited')) return;
        sessionStorage.setItem('atomic_visited', 'true');
    }
    fetch(`${CONFIG.PAINEL_API_BASE}/public/visit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
        keepalive: true
    }).catch(err => console.warn('[Atomic Analytics] Error:', err));
};

// --- DADOS INICIAIS E VARIÁVEIS ---
const initialProducts = [
    { id: "1", name: "PlayStation 5 Slim", category: "console", price: "R$ 3.799,00", image: BASE_IMG_URL + "img%20site/console-ps5.webp", desc: "Digital Edition, 1TB SSD. O console mais rápido da Sony." },
    { id: "2", name: "Xbox Series S", category: "console", price: "R$ 2.699,00", image: BASE_IMG_URL + "img%20site/console-xbox-s.webp", desc: "512GB SSD, Compacto e 100% digital." },
    { id: "6", name: "God of War Ragnarok", category: "games", price: "R$ 299,00", image: BASE_IMG_URL + "img%20site/game-gow.webp", desc: "PS5 Mídia Física. Aventura épica." },
    { id: "12", name: "Controle DualSense", category: "acessorios", price: "R$ 449,00", image: BASE_IMG_URL + "img%20site/acessorio-dualsense.webp", desc: "Original Sony. Controle sem fio." },
    { id: "13", name: "Mouse Gamer Red Dragon", category: "acessorios", price: "R$ 149,90", image: "https://placehold.co/400x400/292524/FFD700?text=MOUSE", desc: "Mouse Redragon de alta precisão." }
];

const faqs = [
    { q: "Vocês aceitam consoles usados na troca?", a: "Sim! Avaliamos seu console usado (PS4, Xbox One, Switch) como parte do pagamento." },
    { q: "Qual o prazo de garantia dos serviços?", a: "Todos os nossos serviços de manutenção possuem 90 dias (3 meses) de garantia legal." },
    { q: "Vocês montam PC Gamer?", a: "Com certeza! Temos consultoria especializada para montar o PC ideal para seu orçamento." },
    { q: "Entregam em todo o Rio de Janeiro?", a: "Sim, trabalhamos com entregas expressas. Consulte taxa no WhatsApp." }
];

let allProducts = [...initialProducts];
let cart = [];
let promoBanners = [];
let currentFilter = 'all';
let debounceTimer;
let els = {};

// Utils
const formatPrice = p => typeof p === 'number' ? p.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : (String(p).includes('R$') ? p : parseFloat(String(p).replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '')).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));

const showToast = (msg, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="ph-bold ${type === 'success' ? 'ph-check-circle' : 'ph-warning-circle'} text-xl"></i><span>${msg}</span>`;
    els.toastContainer.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateY(20px) scale(0.8)'; setTimeout(() => toast.remove(), 300); }, 3000);
};

const getCategoryClass = cat => ({ console: 'category-console', games: 'category-games', acessorios: 'category-acessorios', hardware: 'category-hardware' }[cat] || 'category-games');

// =========================================================================
// BLOCO LÓGICO DA CALCULADORA (INTEGRADO)
// =========================================================================
const DB_SERVICOS = {
    config: {
        valor_hora: { "JR": 50.00, "SR": 125.00 },
        logistica: { "BALCAO": 0.00, "RAIO_CURTO": 0.00, "RAIO_MEDIO": 30.00, "RAIO_LONGO": 60.00 },
        markup_padrao: 2.0
    },
    aparelhos: [
        {
            id: "PS5", label: "PlayStation 5", servicos: [
                { id: "LIMPEZA_METAL", label: "Limpeza Completa (Metal Líquido)", horas: 2.0, nivel: "SR", complexidade: 1.0, custo_peca: 50.00, risco: "ALTO", obs: "Inclui Metal Líquido" },
                { id: "TROCA_HDMI", label: "Troca de Conector HDMI", horas: 2.0, nivel: "SR", complexidade: 1.04, custo_peca: 40.00, risco: "MEDIO", obs: "Microsolda obrigatória" },
                { id: "DIAGNOSTICO", label: "Não Liga (Diagnóstico Placa)", horas: 3.0, nivel: "SR", complexidade: 1.0, custo_peca: 0.00, risco: "ALTO", obs: "Orçamento sob análise" }
            ]
        },
        {
            id: "PS4", label: "PlayStation 4", servicos: [
                { id: "LIMPEZA_PREVENTIVA", label: "Limpeza Preventiva e Pasta", horas: 2.2, nivel: "JR", complexidade: 1.0, custo_peca: 10.00, risco: "BAIXO", obs: "Pasta térmica prata" },
                { id: "TROCA_HDMI", label: "Troca de HDMI", horas: 1.5, nivel: "SR", complexidade: 1.0, custo_peca: 30.00, risco: "MEDIO", obs: "Solda padrão" },
                { id: "SISTEMA", label: "Reinstalação de Sistema (Erro)", horas: 1.5, nivel: "JR", complexidade: 1.0, custo_peca: 0.00, risco: "BAIXO", obs: "Não inclui peça (HD)" }
            ]
        },
        {
            id: "XBOX_SERIES", label: "Xbox Series S/X", servicos: [
                { id: "LIMPEZA_COMPLETA", label: "Limpeza Completa", horas: 2.2, nivel: "JR", complexidade: 1.0, custo_peca: 10.00, risco: "BAIXO", obs: "Pasta térmica" },
                { id: "ERRO_SSD", label: "Erro de Sistema / SSD", horas: 2.0, nivel: "SR", complexidade: 1.0, custo_peca: 0.00, risco: "MEDIO", obs: "Requer ferramentas proprietárias" }
            ]
        },
        {
            id: "SWITCH", label: "Nintendo Switch", servicos: [
                { id: "DRIFT_JOYCON", label: "Troca de Analógico (Drift)", horas: 0.8, nivel: "JR", complexidade: 1.0, custo_peca: 25.00, risco: "BAIXO", obs: "Por alavanca" },
                { id: "TROCA_TELA_LITE", label: "Troca de Tela (Switch Lite)", horas: 1.6, nivel: "SR", complexidade: 1.0, custo_peca: 150.00, risco: "ALTO", obs: "Desmontagem total" }
            ]
        },
        {
            id: "PC", label: "PC Gamer / Notebook", servicos: [
                { id: "FORMATACAO_SIMPLES", label: "Formatação (Sem Backup)", horas: 1.2, nivel: "JR", complexidade: 1.0, custo_peca: 0.00, risco: "BAIXO", obs: "Drivers básicos" },
                { id: "FORMATACAO_COMPLETA", label: "Formatação Completa + Backup", horas: 2.4, nivel: "JR", complexidade: 1.0, custo_peca: 0.00, risco: "BAIXO", obs: "Backup até 50GB" },
                { id: "LIMPEZA_NOTE", label: "Limpeza Interna Notebook", horas: 2.2, nivel: "JR", complexidade: 1.0, custo_peca: 10.00, risco: "MEDIO", obs: "Troca de pasta" }
            ]
        },
        {
            id: "CONTROLE", label: "Controles (DualSense/Xbox)", servicos: [
                { id: "DRIFT_CONTROLE", label: "Reparo de Drift (Analógico)", horas: 1.0, nivel: "JR", complexidade: 1.2, custo_peca: 25.00, risco: "BAIXO", obs: "Solda necessária" },
                { id: "BATERIA", label: "Troca de Bateria", horas: 0.5, nivel: "JR", complexidade: 1.0, custo_peca: 50.00, risco: "BAIXO", obs: "Peça de reposição" }
            ]
        }
    ]
};

const AtomicCalculator = {
    init: function() { console.log("[Atomic] Calculator Engine Ready"); },
    getAparelhos: function() { return DB_SERVICOS.aparelhos.map(a => ({ id: a.id, label: a.label })); },
    getServicos: function(aparelhoId) { const a = DB_SERVICOS.aparelhos.find(x => x.id === aparelhoId); return a ? a.servicos : []; },
    formatarTempo: function(horas) { if (horas < 24) return `Até ${Math.ceil(horas * 1.5)}h úteis`; return `${Math.ceil(horas / 8)} a ${Math.ceil(horas / 4)} dias úteis`; },
    calcular: function(aparelhoId, servicoId, logisticaTipo = "BALCAO") {
        const aparelho = DB_SERVICOS.aparelhos.find(a => a.id === aparelhoId);
        const servico = aparelho ? aparelho.servicos.find(s => s.id === servicoId) : null;
        if (!aparelho || !servico) return { sucesso: false };

        const valorHora = DB_SERVICOS.config.valor_hora[servico.nivel];
        const custoLogistica = DB_SERVICOS.config.logistica[logisticaTipo] || 0;
        const markupPeca = DB_SERVICOS.config.markup_padrao;

        const precoFinal = (servico.custo_peca * markupPeca) + custoLogistica + (servico.horas * valorHora * servico.complexidade);
        const precoMin = Math.floor(precoFinal / 10) * 10;
        const precoMax = Math.ceil((precoFinal * 1.2) / 10) * 10;

        return {
            sucesso: true,
            aparelho: aparelho.label,
            servico: servico.label,
            preco_min: precoMin.toFixed(2).replace('.', ','),
            preco_max: precoMax.toFixed(2).replace('.', ','),
            horas_estimadas: servico.horas,
            risco: servico.risco,
            custo_logistica: custoLogistica,
            detalhes: servico.obs
        };
    }
};
window.Calculadora = AtomicCalculator;

// --- FUNÇÕES DA UI DA CALCULADORA ---
function initServiceCalculator() {
    if (window.Calculadora) { window.Calculadora.init(); populateDeviceSelect(); }
}
function populateDeviceSelect() {
    const sel = document.getElementById('deviceSelect');
    if (!sel) return;
    sel.innerHTML = '<option value="">Selecione o aparelho...</option>';
    window.Calculadora.getAparelhos().forEach(a => {
        const opt = document.createElement('option'); opt.value = a.id; opt.textContent = a.label; sel.appendChild(opt);
    });
    sel.addEventListener('change', populateIssueSelect);
}
function populateIssueSelect() {
    const devId = document.getElementById('deviceSelect').value;
    const issueSel = document.getElementById('issueSelect');
    issueSel.innerHTML = '<option value="">Selecione o problema...</option>';
    issueSel.disabled = !devId;
    if (!devId) return;
    window.Calculadora.getServicos(devId).forEach(s => {
        const opt = document.createElement('option'); opt.value = s.id; opt.textContent = s.label; issueSel.appendChild(opt);
    });
}
function handleServiceSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const res = window.Calculadora.calcular(fd.get('device'), fd.get('issue'));
    
    if (res.sucesso) {
        document.getElementById('serviceResult').classList.remove('hidden');
        document.getElementById('priceRange').textContent = `R$ ${res.preco_min} - R$ ${res.preco_max}`;
        document.getElementById('timeEstimate').textContent = window.Calculadora.formatarTempo(res.horas_estimadas);
        
        const pedido = {
            origem: "calculadora_site",
            cliente: { nome: fd.get('clientName'), telefone: fd.get('clientPhone') },
            servico_calculado: { aparelho: res.aparelho, servico: res.servico, risco: res.risco },
            resultado_financeiro: { min: res.preco_min, max: res.preco_max }
        };
        
        if (window.Chatbot && window.Chatbot.atualizarContexto) window.Chatbot.atualizarContexto(pedido);
        
        const waMsg = `*ORÇAMENTO ATOMIC*\n👤 ${pedido.cliente.nome}\n🎮 ${res.aparelho}\n⚠️ ${res.servico}\n💰 Est: R$ ${res.preco_min} - ${res.preco_max}\n⏳ ${document.getElementById('timeEstimate').textContent}`;
        window.open(`https://wa.me/5521995969378?text=${encodeURIComponent(waMsg)}`, '_blank');
        trackAtomicEvent('whatsapp');
    }
}

// --- FUNÇÕES DA LOJA E PWA (Legado/Original) ---
function detectPlatform() {
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) return 'ios';
    if (/android/.test(ua)) return 'android';
    return 'generic';
}

function updateInstallButtons() {
    const isStandalone = (window.matchMedia('(display-mode: standalone)').matches) || (window.navigator.standalone === true);
    const btnD = document.getElementById('installAppBtnDesktop');
    const btnM = document.getElementById('installAppBtnMobile');
    if (isStandalone) { if (btnD) btnD.style.display = 'none'; if (btnM) btnM.style.display = 'none'; }
    else { if (btnD) btnD.style.display = ''; if (btnM) btnM.style.display = ''; }
}

function handleInstallClick() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(() => { deferredPrompt = null; });
    } else {
        const modal = document.getElementById('installGuideModal');
        if (modal) {
            const title = document.getElementById('guideTitle');
            const plat = detectPlatform();
            if (title) title.textContent = plat === 'ios' ? "Instalar no iPhone" : "Instalar App";
            modal.classList.add('open');
        }
    }
}

function renderSkeletons() {
    if(!els.productGrid) return;
    els.productGrid.innerHTML = '';
    els.loadMore.classList.add('hidden');
    els.noResults.classList.add('hidden');
    for(let i=0; i<4; i++) {
        els.productGrid.innerHTML += `<article class="product-card bg-card border border-base flex flex-col h-full opacity-80"><div class="product-img-box skeleton h-48 w-full opacity-50"></div><div class="p-4 flex-grow flex flex-col gap-3"><div class="skeleton h-4 w-3/4"></div><div class="skeleton h-3 w-full"></div></div></article>`;
    }
}

async function loadGamesFromGitHub() {
    renderSkeletons();
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
    } catch (e) { allProducts = [...initialProducts]; }
    renderProducts(currentFilter, els.searchInput.value);
}

async function loadBannersFromGitHub() {
    try {
        const res = await fetch(`${BASE_IMG_URL}banners.json?t=${Date.now()}`);
        if (res.ok) { promoBanners = await res.json(); renderPromos(); }
    } catch (e) { promoBanners = []; }
}

function renderPromos() {
    const container = document.getElementById('promoBannersContainer');
    if(!container || !promoBanners.length) { if(container) container.style.display = 'none'; return; }
    container.innerHTML = ''; container.style.display = '';
    const valid = promoBanners.filter(b => b.image && b.image.trim()).slice(0, 2);
    if (!valid.length) return;
    valid.forEach(b => {
        const link = document.createElement('a'); link.className = 'promo-banner-link group'; link.href = b.link || '#';
        link.innerHTML = `<img src="${BASE_IMG_URL}BANNER%20SAZIONAL/${encodeURIComponent(b.image)}" class="promo-banner-img" loading="lazy">`;
        container.appendChild(link);
    });
}

function renderProducts(filter, term = "", forceAll = false) {
    if (!els.productGrid) return;
    const lowerTerm = term.toLowerCase();
    const filtered = allProducts.filter(p => (filter === 'all' || (p.category || 'games').toLowerCase().includes(filter)) && (!term || p.name.toLowerCase().includes(lowerTerm)));
    const limit = (window.innerWidth < 768) ? 6 : 10;
    const toShow = forceAll || term ? filtered : filtered.slice(0, limit);
    
    els.loadMore.classList.toggle('hidden', forceAll || term || filtered.length <= limit);
    els.noResults.classList.toggle('hidden', filtered.length > 0);
    els.productGrid.innerHTML = '';

    toShow.forEach((p, i) => {
        const art = document.createElement('article');
        art.className = 'product-card bg-card border border-base flex flex-col h-full group reveal';
        art.innerHTML = `
            <div class="product-img-box" role="button" tabindex="0"><img src="${p.image}" loading="lazy" alt="${p.name}" onerror="this.src='https://placehold.co/400?text=ATOMIC'"><span class="category-tag ${getCategoryClass(p.category)} absolute top-3 left-3">${p.category}</span></div>
            <div class="p-4 flex-grow flex flex-col"><h3 class="font-bold text-sm mb-1 group-hover:text-yellow-500 transition line-clamp-2">${p.name}</h3><p class="text-xs text-muted mb-4 flex-grow line-clamp-2">${p.desc}</p><div class="mt-auto flex justify-between items-center"><span class="font-black text-lg text-gradient">${p.price}</span><button class="add-btn bg-gradient-to-r from-yellow-400 to-orange-500 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg hover:scale-105 transition"><i class="ph-bold ph-plus text-black"></i></button></div></div>`;
        const imgBox = art.querySelector('.product-img-box');
        const addBtn = art.querySelector('.add-btn');
        imgBox.onclick = () => showProductDetail(p.id);
        addBtn.onclick = (e) => { e.stopPropagation(); addToCart(p.id); };
        els.productGrid.appendChild(art);
    });
}

function updateCartUI() {
    if(!els.cartCount) return;
    els.cartCount.textContent = cart.length; els.cartCount.classList.toggle('hidden', !cart.length);
    els.checkoutBtn.disabled = !cart.length; els.cartItems.innerHTML = '';
    let total = 0;
    if (!cart.length) els.cartItems.innerHTML = '<div class="text-center py-12 text-muted">Carrinho vazio</div>';
    else cart.forEach((item, idx) => {
        total += parseFloat(item.price.replace('R$', '').replace(/\./g, '').replace(',', '.').trim()) || 0;
        const row = document.createElement('div'); row.className = 'flex gap-4 bg-base p-4 rounded-2xl border border-base mb-2';
        row.innerHTML = `<img src="${item.image}" class="w-16 h-16 object-contain rounded-xl bg-white"><div class="flex-grow min-w-0"><p class="font-bold text-sm truncate">${item.name}</p><p class="text-xs text-gradient font-bold">${item.price}</p></div><button class="text-red-500 hover:bg-red-100 p-2 rounded-xl del-btn"><i class="ph-bold ph-trash"></i></button>`;
        row.querySelector('.del-btn').onclick = () => { cart.splice(idx, 1); saveCart(); updateCartUI(); };
        els.cartItems.appendChild(row);
    });
    els.cartTotal.textContent = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function addToCart(id) { const p = allProducts.find(x => x.id == id); if (p) { cart.push(p); saveCart(); updateCartUI(); showToast(`${p.name} adicionado!`); trackAtomicEvent('add_to_cart'); } }
function saveCart() { localStorage.setItem('atomic_cart', JSON.stringify(cart)); }

function loadVideo() { 
    const f = document.getElementById('videoFacade'); 
    const container = document.getElementById('videoContainer');
    if(!f || !container) return;
    container.innerHTML = `<iframe class="w-full h-full" src="https://www.youtube.com/embed/${f.dataset.videoId}?autoplay=1&rel=0" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
    f.style.display = 'none'; container.classList.remove('hidden');
}

function initCharts(theme) {
    const dark = theme === 'dark';
    const color = dark ? '#f1f5f9' : '#0f172a';
    if (window.repChart) window.repChart.destroy();
    if (window.servChart) window.servChart.destroy();
    
    const c1 = document.getElementById('reputationChart');
    if (c1) window.repChart = new Chart(c1.getContext('2d'), {
        type: 'radar',
        data: { labels: ['Atendimento', 'Preço', 'Rapidez', 'Variedade', 'Confiança'], datasets: [{ label: 'Nota', data: [4.8, 4.2, 4.6, 4.4, 4.9], backgroundColor: 'rgba(255, 215, 0, 0.25)', borderColor: '#FFD700', borderWidth: 3 }] },
        options: { scales: { r: { min: 0, max: 5, ticks: { display: false }, pointLabels: { color } } }, plugins: { legend: { display: false } } }
    });

    const c2 = document.getElementById('servicesChart');
    if (c2) window.servChart = new Chart(c2.getContext('2d'), {
        type: 'doughnut',
        data: { labels: ['Manutenção', 'Jogos', 'Consoles', 'Peças'], datasets: [{ data: [40, 20, 25, 15], backgroundColor: ['#FFD700', '#10B981', '#3B82F6', '#8B5CF6'], borderWidth: 0 }] },
        options: { cutout: '70%', plugins: { legend: { position: 'right', labels: { color } } } }
    });
}

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    trackAtomicEvent('visit');
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});

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

    updateInstallButtons();
    const theme = localStorage.getItem('theme') || 'light';
    document.documentElement.className = theme;
    initCharts(theme);
    
    if (localStorage.getItem('atomic_cart')) { try { cart = JSON.parse(localStorage.getItem('atomic_cart')); updateCartUI(); } catch(e) {} }

    loadGamesFromGitHub();
    loadBannersFromGitHub();
    initServiceCalculator();

    const faqContainer = document.getElementById('faqContainer');
    if(faqContainer) {
        faqContainer.innerHTML = '';
        faqs.forEach(f => {
            const d = document.createElement('details'); d.className = 'group bento-card overflow-hidden';
            d.innerHTML = `<summary class="flex justify-between items-center font-medium cursor-pointer p-5 bg-card"><span class="font-bold">${f.q}</span><i class="ph-bold ph-caret-down group-open:rotate-180 transition"></i></summary><div class="text-muted p-5 pt-0 bg-base">${f.a}</div>`;
            faqContainer.appendChild(d);
        });
    }

    // Bind Events
    document.getElementById('themeToggle')?.addEventListener('click', () => {
        const newT = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
        document.documentElement.className = newT; localStorage.setItem('theme', newT); initCharts(newT);
    });

    const toggle = (el, ov) => { el.classList.toggle('open'); ov.classList.toggle('open'); document.body.style.overflow = el.classList.contains('open') ? 'hidden' : ''; };
    document.getElementById('openCartBtn')?.addEventListener('click', () => toggle(els.cartModal, els.cartOverlay));
    document.getElementById('closeCartBtn')?.addEventListener('click', () => toggle(els.cartModal, els.cartOverlay));
    document.getElementById('cartOverlay')?.addEventListener('click', () => toggle(els.cartModal, els.cartOverlay));
    document.getElementById('mobileMenuOpenBtn')?.addEventListener('click', () => toggle(els.mobileMenu, els.mobileOverlay));
    document.getElementById('closeMobileMenuBtn')?.addEventListener('click', () => toggle(els.mobileMenu, els.mobileOverlay));
    document.getElementById('mobileMenuOverlay')?.addEventListener('click', () => toggle(els.mobileMenu, els.mobileOverlay));
    document.getElementById('closeDetailBtn')?.addEventListener('click', () => toggle(els.detailModal, els.detailOverlay));
    document.getElementById('productDetailOverlay')?.addEventListener('click', () => toggle(els.detailModal, els.detailOverlay));
    
    document.getElementById('serviceForm')?.addEventListener('submit', handleServiceSubmit);
    document.getElementById('videoFacade')?.addEventListener('click', loadVideo);
    document.getElementById('backToTop')?.addEventListener('click', () => window.scrollTo({top: 0, behavior: 'smooth'}));
    document.getElementById('checkoutBtn')?.addEventListener('click', () => {
        if (!cart.length) return;
        const msg = `*PEDIDO LOJA*\n` + cart.map(i => `• ${i.name} (${i.price})`).join('\n') + `\nTotal: ${els.cartTotal.textContent}`;
        window.open(`https://wa.me/5521995969378?text=${encodeURIComponent(msg)}`, '_blank');
        trackAtomicEvent('whatsapp');
    });

    document.querySelectorAll('.filter-btn').forEach(btn => btn.addEventListener('click', e => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active')); e.currentTarget.classList.add('active');
        currentFilter = e.currentTarget.dataset.category; renderProducts(currentFilter, els.searchInput.value);
    }));
    els.searchInput?.addEventListener('input', e => { clearTimeout(debounceTimer); debounceTimer = setTimeout(() => renderProducts(currentFilter, e.target.value), 300); });

    // CRITICAL: RESTORE OBSERVER AND SCROLL
    const observer = new IntersectionObserver(entries => entries.forEach(e => e.isIntersecting && (e.target.classList.add('visible'), observer.unobserve(e.target))), { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    let lastY = 0, ticking = false;
    window.addEventListener('scroll', () => {
        if(!ticking) {
            window.requestAnimationFrame(() => {
                const y = window.scrollY;
                document.getElementById('backToTop')?.classList.toggle('show', y > 400);
                document.getElementById('navbar')?.classList.toggle('nav-hidden', y > lastY && y > 80);
                lastY = y; ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
});

// Global Helpers
window.showProductDetail = (id) => {
    const p = allProducts.find(x => x.id == id); if (!p) return;
    document.getElementById('modalProductImage').src = p.image;
    document.getElementById('modalProductName').textContent = p.name;
    document.getElementById('modalProductDescription').textContent = p.desc || 'Sem descrição';
    document.getElementById('modalProductPrice').textContent = p.price;
    document.getElementById('modalProductCategory').textContent = p.category;
    const addBtn = document.getElementById('modalAddToCartBtn');
    const newAdd = addBtn.cloneNode(true); addBtn.parentNode.replaceChild(newAdd, addBtn);
    newAdd.onclick = () => { addToCart(id); els.detailModal.classList.remove('open'); els.detailOverlay.classList.remove('open'); document.body.style.overflow=''; };
    els.detailModal.classList.add('open'); els.detailOverlay.classList.add('open'); document.body.style.overflow = 'hidden';
};
