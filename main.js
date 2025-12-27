const CONFIG = {
    GITHUB_USER: "atomicgamesbrasil",
    GITHUB_REPO: "siteoficial",
    GITHUB_BRANCH: "main",
    CHAT_API: 'https://atomic-thiago-backend.onrender.com/chat'
};
const BASE_IMG_URL = `https://raw.githubusercontent.com/${CONFIG.GITHUB_USER}/${CONFIG.GITHUB_REPO}/${CONFIG.GITHUB_BRANCH}/`;

// === HERO CATALOG (VITRINE BLINDADA) ===
// Produtos fixos para garantir vitrine imediata
const initialProducts = [
    { 
        id: "hero_1", 
        name: "PlayStation 5 Slim Edição Digital", 
        category: "console", 
        price: "R$ 3.799,00", 
        image: BASE_IMG_URL + "img%20site/console-ps5.webp", 
        desc: "O console da nova geração. SSD ultrarrápido, gráficos 4K e gatilhos adaptáveis." 
    },
    { 
        id: "hero_2", 
        name: "Xbox Series S 512GB", 
        category: "console", 
        price: "R$ 2.699,00", 
        image: BASE_IMG_URL + "img%20site/console-xbox-s.webp", 
        desc: "Compacto e poderoso. A melhor entrada para a nova geração de jogos." 
    },
    { 
        id: "hero_3", 
        name: "God of War Ragnarok (PS5)", 
        category: "games", 
        price: "R$ 299,00", 
        image: BASE_IMG_URL + "img%20site/game-gow.webp", 
        desc: "Embarque em uma jornada épica e emocionante com Kratos e Atreus." 
    },
    { 
        id: "hero_4", 
        name: "Controle DualSense Midnight Black", 
        category: "acessorios", 
        price: "R$ 449,00", 
        image: BASE_IMG_URL + "img%20site/acessorio-dualsense.webp", 
        desc: "Sentir o jogo nunca foi tão real. Resposta tátil e design ergonômico." 
    }
];

const faqs = [
    { q: "Vocês aceitam consoles usados na troca?", a: "Sim! Avaliamos seu console usado (PS4, Xbox One, Switch) como parte do pagamento. Traga para avaliação na hora." },
    { q: "Qual o prazo de garantia dos serviços?", a: "Todos os nossos serviços de manutenção possuem 90 dias (3 meses) de garantia legal com selo de qualidade Atomic." },
    { q: "Vocês montam PC Gamer?", a: "Com certeza! Temos consultoria especializada para montar o PC ideal para seu orçamento e performance." },
    { q: "Entregam em todo o Rio de Janeiro?", a: "Sim, trabalhamos com entregas expressas via Motoboy. Consulte a taxa para seu bairro no WhatsApp." }
];

// State
let allProducts = [...initialProducts];
let cart = [];
let currentFilter = 'all';
let els = {};

// Utils
const formatPrice = p => p; // Prices are strings in this version for simplicity

