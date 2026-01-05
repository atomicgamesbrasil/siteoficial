// === GLOBAL CONFIG ===
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; });

const CONFIG = {
    GITHUB_USER: "atomicgamesbrasil",
    GITHUB_REPO: "siteoficial",
    GITHUB_BRANCH: "main"
};
const BASE_IMG_URL = `https://raw.githubusercontent.com/${CONFIG.GITHUB_USER}/${CONFIG.GITHUB_REPO}/${CONFIG.GITHUB_BRANCH}/`;
const API_ANALYTICS_URL = "https://painel-atomic.onrender.com/api/public/visit";
const API_ORDER_URL = "https://painel-atomic.onrender.com/api/public/order";

const trackAtomicEvent = (type) => {
    if (type === 'visit' && sessionStorage.getItem('atomic_visited')) return;
    if (type === 'visit') sessionStorage.setItem('atomic_visited', 'true');
    fetch(API_ANALYTICS_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type }), keepalive: true }).catch(err => console.warn(err));
};

// === DATA ===
const initialProducts = [
    { id: "1", name: "PlayStation 5 Slim", category: "console", price: "R$ 3.799,00", image: BASE_IMG_URL + "img%20site/console-ps5.webp", desc: "Digital Edition, 1TB SSD." },
    { id: "2", name: "Xbox Series S", category: "console", price: "R$ 2.699,00", image: BASE_IMG_URL + "img%20site/console-xbox-s.webp", desc: "512GB SSD, 100% Digital." },
    { id: "6", name: "God of War Ragnarok", category: "games", price: "R$ 299,00", image: BASE_IMG_URL + "img%20site/game-gow.webp", desc: "PS5 Mídia Física." },
    { id: "12", name: "Controle DualSense", category: "acessorios", price: "R$ 449,00", image: BASE_IMG_URL + "img%20site/acessorio-dualsense.webp", desc: "Original Sony." },
    { id: "13", name: "Mouse Gamer Red Dragon", category: "acessorios", price: "R$ 149,90", image: "https://placehold.co/400x400/292524/FFD700?text=MOUSE", desc: "Alta precisão." }
];

const faqs = [
    { q: "Aceitam consoles usados?", a: "Sim! Avaliamos seu console usado (PS4, Xbox One, Switch) como parte do pagamento." },
    { q: "Qual o prazo de garantia?", a: "Todos os serviços possuem 90 dias (3 meses) de garantia legal." },
    { q: "Montam PC Gamer?", a: "Sim! Temos consultoria especializada para montar o PC ideal para seu orçamento." },
    { q: "Fazem entrega?", a: "Sim, trabalhamos com entregas expressas no RJ. Consulte taxa." }
];

