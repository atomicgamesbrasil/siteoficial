// === GLOBAL PWA VARIABLES ===
let deferredPrompt;

// 1. Capture standard event immediately (Prevents race conditions)
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log("PWA install prompt captured");
});

const CONFIG = {
    GITHUB_USER: "atomicgamesbrasil",
    GITHUB_REPO: "siteoficial",
    GITHUB_BRANCH: "main",
    CHAT_API: 'https://atomic-thiago-backend.onrender.com/chat'
};
const BASE_IMG_URL = `https://raw.githubusercontent.com/${CONFIG.GITHUB_USER}/${CONFIG.GITHUB_REPO}/${CONFIG.GITHUB_BRANCH}/`;

// --- ANALYTICS & ORDERS CONFIGURATION (INTEGRAÇÃO PAINEL) ---
const API_BASE_URL = "https://painel-atomic.onrender.com/api";
const API_ANALYTICS_URL = `${API_BASE_URL}/public/visit`;
const API_ORDER_URL = `${API_BASE_URL}/public/order`;

/**
 * Envia métricas para o Painel Administrativo
 * Usa keepalive para garantir envio mesmo se a página fechar
 */
const trackAtomicEvent = (type) => {
    // 1. Controle de Sessão para Visitas (Anti-Flood)
    if (type === 'visit') {
        if (sessionStorage.getItem('atomic_visited')) return;
        sessionStorage.setItem('atomic_visited', 'true');
    }

    // 2. Envio Assíncrono Robusto
    fetch(API_ANALYTICS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
        keepalive: true
    }).catch(err => console.warn('[Atomic Analytics] Error:', err));
};

// Initial Data
const initialProducts = [
    { id: "1", name: "PlayStation 5 Slim", category: "console", price: "R$ 3.799,00", image: BASE_IMG_URL + "img%20site/console-ps5.webp", desc: "Digital Edition, 1TB SSD. O console mais rápido da Sony." },
    { id: "2", name: "Xbox Series S", category: "console", price: "R$ 2.699,00", image: BASE_IMG_URL + "img%20site/console-xbox-s.webp", desc: "512GB SSD, Compacto e 100% digital." },
    { id: "6", name: "God of War Ragnarok", category: "games", price: "R$ 299,00", image: BASE_IMG_URL + "img%20site/game-gow.webp", desc: "PS5 Mídia Física. Aventura épica." },
    { id: "12", name: "Controle DualSense", category: "acessorios", price: "R$ 449,00", image: BASE_IMG_URL + "img%20site/acessorio-dualsense.webp", desc: "Original Sony. Controle sem fio." },
    { id: "13", name: "Mouse Gamer Red Dragon", category: "acessorios", price: "R$ 149,90", image: "https://placehold.co/400x400/292524/FFD700?text=MOUSE", desc: "Mouse Redragon de alta precisão." }
];

// Dados Iniciais de Banners
let promoBanners = [];

const faqs = [
    { q: "Vocês aceitam consoles usados na troca?", a: "Sim! Avaliamos seu console usado (PS4, Xbox One, Switch) como parte do pagamento." },
    { q: "Qual o prazo de garantia dos serviços?", a: "Todos os nossos serviços de manutenção possuem 90 dias (3 meses) de garantia legal." },
    { q: "Vocês montam PC Gamer?", a: "Com certeza! Temos consultoria especializada para montar o PC ideal para seu orçamento." },
    { q: "Entregam em todo o Rio de Janeiro?", a: "Sim, trabalhamos com entregas expressas. Consulte taxa no WhatsApp." }
];