const showToast = (msg, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="ph-bold ${type==='success'?'ph-check-circle':'ph-warning-circle'}"></i> <span>${msg}</span>`;
    els.toastContainer.appendChild(toast);
    setTimeout(() => { toast.style.opacity='0'; setTimeout(()=>toast.remove(),300); }, 3000);
};

const getCategoryClass = cat => {
    const c = (cat || '').toLowerCase();
    if(c.includes('console')) return 'category-console';
    if(c.includes('acess')) return 'category-acessorios';
    if(c.match(/pc|hardware/)) return 'category-hardware';
    return 'category-games';
};

// Core Logic
async function loadProducts() {
    try {
        const res = await fetch(`${BASE_IMG_URL}produtos.json?t=${Date.now()}`);
        if(res.ok) {
            const data = await res.json();
            if(data.length) {
                // Deduplicate against heroes
                const heroNames = initialProducts.map(h=>h.name);
                const newItems = data.filter(d => !heroNames.includes(d.name)).map(p => ({
                    id: String(p.id || Math.random()),
                    name: p.name,
                    category: p.category || 'games',
                    price: p.price,
                    image: p.image.replace('/img/', '/img%20site/'),
                    desc: p.desc || ''
                }));
                allProducts = [...initialProducts, ...newItems];
            }
        }
    } catch(e) { console.log('Using Hero catalog'); }
    renderProducts(currentFilter);
}

function renderProducts(filter, term = "") {
    els.productGrid.innerHTML = '';
    const lowerTerm = term.toLowerCase();
    const filtered = allProducts.filter(p => 
        (filter === 'all' || (p.category||'').toLowerCase().includes(filter)) &&
        (!term || p.name.toLowerCase().includes(lowerTerm))
    );

    if(!filtered.length) {
        els.noResults.classList.remove('hidden');
        return;
    }
    els.noResults.classList.add('hidden');

    const limit = 8;
    // Show all if searching, else limit
    const toShow = term ? filtered : filtered.slice(0, limit); 
    els.loadMore.classList.toggle('hidden', term || filtered.length <= limit);

    toShow.forEach((p, i) => {
        const article = document.createElement('article');
        article.className = 'product-card flex flex-col h-full';
        article.innerHTML = `
            <div class="product-img-box" onclick="showDetail('${p.id}')">
                <img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.src='https://placehold.co/400?text=ATOMIC'">
                <span class="category-tag absolute top-3 left-3 ${getCategoryClass(p.category)}">${p.category}</span>
            </div>
            <div class="p-4 flex-grow flex flex-col bg-card">
                <h3 class="font-bold text-sm mb-1 leading-tight line-clamp-2 hover:text-yellow-500 transition cursor-pointer" onclick="showDetail('${p.id}')">${p.name}</h3>
                <p class="text-xs text-muted mb-3 flex-grow line-clamp-2">${p.desc}</p>
                <div class="flex items-center justify-between mt-auto">
                    <span class="font-black text-lg text-gradient">${p.price}</span>
                    <button class="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 text-black flex items-center justify-center hover:scale-110 active:scale-95 transition shadow-lg" onclick="addToCart('${p.id}')" aria-label="Adicionar">
                        <i class="ph-bold ph-plus text-lg"></i>
                    </button>
                </div>
            </div>
        `;
        els.productGrid.appendChild(article);
    });
}

function addToCart(id) {
    const p = allProducts.find(x=>x.id==id);
    if(p) { 
        cart.push(p); 
        updateCartUI(); 
        showToast(`${p.name} adicionado!`); 
    }
}

function removeFromCart(idx) {
    cart.splice(idx,1);
    updateCartUI();
}

function updateCartUI() {
    els.cartCount.textContent = cart.length;
    els.cartCount.classList.toggle('hidden', !cart.length);
    els.checkoutBtn.disabled = !cart.length;
    els.cartItems.innerHTML = '';
    
    let total = 0;
    cart.forEach((item, idx) => {
        const val = parseFloat(item.price.replace(/[^0-9,]/g,'').replace(',','.')) || 0;
        total += val;
        const div = document.createElement('div');
        div.className = 'flex gap-3 bg-base p-2 rounded-lg border border-gray-800 items-center';
        div.innerHTML = `
            <img src="${item.image}" class="w-12 h-12 object-contain bg-white rounded">
            <div class="flex-grow min-w-0">
                <p class="font-bold text-xs line-clamp-1">${item.name}</p>
                <p class="text-xs text-yellow-500">${item.price}</p>
            </div>
            <button onclick="removeFromCart(${idx})" class="p-2 text-red-500 hover:text-red-400"><i class="ph-bold ph-trash"></i></button>
        `;
        els.cartItems.appendChild(div);
    });
    els.cartTotal.textContent = total.toLocaleString('pt-BR', {style:'currency', currency:'BRL'});
}

// UI Toggles
window.showDetail = (id) => {
    const p = allProducts.find(x=>x.id==id);
    if(!p) return;
    document.getElementById('modalProductImage').src = p.image;
    document.getElementById('modalProductName').textContent = p.name;
    document.getElementById('modalProductDescription').textContent = p.desc;
    document.getElementById('modalProductPrice').textContent = p.price;
    document.getElementById('modalProductCategory').className = `category-tag absolute top-4 left-4 ${getCategoryClass(p.category)}`;
    document.getElementById('modalProductCategory').textContent = p.category;
    document.getElementById('modalAddToCartBtn').onclick = () => { addToCart(id); closeDetail(); };
    document.getElementById('modalWhatsappBtn').href = `https://wa.me/5521995969378?text=Interesse em ${p.name}`;
    
    els.detailModal.classList.add('open');
    els.detailOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
}

window.closeDetail = () => {
    els.detailModal.classList.remove('open');
    els.detailOverlay.classList.remove('open');
    document.body.style.overflow = '';
}