const CALCULATOR_DATA = {
    console: {
        label: "Console de Mesa",
        models: {
            ps5: { name: "PlayStation 5", services: { cleaning: { name: "Limpeza (Metal Líquido)", min: 250, max: 450, note: "Risco Alto" }, hdmi: { name: "Troca HDMI", min: 250, max: 400, note: "Micro-solda" }, repair_board: { name: "Reparo Placa", min: 400, max: 800, note: "Análise Avançada" } } },
            ps4: { name: "PlayStation 4", services: { cleaning: { name: "Limpeza Completa", min: 100, max: 150, note: "Preventiva" }, hdmi: { name: "Troca HDMI", min: 250, max: 400, note: "Micro-solda" }, repair_board: { name: "Reparo Placa", min: 250, max: 450, note: "Reballing" } } },
            xbox_series: { name: "Xbox Series S/X", services: { cleaning: { name: "Limpeza Interna", min: 100, max: 150, note: "Preventiva" }, hdmi: { name: "Troca HDMI", min: 300, max: 450, note: "Complexo" }, ssd: { name: "Erro E100/SSD", min: 150, max: 150, note: "+ Peça" } } }
        }
    },
    handheld: {
        label: "Portátil",
        models: {
            switch: { name: "Nintendo Switch", services: { drift: { name: "Drift Joy-Con", min: 60, max: 120, note: "Por analógico" }, screen: { name: "Troca Tela", min: 300, max: 600, note: "Risco OLED" }, cleaning: { name: "Limpeza", min: 80, max: 120, note: "Preventiva" } } },
            switch_lite: { name: "Switch Lite", services: { drift: { name: "Drift Analógico", min: 90, max: 120, note: "Desmontagem Total" }, screen: { name: "Troca Tela", min: 350, max: 500, note: "Complexo" } } }
        }
    },
    pc: {
        label: "Computador",
        models: {
            desktop: { name: "PC Gamer", services: { format_simple: { name: "Formatação", min: 50, max: 80, note: "Sem Backup" }, cleaning: { name: "Limpeza Gamer", min: 120, max: 180, note: "Cable Management" } } },
            notebook: { name: "Notebook", services: { format_simple: { name: "Formatação", min: 50, max: 80, note: "Sem Backup" }, cleaning: { name: "Limpeza Interna", min: 100, max: 150, note: "Preventiva" }, screen: { name: "Troca Tela", min: 80, max: 150, note: "+ Peça" } } }
        }
    },
    accessory: {
        label: "Acessórios",
        models: {
            controller: { name: "Controle", services: { drift: { name: "Troca Analógico", min: 50, max: 120, note: "Potenciômetro" }, battery: { name: "Bateria", min: 90, max: 120, note: "Peça Inclusa" } } }
        }
    }
};

const LOGISTICS_COST = { shop: 0, pickup_close: 0, pickup_far: 30 };

let allProducts = [...initialProducts];
let cart = [];
let els = {};

// === UTILS ===
const formatPrice = p => typeof p === 'number' ? p.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : p;
const showToast = (msg) => {
    const t = document.createElement('div'); t.className = 'toast show'; t.textContent = msg;
    els.toastContainer.appendChild(t); setTimeout(() => t.remove(), 3000);
};

// === APP LOGIC ===
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

    // State
    let state = { category: null, model: null, service: null, logistics: 'shop' };

    const updateCalc = () => {
        if (state.category && state.model && state.service) {
            const sData = CALCULATOR_DATA[state.category].models[state.model].services[state.service];
            const lCost = LOGISTICS_COST[state.logistics];
            document.getElementById('price-min').textContent = formatPrice(sData.min + lCost);
            document.getElementById('price-max').textContent = formatPrice(sData.max + lCost);
            document.getElementById('result-note').textContent = sData.note;
            resultArea.classList.add('active');
        } else {
            resultArea.classList.remove('active');
        }
    };

    catInputs.forEach(i => i.addEventListener('change', (e) => {
        state.category = e.target.value;
        state.model = null; state.service = null;
        
        // Reset Steps
        step2.classList.remove('active');
        step3.classList.remove('active');
        resultArea.classList.remove('active');
        serviceWrapper.classList.add('hidden');
        
        // Populate Models
        modelSelect.innerHTML = '<option value="" disabled selected>Selecione...</option>';
        const models = CALCULATOR_DATA[state.category].models;
        for (const [k, v] of Object.entries(models)) {
            const opt = document.createElement('option');
            opt.value = k; opt.textContent = v.name;
            modelSelect.appendChild(opt);
        }
        step2.classList.add('active');
    }));

    modelSelect.addEventListener('change', (e) => {
        state.model = e.target.value;
        state.service = null;
        
        // Reset Service
        serviceSelect.innerHTML = '<option value="" disabled selected>Selecione...</option>';
        resultArea.classList.remove('active');
        step3.classList.remove('active');
        
        // Populate Services
        const services = CALCULATOR_DATA[state.category].models[state.model].services;
        for (const [k, v] of Object.entries(services)) {
            const opt = document.createElement('option');
            opt.value = k; opt.textContent = v.name;
            serviceSelect.appendChild(opt);
        }
        serviceWrapper.classList.remove('hidden');
    });

    serviceSelect.addEventListener('change', (e) => {
        state.service = e.target.value;
        step3.classList.add('active');
        updateCalc();
    });

    logInputs.forEach(i => i.addEventListener('change', (e) => {
        state.logistics = e.target.value;
        updateCalc();
    }));

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        trackAtomicEvent('whatsapp');
        const name = document.getElementById('calc-name').value || 'Cliente';
        const phone = document.getElementById('calc-phone').value || '';
        
        if(!state.service) return;
        const mName = CALCULATOR_DATA[state.category].models[state.model].name;
        const sName = CALCULATOR_DATA[state.category].models[state.model].services[state.service].name;
        const pStr = `${document.getElementById('price-min').textContent} - ${document.getElementById('price-max').textContent}`;
        
        const msg = `*ORÇAMENTO (WEB)*\n👤 ${name}\n📱 ${phone}\n🎮 ${mName}\n🛠 ${sName}\n💰 ${pStr}`;
        window.open(`https://wa.me/5521995969378?text=${encodeURIComponent(msg)}`);
    });
}