// --- CALCULATOR DATA (BASEADA NO RELATÓRIO TÉCNICO 2025/2026) ---
const CALCULATOR_DATA = {
    console: {
        label: "Console de Mesa",
        models: {
            ps5_series: { 
                name: "PlayStation 5 / Series X", 
                services: { 
                    cleaning: { name: "Limpeza Preventiva (Metal Líquido)", min: 250, max: 400, note: "Risco Alto (Curto-circuito)" }, 
                    hdmi: { name: "Troca de HDMI", min: 350, max: 500, note: "Microsolda Avançada" } 
                } 
            },
            ps4_xboxone: { 
                name: "PS4 / Xbox One", 
                services: { 
                    cleaning: { name: "Limpeza + Pasta Térmica Prata", min: 150, max: 250, note: "Manutenção Preventiva" }, 
                    hdmi: { name: "Troca de HDMI", min: 200, max: 350, note: "Microsolda" },
                    drive: { name: "Reparo Leitor de Disco", min: 180, max: 300, note: "+ Peça se necessário" }
                } 
            },
            xbox_360: { 
                name: "Xbox 360", 
                services: { 
                    rgh: { name: "Desbloqueio RGH 3.0", min: 150, max: 250, note: "Serviço Legado" },
                    cleaning: { name: "Limpeza Geral", min: 100, max: 150, note: "Troca de pasta térmica" }
                } 
            }
        }
    },
    handheld: {
        label: "Portátil",
        models: {
            switch_v1: { 
                name: "Nintendo Switch V1", 
                services: { 
                    unlock_sw: { name: "Desbloqueio (Software)", min: 100, max: 180, note: "Inclui Configuração SD" },
                    cleaning: { name: "Limpeza Interna", min: 100, max: 150, note: "Preventiva" }
                } 
            },
            switch_v2_lite: { 
                name: "Switch V2 / Lite", 
                services: { 
                    unlock_chip: { name: "Desbloqueio (ModChip)", min: 350, max: 550, note: "Microsolda (Alta)" },
                    screen_lite: { name: "Troca de Tela (Lite)", min: 350, max: 500, note: "Desmontagem Completa" },
                    drift_stick: { name: "Troca de Analógico (Joy-Con)", min: 60, max: 90, note: "Por lado" }
                } 
            },
            switch_oled: { 
                name: "Switch OLED", 
                services: { 
                    unlock_chip: { name: "Desbloqueio (ModChip)", min: 500, max: 800, note: "Extrema Complexidade (Dat0)" },
                    cleaning: { name: "Limpeza Interna", min: 150, max: 250, note: "Preventiva" }
                } 
            },
            steam_deck: {
                name: "Steam Deck",
                services: {
                    ssd_upgrade: { name: "Troca de SSD (Upgrade)", min: 150, max: 250, note: "Não inclui valor do SSD" },
                    stick_replace: { name: "Troca de Stick (Hall Effect)", min: 200, max: 350, note: "+ Peças (Gulik)" }
                }
            }
        }
    },
    pc: {
        label: "Computador / Notebook",
        models: {
            generic: { 
                name: "Desktop / Notebook", 
                services: { 
                    format_basic: { name: "Formatação Simples (Piso)", min: 50, max: 80, note: "Sem Backup / Commodity" }, 
                    format_pro: { name: "Formatação Profissional", min: 120, max: 180, note: "C/ Backup + Drivers" },
                    cleaning_basic: { name: "Limpeza Interna", min: 80, max: 150, note: "Ar comprimido + Pasta" }
                } 
            },
            laptop_screen: {
                name: "Notebook (Tela)",
                services: {
                    screen_replace: { name: "Troca de Tela", min: 100, max: 200, note: "+ Valor da Tela (Consultar)" }
                }
            }
        }
    },
    accessory: {
        label: "Periféricos",
        models: {
            controllers: { 
                name: "Controle (DualSense / Xbox)", 
                services: { 
                    drift_simple: { name: "Reparo Drift (Simples)", min: 80, max: 120, note: "Potenciômetro" }, 
                    hall_effect: { name: "Upgrade Hall Effect", min: 160, max: 250, note: "Solução Definitiva" } 
                } 
            },
            ds4: { 
                name: "DualShock 4", 
                services: { 
                    battery: { name: "Troca de Bateria", min: 80, max: 100, note: "2000mAh (Inclusa)" },
                    drift_simple: { name: "Reparo Analógico", min: 60, max: 90, note: "Por unidade" }
                } 
            }
        }
    }
};

// Custos Logísticos baseados na Tabela 2.4 e 7.2 (Geografia Econômica)
const LOGISTICS_COST = { 
    shop: 0, // Levar na Loja
    local: 15, // Bairro vizinho
    interzonal: 35, // Média entre 30 e 40 (Zona Norte <-> Centro)
    remote: 50 // Niterói / Baixada (Piso inicial)
};

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

// --- PWA LOGIC (VISIBLE BY DEFAULT STRATEGY) ---
function detectPlatform() {
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) return 'ios';
    if (/android/.test(ua)) return 'android';
    if (/mac os/.test(ua)) return 'mac';
    if (/windows/.test(ua)) return 'windows';
    return 'generic';
}

function updateInstallButtons() {
    const isInStandaloneMode = (window.matchMedia('(display-mode: standalone)').matches) ||
                               (window.navigator.standalone === true) || 
                               (document.referrer.includes('android-app://'));
    
    const installBtnDesktop = document.getElementById('installAppBtnDesktop');
    const installBtnMobile = document.getElementById('installAppBtnMobile');

    if (isInStandaloneMode) {
        if (installBtnDesktop) installBtnDesktop.style.display = 'none';
        if (installBtnMobile) installBtnMobile.style.display = 'none';
    } else {
        if (installBtnDesktop) installBtnDesktop.style.display = '';
        if (installBtnMobile) installBtnMobile.style.display = '';
    }
}

