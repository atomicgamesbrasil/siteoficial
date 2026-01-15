(function() {
    'use strict';

    console.log('Atomic Chatbot v4.2.0 (Map Modal Integrated) Initializing...');

    // ==========================================================================
    // 0. ATOMIC THEME INJECTION (CSS OVERRIDE)
    // ==========================================================================
    function injectAtomicStyles() {
        const styleId = 'atomic-chat-styles';
        if (document.getElementById(styleId)) return;

        // PALETA ATOMIC:
        // Amarelo Principal: #ffc107 (Amber)
        // Fundo Dark: #09090b
        // Fundo Card: #18181b
        
        const css = `
            /* --- JANELA PRINCIPAL --- */
            #chatWindow, #atomic-chat-window, .chat-window {
                background-color: #09090b !important; /* Ultra Dark */
                border: 1px solid #333 !important;
                box-shadow: 0 20px 50px rgba(0,0,0,0.8) !important;
                font-family: 'Segoe UI', Roboto, sans-serif !important;
                border-radius: 16px !important;
                overflow: hidden !important;
                z-index: 9999 !important;
            }

            /* --- HEADER --- */
            .chat-header, #chatWindow header {
                background: #18181b !important;
                border-bottom: 2px solid #ffc107 !important;
                color: #ffffff !important;
                padding: 16px 20px !important;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            .chat-header h3, .chat-title {
                color: #ffffff !important;
                font-weight: 700 !important;
                font-size: 15px !important;
                display: flex;
                align-items: center;
                gap: 10px;
                text-transform: uppercase;
                margin: 0 !important;
            }
            .chat-header h3::before {
                content: ''; display: block; width: 10px; height: 10px;
                background-color: #ffc107; border-radius: 50%;
                box-shadow: 0 0 10px rgba(255, 193, 7, 0.5);
            }
            .chat-header button {
                color: #a1a1aa !important; background: none !important; border: none !important;
                cursor: pointer; transition: color 0.2s;
            }
            .chat-header button:hover { color: #ffc107 !important; }

            /* --- MENSAGENS --- */
            #chatMessages, .chat-body {
                background-color: #09090b !important;
                padding: 20px !important;
                overflow-x: hidden !important;
            }
            .atomic-msg-bubble {
                padding: 12px 18px !important;
                font-size: 14px !important;
                line-height: 1.5 !important;
                max-width: 85% !important;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important;
                white-space: pre-wrap !important;
                word-wrap: break-word !important;
                overflow-wrap: break-word !important;
            }
            .atomic-msg-bubble.bot {
                background-color: #18181b !important; color: #e4e4e7 !important;
                border: 1px solid #27272a !important;
                border-radius: 16px 16px 16px 4px !important;
            }
            .atomic-msg-bubble.user {
                background-color: #ffc107 !important; color: #000000 !important;
                border-radius: 16px 16px 4px 16px !important;
                font-weight: 600 !important;
                border: none !important;
            }

            /* --- FOOTER --- */
            .chat-footer {
                background-color: #09090b !important; border-top: 1px solid #27272a !important;
                padding: 15px !important; position: relative;
            }
            #chatInput {
                background: #18181b !important; border: 1px solid #333 !important;
                color: #fff !important; border-radius: 8px !important;
                padding: 12px 15px !important; font-size: 14px !important;
                width: 100%; box-sizing: border-box;
            }
            #chatInput:focus { border-color: #ffc107 !important; outline: none !important; }
            #sendBtn {
                position: absolute; right: 25px; top: 50%; transform: translateY(-50%);
                background: transparent !important; color: #ffc107 !important;
                font-weight: bold !important; border: none !important; cursor: pointer;
            }

            /* --- PRODUTOS E BOTÕES --- */
            .chat-product-card {
                background: #18181b !important; border: 1px solid #333 !important;
                border-radius: 8px !important; margin-top: 10px !important; padding: 12px !important;
                border-left: 3px solid #ffc107 !important;
            }
            .chat-product-title { color: #fff !important; font-weight: 600; font-size: 13px; }
            .chat-product-price { color: #ffc107 !important; font-weight: bold; font-size: 14px; }
            
            .chat-add-btn, .atomic-action-btn {
                background: transparent !important; color: #ffc107 !important;
                border: 1px solid #ffc107 !important; border-radius: 6px !important;
                padding: 8px 14px !important; font-size: 12px !important; cursor: pointer !important;
                margin-top: 6px; text-transform: uppercase; font-weight: 700;
                transition: all 0.2s;
            }
            .chat-add-btn:hover, .atomic-action-btn:hover {
                background: #ffc107 !important; color: #000 !important;
            }

            /* --- MODAL DE MAPA (NOVO) --- */
            #atomic-map-modal {
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                background: rgba(0,0,0,0.85); z-index: 100000;
                display: none; justify-content: center; align-items: center;
                backdrop-filter: blur(5px);
            }
            #atomic-map-modal.active { display: flex; }
            
            .atomic-map-content {
                background: #18181b; border: 1px solid #333; border-radius: 12px;
                width: 90%; max-width: 600px; max-height: 90vh;
                display: flex; flex-direction: column; overflow: hidden;
                box-shadow: 0 0 30px rgba(0,0,0,0.8);
            }
            .atomic-map-header {
                padding: 15px 20px; border-bottom: 1px solid #333;
                display: flex; justify-content: space-between; align-items: center;
                background: #09090b;
            }
            .atomic-map-header h4 { color: #fff; margin: 0; font-size: 16px; text-transform: uppercase; }
            .atomic-map-close { background: none; border: none; color: #fff; font-size: 24px; cursor: pointer; }
            
            .atomic-map-body { padding: 0; height: 350px; position: relative; }
            .atomic-map-body iframe { width: 100%; height: 100%; border: 0; }
            
            .atomic-map-footer {
                padding: 15px; background: #09090b; border-top: 1px solid #333;
                text-align: center;
            }
            .atomic-map-btn {
                background: #ffc107; color: #000; padding: 12px 24px;
                border: none; border-radius: 8px; font-weight: bold; text-transform: uppercase;
                cursor: pointer; display: inline-flex; align-items: center; gap: 8px;
                text-decoration: none; font-size: 14px;
            }
            .atomic-map-btn:hover { background: #e0a800; }

            /* --- BUBBLE --- */
            #chatBubble, #atomic-chat-trigger {
                background-color: #ffc107 !important; box-shadow: 0 0 20px rgba(255, 193, 7, 0.4) !important;
            }
        `;

        const styleEl = document.createElement('style');
        styleEl.id = styleId;
        styleEl.innerHTML = css;
        document.head.appendChild(styleEl);
    }

    injectAtomicStyles();

    // ==========================================================================
    // 0.1 MODAL GENERATOR (MAPA)
    // ==========================================================================
    function createMapModal() {
        if (document.getElementById('atomic-map-modal')) return;

        const modalHtml = `
            <div id="atomic-map-modal">
                <div class="atomic-map-content">
                    <div class="atomic-map-header">
                        <h4>📍 Localização Atomic</h4>
                        <button class="atomic-map-close" onclick="document.getElementById('atomic-map-modal').classList.remove('active')">&times;</button>
                    </div>
                    <div class="atomic-map-body">
                        <!-- Iframe do Google Maps Embed (Gratuito/Sem API Key restrita) -->
                        <iframe 
                            src="https://maps.google.com/maps?q=Atomic+Games+Madureira+Av+Ministro+Edgard+Romero+81&t=&z=15&ie=UTF8&iwloc=&output=embed" 
                            allowfullscreen>
                        </iframe>
                    </div>
                    <div class="atomic-map-footer">
                        <a href="https://www.google.com/maps/search/?api=1&query=Atomic+Games+Madureira+Av+Ministro+Edgard+Romero+81" target="_blank" class="atomic-map-btn">
                            🚗 Traçar Rota (GPS)
                        </a>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Fechar ao clicar fora
        document.getElementById('atomic-map-modal').addEventListener('click', (e) => {
            if (e.target.id === 'atomic-map-modal') e.target.classList.remove('active');
        });
    }

    // Inicializa o modal oculto
    createMapModal();

    function showMapModal() {
        createMapModal(); // Garante que existe
        document.getElementById('atomic-map-modal').classList.add('active');
    }

    // ==========================================================================
    // 0.2 TEST ENVIRONMENT MOCKS
    // ==========================================================================
    function setupTestEnvironment() {
        if (typeof window.showProductDetail !== 'function') {
            window.showProductDetail = (id) => console.log(`[Atomic Mock] Open Product: ${id}`);
        }
    }
    setupTestEnvironment();

    // ==========================================================================
    // 1. SELECTORS & CONFIG
    // ==========================================================================
    
    const getEl = (id) => document.getElementById(id);
    
    const els = {
        bubble: getEl('chatBubble') || getEl('atomic-chat-trigger'),
        win: getEl('chatWindow') || getEl('atomic-chat-window'),
        msgs: getEl('chatMessages') || getEl('atomic-chat-body'),
        input: getEl('chatInput') || getEl('atomic-chat-input'),
        badge: getEl('chatBadge'), 
        sendBtn: getEl('sendBtn') || getEl('atomic-chat-send'),
        
        header: document.querySelector('.chat-header') || document.querySelector('.header') || document.querySelector('#chatWindow header'),
        
        closeBtn: getEl('closeChatBtn'),
        resetBtn: getEl('resetChatBtn')
    };

    const CONFIG = {
        API_ENDPOINT: 'https://atomic-thiago-backend.onrender.com/api/chat-brain',
        TIMEOUT_MS: 60000,
        STORAGE_KEYS: {
            SESSION: 'atomic_sess_id_v2',
            HISTORY: 'atomic_chat_history_v2' 
        }
    };

    if (!els.bubble || !els.win) {
        console.error('AtomicChat: Critical elements missing. Widget disabled.');
        return;
    }

    // ==========================================================================
    // 2. UI BINDING & EVENTS
    // ==========================================================================
    
    function bindUIEvents() {
        const handleClose = (e) => { e.preventDefault(); e.stopPropagation(); closeChat(); };
        const handleReset = (e) => { e.preventDefault(); e.stopPropagation(); resetChat(); };

        if (els.closeBtn) els.closeBtn.addEventListener('click', handleClose);
        if (els.resetBtn) els.resetBtn.addEventListener('click', handleReset);

        if (els.header) {
            els.header.addEventListener('click', (e) => {
                const t = e.target;
                if (t.id === 'closeChatBtn' || t.closest('#closeChatBtn') || t.innerText.includes('✕')) handleClose(e);
                if (t.id === 'resetChatBtn' || t.closest('#resetChatBtn') || t.innerText.includes('🗑')) handleReset(e);
            });
            els.header.style.cursor = 'default';
        }
    }

    bindUIEvents();

    // ==========================================================================
    // 3. CORE STATE
    // ==========================================================================

    let state = {
        isOpen: false,
        isDragging: false,
        startX: 0, startY: 0,
        sessionId: sessionStorage.getItem(CONFIG.STORAGE_KEYS.SESSION)
    };

    function updateChatUI(open) {
        state.isOpen = open;
        if (open) {
            els.win.classList.add('open');
            els.win.style.display = 'flex';
            
            if(window.innerWidth <= 480) {
                const rect = els.bubble.getBoundingClientRect();
                els.win.style.transformOrigin = `${rect.left+rect.width/2}px ${rect.top+rect.height/2}px`;
            }

            els.bubble.style.opacity = '0';
            els.bubble.style.pointerEvents = 'none';
            if(els.badge) els.badge.style.display = 'none';
            
            scrollToBottom();
            if(window.innerWidth > 768 && els.input) setTimeout(() => els.input.focus(), 100);
            checkEmptyState();

        } else {
            els.win.classList.remove('open');
            els.win.style.display = 'none';
            els.bubble.style.opacity = '1';
            els.bubble.style.pointerEvents = 'auto';
            if(els.badge) els.badge.style.display = 'flex';
            if(els.input) els.input.blur();
        }
        document.body.classList.toggle('chat-open', open);
    }

    function openChat() { if(!state.isOpen) { history.pushState({chat: true}, '', '#chat'); updateChatUI(true); } }
    function closeChat() { if(state.isOpen) { if(history.state?.chat) history.back(); else updateChatUI(false); } }

    function resetChat() {
        if(confirm('Apagar histórico da conversa?')) {
            localStorage.removeItem(CONFIG.STORAGE_KEYS.HISTORY);
            sessionStorage.removeItem(CONFIG.STORAGE_KEYS.SESSION);
            state.sessionId = null;
            els.msgs.innerHTML = '';
            checkEmptyState();
        }
    }

    window.addEventListener('popstate', (e) => { updateChatUI(false); });
    function scrollToBottom() { if(els.msgs) els.msgs.scrollTop = els.msgs.scrollHeight; }

    // ==========================================================================
    // 4. RENDERING & MESSAGING
    // ==========================================================================

    function renderMessage(role, text, prods, actions, isHistory) {
        if(!els.msgs) return;

        const row = document.createElement('div');
        row.className = `atomic-msg-row ${role}`;
        row.style.display = 'flex';
        row.style.justifyContent = role === 'user' ? 'flex-end' : 'flex-start';
        row.style.marginBottom = '8px';

        const bubble = document.createElement('div');
        bubble.className = `atomic-msg-bubble ${role}`;
        bubble.innerHTML = text.replace(/\n/g, '<br>');

        if (prods && prods.length) {
            const prodCont = document.createElement('div');
            prods.forEach(p => {
                const card = document.createElement('div');
                card.className = 'chat-product-card';
                card.innerHTML = `<div class="chat-product-title">${p.name}</div><div class="chat-product-price">${p.price}</div>`;
                const btn = document.createElement('button');
                btn.className = 'chat-add-btn';
                btn.innerText = 'VER DETALHES';
                btn.onclick = (e) => { e.stopPropagation(); window.showProductDetail(p.id); };
                card.appendChild(btn);
                prodCont.appendChild(card);
            });
            bubble.appendChild(prodCont);
        }

        if (actions && actions.length) {
            const actCont = document.createElement('div');
            actCont.className = 'atomic-actions-row';
            actions.forEach(act => {
                const btn = document.createElement('button');
                btn.className = 'atomic-action-btn';
                btn.innerText = act.label;
                
                // LÓGICA DE AÇÃO ROBUSTA (MAPA E CALCULADORA)
                btn.onclick = () => {
                    // Ação 1: Abrir Mapa (MODAL INTERNO)
                    if (act.type === 'OPEN_MAP') {
                        showMapModal();
                    } 
                    // Ação 2: Calculadora / Orçamento
                    else if (act.type === 'OPEN_BUDGET') {
                        // Tenta encontrar uma seção de orçamento/calculadora na página
                        const targets = ['orcamento', 'budget', 'calculadora', 'assistencia', 'contact'];
                        let found = false;
                        for(const id of targets) {
                            const el = document.getElementById(id);
                            if(el) {
                                el.scrollIntoView({behavior: 'smooth', block: 'center'});
                                found = true;
                                break;
                            }
                        }
                        if(!found) {
                            window.open('https://wa.me/5521995969378?text=Olá,%20gostaria%20de%20fazer%20um%20orçamento%20online!', '_blank');
                        }
                    }
                    else if (act.type === 'OPEN_PRODUCT') window.showProductDetail(act.payload);
                    else if (act.url) window.open(act.url, '_blank');
                    else if (act.targetId) {
                        const el = document.getElementById(act.targetId);
                        if(el) el.scrollIntoView({behavior:'smooth'});
                    }
                };
                actCont.appendChild(btn);
            });
            bubble.appendChild(actCont);
        }

        row.appendChild(bubble);
        els.msgs.appendChild(row);
        if(!isHistory) scrollToBottom();
    }

    async function handleSend() {
        const txt = els.input.value.trim();
        if(!txt) return;
        els.input.value = '';
        
        renderMessage('user', txt);
        saveHistory('user', txt);

        const loadingId = 'loading-' + Date.now();
        const loadRow = document.createElement('div');
        loadRow.id = loadingId;
        loadRow.innerHTML = '<div class="atomic-msg-bubble bot">...</div>';
        els.msgs.appendChild(loadRow);
        scrollToBottom();

        try {
            const res = await fetch(CONFIG.API_ENDPOINT, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ message: txt, session_id: state.sessionId })
            });
            
            if (!res.ok) throw new Error(`Server Error: ${res.status}`);
            
            const data = await res.json();
            document.getElementById(loadingId)?.remove();
            
            if (data.session_id) {
                state.sessionId = data.session_id;
                sessionStorage.setItem(CONFIG.STORAGE_KEYS.SESSION, state.sessionId);
            }
            
            const replyText = data.reply || data.response || "Sem resposta.";
            renderMessage('bot', replyText, data.produtos_sugeridos, data.actions);
            saveHistory('bot', replyText, data.produtos_sugeridos, data.actions);

        } catch (err) {
            console.error('Atomic Chat Error:', err);
            document.getElementById(loadingId)?.remove();
            renderMessage('bot', 'Ops! Tive um problema de conexão com o QG. Tenta de novo?');
        }
    }

    if(els.sendBtn) els.sendBtn.onclick = handleSend;
    if(els.input) els.input.onkeydown = (e) => { if(e.key === 'Enter') handleSend(); };

    function saveHistory(role, text, prods, acts) {
        const h = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.HISTORY) || '[]');
        h.push({role, text, prods, acts});
        localStorage.setItem(CONFIG.STORAGE_KEYS.HISTORY, JSON.stringify(h.slice(-20)));
    }

    function loadHistory() {
        const h = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.HISTORY) || '[]');
        h.forEach(m => renderMessage(m.role, m.text, m.prods, m.acts, true));
        return h.length > 0;
    }

    function checkEmptyState() {
        if(els.msgs.children.length === 0) {
            const msg = "Fala aí! Sou o Thiago da Atomic. Tô na área pra falar de Games, Consoles e PC. No que posso ajudar?";
            renderMessage('bot', msg, [], []);
        }
    }

    if(!loadHistory()) checkEmptyState();

    els.bubble.addEventListener('touchstart', e => {
        state.startX = e.touches[0].clientX; state.startY = e.touches[0].clientY; state.isDragging = false;
    }, {passive:true});

    els.bubble.addEventListener('touchmove', e => {
        if(Math.hypot(e.touches[0].clientX - state.startX, e.touches[0].clientY - state.startY) > 10) {
            state.isDragging = true;
            els.bubble.style.left = e.touches[0].clientX + 'px'; els.bubble.style.top = e.touches[0].clientY + 'px';
            e.preventDefault();
        }
    }, {passive:false});

    els.bubble.addEventListener('touchend', e => { if(!state.isDragging) openChat(); state.isDragging = false; });
    els.bubble.addEventListener('click', e => { if(!state.isDragging) state.isOpen ? closeChat() : openChat(); });

})();