window.toggleCart = () => {
    els.cartModal.classList.toggle('open');
    els.cartOverlay.classList.toggle('open');
}

window.toggleMenu = () => {
    els.mobileMenu.classList.toggle('open');
    els.mobileOverlay.classList.toggle('open');
}

// Video Loading Logic
function loadVideo() {
    const f = document.getElementById('videoFacade'); 
    const container = document.getElementById('videoContainer');
    const iframe = document.createElement('iframe');
    iframe.className = "w-full h-full rounded-2xl";
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
function initCharts() {
    const ctx1 = document.getElementById('reputationChart');
    if(ctx1) new Chart(ctx1, {
        type: 'radar',
        data: {
            labels: ['Agilidade', 'Preço', 'Qualidade', 'Variedade', 'Confiança'],
            datasets: [{
                label: 'Avaliação',
                data: [4.8, 4.5, 5.0, 4.2, 4.9],
                backgroundColor: 'rgba(255, 215, 0, 0.2)',
                borderColor: '#FFD700',
                pointBackgroundColor: '#FFD700'
            }]
        },
        options: { scales: { r: { grid: { color: 'rgba(255,255,255,0.1)' }, pointLabels: { color: 'white' }, ticks: { display: false } } }, plugins: { legend: { display: false } } }
    });
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    els = {
        toastContainer: document.getElementById('toastContainer'),
        productGrid: document.getElementById('productGrid'),
        cartItems: document.getElementById('cartItemsContainer'),
        cartCount: document.getElementById('cartCount'),
        cartTotal: document.getElementById('cartTotal'),
        checkoutBtn: document.getElementById('checkoutBtn'),
        cartModal: document.getElementById('cartModal'),
        cartOverlay: document.getElementById('cartOverlay'),
        mobileMenu: document.getElementById('mobileMenu'),
        mobileOverlay: document.getElementById('mobileMenuOverlay'),
        detailModal: document.getElementById('productDetailModal'),
        detailOverlay: document.getElementById('productDetailOverlay'),
        noResults: document.getElementById('noResults'),
        loadMore: document.getElementById('loadMoreContainer'),
        searchInput: document.getElementById('searchInput')
    };

    // Events
    document.getElementById('openCartBtn').onclick = toggleCart;
    document.getElementById('closeCartBtn').onclick = toggleCart;
    document.getElementById('cartOverlay').onclick = toggleCart;
    
    document.getElementById('mobileMenuOpenBtn').onclick = toggleMenu;
    document.getElementById('closeMobileMenuBtn').onclick = toggleMenu;
    document.getElementById('mobileMenuOverlay').onclick = toggleMenu;
    
    document.getElementById('closeDetailBtn').onclick = closeDetail;
    document.getElementById('productDetailOverlay').onclick = closeDetail;

    document.getElementById('videoFacade')?.addEventListener('click', loadVideo);

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.onclick = (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            renderProducts(e.currentTarget.dataset.category, els.searchInput.value);
        };
    });

    els.searchInput.oninput = (e) => renderProducts(currentFilter, e.target.value);
    
    document.getElementById('themeToggle').onclick = () => {
        document.body.classList.toggle('light');
    };

    document.getElementById('checkoutBtn').onclick = () => {
        const text = `Pedido: \n${cart.map(i=>i.name).join('\n')}\nTotal: ${els.cartTotal.textContent}`;
        window.open(`https://wa.me/5521995969378?text=${encodeURIComponent(text)}`);
    }

    // FAQ
    const faqContainer = document.getElementById('faqContainer');
    if(faqContainer) {
        faqs.forEach((f, i) => {
            const details = document.createElement('details');
            details.className = 'group rounded-xl overflow-hidden border border-white/10 bg-card open:bg-white/5 transition';
            const summary = document.createElement('summary');
            summary.className = 'flex justify-between items-center font-bold cursor-pointer p-4 transition-colors hover:text-yellow-500 list-none';
            summary.innerHTML = `${f.q} <i class="ph-bold ph-caret-down text-lg transition-transform group-open:rotate-180"></i>`;
            const div = document.createElement('div');
            div.className = 'text-muted p-4 pt-0 text-sm leading-relaxed';
            div.textContent = f.a;
            details.appendChild(summary);
            details.appendChild(div);
            faqContainer.appendChild(details);
        });
    }

    loadProducts();
    initCharts();
});