function handleInstallClick() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') { console.log('User accepted install'); }
            deferredPrompt = null;
        });
    } else {
        showManualGuide();
    }
}

function showManualGuide() {
    const guideModal = document.getElementById('installGuideModal');
    const title = document.getElementById('guideTitle');
    const text = document.getElementById('guideText');
    const steps = document.getElementById('guideSteps');
    const icon = document.getElementById('guideMainIcon');
    const platform = detectPlatform();

    if(!guideModal || !title) return;

    if (platform === 'ios') {
        title.textContent = "Instalar no iPhone";
        text.innerHTML = "Toque em <strong class='text-blue-500'>Compartilhar</strong> e depois em <strong class='text-base'>Adicionar à Tela de Início</strong>.";
        icon.className = "ph-bold ph-share-network text-3xl text-blue-500";
        steps.innerHTML = `
            <div class="flex flex-col items-center gap-2">
                <span class="text-xs font-bold text-muted">1. Toque aqui</span>
                <i class="ph-bold ph-export text-2xl animate-bounce"></i>
            </div>
            <div class="w-px h-10 bg-base mx-2"></div>
            <div class="flex flex-col items-center gap-2">
                <span class="text-xs font-bold text-muted">2. Selecione</span>
                <div class="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs font-bold"><i class="ph-bold ph-plus-square"></i> Tela de Início</div>
            </div>`;
    } else if (platform === 'android') {
        title.textContent = "Instalar App";
        text.innerHTML = "Toque no menu do navegador e selecione <strong class='text-base'>Instalar aplicativo</strong> ou <strong class='text-base'>Adicionar à tela inicial</strong>.";
        icon.className = "ph-bold ph-download-simple text-3xl text-yellow-500";
        steps.innerHTML = `
            <div class="flex flex-col items-center gap-2">
                <span class="text-xs font-bold text-muted">1. Menu</span>
                <i class="ph-bold ph-dots-three-vertical text-2xl animate-bounce"></i>
            </div>
            <div class="w-px h-10 bg-base mx-2"></div>
            <div class="flex flex-col items-center gap-2">
                <span class="text-xs font-bold text-muted">2. Opção</span>
                <div class="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs font-bold"><i class="ph-bold ph-download-simple"></i> Instalar</div>
            </div>`;
    } else {
        title.textContent = "Instalar no Computador";
        text.innerHTML = "Procure pelo ícone de instalação <i class='ph-bold ph-download-simple'></i> na barra de endereço ou no menu do navegador.";
        icon.className = "ph-bold ph-desktop text-3xl text-purple-500";
        steps.innerHTML = `
            <div class="flex flex-col items-center gap-2">
                <span class="text-xs font-bold text-muted">Chrome / Edge</span>
                <div class="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs font-bold">Barra de Endereço</div>
            </div>`;
    }
    
    guideModal.classList.add('open');
}
// --- END PWA LOGIC ---

// Core Functions
function renderSkeletons() {
    els.productGrid.innerHTML = '';
    els.loadMore.classList.add('hidden');
    els.noResults.classList.add('hidden');
    
    const count = window.innerWidth < 768 ? 4 : 8;
    const frag = document.createDocumentFragment();

    for(let i=0; i<count; i++) {
        const article = document.createElement('article');
        article.className = 'product-card bg-card border border-base flex flex-col h-full opacity-80';
        article.innerHTML = `
            <div class="product-img-box skeleton h-48 w-full opacity-50"></div>
            <div class="p-4 flex-grow flex flex-col gap-3">
                <div class="skeleton h-4 w-3/4"></div>
                <div class="skeleton h-3 w-full"></div>
                <div class="mt-auto flex justify-between items-end">
                    <div class="skeleton h-6 w-24"></div>
                    <div class="skeleton h-10 w-10 rounded-xl"></div>
                </div>
            </div>
        `;
        frag.appendChild(article);
    }
    els.productGrid.appendChild(frag);
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
    } catch (e) { console.warn("Using fallback catalog"); }
    renderProducts(currentFilter, els.searchInput.value);
}

async function loadBannersFromGitHub() {
    try {
        const res = await fetch(`${BASE_IMG_URL}banners.json?t=${Date.now()}`);
        if (res.ok) { promoBanners = await res.json(); } else { promoBanners = []; }
    } catch (e) { promoBanners = []; }
    renderPromos();
}

