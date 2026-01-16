import { formatPrice, showToast, getCategoryClass } from './utils.js';
import { trackAtomicEvent, submitOrderToAPI } from './api.js';
import { initCalculator } from './calculator.js';

// === CONFIG ===
const GITHUB_BASE = "https://raw.githubusercontent.com/atomicgamesbrasil/siteoficial/main/";
const PROD_URL = `${GITHUB_BASE}produtos.json`;
const BANNER_URL = `${GITHUB_BASE}banners.json`;

// === STATE ===
let allProducts = [];
let cart = JSON.parse(localStorage.getItem('atomic_cart') || '[]');
let currentFilter = 'all';
let deferredPrompt;

// === DOM CACHE ===
const els = {
    grid: document.getElementById('productGrid'),
    loadMore: document.getElementById('loadMoreContainer'),
    noResults: document.getElementById('noResults'),
    cartCount: document.getElementById('cartCount'),
    cartModal: document.getElementById('cartModal'),
    cartItems: document.getElementById('cartItemsContainer'),
    cartTotal: document.getElementById('cartTotal'),
    checkoutBtn: document.getElementById('checkoutBtn'),
    detailModal: document.getElementById('productDetailModal'),
    searchInput: document.getElementById('searchInput')
};

// === FUNCTIONS ===

// Global Access for HTML/Chatbot interactions
window.addToCart = (id) => {
    const p = allProducts.find(x => x.id == id);
    if(p) {
        cart.push(p);
        saveCart();
        updateCartUI();
        showToast(`${p.name} adicionado!`);
        trackAtomicEvent('add_to_cart');
    }
};

