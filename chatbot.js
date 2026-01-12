
// === CHATBOT 4.1 (CORREÇÃO DE PONTUAÇÃO E TRUNCAMENTO) ===
// Atualização: Removida a lógica que cortava mensagens com "..." e relaxado o limite de palavras.

(function() {
    // --- 1. CONFIGURAÇÃO DE CONEXÃO ---
    const API_URL = 'https://atomic-thiago-backend.onrender.com/chat';
    const TIMEOUT_MS = 60000; 

    // --- 2. ESTILOS ---
    const STYLES = `
        :root { --chat-primary: #10b981; --chat-bg: #ffffff; --chat-dark: #1f2937; }
        #chatBubble {
            position: fixed; bottom: 20px; right: 20px; width: 60px; height: 60px;
            background: var(--chat-primary); border-radius: 50%; box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            cursor: pointer; z-index: 9999; display: flex; align-items: center; justify-content: center;
            transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        #chatBubble:hover { transform: scale(1.1); }
        #chatBubble svg { width: 32px; height: 32px; fill: white; }
        #chatBadge {
            position: absolute; top: -5px; right: -5px; background: #ef4444; color: white;
            font-size: 11px; font-weight: bold; width: 20px; height: 20px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center; border: 2px solid white;
        }
        #chatWindow {
            position: fixed; bottom: 90px; right: 20px; width: 380px; height: 600px; max-height: 80vh;
            background: #fff; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.15);
            display: flex; flex-direction: column; overflow: hidden; z-index: 9999;
            transform: scale(0); transform-origin: bottom right; opacity: 0; pointer-events: none;
            transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1); font-family: 'Segoe UI', sans-serif;
        }
        #chatWindow.open { transform: scale(1); opacity: 1; pointer-events: auto; }
        .chat-header {
            background: #111827; color: white; padding: 16px; display: flex; align-items: center; justify-content: space-between;
        }
        .chat-profile { display: flex; align-items: center; gap: 12px; }
        .chat-avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid #10b981; }
        .chat-info h3 { margin: 0; font-size: 16px; font-weight: 600; }
        .chat-status { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #10b981; }
        .status-dot { width: 8px; height: 8px; background: #10b981; border-radius: 50%; }
        .chat-controls button { background: none; border: none; color: #9ca3af; cursor: pointer; padding: 4px; transition: color 0.2s; }
        .chat-controls button:hover { color: white; }
        
        #chatMessages { flex: 1; overflow-y: auto; padding: 20px; background: #f3f4f6; display: flex; flex-direction: column; gap: 12px; }
        .message { display: flex; flex-direction: column; max-width: 85%; animation: fadeIn 0.3s ease; }
        .message.user { align-self: flex-end; align-items: flex-end; }
        .message.bot { align-self: flex-start; align-items: flex-start; }
        .message-bubble {
            padding: 12px 16px; border-radius: 12px; font-size: 14px; line-height: 1.5; position: relative; word-wrap: break-word;
        }
        .message.user .message-bubble { background: #facc15; color: #111827; border-bottom-right-radius: 2px; font-weight: 500; }
        .message.bot .message-bubble { background: #1f2937; color: #f3f4f6; border-bottom-left-radius: 2px; }
        
        .chat-input-area { padding: 12px; background: white; border-top: 1px solid #e5e7eb; display: flex; gap: 8px; align-items: center; }
        #chatInput { flex: 1; padding: 10px 14px; border: 1px solid #e5e7eb; border-radius: 24px; outline: none; transition: border-color 0.2s; }
        #chatInput:focus { border-color: #10b981; }
        #sendBtn { width: 40px; height: 40px; background: #111827; border-radius: 50%; border: none; color: #facc15; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: transform 0.2s; }
        #sendBtn:hover { transform: scale(1.05); }

        .typing-indicator { display: flex; gap: 4px; padding: 4px; }
        .typing-dot { width: 6px; height: 6px; background: #9ca3af; border-radius: 50%; animation: bounce 1.4s infinite ease-in-out; }
        .typing-dot:nth-child(1) { animation-delay: -0.32s; }
        .typing-dot:nth-child(2) { animation-delay: -0.16s; }
        @keyframes bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        .chat-products-scroll { display: flex; gap: 10px; overflow-x: auto; padding: 10px 0; width: 100%; scrollbar-width: none; }
        .chat-product-card { min-width: 140px; background: white; border-radius: 8px; padding: 10px; display: flex; flex-direction: column; align-items: center; gap: 8px; border: 1px solid #374151; }
        .chat-product-card img { width: 80px; height: 80px; object-fit: contain; }
        .chat-product-title { font-size: 12px; font-weight: bold; text-align: center; color: #111827; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .chat-product-price { color: #10b981; font-weight: 800; font-size: 13px; }
        .chat-add-btn { background: #111827; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 10px; font-weight: bold; cursor: pointer; width: 100%; transition: background 0.2s; }
        .chat-add-btn:hover { background: #10b981; }

        /* --- STYLES DO MODAL DE PREVIEW --- */
        #chatProductModal {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.7); z-index: 10000;
            display: flex; align-items: center; justify-content: center;
            opacity: 0; pointer-events: none; transition: opacity 0.3s ease;
        }
        #chatProductModal.open { opacity: 1; pointer-events: auto; }
        .cpm-card {
            background: white; width: 90%; max-width: 400px; padding: 24px;
            border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
            position: relative; transform: translateY(20px); transition: transform 0.3s ease;
            display: flex; flex-direction: column; align-items: center; text-align: center;
        }
        #chatProductModal.open .cpm-card { transform: translateY(0); }
        .cpm-close {
            position: absolute; top: 12px; right: 12px; background: none; border: none; font-size: 24px; 
            cursor: pointer; color: #9ca3af; padding: 4px; line-height: 1;
        }
        .cpm-img { width: 100%; height: 220px; object-fit: contain; margin-bottom: 20px; }
        .cpm-title { font-size: 20px; font-weight: 700; color: #111827; margin-bottom: 8px; line-height: 1.3; }
        .cpm-price { font-size: 28px; color: #10b981; font-weight: 800; margin-bottom: 24px; }
        .cpm-btn {
            width: 100%; padding: 14px; background: #25d366; color: white; 
            border: none; border-radius: 12px; font-weight: bold; font-size: 16px;
            cursor: pointer; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 8px;
            transition: transform 0.2s, background 0.2s;
        }
        .cpm-btn:hover { transform: scale(1.02); background: #1fad53; }
        
        @media (max-width: 480px) {
            #chatWindow { width: 100%; height: 100%; bottom: 0; right: 0; border-radius: 0; max-height: 100%; }
            #chatBubble { bottom: 20px; right: 20px; }
        }
    `;

    const HTML = `
        <div id="chatBubble">
            <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
            <div id="chatBadge">1</div>
        </div>
        <div id="chatWindow">
            <div class="chat-header">
                <div class="chat-profile">
                    <img src="https://ui-avatars.com/api/?name=Thiago+Atomic&background=10b981&color=fff" class="chat-avatar" alt="Avatar">
                    <div class="chat-info">
                        <h3>Thiago - Atomic</h3>
                        <div class="chat-status"><div class="status-dot"></div>Online Agora</div>
                    </div>
                </div>
                <div class="chat-controls">
                    <button id="resetChatBtn" title="Limpar conversa">🗑️</button>
                    <button id="closeChatBtn" title="Minimizar">✖</button>
                </div>
            </div>
            <div id="chatMessages"></div>
            <div class="chat-input-area">
                <input type="text" id="chatInput" placeholder="Digite sua dúvida..." autocomplete="off">
                <button id="sendBtn"><svg style="width:20px;height:20px;fill:currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button>
            </div>
        </div>
        <!-- MODAL DE PRODUTO INTEGRADO -->
        <div id="chatProductModal">
            <div class="cpm-card">
                <button class="cpm-close" id="cpmCloseBtn">×</button>
                <img src="" class="cpm-img" id="cpmImg" alt="Produto">
                <div class="cpm-title" id="cpmTitle"></div>
                <div class="cpm-price" id="cpmPrice"></div>
                <a href="#" target="_blank" class="cpm-btn" id="cpmActionBtn">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12.01 2C6.48 2 2 6.48 2 12c0 2.16.7 4.16 1.91 5.82L3 22l4.33-.94C8.78 21.69 10.36 22 12.01 22c5.52 0 10-4.48 10-10S17.53 2 12.01 2zM16.6 16.92c-.22.61-1.25 1.12-1.74 1.15-.46.03-1 .06-3.41-.95-2.88-1.21-4.73-4.14-4.88-4.33-.14-.2-1.17-1.55-1.17-2.95 0-1.4.72-2.09 1-2.38.26-.28.58-.35.77-.35.2 0 .4.01.57.01.18 0 .43-.07.67.51.25.59.84 2.06.91 2.21.07.15.12.36.03.57-.1.21-.15.34-.3.51-.14.17-.3.23-.42.36-.14.13-.28.28-.12.56.16.27.71 1.17 1.52 1.89 1.05.93 1.93 1.22 2.2 1.35.28.13.44.11.6-.07.17-.19.71-.83.9-1.12.19-.28.39-.24.65-.14.26.1.1.64.77 1.63 3.39.5.25.83.37.95.58.13.2.13 1.16-.09 1.77z"/></svg>
                    Negociar no WhatsApp
                </a>
            </div>
        </div>
    `;

    function injectInterface() {
        if (document.getElementById('chatBubble')) return; 
        const style = document.createElement('style'); style.textContent = STYLES; document.head.appendChild(style);
        const container = document.createElement('div'); container.id = 'atomic-chat-root'; container.innerHTML = HTML; document.body.appendChild(container);
    }
    injectInterface();

    // --- 3. CÉREBRO LOCAL (ATUALIZADO V3.9) ---
    const BRAIN = {
        // Classificação de Perfil (Tom de Voz)
        classification: {
            leigo: ["computador lento", "travando", "não entendo", "vírus", "luz piscando", "barulho estranho", "coisa de computador", "não liga", "tela azul", "esquentando", "devagar"],
            entusiasta: ["fps", "hz", "overclock", "gargalo", "driver", "bios", "nvme", "thermal throttling", "xmp", "chipset", "gpu", "cpu", "water cooler", "build"]
        },
        // Classificação de Intenção (Serviço vs Venda)
        intents: {
            service: ["conserto", "reparo", "arrumar", "quebrado", "pifou", "não liga", "tela azul", "formatar", "limpeza", "vírus", "manutenção", "trocar pasta", "upgrade", "instalar"],
            sales: ["comprar", "preço", "quanto custa", "vende", "tem rtx", "processador", "monitor", "teclado", "mouse", "loja"]
        },
        guardrails: {
            blocklist: ["crack", "ativador", "torrent", "baixar de graça", "pirata", "senha do banco", "cartão de crédito", "cvv", "conserta agora", "garante que resolve", "certeza absoluta"],
            responses: {
                piracy: "🔒 **Segurança:** Por questões éticas e de segurança, nossa loja trabalha exclusivamente com softwares originais.",
                financial: "🔒 **Segurança:** Para sua segurança, por favor não compartilhe senhas ou dados financeiros por aqui.",
                generic: "🔒 **Segurança:** Identifiquei termos que violam nossas diretrizes de segurança. Por favor, reformule sua dúvida."
            }
        },
        offline_knowledge: [
            { keys: ['formatar', 'formatacao', 'windows', 'sistema', 'tela azul'], response: "💡 **Modo Offline:** Para problemas de sistema ou vírus, nossa Formatação Completa é a solução ideal. Ela inclui backup e drivers." },
            { keys: ['limpeza', 'limpar', 'poeira', 'esquentando', 'barulho', 'quente'], response: "💡 **Modo Offline:** Computador esquentando ou barulhento geralmente precisa de uma Limpeza Preventiva com troca de pasta térmica." },
            { keys: ['lento', 'travando', 'melhorar', 'rápido', 'upgrade'], response: "💡 **Modo Offline:** Lentidão quase sempre se resolve trocando o HD antigo por um SSD e adicionando mais memória RAM. Fica até 10x mais rápido!" },
            { keys: ['gamer', 'jogo', 'fps', 'rodar', 'placa de video'], response: "💡 **Modo Offline:** Quer rodar tudo no ultra? Posso montar um orçamento de PC Gamer personalizado para você." },
            { keys: ['preço', 'valor', 'quanto', 'custa'], response: "💡 **Modo Offline:** Para valores exatos, preciso que o técnico avalie na bancada. Mas use nosso Simulador de Reparo abaixo para ter uma estimativa!" }
        ]
    };

    const els = { 
        bubble: document.getElementById('chatBubble'), 
        win: document.getElementById('chatWindow'), 
        msgs: document.getElementById('chatMessages'), 
        input: document.getElementById('chatInput'),
        badge: document.getElementById('chatBadge'),
        // Modal Elements
        modal: document.getElementById('chatProductModal'),
        modalImg: document.getElementById('cpmImg'),
        modalTitle: document.getElementById('cpmTitle'),
        modalPrice: document.getElementById('cpmPrice'),
        modalBtn: document.getElementById('cpmActionBtn'),
        modalClose: document.getElementById('cpmCloseBtn')
    };

    let state = { isOpen: false, isDragging: false, startX: 0, startY: 0, initialLeft: 0, initialTop: 0 };
    let sessionId = localStorage.getItem('chat_sess_id');
    let msgHistory = []; 

    // --- 4. CONTROLES DE INTERFACE ---
    function updateChatUI(open) {
        state.isOpen = open;
        els.win.classList.toggle('open', open);
        els.badge.style.display = open ? 'none' : 'flex';
        document.body.classList.toggle('chat-open', open);
        if (open) {
            if(window.innerWidth <= 480) {
                const rect = els.bubble.getBoundingClientRect();
                els.win.style.transformOrigin = `${rect.left + rect.width/2}px ${rect.top + rect.height/2}px`;
            }
            els.bubble.style.transform = 'scale(0)'; els.bubble.style.opacity = '0'; els.bubble.style.pointerEvents = 'none';
            if(window.innerWidth > 768) setTimeout(() => els.input.focus(), 350);
            scrollToBottom();
        } else {
            els.bubble.style.transform = 'scale(1)'; els.bubble.style.opacity = '1'; els.bubble.style.pointerEvents = 'auto';
            els.input.blur();
        }
    }

    function openChat() { if(state.isOpen) return; history.pushState({chat: true}, '', '#chat'); updateChatUI(true); }
    function closeChat() { if(!state.isOpen) return; history.back(); }
    window.addEventListener('popstate', () => { if(state.isOpen) updateChatUI(false); });
    function scrollToBottom() { els.msgs.scrollTop = els.msgs.scrollHeight; }

    // --- LÓGICA DO MODAL DE PRODUTO ---
    function openProductPreview(product) {
        // Tenta usar a função do site hospedeiro primeiro
        if (window.showProductDetail && typeof window.showProductDetail === 'function') {
            if(window.innerWidth <= 768) updateChatUI(false); 
            window.showProductDetail(product.id);
            return;
        }

        // Fallback: Usa o modal nativo do chatbot
        els.modalImg.src = product.image || 'https://placehold.co/300';
        els.modalTitle.textContent = product.name || product.nome;
        els.modalPrice.textContent = product.price || product.preco;
        
        const message = `Olá! Tenho interesse no produto: ${product.name || product.nome} (${product.price || product.preco})`;
        els.modalBtn.href = `https://wa.me/5521995969378?text=${encodeURIComponent(message)}`;
        
        els.modal.classList.add('open');
    }

    els.modalClose.onclick = () => els.modal.classList.remove('open');
    els.modal.onclick = (e) => { if(e.target === els.modal) els.modal.classList.remove('open'); };

    // --- 5. FÍSICA E EVENTOS ---
    if(els.bubble) {
        const updatePos = (x, y) => { els.bubble.style.left = `${x}px`; els.bubble.style.top = `${y}px`; };
        els.bubble.addEventListener('touchstart', (e) => {
            const t = e.touches[0]; state.startX = t.clientX; state.startY = t.clientY;
            const rect = els.bubble.getBoundingClientRect(); state.initialLeft = rect.left; state.initialTop = rect.top;
            state.isDragging = false; els.bubble.classList.add('no-transition'); els.bubble.classList.remove('snapping');
            els.bubble.style.transform = 'scale(0.95)'; updatePos(rect.left, rect.top);
        }, { passive: true });
        els.bubble.addEventListener('touchmove', (e) => {
            const t = e.touches[0]; const dx = t.clientX - state.startX; const dy = t.clientY - state.startY;
            if (Math.sqrt(dx*dx + dy*dy) > 15) state.isDragging = true;
            if (state.isDragging) { e.preventDefault(); updatePos(state.initialLeft + dx, state.initialTop + dy); }
        }, { passive: false });
        els.bubble.addEventListener('touchend', (e) => {
            els.bubble.classList.remove('no-transition');
            if (!state.isDragging) { e.preventDefault(); els.bubble.style.transform = 'scale(1)'; openChat(); } 
            else {
                els.bubble.style.transform = 'scale(1)'; els.bubble.classList.add('snapping');
                const rect = els.bubble.getBoundingClientRect(); const midX = window.innerWidth / 2;
                const snapX = (rect.left + rect.width/2) < midX ? 20 : window.innerWidth - rect.width - 20;
                let snapY = rect.top; if(snapY < 20) snapY = 20; if(snapY > window.innerHeight - 100) snapY = window.innerHeight - 100;
                updatePos(snapX, snapY);
            }
            state.isDragging = false;
        });
        els.bubble.addEventListener('click', (e) => { if(e.detail && !state.isDragging) { if(state.isOpen) closeChat(); else openChat(); } });
        document.getElementById('closeChatBtn').onclick = (e) => { e.stopPropagation(); closeChat(); };
        document.getElementById('resetChatBtn').onclick = (e) => { 
            e.stopPropagation(); 
            if(confirm('Limpar histórico?')) { 
                localStorage.removeItem('atomic_chat_history'); localStorage.removeItem('chat_sess_id'); 
                msgHistory = []; els.msgs.innerHTML = ''; sessionId = null; 
                setTimeout(() => addMsg('bot', 'Histórico limpo!'), 200); 
            } 
        };
    }

    // --- 6. RENDERIZAÇÃO ---
    function parseText(text) {
        if(!text) return document.createTextNode("");
        const frag = document.createDocumentFragment();
        text.split('\n').forEach((line, i) => {
            if(i>0) frag.appendChild(document.createElement('br'));
            line.split('**').forEach((part, j) => { j%2 ? frag.appendChild(Object.assign(document.createElement('b'),{textContent:part})) : frag.appendChild(document.createTextNode(part)); });
        });
        return frag;
    }

    function addMsg(role, content, prods, link, actions = [], save = true) {
        let cleanContent = content;
        if (role === 'bot' && msgHistory.length > 0) {
             cleanContent = cleanContent.replace(/^(Olá|Oi|E aí|Opa)(!|,|\.)? (Eu )?(Sou|Aqui é) o Thiago.*?(\.|\!|\?|\n)/si, "").trim();
             if(cleanContent.length > 0) cleanContent = cleanContent.charAt(0).toUpperCase() + cleanContent.slice(1);
        }

        const div = document.createElement('div'); div.className = `message ${role}`;
        const bubble = document.createElement('div'); bubble.className = 'message-bubble';
        if(cleanContent) bubble.appendChild(parseText(cleanContent));
        
        if(prods?.length) {
            const scroll = document.createElement('div'); scroll.className = 'chat-products-scroll';
            prods.forEach(p => {
                const card = document.createElement('div'); card.className = 'chat-product-card';
                const img = document.createElement('img'); img.src = p.image || 'https://placehold.co/100';
                const title = document.createElement('div'); title.className = 'chat-product-title'; title.textContent = p.name || p.nome;
                const price = document.createElement('div'); price.className = 'chat-product-price'; price.textContent = p.price || p.preco;
                const btn = document.createElement('button'); btn.className = 'chat-add-btn'; btn.textContent = 'VER DETALHES';
                
                // --- AÇÃO DE CLIQUE ATUALIZADA ---
                btn.onclick = (e) => {
                    e.stopPropagation();
                    openProductPreview(p);
                };
                
                card.append(img, title, price, btn); scroll.appendChild(card);
            });
            bubble.appendChild(scroll);
        }

        if(link) {
           const btn = document.createElement('a'); btn.href=link; btn.target='_blank';
           btn.className = 'block mt-2 text-center bg-green-500 text-white font-bold py-2 rounded-lg text-xs hover:bg-green-600';
           btn.textContent = 'NEGOCIAR AGORA'; bubble.appendChild(btn);
        }
        if (actions && actions.length > 0) {
            const actionContainer = document.createElement('div'); actionContainer.className = 'mt-3 flex flex-col gap-2';
            actions.forEach(act => {
                const actBtn = document.createElement('button');
                actBtn.className = 'flex items-center justify-between w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs font-bold hover:bg-yellow-400 hover:text-black transition-colors';
                actBtn.innerHTML = `<span>${act.label}</span><i class="ph-bold ${act.icon}"></i>`;
                actBtn.onclick = () => { if (act.targetId) { const el = document.getElementById(act.targetId); if(el) { if(window.innerWidth < 768) updateChatUI(false); el.scrollIntoView({behavior:'smooth'}); } } else if (act.url) window.open(act.url, '_blank'); };
                actionContainer.appendChild(actBtn);
            });
            bubble.appendChild(actionContainer);
        }
        div.appendChild(bubble); els.msgs.appendChild(div); scrollToBottom();
        if (save) { msgHistory.push({ role, content, prods, link, actions }); localStorage.setItem('atomic_chat_history', JSON.stringify(msgHistory)); }
    }

    // --- 7. INTELIGÊNCIA HÍBRIDA (NOVO LÓGICA V3.9) ---

    function classifyUser(text) {
        const t = text.toLowerCase();
        if (BRAIN.classification.entusiasta.some(k => t.includes(k))) return 'ENTUSIASTA';
        if (BRAIN.classification.leigo.some(k => t.includes(k))) return 'LEIGO';
        return 'INDEFINIDO';
    }

    function detectIntent(text) {
        const t = text.toLowerCase();
        if (BRAIN.intents.service.some(k => t.includes(k))) return 'SERVICE';
        if (BRAIN.intents.sales.some(k => t.includes(k))) return 'SALES';
        return 'OTHER';
    }

    function checkSecurity(text) {
        const t = text.toLowerCase();
        if (BRAIN.guardrails.blocklist.some(k => t.includes(k))) {
            if (t.includes('senha') || t.includes('cartão') || t.includes('cvv')) return BRAIN.guardrails.responses.financial;
            if (t.includes('crack') || t.includes('pirata') || t.includes('torrent') || t.includes('ativador')) return BRAIN.guardrails.responses.piracy;
            return BRAIN.guardrails.responses.generic;
        }
        return null;
    }

    function getOfflineResponse(text) {
        const lower = text.toLowerCase();
        const match = BRAIN.offline_knowledge.find(entry => entry.keys.some(k => lower.includes(k)));
        return match ? match.response : "Estou com uma pequena instabilidade na minha conexão com o servidor da loja. Mas não se preocupe! Nossa equipe humana está pronta no WhatsApp. Clique abaixo para falar com eles.";
    }

    async function makeRequest(message, currentSessionId) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS); 
        try {
            const res = await fetch(API_URL, { 
                method: 'POST', 
                headers: {'Content-Type':'application/json'}, 
                body: JSON.stringify({ message: message, session_id: currentSessionId }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return res;
        } catch(error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    async function send() {
        const txt = els.input.value.trim();
        if(!txt) return;

        // 1. SEGURANÇA LOCAL
        const securityAlert = checkSecurity(txt);
        if (securityAlert) {
             els.input.value = ''; addMsg('user', txt);
             setTimeout(() => addMsg('bot', securityAlert, [], null, [], true), 600);
             return;
        }

        // 2. DETECÇÃO LOCAL (CÉREBRO V3.9)
        const userProfile = classifyUser(txt);
        const userIntent = detectIntent(txt);
        
        console.log(`[Cérebro v3.9] Perfil: ${userProfile} | Intenção: ${userIntent}`);

        els.input.value = ''; addMsg('user', txt); 
        const loadingDiv = document.createElement('div'); loadingDiv.id='typing'; loadingDiv.className='message bot';
        loadingDiv.innerHTML = `<div class="message-bubble"><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>`;
        els.msgs.appendChild(loadingDiv); scrollToBottom();

        // 3. PREPARAÇÃO DE AÇÕES LOCAIS
        let localActions = [];

        // LÓGICA DA CALCULADORA (OBRIGATÓRIA PARA SERVIÇOS)
        if (userIntent === 'SERVICE') {
            const serviceSec = document.getElementById('services');
            let dir = (serviceSec && serviceSec.getBoundingClientRect().top < 0) ? '👆' : '👇';
            // Adiciona o botão com destaque
            localActions.push({ label: `🧮 ABRIR SIMULADOR DE ORÇAMENTO ${dir}`, icon: 'ph-calculator', targetId: 'services' });
        } else {
            // Se não for serviço explícito, verifica se pediu local
            if (txt.toLowerCase().includes('onde') || txt.toLowerCase().includes('endereço')) {
                localActions.push({ label: 'Ver Mapa e Endereço', icon: 'ph-map-pin', targetId: 'location' });
            }
        }
        
        try {
            // 4. CONSTRUÇÃO DO PROMPT DINÂMICO
            // Ajusta o contexto da IA baseada no Perfil e Intenção detectados localmente
            let systemInstruction = "";
            
            if (userIntent === 'SERVICE') {
                systemInstruction = `[SISTEMA: O usuário quer um SERVIÇO DE MANUTENÇÃO (Perfil: ${userProfile}). 
                Seja breve (máximo 3 frases).
                Não dê preços exatos. Explique o serviço brevemente e finalize dizendo: "Use nosso Simulador abaixo para uma estimativa precisa."
                Seja ${userProfile === 'ENTUSIASTA' ? 'técnico e direto' : 'didático e simples'}.]`;
            } else if (userIntent === 'SALES') {
                systemInstruction = `[SISTEMA: O usuário quer COMPRAR PRODUTO (Perfil: ${userProfile}).
                Seja breve. Se tiver o produto na base, ofereça. Se não, peça para chamar no WhatsApp.]`;
            } else {
                systemInstruction = `[SISTEMA: Responda como Thiago da Atomic Games. Perfil do cliente: ${userProfile}. Seja conciso.]`;
            }

            const finalPayload = `${systemInstruction}\nMensagem do usuário: ${txt}`;

            let res = await makeRequest(finalPayload, sessionId);
            
            // Retry automático para erro 500
            if (res.status === 500) {
                console.warn("[Auto-Repair] Erro 500. Retentando limpo em 2s...");
                sessionId = null; localStorage.removeItem('chat_sess_id');
                await new Promise(r => setTimeout(r, 2000)); 
                res = await makeRequest(finalPayload, null);
            }

            if (!res.ok) throw new Error(`Status: ${res.status}`);

            const data = await res.json();
            document.getElementById('typing')?.remove();
            
            if(data.success) {
                if(data.session_id) { sessionId = data.session_id; localStorage.setItem('chat_sess_id', sessionId); }
                const finalActions = [...localActions, ...(data.actions || [])];
                
                let responseText = data.response || "";
                
                // Removida a lógica de truncamento manual com "..."

                addMsg('bot', responseText, data.produtos_sugeridos, data.action_link, finalActions);
            } else { throw new Error("Success False"); }

        } catch (e) { 
            console.warn("[FALHA DE REDE/COTA] Ativando Modo Offline", e);
            document.getElementById('typing')?.remove();
            
            // === MODO DE CONTINGÊNCIA ===
            const offlineResp = getOfflineResponse(txt);
            
            // Se caiu no offline e era serviço, garante o botão também
            if (userIntent === 'SERVICE' && !localActions.some(a => a.targetId === 'services')) {
                 localActions.push({ label: `🧮 ABRIR SIMULADOR DE ORÇAMENTO`, icon: 'ph-calculator', targetId: 'services' });
            }

            localActions.push({ 
                label: 'Falar com Humano no WhatsApp', 
                icon: 'ph-whatsapp-logo', 
                url: `https://wa.me/5521995969378?text=Estou com problemas e o bot caiu. Dúvida: ${txt}`
            });

            addMsg('bot', offlineResp, [], null, localActions); 
        }
    }

    document.getElementById('sendBtn').onclick = send;
    els.input.addEventListener('keydown', (e) => { if(e.key === 'Enter') send(); });
    ['mousedown', 'touchstart'].forEach(evt => els.input.addEventListener(evt, (e) => { e.stopPropagation(); els.input.focus(); }));

    try {
        const savedHist = localStorage.getItem('atomic_chat_history');
        if (savedHist) { JSON.parse(savedHist).forEach(m => addMsg(m.role, m.content, m.prods, m.link, m.actions, false)); }
        else { setTimeout(() => addMsg('bot', 'E aí! 👋 Sou o **Thiago**, especialista da Atomic Games.\nComo posso ajudar hoje?'), 1000); }
    } catch(e) {}

    // Wake Up Ping
    setTimeout(() => {
        const baseUrl = API_URL.replace('/chat', ''); 
        fetch(baseUrl, { method: 'HEAD', mode: 'no-cors' }).catch(() => {});
    }, 2000);

    window.AtomicChat = {
        processBudget: function(context) {
            if (!context || context.status !== 'completed') return;
            if (!state.isOpen) openChat();
            const fmt = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            let name = context.service.name;
            let price = `${fmt(context.financial.totalMin)} a ${fmt(context.financial.totalMax)}`;
            if (context.service.customDescription) { name += `: "${context.service.customDescription}"`; price = "Sob Análise"; }
            
            const msg = `Olá **${context.customer.name}**! 👋 Recebi seu orçamento para **${context.device.modelLabel}**.\n🔧 ${name}\n💰 ${price}\nPosso confirmar?`;
            const url = `https://wa.me/5521995969378?text=${encodeURIComponent(`*ORÇAMENTO*\n${context.device.modelLabel} - ${name}\nValor: ${price}`)}`;
            setTimeout(() => { addMsg('bot', msg, [], null, [{ label: 'Agendar no WhatsApp', icon: 'ph-whatsapp-logo', url }], true); }, 500);
        }
    };
})();