function renderPromos() {
    const container = document.getElementById('promoBannersContainer');
    if(!container) return;

    const validBanners = promoBanners.filter(b => b.image && b.image.trim() !== '');
    if(!validBanners.length) { container.style.display = 'none'; return; }

    container.innerHTML = '';
    container.style.display = '';

    const sortedBanners = [
        validBanners.find(b => b.id === 'banner_1'),
        validBanners.find(b => b.id === 'banner_2')
    ].filter(b => b);

    if (sortedBanners.length === 0) return;

    const frag = document.createDocumentFragment();
    sortedBanners.forEach(banner => {
        const link = document.createElement('a');
        link.className = 'promo-banner-link group';
        link.href = banner.link || '#';
        if(banner.link && banner.link.startsWith('http')) {
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
        }
        
        const imgUrl = `${BASE_IMG_URL}BANNER%20SAZIONAL/${encodeURIComponent(banner.image)}`;
        const img = document.createElement('img');
        img.src = imgUrl; img.alt = banner.id; img.className = 'promo-banner-img'; img.loading = 'lazy';
        
        const shine = document.createElement('div');
        shine.className = 'absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none';
        
        link.appendChild(img); link.appendChild(shine);
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
        
        const imgBox = document.createElement('div');
        imgBox.className = 'product-img-box';
        imgBox.role = 'button';
        imgBox.tabIndex = 0;
        imgBox.addEventListener('click', () => showProductDetail(p.id));
        imgBox.addEventListener('keydown', (e) => (e.key === 'Enter' || e.key === ' ') && showProductDetail(p.id));

        const img = document.createElement('img');
        img.src = p.image; img.alt = p.name; img.loading = 'lazy'; img.width = 400; img.height = 400;
        img.onerror = function() { this.src='https://placehold.co/400x400/e2e8f0/1e293b?text=ATOMIC' };

        const tag = document.createElement('span');
        tag.className = `category-tag ${getCategoryClass(p.category)} absolute top-3 left-3`;
        tag.textContent = p.category;

        imgBox.appendChild(img); imgBox.appendChild(tag);

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
        const icon = document.createElement('i'); icon.className = 'ph-bold ph-plus text-lg'; addBtn.appendChild(icon);
        addBtn.addEventListener('click', (e) => { e.stopPropagation(); addToCart(p.id); });

        footer.appendChild(price); footer.appendChild(addBtn);
        contentBox.appendChild(title); contentBox.appendChild(desc); contentBox.appendChild(footer);
        card.appendChild(imgBox); card.appendChild(contentBox);
        frag.appendChild(card);
    });
    els.productGrid.appendChild(frag);
}

function updateCartUI() {
    els.cartCount.textContent = cart.length;
    els.cartCount.classList.toggle('hidden', !cart.length);
    els.checkoutBtn.disabled = !cart.length;
    els.cartItems.innerHTML = '';
    
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
        // FIX: Use Global Regex Replace /\./g to handle prices > 1k (e.g. 1.200,00)
        total += parseFloat(item.price.replace('R$', '').replace(/\./g, '').replace(',', '.').trim()) || 0;
        
        const div = document.createElement('div');
        div.className = 'flex gap-4 bg-base p-4 rounded-2xl border border-base';
        
        const img = document.createElement('img');
        img.src = item.image; img.className = 'w-16 h-16 object-contain bg-white dark:bg-slate-800 rounded-xl shadow';
        img.onerror = function() { this.src='https://placehold.co/100?text=ATOMIC' };

        const info = document.createElement('div');
        info.className = 'flex-grow min-w-0';
        
        const pName = document.createElement('p'); pName.className = 'font-bold text-sm line-clamp-1'; pName.textContent = item.name;
        const pDesc = document.createElement('p'); pDesc.className = 'text-xs text-muted line-clamp-1'; pDesc.textContent = item.desc;
        const pPrice = document.createElement('p'); pPrice.className = 'text-sm font-bold text-gradient mt-1'; pPrice.textContent = item.price;
        
        info.appendChild(pName); info.appendChild(pDesc); info.appendChild(pPrice);

        const delBtn = document.createElement('button');
        delBtn.className = 'self-center p-2 text-red-500 hover:bg-red-100 rounded-xl transition';
        const icon = document.createElement('i'); icon.className = 'ph-bold ph-trash text-lg'; delBtn.appendChild(icon);
        delBtn.ariaLabel = "Remover item";
        delBtn.addEventListener('click', () => removeFromCart(idx));

        div.appendChild(img); div.appendChild(info); div.appendChild(delBtn);
        frag.appendChild(div);
    });
    
    els.cartItems.appendChild(frag);
    els.cartTotal.textContent = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function saveCart() { localStorage.setItem('atomic_cart', JSON.stringify(cart)); }

function addToCart(id) { 
    const p = allProducts.find(x => x.id == id); 
    if(p){ 
        cart.push(p); saveCart(); updateCartUI(); showToast(`${p.name} adicionado!`);
        trackAtomicEvent('add_to_cart');
    } 
}

function removeFromCart(idx) { cart.splice(idx, 1); saveCart(); updateCartUI(); showToast('Produto removido', 'error'); }

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

