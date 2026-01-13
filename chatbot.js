// === CHATBOT 3.0 (PURE UI - BRAINLESS FRONTEND) ===
(function() {
    // --- UI HELPERS ---
    function safeImageSrc(src) {
        try { const u = new URL(src, location.href); if (u.protocol === 'http:'||u.protocol==='https:') return u.href; } catch(e) {}
        return 'https://placehold.co/100'; 
    }

    // ELEMENTOS DOM
    const els = { 
        bubble: document.getElementById('chatBubble'), 
        win: document.getElementById('chatWindow'), 
        msgs: document.getElementById('chatMessages'), 
        input: document.getElementById('chatInput'),
        badge: document.getElementById('chatBadge')
    };
    
    if (!els.bubble || !els.win) return;

    // ESTADO
    let state = { isOpen: false, isDragging: false, startX: 0, startY: 0, initialLeft: 0, initialTop: 0 };
    let sessionId = localStorage.getItem('chat_sess_id') || 'sess_' + Date.now();

    // --- LÓGICA DE UI (ABRIR/FECHAR) ---
    function updateChatUI(open) {
        state.isOpen = open;
        els.win.classList.toggle('open', open);
        els.badge.style.display = open ? 'none' : 'flex';
        document.body.classList.toggle('chat-open', open);
        
        if (open) {
            // Efeito Morph para Mobile
            if(window.innerWidth <= 480) {
                const rect = els.bubble.getBoundingClientRect();
                els.win.style.transformOrigin = `${rect.left + rect.width/2}px ${rect.top + rect.height/2}px`;
            }
            els.bubble.style.transform = 'scale(0)'; 
            els.bubble.style.opacity = '0';
            els.bubble.style.pointerEvents = 'none';
            if(window.innerWidth > 768) setTimeout(() => els.input.focus(), 350);
            scrollToBottom();
        } else {
            els.bubble.style.transform = 'scale(1)';
            els.bubble.style.opacity = '1';
            els.bubble.style.pointerEvents = 'auto';
            els.input.blur();
        }
    }

    function toggleChat() { state.isOpen ? closeChat() : openChat(); }
    function openChat() { if(!state.isOpen) { history.pushState({chat: true}, '', '#chat'); updateChatUI(true); } }
    function closeChat() { if(state.isOpen) history.back(); }

    window.addEventListener('popstate', () => { if(state.isOpen) updateChatUI(false); });
    function scrollToBottom() { els.msgs.scrollTop = els.msgs.scrollHeight; }

    // --- FÍSICA DE ARRASTAR (DRAG & DROP) ---
    if(els.bubble) {
        const updatePos = (x, y) => { els.bubble.style.left = `${x}px`; els.bubble.style.top = `${y}px`; };
        
        els.bubble.addEventListener('touchstart', (e) => {
            const t = e.touches[0];
            state.startX = t.clientX; state.startY = t.clientY;
            const rect = els.bubble.getBoundingClientRect();
            state.initialLeft = rect.left; state.initialTop = rect.top;
            state.isDragging = false;
            els.bubble.classList.add('no-transition');
            updatePos(rect.left, rect.top);
        }, { passive: true });

        els.bubble.addEventListener('touchmove', (e) => {
            const t = e.touches[0];
            const dx = t.clientX - state.startX;
            const dy = t.clientY - state.startY;
            if (Math.sqrt(dx*dx + dy*dy) > 10) state.isDragging = true;
            if (state.isDragging) { e.preventDefault(); updatePos(state.initialLeft + dx, state.initialTop + dy); }
        }, { passive: false });

        els.bubble.addEventListener('touchend', (e) => {
            els.bubble.classList.remove('no-transition');
            if (!state.isDragging) {
                e.preventDefault(); openChat(); 
            } else {
                // Snap to edge logic
                const rect = els.bubble.getBoundingClientRect();
                const snapX = (rect.left + rect.width/2) < window.innerWidth/2 ? 20 : window.innerWidth - rect.width - 20;
                let snapY = Math.min(Math.max(rect.top, 20), window.innerHeight - 100);
                updatePos(snapX, snapY);
            }
            state.isDragging = false;
        });
        
        els.bubble.addEventListener('click', (e) => { if(!state.isDragging) toggleChat(); });
        document.getElementById('closeChatBtn').onclick = (e) => { e.stopPropagation(); closeChat(); };
    }

    // --- RENDERIZAÇÃO DE MENSAGENS ---
    function parseText(text) {
        if(!text) return document.createTextNode("");
        // Simples parser de Markdown (**negrito**)
        const frag = document.createDocumentFragment();
        text.split('\n').forEach((line, i) => {
            if(i>0) frag.appendChild(document.createElement('br'));
            line.split('**').forEach((part, j) => {
                j%2 ? frag.appendChild(Object.assign(document.createElement('b'),{textContent:part})) 
                    : frag.appendChild(document.createTextNode(part));
            });
        });
        return frag;
    }

    function addMsg(role, content, prods = [], link = null, actions = []) {
        const div = document.createElement('div'); div.className = `message ${role}`;
        const bubble = document.createElement('div'); bubble.className = 'message-bubble';
        
        if(content) bubble.appendChild(parseText(content));
        
        // Renderiza Vitrine de Produtos (se houver)
        if(prods && prods.length > 0) {
            const scroll = document.createElement('div'); scroll.className = 'chat-products-scroll';
            prods.forEach(p => {
                const card = document.createElement('div'); card.className = 'chat-product-card';
                card.innerHTML = `
                    <img src="${safeImageSrc(p.image)}" loading="lazy" />
                    <div class="chat-product-title">${p.name}</div>
                    <div class="chat-product-price">${p.price}</div>
                    <button class="chat-add-btn">VER DETALHES</button>
                `;
                // Handler de clique no produto
                const btn = card.querySelector('button');
                btn.onclick = (e) => {
                    e.stopPropagation();
                    if(window.showProductDetail) {
                        if(window.innerWidth <= 768) updateChatUI(false);
                        window.showProductDetail(p.id);
                    } else {
                        window.open(`https://wa.me/5521995969378?text=Tenho interesse em: ${p.name}`);
                    }
                };
                scroll.appendChild(card);
            });
            bubble.appendChild(scroll);
        }

        // Renderiza Botão de Ação Principal
        if(link) {
           const btn = document.createElement('a'); 
           btn.href = link; btn.target = '_blank';
           btn.className = 'block mt-2 text-center bg-green-500 text-white font-bold py-2 rounded-lg text-xs hover:bg-green-600 transition';
           btn.textContent = 'NEGOCIAR AGORA'; 
           bubble.appendChild(btn);
        }

        // Renderiza Ações de Contexto (Scroll/Navegação)
        if(actions && actions.length > 0) {
            const actionContainer = document.createElement('div');
            actionContainer.className = 'mt-3 flex flex-col gap-2';
            actions.forEach(act => {
                const btn = document.createElement('button');
                btn.className = 'flex items-center justify-between w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-yellow-400 hover:text-black transition-colors';
                btn.innerHTML = `<span>${act.label}</span><i class="ph-bold ${act.icon || 'ph-arrow-right'}"></i>`;
                btn.onclick = () => {
                    if(act.targetId) {
                        const target = document.getElementById(act.targetId);
                        if(target) {
                            if(window.innerWidth < 768) updateChatUI(false);
                            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    } else if(act.url) {
                        window.open(act.url, '_blank');
                    }
                };
                actionContainer.appendChild(btn);
            });
            bubble.appendChild(actionContainer);
        }

        div.appendChild(bubble); els.msgs.appendChild(div); scrollToBottom();
        
        // Salva histórico local
        saveHistory({ role, content, prods, link, actions });
    }

    function saveHistory(msg) {
        let history = JSON.parse(localStorage.getItem('atomic_chat_history') || '[]');
        history.push(msg);
        localStorage.setItem('atomic_chat_history', JSON.stringify(history));
    }

    function addTyping() {
        const div = document.createElement('div'); div.id='typing'; div.className='message bot';
        div.innerHTML = `<div class="message-bubble"><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>`;
        els.msgs.appendChild(div); scrollToBottom();
    }

    // --- COMUNICAÇÃO COM O BACKEND ---
    async function sendMessage() {
        const txt = els.input.value.trim();
        if(!txt) return;
        
        els.input.value = ''; 
        addMsg('user', txt); 
        addTyping();
        
        // Endpoint do Backend (ajuste conforme necessário)
        const api = (typeof CONFIG !== 'undefined' && CONFIG.CHAT_API) ? CONFIG.CHAT_API : '/api/chat'; 

        try {
            // Envia apenas a mensagem e sessão. O "Cérebro" está lá no servidor.
            const res = await fetch(api, { 
                method: 'POST', 
                headers: {'Content-Type':'application/json'}, 
                body: JSON.stringify({ message: txt, session_id: sessionId }) 
            });
            
            const data = await res.json();
            document.getElementById('typing')?.remove();
            
            if(data.session_id) {
                sessionId = data.session_id;
                localStorage.setItem('chat_sess_id', sessionId);
            }
            
            // O Backend já devolve tudo processado
            addMsg('bot', data.response, data.produtos_sugeridos, data.action_link, data.local_actions);

        } catch(e) { 
            console.error(e);
            document.getElementById('typing')?.remove();
            addMsg('bot', 'Estou sem sinal com a base. Verifique sua internet.'); 
        }
    }

    // EVENTOS
    document.getElementById('sendBtn').onclick = sendMessage;
    els.input.addEventListener('keydown', (e) => { if(e.key === 'Enter') sendMessage(); });
    
    // CARREGA HISTÓRICO
    try {
        const savedHist = localStorage.getItem('atomic_chat_history');
        if (savedHist) {
            JSON.parse(savedHist).forEach(m => addMsg(m.role, m.content, m.prods, m.link, m.actions));
        } else {
            setTimeout(() => addMsg('bot', 'Fala Gamer! 👋 Sou o **Thiago**, da Atomic Games.\nPosso ajudar com Peças, PC Gamer ou Manutenção?'), 1000);
        }
    } catch(e) {}

    // RESET CHAT
    const resetBtn = document.getElementById('resetChatBtn');
    if(resetBtn) resetBtn.onclick = (e) => {
        e.stopPropagation();
        if(confirm('Limpar histórico?')) {
            localStorage.removeItem('atomic_chat_history');
            els.msgs.innerHTML = '';
            setTimeout(() => addMsg('bot', 'Histórico limpo! Manda ver.'), 200);
        }
    };

    // HOOK GLOBAL (Para o botão "Orçamento" do site chamar o chat)
    window.AtomicChat = {
        openWithContext: function(message) {
            if(!state.isOpen) openChat();
            addMsg('bot', message, [], null, [{label: 'Ir para WhatsApp', url: 'https://wa.me/5521995969378', icon: 'ph-whatsapp-logo'}]);
        }
    };

})();
