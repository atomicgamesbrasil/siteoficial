/**
 * ATOMIC GAMES - CLIENT SIDE APPLICATION
 * Architecture: Hybrid Sync (API + GitHub Fallback)
 */

const AtomicApp = (() => {
    const CONFIG = {
        SERVER_URL: window.location.origin // Usa o domínio onde o site está rodando
    };

    const State = {
        products: [],
        cart: [],
        filter: 'all',
        config: {}
    };

    const UI = {
        grid: document.getElementById('productGrid'),
        cartCount: document.getElementById('cartCount'),
        searchInput: document.getElementById('searchInput'),
        categoryBtns: document.querySelectorAll('.filter-btn'),
        themeToggle: document.getElementById('themeToggle')
    };

    const Utils = {
        formatPrice: (p) => {
            if (typeof p === 'number') return p.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            return String(p).includes('R$') ? p : parseFloat(String(p).replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '')).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        }
    };

    const Animation = {
        init: () => {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) entry.target.classList.add('active');
                });
            }, { threshold: 0.1 });

            document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
            
            // Fail-safe para visibilidade
            setTimeout(() => {
                document.querySelectorAll('.reveal:not(.active)').forEach(el => el.classList.add('active'));
            }, 1000);
        }
    };

    const Catalog = {
        fetch: async () => {
            console.log("📦 Sincronizando catálogo com servidor...");
            try {
                // Tenta buscar do servidor local (mais rápido e atualizado)
                const res = await fetch(`${CONFIG.SERVER_URL}/api/public/products`);
                if (!res.ok) throw new Error("API Offline");
                
                const data = await res.json();
                State.products = data.map(p => ({
                    ...p,
                    category: (p.category || 'games').toLowerCase(),
                    price: Utils.formatPrice(p.price)
                }));
                console.log("✅ Catálogo sincronizado com sucesso.");
            } catch (e) {
                console.warn("⚠️ API local falhou, usando backup do GitHub.");
                // Backup do GitHub se o servidor estiver reiniciando (Render sleep)
                const githubRes = await fetch(`https://raw.githubusercontent.com/atomicgamesbrasil/siteoficial/main/produtos.json?t=${Date.now()}`);
                const data = await githubRes.json();
                State.products = data.map(p => ({ ...p, category: (p.category || 'games').toLowerCase(), price: Utils.formatPrice(p.price) }));
            } finally {
                Catalog.render();
            }
        },

        render: () => {
            if (!UI.grid) return;
            
            const term = (UI.searchInput ? UI.searchInput.value.toLowerCase() : "");
            
            const filtered = State.products.filter(p => {
                const matchesSearch = p.name.toLowerCase().includes(term) || (p.desc && p.desc.toLowerCase().includes(term));
                const matchesFilter = State.filter === 'all' || p.category === State.filter;
                return matchesSearch && matchesFilter;
            });

            UI.grid.innerHTML = '';
            
            if (filtered.length === 0) {
                UI.grid.innerHTML = '<div class="col-span-full py-12 text-center text-muted">Nenhum item encontrado.</div>';
                return;
            }

            const frag = document.createDocumentFragment();
            filtered.forEach(p => {
                const art = document.createElement('article');
                art.className = 'product-card bg-card border border-base rounded-2xl overflow-hidden p-4 group flex flex-col h-full reveal active';
                art.innerHTML = `
                    <div class="relative h-40 mb-4 overflow-hidden rounded-xl bg-white/5 flex items-center justify-center">
                        <img src="${p.image}" class="max-h-full max-w-full object-contain transform group-hover:scale-110 transition duration-500" loading="lazy">
                        <span class="absolute top-2 left-2 text-[10px] font-bold uppercase px-2 py-1 bg-black/50 backdrop-blur-md rounded text-yellow-500">${p.category}</span>
                    </div>
                    <h3 class="font-bold text-sm mb-1 line-clamp-2 h-10">${p.name}</h3>
                    <div class="mt-auto flex justify-between items-center pt-2">
                        <span class="font-black text-lg text-gradient">${p.price}</span>
                        <button class="bg-yellow-500 hover:bg-yellow-400 text-black w-10 h-10 rounded-xl flex items-center justify-center transition active:scale-90" 
                            onclick="AtomicApp.Cart.add('${p.id}')" aria-label="Adicionar ao carrinho">
                            <i class="ph-bold ph-plus"></i>
                        </button>
                    </div>
                `;
                frag.appendChild(art);
            });
            UI.grid.appendChild(frag);
        }
    };

    const Cart = {
        add: (id) => {
            const prod = State.products.find(p => p.id === id);
            if (prod) {
                State.cart.push(prod);
                Cart.updateUI();
                // Pequeno feedback visual no badge
                if (UI.cartCount) {
                    UI.cartCount.classList.add('animate-bounce');
                    setTimeout(() => UI.cartCount.classList.remove('animate-bounce'), 500);
                }
            }
        },
        updateUI: () => {
            if (UI.cartCount) {
                const count = State.cart.length;
                UI.cartCount.textContent = count;
                UI.cartCount.classList.toggle('hidden', count === 0);
            }
        }
    };

    const init = () => {
        // Inicialização do Tema
        if (localStorage.getItem('atomic-theme') === 'dark') document.documentElement.classList.add('dark');

        // Listeners
        UI.searchInput?.addEventListener('input', () => Catalog.render());
        
        UI.categoryBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                UI.categoryBtns.forEach(b => b.classList.remove('active', 'bg-yellow-500', 'text-black'));
                e.currentTarget.classList.add('active', 'bg-yellow-500', 'text-black');
                State.filter = e.currentTarget.dataset.category;
                Catalog.render();
            });
        });

        UI.themeToggle?.addEventListener('click', () => {
            document.documentElement.classList.toggle('dark');
            localStorage.setItem('atomic-theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
        });

        // Startup
        Animation.init();
        Catalog.fetch();

        // Limpeza de Service Worker legado que causa erros de POST
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
        }

        // Acordar servidor se necessário
        fetch(`${CONFIG.SERVER_URL}/api/public/wake`).catch(() => {});
        // Track visitas
        fetch(`${CONFIG.SERVER_URL}/api/public/track`, { method: 'POST' }).catch(() => {});
    };

    return { init, Cart: { add: Cart.add } };
})();

document.addEventListener('DOMContentLoaded', AtomicApp.init);