// --- CHECKOUT & ORDERS LOGIC (ENTERPRISE GRADE) ---
// Função de envio robusta que não bloqueia a UI
function submitOrderToAPI(customerName) {
    if (!cart.length) return;

    // 1. Agrega itens iguais (Quantidade)
    const itemsMap = new Map();
    cart.forEach(item => {
        if (itemsMap.has(item.id)) {
            itemsMap.get(item.id).quantity += 1;
        } else {
            itemsMap.set(item.id, {
                id: item.id,
                name: item.name,
                image: item.image, // Snapshot da imagem no momento da compra
                price: item.price,
                quantity: 1
            });
        }
    });
    
    // 2. Cria Payload Rico (Objeto JSON, não String)
    const orderData = {
        customer: customerName,
        total: els.cartTotal.textContent,
        items: Array.from(itemsMap.values())
    };

    // CRUCIAL: 'keepalive: true' garante que o browser termine essa request
    // mesmo se a página for descarregada pelo window.location.href
    fetch(API_ORDER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
        keepalive: true 
    }).catch(e => console.error("Erro ao salvar pedido (keepalive)", e));
}

// Criação do Modal de Checkout (Identificação)
function createCheckoutModal() {
    if (document.getElementById('checkoutModal')) return;

    const overlay = document.createElement('div');
    overlay.id = 'checkoutModal';
    // CSS Inline para garantir Z-Index máximo e evitar sobreposição com o carrinho
    overlay.style.cssText = "position: fixed; inset: 0; z-index: 2147483647; display: none; align-items: center; justify-content: center; background: rgba(0,0,0,0.85); backdrop-filter: blur(4px);";
    
    const modal = document.createElement('div');
    modal.className = 'w-[90%] max-w-md bg-white dark:bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-6 text-center relative';
    
    modal.innerHTML = `
        <button id="closeCheckoutX" class="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition"><i class="ph-bold ph-x text-xl"></i></button>
        <div class="mb-6">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <i class="ph-fill ph-whatsapp-logo text-3xl text-green-500"></i>
            </div>
            <h3 class="text-2xl font-bold mb-2 text-gray-800 dark:text-white">Identifique-se</h3>
            <p class="text-gray-600 dark:text-gray-300 text-sm">Digite seu nome para iniciarmos o atendimento.</p>
        </div>
        <form id="checkoutForm" class="space-y-4">
            <div class="relative text-left">
                <label class="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Seu Nome</label>
                <div class="relative">
                    <i class="ph-bold ph-user absolute left-4 top-3.5 text-gray-400"></i>
                    <input type="text" id="checkoutName" required placeholder="Digite seu nome..." class="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition font-medium text-gray-800 dark:text-white" autocomplete="name">
                </div>
            </div>
            <button type="submit" class="w-full py-3.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-lg hover:shadow-green-500/30 transition-all transform active:scale-95 flex items-center justify-center gap-2">
                <span>Continuar para WhatsApp</span> <i class="ph-bold ph-arrow-right"></i>
            </button>
        </form>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const close = () => { overlay.style.display = 'none'; };
    document.getElementById('closeCheckoutX').onclick = (e) => { e.preventDefault(); close(); };
    overlay.onclick = (e) => { if (e.target === overlay) close(); };

    document.getElementById('checkoutForm').onsubmit = (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('checkoutName');
        const name = nameInput.value.trim();
        
        if (name) {
            // 1. Gera Link do WhatsApp
            const msg = `Olá! Sou *${name}* e gostaria de fechar o pedido:\n\n` + 
                        cart.map(i => `• ${i.name} - ${i.price}`).join('\n') + 
                        `\n\n*Total: ${els.cartTotal.textContent}*`;
            
            const waUrl = `https://wa.me/5521995969378?text=${encodeURIComponent(msg)}`;

            // 2. Registra o Evento e o Pedido (Background)
            trackAtomicEvent('whatsapp');
            submitOrderToAPI(name);

            // 3. Redireciona IMEDIATAMENTE (Síncrono)
            // Usar window.location.href é a forma mais segura para deep links em mobile
            window.location.href = waUrl;
            
            close();
        }
    };
}

function checkoutWhatsApp() {
    if (!cart.length) return showToast('Carrinho vazio!', 'error');
    
    // Injeta o modal na DOM se não existir
    if (!document.getElementById('checkoutModal')) createCheckoutModal();
    
    // CRUCIAL: Fecha o carrinho lateral primeiro para evitar conflitos de Z-Index/Overlay em mobile
    if (els.cartModal.classList.contains('open')) toggleCart();
    
    const overlay = document.getElementById('checkoutModal');
    const input = document.getElementById('checkoutName');
    
    // Exibe o modal
    overlay.style.display = 'flex';
    if(input) input.focus();
}