// === MAIN INIT ===
document.addEventListener('DOMContentLoaded', () => {
    trackAtomicEvent('visit');
    
    // DOM Cache
    els = {
        toastContainer: document.getElementById('toastContainer'),
        productGrid: document.getElementById('productGrid'),
        cartItems: document.getElementById('cartItemsContainer'),
        cartTotal: document.getElementById('cartTotal'),
        cartCount: document.getElementById('cartCount'),
        cartModal: document.getElementById('cartModal'),
        cartOverlay: document.getElementById('cartOverlay'),
        mobileMenu: document.getElementById('mobileMenu'),
        mobileOverlay: document.getElementById('mobileMenuOverlay'),
        detailModal: document.getElementById('productDetailModal'),
        detailOverlay: document.getElementById('productDetailOverlay')
    };

    // SW
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});

    // PWA Install
    const installBtn = document.getElementById('installAppBtnDesktop');
    if(installBtn) installBtn.addEventListener('click', handleInstallClick);

    // Theme
    const theme = localStorage.getItem('theme') || 'light';
    document.documentElement.className = theme;
    document.getElementById('themeToggle')?.addEventListener('click', () => {
        const t = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
        document.documentElement.className = t;
        localStorage.setItem('theme', t);
        initCharts(t);
    });

    // Load Data
    loadGamesFromGitHub();
    loadBannersFromGitHub();
    initCalculator();
    initCharts(theme);

    // FAQ
    const faqContainer = document.getElementById('faqContainer');
    if(faqContainer) {
        faqContainer.innerHTML = faqs.map(f => `
            <details class="group bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                <summary class="flex justify-between items-center p-4 cursor-pointer font-bold select-none">
                    ${f.q} <i class="ph-bold ph-caret-down transition-transform group-open:rotate-180"></i>
                </summary>
                <div class="p-4 pt-0 text-gray-600 dark:text-gray-400 text-sm leading-relaxed border-t border-gray-100 dark:border-slate-800">${f.a}</div>
            </details>
        `).join('');
    }

    // Event Listeners
    const toggleCart = () => { els.cartModal.classList.toggle('open'); els.cartOverlay.classList.toggle('open'); };
    const toggleMenu = () => { els.mobileMenu.classList.toggle('open'); els.mobileOverlay.classList.toggle('open'); };
    
    document.getElementById('openCartBtn')?.addEventListener('click', toggleCart);
    document.getElementById('closeCartBtn')?.addEventListener('click', toggleCart);
    document.getElementById('cartOverlay')?.addEventListener('click', toggleCart);
    
    document.getElementById('mobileMenuOpenBtn')?.addEventListener('click', toggleMenu);
    document.getElementById('closeMobileMenuBtn')?.addEventListener('click', toggleMenu);
    document.getElementById('mobileMenuOverlay')?.addEventListener('click', toggleMenu);
    document.querySelectorAll('#mobileMenu a').forEach(a => a.addEventListener('click', toggleMenu));

    document.getElementById('backToTop')?.addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'}));
    document.getElementById('videoFacade')?.addEventListener('click', function() {
        document.getElementById('videoContainer').innerHTML = `<iframe class="w-full h-full" src="https://www.youtube.com/embed/${this.dataset.videoId}?autoplay=1" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
        this.style.display = 'none';
        document.getElementById('videoContainer').classList.remove('hidden');
    });

    // Close Modals on ESC
    document.addEventListener('keydown', e => {
        if(e.key === 'Escape') {
            els.cartModal.classList.remove('open');
            els.cartOverlay.classList.remove('open');
            els.detailModal.classList.remove('open');
            els.detailOverlay.classList.remove('open');
        }
    });

    // Checkout
    document.getElementById('checkoutBtn')?.addEventListener('click', () => {
        if(!cart.length) return showToast('Carrinho vazio');
        const overlay = document.createElement('div');
        overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:9999;display:flex;justify-content:center;align-items:center";
        overlay.innerHTML = `
            <div class="bg-white dark:bg-slate-900 p-6 rounded-xl w-11/12 max-w-sm">
                <h3 class="font-bold text-lg mb-4">Seu Nome</h3>
                <input id="coName" class="w-full border p-2 rounded mb-4 dark:bg-slate-800 dark:border-slate-700" placeholder="Nome...">
                <div class="flex gap-2">
                    <button id="coCancel" class="flex-1 py-2 bg-gray-200 dark:bg-slate-700 rounded font-bold">Cancelar</button>
                    <button id="coSend" class="flex-1 py-2 bg-green-500 text-white rounded font-bold">Enviar</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);
        
        document.getElementById('coCancel').onclick = () => overlay.remove();
        document.getElementById('coSend').onclick = () => {
            const name = document.getElementById('coName').value;
            if(!name) return alert('Digite seu nome');
            trackAtomicEvent('whatsapp');
            const msg = `Pedido de *${name}*:\n\n${cart.map(i => `- ${i.name}`).join('\n')}\n\nTotal: ${els.cartTotal.textContent}`;
            window.location.href = `https://wa.me/5521995969378?text=${encodeURIComponent(msg)}`;
            overlay.remove();
        };
    });
});