window.showProductDetail = (id) => {
    const p = allProducts.find(x => x.id == id);
    if (!p) return;
    
    document.getElementById('modalProductImage').src = p.image;
    document.getElementById('modalProductName').textContent = p.name;
    document.getElementById('modalProductDescription').textContent = p.desc;
    document.getElementById('modalProductPrice').textContent = p.price;
    
    const catTag = document.getElementById('modalProductCategory');
    catTag.className = `category-tag absolute top-4 left-4 ${getCategoryClass(p.category)}`;
    catTag.textContent = p.category;
    
    // Update buttons in modal (Remove old listeners by cloning)
    const addBtn = document.getElementById('modalAddToCartBtn');
    const newAddBtn = addBtn.cloneNode(true);
    addBtn.parentNode.replaceChild(newAddBtn, addBtn);
    newAddBtn.onclick = () => { window.addToCart(id); closeProductDetail(); };
    
    const waBtn = document.getElementById('modalWhatsappBtn');
    waBtn.onclick = (e) => {
        e.preventDefault();
        if (!cart.some(x => x.id == id)) window.addToCart(id);
        closeProductDetail();
        setTimeout(checkoutWhatsApp, 200);
    };

    els.detailModal.classList.add('open');
    document.getElementById('productDetailOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
};

function closeProductDetail() {
    els.detailModal.classList.remove('open');
    document.getElementById('productDetailOverlay').classList.remove('open');
    document.body.style.overflow = '';
}

function saveCart() { localStorage.setItem('atomic_cart', JSON.stringify(cart)); }

function updateCartUI() {
    els.cartCount.textContent = cart.length;
    els.cartCount.classList.toggle('hidden', !cart.length);
    els.checkoutBtn.disabled = !cart.length;
    els.cartItems.innerHTML = '';
    
    let total = 0;
    
    if (cart.length === 0) {
        els.cartItems.innerHTML = '<div class="text-center py-8 text-muted">Carrinho vazio</div>';
    } else {
        cart.forEach((item, idx) => {
            const raw = typeof item.price === 'number' ? item.price : parseFloat(item.price.replace('R$', '').replace('.', '').replace(',', '.'));
            total += raw || 0;
            
            const row = document.createElement('div');
            row.className = 'flex gap-3 bg-base p-3 rounded-xl border border-base mb-2';
            row.innerHTML = `
                <img src="${item.image}" class="w-12 h-12 object-contain rounded bg-white">
                <div class="flex-grow min-w-0">
                    <p class="font-bold text-sm truncate">${item.name}</p>
                    <p class="text-xs text-muted">${item.price}</p>
                </div>
                <button onclick="window.removeFromCart(${idx})" class="text-red-500 hover:bg-red-100 p-2 rounded-lg"><i class="ph-bold ph-trash"></i></button>
            `;
            els.cartItems.appendChild(row);
        });
    }
    els.cartTotal.textContent = formatPrice(total);
}

window.removeFromCart = (idx) => {
    cart.splice(idx, 1);
    saveCart();
    updateCartUI();
};

function checkoutWhatsApp() {
    if(!cart.length) return showToast('Carrinho vazio!', 'error');
    
    // Simple Prompt for Name (Can be replaced by modal)
    const name = prompt("Qual seu nome para o pedido?");
    if(!name) return;
    
    const itemsList = cart.map(i => `• ${i.name} (${i.price})`).join('\n');
    const msg = `Olá! Sou *${name}* e quero fechar o pedido:\n\n${itemsList}\n\n*Total: ${els.cartTotal.textContent}*`;
    
    submitOrderToAPI({
        id: Date.now().toString(),
        customer: name,
        items: cart,
        total: els.cartTotal.textContent,
        source: 'Checkout'
    });
    
    window.open(`https://wa.me/5521995969378?text=${encodeURIComponent(msg)}`, '_blank');
}

// === DATA LOADING ===
async function loadData() {
    try {
        const res = await fetch(`${PROD_URL}?t=${Date.now()}`);
        const data = await res.json();
        allProducts = data.map(p => ({
            id: String(p.id),
            name: p.name,
            category: p.category ? (p.category.toLowerCase().includes('console') ? 'console' : p.category.toLowerCase().includes('acess') ? 'acessorios' : p.category.toLowerCase().match(/pc|hardware/) ? 'hardware' : 'games') : 'games',
            price: formatPrice(p.price),
            image: (p.image || "").replace('/img/', '/img%20site/') || "https://placehold.co/400?text=ATOMIC",
            desc: p.desc || ""
        }));
        renderProducts();
    } catch (e) {
        console.warn("Fallback Data", e);
        // Fallback data if fetch fails (e.g. CORS on local file)
        allProducts = [
            { id: "1", name: "PS5 Slim", category: "console", price: "R$ 3.799,00", image: "https://raw.githubusercontent.com/atomicgamesbrasil/siteoficial/main/img%20site/console-ps5.webp", desc: "Digital Edition" },
            { id: "2", name: "Xbox Series S", category: "console", price: "R$ 2.699,00", image: "https://raw.githubusercontent.com/atomicgamesbrasil/siteoficial/main/img%20site/console-xbox-s.webp", desc: "512GB SSD" }
        ];
        renderProducts();
    }
}

function renderProducts(term = "") {
    const termLower = term.toLowerCase();
    const filtered = allProducts.filter(p => 
        (currentFilter === 'all' || p.category === currentFilter) &&
        (p.name.toLowerCase().includes(termLower))
    );

    els.grid.innerHTML = '';
    els.noResults.classList.toggle('hidden', filtered.length > 0);

    const frag = document.createDocumentFragment();
    filtered.slice(0, 12).forEach(p => {
        const div = document.createElement('div');
        div.className = 'product-card bg-card border border-base flex flex-col h-full group';
        div.innerHTML = `
            <div class="product-img-box" onclick="window.showProductDetail('${p.id}')">
                <img src="${p.image}" loading="lazy" alt="${p.name}">
                <span class="category-tag absolute top-3 left-3 ${getCategoryClass(p.category)}">${p.category}</span>
            </div>
            <div class="p-4 flex-grow flex flex-col">
                <h3 class="font-bold text-sm mb-1 line-clamp-2">${p.name}</h3>
                <p class="text-xs text-muted mb-3 flex-grow line-clamp-2">${p.desc}</p>
                <div class="mt-auto flex justify-between items-center">
                    <span class="font-black text-lg text-gradient">${p.price}</span>
                    <button onclick="window.addToCart('${p.id}')" class="bg-yellow-400 w-10 h-10 rounded-xl flex items-center justify-center hover:scale-110 transition shadow-lg text-black"><i class="ph-bold ph-plus"></i></button>
                </div>
            </div>
        `;
        frag.appendChild(div);
    });
    els.grid.appendChild(frag);
}

// === INIT ===
document.addEventListener('DOMContentLoaded', () => {
    // 1. Load Data
    loadData();
    initCalculator();
    updateCartUI();
    
    // 2. Event Listeners
    document.getElementById('openCartBtn').addEventListener('click', () => {
        els.cartModal.classList.add('open');
        document.getElementById('cartOverlay').classList.add('open');
    });
    
    document.getElementById('closeCartBtn').addEventListener('click', () => {
        els.cartModal.classList.remove('open');
        document.getElementById('cartOverlay').classList.remove('open');
    });
    
    document.getElementById('cartOverlay').addEventListener('click', () => {
        els.cartModal.classList.remove('open');
        document.getElementById('cartOverlay').classList.remove('open');
    });

    els.checkoutBtn.addEventListener('click', checkoutWhatsApp);
    
    document.getElementById('mobileMenuOpenBtn').addEventListener('click', () => {
        document.getElementById('mobileMenu').classList.add('open');
        document.getElementById('mobileMenuOverlay').classList.add('open');
    });
    
    document.getElementById('closeMobileMenuBtn').addEventListener('click', () => {
        document.getElementById('mobileMenu').classList.remove('open');
        document.getElementById('mobileMenuOverlay').classList.remove('open');
    });

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            currentFilter = e.currentTarget.dataset.category;
            renderProducts(els.searchInput.value);
        });
    });

    els.searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => renderProducts(e.target.value), 300);
    });

    document.getElementById('closeDetailBtn').addEventListener('click', closeProductDetail);
    document.getElementById('productDetailOverlay').addEventListener('click', closeProductDetail);

    // PWA Install
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        const btn = document.getElementById('installAppBtnDesktop');
        if(btn) {
            btn.style.display = 'flex';
            btn.addEventListener('click', () => {
                deferredPrompt.prompt();
                deferredPrompt = null;
            });
        }
    });

    // Theme Toggle
    document.getElementById('themeToggle').addEventListener('click', () => {
        const isDark = document.documentElement.classList.toggle('dark');
        document.documentElement.classList.toggle('light', !isDark);
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
    
    // Restore Theme
    if (localStorage.getItem('theme') === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
    }

    trackAtomicEvent('visit');
});