// Global exposure for Chatbot interactions
window.showProductDetail = function(id) {
    const p = allProducts.find(x => x.id == id);
    if (!p) return;
    document.getElementById('modalProductImage').src = p.image;
    document.getElementById('modalProductName').textContent = p.name;
    document.getElementById('modalProductDescription').textContent = p.desc;
    document.getElementById('modalProductPrice').textContent = p.price;
    document.getElementById('modalProductCategory').className = `category-tag absolute top-4 left-4 ${getCategoryClass(p.category)}`;
    document.getElementById('modalProductCategory').textContent = p.category;
    
    const oldBtn = document.getElementById('modalAddToCartBtn');
    const newBtn = oldBtn.cloneNode(true);
    oldBtn.parentNode.replaceChild(newBtn, oldBtn);
    newBtn.onclick = () => { addToCart(id); closeProductDetail(); };
    
    const waBtn = document.getElementById('modalWhatsappBtn');
    
    // Botão "Negociar" agora segue o fluxo padrão de identificação
    waBtn.removeAttribute('href');
    waBtn.removeAttribute('target');
    waBtn.style.cursor = 'pointer';
    waBtn.onclick = (e) => {
        e.preventDefault();
        // Garante que o item esteja no carrinho antes de ir para o checkout
        if (!cart.some(x => x.id == id)) addToCart(id);
        closeProductDetail();
        // Pequeno delay visual para a transição de modais ser suave
        setTimeout(checkoutWhatsApp, 150);
    };

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
    const iframe = document.createElement('iframe');
    iframe.className = "w-full h-full";
    iframe.src = `https://www.youtube.com/embed/${f.dataset.videoId}?autoplay=1&rel=0`;
    iframe.frameBorder = "0"; iframe.allow = "autoplay; encrypted-media"; iframe.allowFullscreen = true;
    container.innerHTML = ''; container.appendChild(iframe);
    f.style.display = 'none'; container.classList.remove('hidden');
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
            responsive: true, maintainAspectRatio: false,
            scales: { 
                r: { 
                    min: 0, max: 5, beginAtZero: true,
                    grid: { color: gridColor, circular: true }, 
                    angleLines: { color: gridColor },
                    pointLabels: { color: color, font: { size: 12, weight: '600', family: 'Inter' } },
                    ticks: { display: false, backdropColor: 'transparent' } 
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

// --- NEW PROGRESSIVE CALCULATOR LOGIC (PREP PARA PAINEL/CHATBOT) ---
function initCalculator() {
    const form = document.getElementById('serviceForm');
    if(!form) return;

    // Elements
    const step1 = document.getElementById('step-1');
    const step2 = document.getElementById('step-2');
    const step3 = document.getElementById('step-3');
    const resultArea = document.getElementById('result-area');
    
    const catInputs = document.querySelectorAll('input[name="category"]');
    const modelSelect = document.getElementById('calc-model');
    const serviceSelect = document.getElementById('calc-service');
    const serviceWrapper = document.getElementById('service-wrapper');
    const logInputs = document.querySelectorAll('input[name="logistics"]');

    // --- CONTEXTO UNIFICADO (Contrato Oficial para Integrações Futuras) ---
    // Este objeto não é usado para renderizar a UI (ainda), mas corre em paralelo
    // para garantir que tenhamos um estado limpo para exportação.
    const budgetContext = {
        status: 'draft',
        timestamp: null,
        customer: { name: '', phone: '' },
        device: { category: '', model: '', modelLabel: '' },
        service: { id: '', name: '', priceMin: 0, priceMax: 0, note: '' },
        logistics: { type: 'shop', label: '', cost: 0 },
        financial: { totalMin: 0, totalMax: 0 },
        meta: { source: 'web_calculator', userAgent: navigator.userAgent }
    };

    // State Local (UI Control)
    let state = { category: null, model: null, service: null, logistics: 'shop' };

    const updateCalc = () => {
        let min = 0;
        let max = 0;
        let note = '';

        // Só exibe resultado se tiver todos os dados
        if (state.category && state.model && state.service) {
            const modelData = CALCULATOR_DATA[state.category].models[state.model];
            const svcData = modelData.services[state.service];
            
            min = svcData.min;
            max = svcData.max;
            note = svcData.note;

            const logisticCost = LOGISTICS_COST[state.logistics] || 0;
            min += logisticCost;
            max += logisticCost;

            // --- ATUALIZAÇÃO DO CONTEXTO DE INTEGRAÇÃO ---
            budgetContext.device.category = state.category;
            budgetContext.device.model = state.model;
            budgetContext.device.modelLabel = modelData.name;
            
            budgetContext.service.id = state.service;
            budgetContext.service.name = svcData.name;
            budgetContext.service.priceMin = svcData.min;
            budgetContext.service.priceMax = svcData.max;
            budgetContext.service.note = note;

            const logisticTexts = {
                'shop': 'Levar na Loja (Madureira)',
                'local': 'Coleta Local (Bairro Vizinho)',
                'interzonal': 'Coleta Interzonal (Zona Norte/Centro)',
                'remote': 'Baixada / Niterói'
            };

            budgetContext.logistics.type = state.logistics;
            budgetContext.logistics.label = logisticTexts[state.logistics];
            budgetContext.logistics.cost = logisticCost;

            budgetContext.financial.totalMin = min;
            budgetContext.financial.totalMax = max;
            // ----------------------------------------------

            document.getElementById('price-min').textContent = formatPrice(min);
            document.getElementById('price-max').textContent = formatPrice(max);
            document.getElementById('result-note').textContent = note;
            
            resultArea.classList.add('active');
        } else {
            resultArea.classList.remove('active');
        }
    };

    // Step 1: Category Change
    catInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            state.category = e.target.value;
            state.model = null;
            state.service = null;
            
            // Reset UI
            step2.classList.remove('active');
            step3.classList.remove('active');
            resultArea.classList.remove('active');
            serviceWrapper.classList.add('hidden');
            
            // Populate Models
            modelSelect.innerHTML = '<option value="" disabled selected>Selecione...</option>';
            const models = CALCULATOR_DATA[state.category].models;
            for (const [key, val] of Object.entries(models)) {
                const opt = document.createElement('option');
                opt.value = key;
                opt.textContent = val.name;
                modelSelect.appendChild(opt);
            }
            
            // Show Step 2
            step2.classList.add('active');
        });
    });

    // Step 2: Model Change
    modelSelect.addEventListener('change', (e) => {
        state.model = e.target.value;
        state.service = null;
        
        // Reset Service
        serviceSelect.innerHTML = '<option value="" disabled selected>Selecione...</option>';
        resultArea.classList.remove('active');
        step3.classList.remove('active');
        
        // Populate Services
        const services = CALCULATOR_DATA[state.category].models[state.model].services;
        for (const [key, val] of Object.entries(services)) {
            const opt = document.createElement('option');
            opt.value = key;
            opt.textContent = val.name;
            serviceSelect.appendChild(opt);
        }
        
        serviceWrapper.classList.remove('hidden');
    });

    // Step 3: Service Change
    serviceSelect.addEventListener('change', (e) => {
        state.service = e.target.value;
        step3.classList.add('active');
        updateCalc();
    });

    // Step 4: Logistics Change
    logInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            state.logistics = e.target.value;
            updateCalc();
        });
    });

    // Form Submit
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        trackAtomicEvent('whatsapp');
        
        const clientName = document.getElementById('calc-name').value || 'Cliente';
        const clientPhone = document.getElementById('calc-phone').value || 'Não informado';
        
        // Finalize Context for Export
        budgetContext.status = 'completed';
        budgetContext.timestamp = new Date().toISOString();
        budgetContext.customer.name = clientName;
        budgetContext.customer.phone = clientPhone;

        if (!state.category || !state.model || !state.service) return;

        // --- HOOKS PARA INTEGRAÇÃO FUTURA ---
        // 1. CHATBOT: Quando ativado, o bot poderá ler 'budgetContext' aqui e assumir a conversa
        // if (window.AtomicChat && window.AtomicChat.isActive) { window.AtomicChat.processBudget(budgetContext); return; }

        // 2. PAINEL: Serialização para envio ao backend (CRM/Leads)
        // const payload = JSON.stringify(budgetContext);
        // console.log("Ready for Panel:", payload);
        // ------------------------------------

        // Geração do Link WhatsApp (Usando dados do Contexto para garantir integridade)
        const priceStr = `${formatPrice(budgetContext.financial.totalMin)} a ${formatPrice(budgetContext.financial.totalMax)}`;
        
        const msg = `*ORÇAMENTO TÉCNICO (WEB)*\n\n` +
                    `👤 *${budgetContext.customer.name}*\n` +
                    `📱 ${budgetContext.customer.phone}\n` +
                    `--------------------------------\n` +
                    `🎮 *Aparelho:* ${budgetContext.device.modelLabel}\n` +
                    `🛠️ *Serviço:* ${budgetContext.service.name}\n` +
                    `📍 *Logística:* ${budgetContext.logistics.label}\n` +
                    `💰 *Estimativa:* ${priceStr}\n` +
                    `--------------------------------\n` +
                    `*Obs:* Aceito a taxa de diagnóstico caso recuse o reparo.`;

        window.open(`https://wa.me/5521995969378?text=${encodeURIComponent(msg)}`);
    });
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    trackAtomicEvent('visit');

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(r => console.log('SW registered'))
                .catch(e => console.log('SW failed', e));
        });
    }

    updateInstallButtons();
    window.addEventListener('resize', updateInstallButtons);

    const installBtnDesktop = document.getElementById('installAppBtnDesktop');
    const installBtnMobile = document.getElementById('installAppBtnMobile');
    const guideModal = document.getElementById('installGuideModal');

    if(installBtnDesktop) installBtnDesktop.addEventListener('click', handleInstallClick);
    if(installBtnMobile) installBtnMobile.addEventListener('click', handleInstallClick);
    document.getElementById('closeGuideModal')?.addEventListener('click', () => guideModal.classList.remove('open'));
    guideModal?.addEventListener('click', (e) => { if(e.target === guideModal) guideModal.classList.remove('open'); });
    window.addEventListener('appinstalled', () => { updateInstallButtons(); deferredPrompt = null; });

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

    const savedCart = localStorage.getItem('atomic_cart');
    if (savedCart) { try { cart = JSON.parse(savedCart); updateCartUI(); } catch(e) {} }
    
    const faqContainer = document.getElementById('faqContainer');
    if(faqContainer) {
        faqContainer.innerHTML = '';
        faqs.forEach((f, i) => {
            const details = document.createElement('details');
            details.className = 'group bento-card overflow-hidden';
            if(i === 0) details.open = true;
            const summary = document.createElement('summary');
            summary.className = 'flex justify-between items-center font-medium cursor-pointer list-none p-5 md:p-6 bg-card transition-colors';
            const qSpan = document.createElement('span'); qSpan.className = 'text-base font-bold pr-4'; qSpan.textContent = f.q;
            const iconDiv = document.createElement('div'); iconDiv.className = 'w-10 h-10 rounded-xl bg-base flex items-center justify-center transition-all flex-shrink-0';
            const icon = document.createElement('i'); icon.className = 'ph-bold ph-caret-down text-lg transition-transform group-open:rotate-180'; iconDiv.appendChild(icon);
            summary.appendChild(qSpan); summary.appendChild(iconDiv);
            const ansDiv = document.createElement('div'); ansDiv.className = 'text-muted p-5 md:p-6 pt-0 leading-relaxed bg-base'; ansDiv.textContent = f.a;
            details.appendChild(summary); details.appendChild(ansDiv);
            faqContainer.appendChild(details);
        });
    }
    
    initCharts(theme);
    loadGamesFromGitHub();
    loadBannersFromGitHub();
    initCalculator(); // INICIALIZA A NOVA CALCULADORA

    const observer = new IntersectionObserver(entries => entries.forEach(e => e.isIntersecting && (e.target.classList.add('visible'), observer.unobserve(e.target))), { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    document.getElementById('backToTop')?.addEventListener('click', () => window.scrollTo({top: 0, behavior: 'smooth'}));
    document.getElementById('videoFacade')?.addEventListener('click', loadVideo);
    document.getElementById('productDetailOverlay')?.addEventListener('click', closeProductDetail);
    document.getElementById('closeDetailBtn')?.addEventListener('click', closeProductDetail);
    
    document.getElementById('mobileMenuOverlay')?.addEventListener('click', toggleMobileMenu);
    document.getElementById('mobileMenuOpenBtn')?.addEventListener('click', toggleMobileMenu);
    document.getElementById('closeMobileMenuBtn')?.addEventListener('click', toggleMobileMenu);
    document.querySelectorAll('.mobile-menu a').forEach(link => link.addEventListener('click', toggleMobileMenu));

    document.getElementById('cartOverlay')?.addEventListener('click', toggleCart);
    document.getElementById('openCartBtn')?.addEventListener('click', toggleCart);
    document.getElementById('closeCartBtn')?.addEventListener('click', toggleCart);
    document.getElementById('checkoutBtn')?.addEventListener('click', checkoutWhatsApp);

    document.getElementById('btnLoadMore')?.addEventListener('click', () => renderProducts(currentFilter, els.searchInput.value, true));
    document.querySelectorAll('.filter-btn').forEach(btn => btn.addEventListener('click', e => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active')); e.currentTarget.classList.add('active');
        currentFilter = e.currentTarget.dataset.category; renderProducts(currentFilter, els.searchInput.value);
    }));
    els.searchInput?.addEventListener('input', e => { clearTimeout(debounceTimer); debounceTimer = setTimeout(() => renderProducts(currentFilter, e.target.value), 300); });
    
    document.getElementById('themeToggle')?.addEventListener('click', () => {
        const newTheme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
        document.documentElement.className = newTheme; localStorage.setItem('theme', newTheme); initCharts(newTheme);
    });

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