// Helper Functions
async function loadGamesFromGitHub() {
    try {
        const res = await fetch(`${BASE_IMG_URL}produtos.json`);
        if(res.ok) {
            const data = await res.json();
            allProducts = data.map(p => ({
                id: String(p.id), name: p.name, category: p.category?.toLowerCase() || 'games',
                price: formatPrice(p.price), image: (p.image || '').replace('/img/', '/img%20site/'), desc: p.desc
            }));
        }
    } catch(e) {}
    renderProducts('all');
}

async function loadBannersFromGitHub() {
    try {
        const res = await fetch(`${BASE_IMG_URL}banners.json`);
        if(res.ok) {
            promoBanners = await res.json();
            const c = document.getElementById('promoBannersContainer');
            if(c && promoBanners.length) {
                const b = promoBanners.find(x => x.id === 'banner_1');
                if(b) c.innerHTML = `<img src="${BASE_IMG_URL}BANNER%20SAZIONAL/${encodeURIComponent(b.image)}" class="w-full rounded-2xl shadow-lg">`;
            }
        }
    } catch(e) {}
}

function renderProducts(filter, term='') {
    const list = allProducts.filter(p => (filter==='all' || p.category.includes(filter)) && p.name.toLowerCase().includes(term.toLowerCase()));
    els.productGrid.innerHTML = list.slice(0, 8).map(p => `
        <article class="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 overflow-hidden hover:shadow-lg transition group cursor-pointer" onclick="showProductDetail('${p.id}')">
            <div class="aspect-square bg-gray-100 dark:bg-slate-800 relative">
                <img src="${p.image}" class="w-full h-full object-contain p-4" onerror="this.src='https://placehold.co/400?text=ATOMIC'">
                <span class="absolute top-2 left-2 text-[10px] font-bold bg-black text-white px-2 py-1 rounded">${p.category}</span>
            </div>
            <div class="p-4">
                <h3 class="font-bold text-sm mb-1 truncate">${p.name}</h3>
                <p class="text-xs text-gray-500 mb-3 truncate">${p.desc}</p>
                <div class="flex justify-between items-center">
                    <span class="font-bold text-yellow-600 dark:text-yellow-400">${p.price}</span>
                    <button class="w-8 h-8 rounded-lg bg-yellow-400 flex items-center justify-center hover:scale-110 transition" onclick="event.stopPropagation(); addToCart('${p.id}')"><i class="ph-bold ph-plus"></i></button>
                </div>
            </div>
        </article>
    `).join('');
    document.getElementById('noResults').classList.toggle('hidden', list.length > 0);
}

