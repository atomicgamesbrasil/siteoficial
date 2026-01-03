/**
 * ATOMIC GAMES - ENGINE V5.1 (SYNC FIXED)
 */

const AtomicApp = (() => {
    const CONFIG = {
        // Usa relativo para garantir que pega o mesmo domínio do server.js
        API_URL: '/api'
    };

    const State = {
        products: [],
        cart: JSON.parse(localStorage.getItem('atomic_cart') || '[]'),
        filter: 'all',
        isLoading: true,
        whatsapp: '5521995969378' // Fallback
    };

    const UI = {
        grid: document.getElementById('productGrid'),
        cartCount: document.getElementById('cartCount'),
        cartTotal: document.getElementById('cartTotal'),
        cartItems: document.getElementById('cartItemsContainer'),
        cartModal: document.getElementById('cartModal'),
        cartOverlay: document.getElementById('cartOverlay'),
        searchInput: document.getElementById('searchInput'),
        toastContainer: document.getElementById('toast-container')
    };

    const Utils = {
        formatPrice: (p) => {
            let val = typeof p === 'number' ? p : parseFloat(String(p).replace('R$', '').replace(/\./g, '').replace(',', '.').trim()) || 0;
            return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        },
        getNumeric: (p) => typeof p === 'number' ? p : parseFloat(String(p).replace('R$', '').replace(/\./g, '').replace(',', '.').trim()) || 0,
        showToast: (msg) => {
            const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
            UI.toastContainer.appendChild(t);
            setTimeout(() => t.remove(), 3000);
        }
    };

    const Analytics = {
        trackVisit: () => {
            fetch(`${CONFIG.API_URL}/public/visit`, { method: 'POST' }).catch(() => {});
        },
        trackOrder: async (items, total) => {
            try {
                const summary = items.map(i => i.name).join(', ');
                await fetch(`${CONFIG.API_URL}/public/order`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ customer: "Site Guest", items: summary, total: total })
                });
            } catch (e) { console.error(e); }
        }
    };

    const Catalog = {
        renderSkeletons: () => {
            if(!UI.grid) return;
            UI.grid.innerHTML = Array(8).fill(0).map(() => `
                <div class="bg-white dark:bg-slate-800/40 rounded-[2rem] p-5 h-[350px] flex flex-col space-y-4">
                    <div class="skeleton h-44 w-full rounded-2xl"></div>
                    <div class="skeleton h-4 w-3/4 rounded"></div>
                    <div class="mt-auto flex justify-between"><div class="skeleton h-8 w-24 rounded"></div><div class="skeleton h-10 w-10 rounded-xl"></div></div>
                </div>
            `).join('');
        },
        fetch: async () => {
            Catalog.renderSkeletons();
            State.isLoading = true;
            try {
                // Busca Config primeiro
                fetch(`${CONFIG.API_URL}/config`).then(r => r.json()).then(c => { if(c.whatsapp) State.whatsapp = c.whatsapp; }).catch(()=>{});
                
                // Busca Produtos
                const res = await fetch(`${CONFIG.API_URL}/public/products`);
                if (!res.ok) throw new Error("API Error");
                State.products = await res.json();
            } catch (e) {
                console.warn("API Offline, usando backup GitHub...");
                try {
                    const fb = await fetch(`https://raw.githubusercontent.com/atomicgamesbrasil/siteoficial/main/produtos.json?t=${Date.now()}`);
                    State.products = await fb.json();
                } catch(err) {}
            } finally {
                State.isLoading = false;
                Catalog.render();
            }
        },
        render: () => {
            if (!UI.grid || State.isLoading) return;
            const term = (UI.searchInput ? UI.searchInput.value.toLowerCase() : "");
            const filtered = State.products.filter(p => {
                return (p.name.toLowerCase().includes(term)) && (State.filter === 'all' || (p.category || 'all').toLowerCase() === State.filter);
            });

            UI.grid.innerHTML = '';
            if (filtered.length === 0) {
                UI.grid.innerHTML = '<div class="col-span-full py-20 text-center opacity-50 font-bold uppercase">Nenhum produto encontrado.</div>';
                return;
            }

            filtered.forEach(p => {
                const card = document.createElement('article');
                card.className = 'product-card bg-white dark:bg-slate-800/50 rounded-[2rem] border dark:border-slate-800 p-5 flex flex-col h-full reveal active transition-all group';
                card.innerHTML = `
                    <div class="relative h-44 mb-6 bg-slate-100 dark:bg-slate-900 rounded-2xl p-4 flex items-center justify-center overflow-hidden cursor-pointer" onclick="AtomicApp.Interface.showDetail('${p.id}')">
                        <img src="${p.image}" class="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-500" loading="lazy">
                        <span class="absolute top-3 left-3 px-2 py-1 bg-black/80 rounded-lg text-[9px] text-yellow-500 font-bold uppercase">${p.category}</span>
                    </div>
                    <h3 class="font-bold text-sm mb-2 line-clamp-2 h-10 leading-snug">${p.name}</h3>
                    <div class="mt-auto flex justify-between items-center pt-4">
                        <span class="font-black text-xl text-gradient">${Utils.formatPrice(p.price)}</span>
                        <button class="w-11 h-11 bg-yellow-500 rounded-xl flex items-center justify-center text-black hover:bg-yellow-400 active:scale-90 transition shadow-lg shadow-yellow-500/10" onclick="AtomicApp.Cart.add('${p.id}')"><i class="ph-bold ph-plus"></i></button>
                    </div>
                `;
                UI.grid.appendChild(card);
            });
        }
    };

    const Cart = {
        save: () => localStorage.setItem('atomic_cart', JSON.stringify(State.cart)),
        add: (id) => {
            const p = State.products.find(x => x.id === id);
            if (p) { State.cart.push({ ...p, cartId: Date.now() }); Cart.save(); Cart.updateUI(); Utils.showToast(`Adicionado: ${p.name}`); }
        },
        remove: (cid) => { State.cart = State.cart.filter(i => i.cartId !== cid); Cart.save(); Cart.updateUI(); },
        updateUI: () => {
            const count = State.cart.length;
            if (UI.cartCount) { UI.cartCount.textContent = count; UI.cartCount.classList.toggle('hidden', count === 0); }
            if (UI.cartItems) {
                UI.cartItems.innerHTML = '';
                let total = 0;
                State.cart.forEach(item => {
                    total += Utils.getNumeric(item.price);
                    const div = document.createElement('div');
                    div.className = 'flex gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border dark:border-slate-800';
                    div.innerHTML = `<img src="${item.image}" class="w-16 h-16 object-contain rounded-xl bg-white dark:bg-slate-900 p-2"><div class="flex-1 min-w-0"><h4 class="font-bold text-[11px] truncate">${item.name}</h4><p class="text-sm font-black text-gradient mt-1">${Utils.formatPrice(item.price)}</p></div><button onclick="AtomicApp.Cart.remove(${item.cartId})" class="p-2 text-red-500"><i class="ph-bold ph-trash"></i></button>`;
                    UI.cartItems.appendChild(div);
                });
                if (UI.cartTotal) UI.cartTotal.textContent = Utils.formatPrice(total);
            }
        },
        checkout: async () => {
            if (State.cart.length === 0) return;
            const btn = document.getElementById('checkoutBtn');
            const txt = btn.innerHTML;
            btn.disabled = true; btn.innerHTML = '<i class="ph-bold ph-spinner ph-spin"></i> Processando...';
            
            const totalVal = Utils.formatPrice(State.cart.reduce((a, b) => a + Utils.getNumeric(b.price), 0));
            await Analytics.trackOrder(State.cart, totalVal);
            
            const items = State.cart.map(i => `• ${i.name} (${Utils.formatPrice(i.price)})`).join('\n');
            const msg = `Olá Atomic! Gostaria de fechar o pedido:\n\n${items}\n\n*Total: ${totalVal}*`;
            
            setTimeout(() => {
                window.location.href = `https://wa.me/${State.whatsapp}?text=${encodeURIComponent(msg)}`;
                setTimeout(() => { btn.disabled = false; btn.innerHTML = txt; }, 2000);
            }, 800);
        }
    };

    const Interface = {
        init: () => {
            if (localStorage.getItem('atomic-theme') === 'dark') document.documentElement.classList.add('dark');
            document.getElementById('themeToggle')?.addEventListener('click', () => {
                document.documentElement.classList.toggle('dark');
                localStorage.setItem('atomic-theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
            });
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    document.querySelectorAll('.filter-btn').forEach(b => { b.classList.remove('active', 'bg-yellow-500', 'text-black'); b.classList.add('bg-slate-50', 'dark:bg-slate-800', 'text-slate-500'); });
                    e.currentTarget.classList.add('active', 'bg-yellow-500', 'text-black'); e.currentTarget.classList.remove('bg-slate-50', 'text-slate-500');
                    State.filter = e.currentTarget.dataset.category; Catalog.render();
                });
            });
            UI.searchInput?.addEventListener('input', () => Catalog.render());
            document.getElementById('openCartBtn')?.addEventListener('click', () => { UI.cartModal.classList.add('open'); UI.cartOverlay.classList.add('open'); });
            document.getElementById('closeCartBtn')?.addEventListener('click', () => { UI.cartModal.classList.remove('open'); UI.cartOverlay.classList.remove('open'); });
            UI.cartOverlay?.addEventListener('click', () => { UI.cartModal.classList.remove('open'); UI.cartOverlay.classList.remove('open'); Interface.hideDetail(); });
            document.getElementById('closeDetailBtn')?.addEventListener('click', Interface.hideDetail);
            document.getElementById('modalAddToCartBtn')?.addEventListener('click', () => { Cart.add(document.getElementById('modalAddToCartBtn').dataset.id); Interface.hideDetail(); });
            document.getElementById('checkoutBtn')?.addEventListener('click', Cart.checkout);
            
            const rtx = document.getElementById('reputationChart');
            if (rtx) {
                new Chart(rtx, { type: 'radar', data: { labels: ['Preço', 'Agilidade', 'Qualidade', 'Atendimento', 'Garantia'], datasets: [{ data: [4.8, 4.5, 5, 4.9, 5], backgroundColor: 'rgba(255, 215, 0, 0.2)', borderColor: '#FFD700', borderWidth: 2, pointRadius: 0 }] }, options: { scales: { r: { min: 0, max: 5, ticks: { display: false }, grid: { color: 'rgba(255,255,255,0.05)' }, pointLabels: { font: { size: 9, weight: 'bold' } } } }, plugins: { legend: { display: false } } } });
            }
            
            const obs = new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) e.target.classList.add('active'); }), { threshold: 0.1 });
            document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
        },
        showDetail: (id) => {
            const p = State.products.find(x => x.id === id);
            if (!p) return;
            document.getElementById('modalProductImage').src = p.image;
            document.getElementById('modalProductName').textContent = p.name;
            document.getElementById('modalProductDescription').textContent = p.desc || 'Produto de alta performance com garantia Atomic.';
            document.getElementById('modalProductPrice').textContent = Utils.formatPrice(p.price);
            document.getElementById('modalWhatsappBtn').href = `https://wa.me/${State.whatsapp}?text=Interesse em: ${p.name}`;
            document.getElementById('modalAddToCartBtn').dataset.id = p.id;
            document.getElementById('productDetailOverlay').classList.add('open');
            document.getElementById('productDetailModal').classList.add('open');
        },
        hideDetail: () => {
            document.getElementById('productDetailOverlay').classList.remove('open');
            document.getElementById('productDetailModal').classList.remove('open');
        }
    };

    return {
        init: () => { Catalog.fetch(); Interface.init(); Cart.updateUI(); Analytics.trackVisit(); },
        Interface: { showDetail: Interface.showDetail },
        Cart: { add: Cart.add, remove: Cart.remove }
    };
})();

document.addEventListener('DOMContentLoaded', AtomicApp.init);
