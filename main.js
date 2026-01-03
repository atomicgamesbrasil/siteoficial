/**
 * ATOMIC GAMES - CLIENT SIDE APPLICATION
 * Architecture: Namespace Pattern (AtomicApp)
 * Features: Shopping Cart, PWA, Analytics, UI Interactions
 */

const AtomicApp = (() => {
    // --- PRIVATE CONFIGURATION ---
    const CONFIG = {
        GITHUB: { USER: "atomicgamesbrasil", REPO: "siteoficial", BRANCH: "main" },
        // IMPORTANT: Must match the Render URL exactly
        // O erro 404 estava acontecendo porque o site ao vivo apontava para 'atomic-thiago-backend'
        SERVER_URL: 'https://painel-atomic.onrender.com'
    };

    const BASE_IMG_URL = `https://raw.githubusercontent.com/${CONFIG.GITHUB.USER}/${CONFIG.GITHUB.REPO}/${CONFIG.GITHUB.BRANCH}/`;

    // --- STATE MANAGEMENT ---
    const State = {
        products: [],
        cart: [],
        filter: 'all',
        banners: [],
        deferredPrompt: null
    };

    // --- DOM CACHE (Populated on Init) ---
    const UI = {};

    // --- UTILITIES ---
    const Utils = {
        formatPrice: (p) => {
            if (typeof p === 'number') return p.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            // Cleanup string price for display
            return String(p).includes('R$') ? p : parseFloat(String(p).replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '')).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        },
        
        getCleanPrice: (p) => {
            if (typeof p === 'number') return p;
            return parseFloat(String(p).replace('R$', '').replace(/\./g, '').replace(',', '.').trim()) || 0;
        },

        showToast: (msg, type = 'success') => {
            const toast = document.createElement('div');
            toast.className = `toast toast-${type}`;
            toast.innerHTML = `<i class="ph-bold ${type === 'success' ? 'ph-check-circle' : 'ph-warning-circle'} text-xl"></i><span>${msg}</span>`;
            
            const container = document.getElementById('toastContainer');
            if(container) {
                container.appendChild(toast);
                setTimeout(() => {
                    toast.style.opacity = '0';
                    toast.style.transform = 'translateY(20px) scale(0.8)';
                    setTimeout(() => toast.remove(), 300);
                }, 3000);
            }
        },

        detectPlatform: () => {
            const ua = navigator.userAgent.toLowerCase();
            if (/iphone|ipad|ipod/.test(ua)) return 'ios';
            if (/android/.test(ua)) return 'android';
            if (/windows/.test(ua)) return 'windows';
            return 'generic';
        }
    };

    // --- CART MODULE ---
    const Cart = {
        load: () => {
            const saved = localStorage.getItem('atomic_cart');
            if (saved) {
                try { State.cart = JSON.parse(saved); } catch (e) { console.error("Cart corrupted", e); }
            }
            Cart.updateUI();
        },

        add: (id) => {
            const product = State.products.find(p => p.id === String(id));
            if (product) {
                State.cart.push(product);
                Cart.save();
                Cart.updateUI();
                Utils.showToast(`${product.name} adicionado!`);
                Analytics.trackEvent('add_to_cart');
            }
        },

        remove: (index) => {
            State.cart.splice(index, 1);
            Cart.save();
            Cart.updateUI();
            Utils.showToast('Item removido', 'info');
        },

        save: () => localStorage.setItem('atomic_cart', JSON.stringify(State.cart)),

        updateUI: () => {
            if(!UI.cartCount) return;

            UI.cartCount.textContent = State.cart.length;
            UI.cartCount.classList.toggle('hidden', !State.cart.length);
            if(UI.checkoutBtn) UI.checkoutBtn.disabled = !State.cart.length;

            let total = 0;
            const container = document.getElementById('cartItemsContainer');
            if (!container) return;
            
            container.innerHTML = '';

            if (State.cart.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-12">
                        <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-base flex items-center justify-center"><i class="ph-duotone ph-shopping-cart-simple text-4xl text-muted"></i></div>
                        <p class="text-muted font-medium">Seu carrinho está vazio</p>
                    </div>`;
                if(UI.cartTotal) UI.cartTotal.textContent = 'R$ 0,00';
                return;
            }

            const frag = document.createDocumentFragment();
            State.cart.forEach((item, idx) => {
                total += Utils.getCleanPrice(item.price);
                
                const div = document.createElement('div');
                div.className = 'flex gap-4 bg-base p-4 rounded-2xl border border-base animate-fade-in';
                div.innerHTML = `
                    <img src="${item.image}" class="w-16 h-16 object-contain bg-white dark:bg-slate-800 rounded-xl shadow" onerror="this.src='https://placehold.co/100?text=IMG'">
                    <div class="flex-grow min-w-0">
                        <p class="font-bold text-sm line-clamp-1">${item.name}</p>
                        <p class="text-sm font-bold text-gradient mt-1">${item.price}</p>
                    </div>
                    <button class="self-center p-2 text-red-500 hover:bg-red-100 rounded-xl transition" onclick="AtomicApp.Cart.remove(${idx})">
                        <i class="ph-bold ph-trash text-lg"></i>
                    </button>
                `;
                frag.appendChild(div);
            });
            container.appendChild(frag);

            if(UI.cartTotal) UI.cartTotal.textContent = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        },

        checkout: async () => {
            if (!State.cart.length) return;

            const btn = UI.checkoutBtn;
            const originalText = btn.innerHTML;
            
            // UX Blocking State
            btn.disabled = true;
            btn.innerHTML = '<i class="ph-bold ph-spinner ph-spin text-xl"></i> Processando...';
            
            const total = UI.cartTotal.textContent;
            const itemsSummary = State.cart.map(i => i.name).join(', ');

            // Send Order to Backend
            try {
                console.log(`🔌 Enviando pedido para: ${CONFIG.SERVER_URL}/api/public/order`);
                const response = await fetch(`${CONFIG.SERVER_URL}/api/public/order`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ customer: "Cliente WhatsApp", items: itemsSummary, total }),
                    keepalive: true
                });
                
                if (!response.ok) throw new Error('Falha no servidor');
                console.log("✅ Pedido registrado no painel com sucesso!");

            } catch (e) { 
                console.error("Order sync failed", e);
                Utils.showToast("Aviso: Pedido será finalizado no WhatsApp (Painel Offline)", "info");
                // Mesmo com erro, liberamos o usuário para ir ao WhatsApp
            }

            // UX Delay for perception
            await new Promise(r => setTimeout(r, 1500));

            btn.innerHTML = '<i class="ph-bold ph-check text-xl"></i> Abrindo WhatsApp...';
            
            const msg = `Olá Atomic! Gostaria de fechar o pedido:\n\n${State.cart.map(i => `• ${i.name} - ${i.price}`).join('\n')}\n\n*Total: ${total}*`;
            
            setTimeout(() => {
                window.location.href = `https://wa.me/5521995969378?text=${encodeURIComponent(msg)}`;
                // Reset button state after redirect logic starts
                setTimeout(() => {
                    btn.disabled = false;
                    btn.innerHTML = originalText;
                }, 2000);
            }, 500);
        }
    };

    // --- CATALOG MODULE ---
    const Catalog = {
        fetch: async () => {
            // Safety timeout to prevent infinite spinner
            const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 8000));
            const request = fetch(`${BASE_IMG_URL}produtos.json?t=${Date.now()}`);

            try {
                const res = await Promise.race([request, timeout]);
                if (res.ok) {
                    const data = await res.json();
                    State.products = data.map(p => ({
                        id: String(p.id),
                        name: p.name,
                        category: Catalog.normalizeCategory(p.category),
                        price: Utils.formatPrice(p.price),
                        image: (p.image || "").replace('/img/', '/img%20site/') || "https://placehold.co/400x400/202020/e0e0e0?text=ATOMIC",
                        desc: p.desc || ""
                    }));
                }
            } catch (e) {
                console.warn("Catalog load warning:", e);
                // Keeps default empty state which renders "No Results"
            } finally {
                Catalog.render();
            }
        },

        fetchBanners: async () => {
            try {
                const res = await fetch(`${BASE_IMG_URL}banners.json?t=${Date.now()}`);
                if (res.ok) State.banners = await res.json();
                Catalog.renderBanners();
            } catch (e) {}
        },

        normalizeCategory: (cat) => {
            const c = (cat || '').toLowerCase();
            if (c.includes('console')) return 'console';
            if (c.includes('acessorios')) return 'acessorios';
            if (c.match(/pc|hardware/)) return 'hardware';
            return 'games';
        },

        render: (forceFilter = null) => {
            const filter = forceFilter || State.filter;
            const term = (UI.searchInput ? UI.searchInput.value.toLowerCase() : "");
            
            const filtered = State.products.filter(p => 
                (filter === 'all' || p.category === filter) &&
                (p.name.toLowerCase().includes(term) || p.desc.toLowerCase().includes(term))
            );

            const grid = document.getElementById('productGrid');
            if (!grid) return;
            
            grid.innerHTML = '';
            
            if (filtered.length === 0) {
                document.getElementById('noResults')?.classList.remove('hidden');
                return;
            }
            document.getElementById('noResults')?.classList.add('hidden');

            // Limit to 12 for performance if not searching
            const displayList = term ? filtered : filtered.slice(0, 12);

            const frag = document.createDocumentFragment();
            displayList.forEach(p => {
                const article = document.createElement('article');
                article.className = 'product-card bg-card border border-base flex flex-col h-full group';
                article.innerHTML = `
                    <div class="product-img-box cursor-pointer" onclick="AtomicApp.UI.showDetail('${p.id}')">
                        <img src="${p.image}" alt="${p.name}" loading="lazy" class="w-full h-full object-cover transform group-hover:scale-105 transition duration-500">
                        <span class="category-tag category-${p.category} absolute top-3 left-3">${p.category}</span>
                    </div>
                    <div class="p-4 flex-grow flex flex-col">
                        <h3 class="font-bold text-sm mb-1 leading-tight group-hover:text-yellow-500 transition line-clamp-2">${p.name}</h3>
                        <p class="text-xs text-muted mb-4 flex-grow line-clamp-2">${p.desc}</p>
                        <div class="mt-auto flex justify-between items-center">
                            <span class="font-black text-lg text-gradient">${p.price}</span>
                            <button class="bg-gradient-to-r from-yellow-400 to-orange-500 text-black w-10 h-10 rounded-xl flex items-center justify-center hover:scale-110 transition shadow-lg" 
                                onclick="event.stopPropagation(); AtomicApp.Cart.add('${p.id}')">
                                <i class="ph-bold ph-plus"></i>
                            </button>
                        </div>
                    </div>
                `;
                frag.appendChild(article);
            });
            grid.appendChild(frag);
        },

        renderBanners: () => {
            const container = document.getElementById('promoBannersContainer');
            if (!container || !State.banners.length) return;
            
            const valid = State.banners.filter(b => b.image);
            if (!valid.length) return;

            container.innerHTML = '';
            const frag = document.createDocumentFragment();
            
            valid.forEach(b => {
                const a = document.createElement('a');
                a.className = 'promo-banner-link group';
                a.innerHTML = `<img src="${BASE_IMG_URL}BANNER%20SAZIONAL/${encodeURIComponent(b.image)}" class="promo-banner-img" loading="lazy">`;
                frag.appendChild(a);
            });
            container.appendChild(frag);
        }
    };

    // --- PWA MODULE ---
    const PWA = {
        init: () => {
            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                State.deferredPrompt = e;
            });

            window.addEventListener('appinstalled', () => {
                State.deferredPrompt = null;
                PWA.updateButtons();
            });

            // Handle Buttons
            ['installAppBtnDesktop', 'installAppBtnMobile', 'installAppBtnMobileHeader'].forEach(id => {
                const btn = document.getElementById(id);
                if (btn) btn.addEventListener('click', PWA.install);
            });

            PWA.updateButtons();
        },

        install: () => {
            if (State.deferredPrompt) {
                State.deferredPrompt.prompt();
                State.deferredPrompt = null;
            } else {
                document.getElementById('installGuideModal')?.classList.add('open');
                // Customize guide based on platform
                const platform = Utils.detectPlatform();
                const title = document.getElementById('guideTitle');
                if(platform === 'ios' && title) title.textContent = "Instalar no iPhone (iOS)";
            }
        },

        updateButtons: () => {
            const isInstalled = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
            const displayStyle = isInstalled ? 'none' : '';
            
            ['installAppBtnDesktop', 'installAppBtnMobile', 'installAppBtnMobileHeader'].forEach(id => {
                const el = document.getElementById(id);
                if(el) el.style.display = displayStyle === 'none' ? 'none' : (id === 'installAppBtnMobile' ? 'flex' : '');
            });
        }
    };

    // --- ANALYTICS ---
    const Analytics = {
        init: () => {
            console.log("🔌 ATOMIC API:", CONFIG.SERVER_URL);
            // Wake Server
            fetch(`${CONFIG.SERVER_URL}/api/public/wake`).catch(() => {});
            // Track Visit
            fetch(`${CONFIG.SERVER_URL}/api/public/track`, { method: 'POST' }).catch(() => {});
        },
        trackEvent: (evt) => {
            // Placeholder for future event tracking
            // console.log("Track:", evt);
        }
    };

    // --- UI INTERACTION ---
    const Interface = {
        init: () => {
            // Cache Elements
            UI.cartCount = document.getElementById('cartCount');
            UI.cartTotal = document.getElementById('cartTotal');
            UI.checkoutBtn = document.getElementById('checkoutBtn');
            UI.searchInput = document.getElementById('searchInput');

            // Listeners
            document.getElementById('openCartBtn')?.addEventListener('click', () => Interface.toggleModal('cart', true));
            document.getElementById('closeCartBtn')?.addEventListener('click', () => Interface.toggleModal('cart', false));
            document.getElementById('cartOverlay')?.addEventListener('click', () => Interface.toggleModal('cart', false));
            
            document.getElementById('mobileMenuOpenBtn')?.addEventListener('click', () => Interface.toggleModal('menu', true));
            document.getElementById('closeMobileMenuBtn')?.addEventListener('click', () => Interface.toggleModal('menu', false));
            document.getElementById('mobileMenuOverlay')?.addEventListener('click', () => Interface.toggleModal('menu', false));

            // Search
            let debounce;
            UI.searchInput?.addEventListener('input', () => {
                clearTimeout(debounce);
                debounce = setTimeout(() => Catalog.render(), 300);
            });

            // Filters
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                    e.currentTarget.classList.add('active');
                    State.filter = e.currentTarget.dataset.category;
                    Catalog.render();
                });
            });

            // Modal Closes
            document.getElementById('closeDetailBtn')?.addEventListener('click', () => Interface.toggleModal('detail', false));
            document.getElementById('productDetailOverlay')?.addEventListener('click', () => Interface.toggleModal('detail', false));
            document.getElementById('closeGuideModal')?.addEventListener('click', () => document.getElementById('installGuideModal')?.classList.remove('open'));
            document.getElementById('installGuideModal')?.addEventListener('click', (e) => {
               if(e.target.id === 'installGuideModal') e.target.classList.remove('open');
            });
            
            // Checkout
            UI.checkoutBtn?.addEventListener('click', Cart.checkout);
            
            // Service Form
            document.getElementById('serviceForm')?.addEventListener('submit', (e) => {
                e.preventDefault();
                const fd = new FormData(e.target);
                const msg = `*SOLICITAÇÃO DE REPARO*\n\n👤 ${fd.get('clientName')}\n📱 ${fd.get('clientPhone')}\n🎮 ${fd.get('device')}\n⚠️ ${fd.get('issue')}`;
                window.open(`https://wa.me/5521995969378?text=${encodeURIComponent(msg)}`);
            });

            // Init Charts
            Interface.initCharts();
        },

        toggleModal: (type, open) => {
            if (type === 'cart') {
                document.getElementById('cartModal').classList.toggle('open', open);
                document.getElementById('cartOverlay').classList.toggle('open', open);
                if(open) Analytics.trackEvent('view_cart');
            }
            if (type === 'menu') {
                document.getElementById('mobileMenu').classList.toggle('open', open);
                document.getElementById('mobileMenuOverlay').classList.toggle('open', open);
            }
            if (type === 'detail') {
                document.getElementById('productDetailModal').classList.toggle('open', open);
                document.getElementById('productDetailOverlay').classList.toggle('open', open);
            }
            document.body.style.overflow = open ? 'hidden' : '';
        },

        showDetail: (id) => {
            const p = State.products.find(x => x.id === String(id));
            if (!p) return;
            
            document.getElementById('modalProductImage').src = p.image;
            document.getElementById('modalProductName').textContent = p.name;
            document.getElementById('modalProductDescription').textContent = p.desc;
            document.getElementById('modalProductPrice').textContent = p.price;
            
            const btn = document.getElementById('modalAddToCartBtn');
            // Clone to remove old listeners
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            newBtn.onclick = () => { Cart.add(id); Interface.toggleModal('detail', false); };
            
            Interface.toggleModal('detail', true);
        },

        initCharts: () => {
            const ctx1 = document.getElementById('reputationChart');
            if (ctx1) {
                new Chart(ctx1.getContext('2d'), {
                    type: 'radar',
                    data: {
                        labels: ['Atendimento', 'Preço', 'Rapidez', 'Variedade', 'Confiança'],
                        datasets: [{ 
                            label: 'Nota', 
                            data: [4.8, 4.2, 4.6, 4.4, 4.9], 
                            backgroundColor: 'rgba(255, 215, 0, 0.25)', 
                            borderColor: '#FFD700', 
                            borderWidth: 2 
                        }]
                    },
                    options: { scales: { r: { min: 0, max: 5, ticks: { display: false }, grid: { color: 'rgba(255,255,255,0.1)' } } }, plugins: { legend: { display: false } } }
                });
            }
        }
    };

    // --- INITIALIZATION ---
    const init = () => {
        // Load Data
        Cart.load();
        Catalog.fetch();
        Catalog.fetchBanners();
        
        // Init Subsystems
        Interface.init();
        PWA.init();
        Analytics.init();

        // Register Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js').catch(console.error);
        }
    };

    // --- PUBLIC API ---
    return {
        init,
        Cart: { add: Cart.add, remove: Cart.remove },
        UI: { showDetail: Interface.showDetail }
    };

})();

// Start App when DOM is Ready
document.addEventListener('DOMContentLoaded', AtomicApp.init);