function showProductDetail(id) {
    const p = allProducts.find(x => x.id == id);
    if(!p) return;
    document.getElementById('modalProductImage').src = p.image;
    document.getElementById('modalProductName').textContent = p.name;
    document.getElementById('modalProductDescription').textContent = p.desc;
    document.getElementById('modalProductPrice').textContent = p.price;
    document.getElementById('modalProductCategory').textContent = p.category;
    
    const btn = document.getElementById('modalAddToCartBtn');
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.onclick = () => { addToCart(id); els.detailModal.classList.remove('open'); els.detailOverlay.classList.remove('open'); };
    
    els.detailModal.classList.add('open');
    els.detailOverlay.classList.add('open');
}

function addToCart(id) {
    const p = allProducts.find(x => x.id == id);
    if(p) { cart.push(p); updateCart(); showToast('Adicionado!'); trackAtomicEvent('add_to_cart'); }
}

function updateCart() {
    els.cartCount.textContent = cart.length;
    els.cartCount.classList.toggle('hidden', !cart.length);
    document.getElementById('checkoutBtn').disabled = !cart.length;
    
    let total = 0;
    els.cartItems.innerHTML = cart.map((p, i) => {
        const val = parseFloat(p.price.replace('R$', '').replace(/\./g, '').replace(',', '.') || 0);
        total += val;
        return `
            <div class="flex gap-3 bg-gray-50 dark:bg-slate-800 p-3 rounded-lg">
                <img src="${p.image}" class="w-12 h-12 object-contain bg-white rounded">
                <div class="flex-grow">
                    <p class="font-bold text-sm truncate">${p.name}</p>
                    <p class="text-xs text-yellow-600 dark:text-yellow-400 font-bold">${p.price}</p>
                </div>
                <button onclick="cart.splice(${i},1); updateCart()" class="text-red-500"><i class="ph-bold ph-trash"></i></button>
            </div>
        `;
    }).join('');
    els.cartTotal.textContent = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function initCharts(theme) {
    const color = theme === 'dark' ? '#fff' : '#000';
    if(window.repChart) window.repChart.destroy();
    if(window.servChart) window.servChart.destroy();
    
    const ctx1 = document.getElementById('reputationChart');
    if(ctx1) window.repChart = new Chart(ctx1, {
        type: 'radar',
        data: { labels: ['Atendimento', 'Preço', 'Rapidez', 'Confiança', 'Qualidade'], datasets: [{ data: [5, 4.5, 4.8, 5, 4.9], backgroundColor: 'rgba(250, 204, 21, 0.2)', borderColor: '#EAB308', pointBackgroundColor: '#EAB308' }] },
        options: { scales: { r: { min: 0, max: 5, ticks: { display: false }, grid: { color: theme==='dark'?'#334155':'#e2e8f0' }, pointLabels: { color } } }, plugins: { legend: { display: false } } }
    });

    const ctx2 = document.getElementById('servicesChart');
    if(ctx2) window.servChart = new Chart(ctx2, {
        type: 'doughnut',
        data: { labels: ['Reparo', 'Venda', 'Troca'], datasets: [{ data: [50, 30, 20], backgroundColor: ['#EAB308', '#3B82F6', '#22C55E'], borderWidth: 0 }] },
        options: { cutout: '70%', plugins: { legend: { position: 'right', labels: { color, usePointStyle: true } } } }
    });
}
