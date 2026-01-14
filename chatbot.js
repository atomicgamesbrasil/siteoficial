(function() {
    'use strict';

    console.log('Atomic Chatbot v3.7.1 (Production Gold) Initializing...');

    // ==========================================================================
    // 0. TEST ENVIRONMENT MOCKS
    // ==========================================================================
    function setupTestEnvironment() {
        // Funções globais que o site original possui. 
        // Se não existirem (ex: rodando isolado), criamos mocks para não quebrar o JS.
        if (typeof window.showProductDetail !== 'function') {
            window.showProductDetail = (id) => console.log(`[Atomic Mock] Open Product: ${id}`);
        }
        if (typeof window.openRoutePopup !== 'function') {
            window.openRoutePopup = () => console.log(`[Atomic Mock] Open Route Popup`);
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
        
        // ROBUST HEADER SELECTOR: Tenta classe moderna, depois antiga, depois tag genérica
        header: document.querySelector('.chat-header') || document.querySelector('.header') || document.querySelector('#chatWindow header'),
        
        closeBtn: getEl('closeChatBtn'),
        resetBtn: getEl('resetChatBtn')
    };

    const CONFIG = {
        // ENDPOINT DE PRODUÇÃO NO RENDER
        API_ENDPOINT: 'https://atomic-thiago-backend.onrender.com/api/chat-brain',
        TIMEOUT_MS: 60000,
        STORAGE_KEYS: {
            SESSION: 'atomic_sess_id_v2',
            HISTORY: 'atomic_chat_history_v2' 
        }
    };

    if (!els.bubble || !els.win) {
        console.error('AtomicChat: Critical elements missing (Window or Bubble). Widget disabled.');
        return;
    }

    // ==========================================================================
    // 2. UI BINDING & EVENTS
    // ==========================================================================
    
    function bindUIEvents() {
        const handleClose = (e) => { e.preventDefault(); e.stopPropagation(); closeChat(); };
        const handleReset = (e) => { e.preventDefault(); e.stopPropagation(); resetChat(); };

        // Bind direto se ID existir
        if (els.closeBtn) els.closeBtn.addEventListener('click', handleClose);
        if (els.resetBtn) els.resetBtn.addEventListener('click', handleReset);

        // Delegação no Header (Fallback para ícones dinâmicos)
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
            
            // Ajuste Mobile: centralizar no bubble se necessário
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

        // Renderiza Produtos (Cards)
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

        // Renderiza Ações (Botões)
        if (actions && actions.length) {
            const actCont = document.createElement('div');
            actCont.className = 'atomic-actions-row';
            actions.forEach(act => {
                const btn = document.createElement('button');
                btn.className = 'atomic-action-btn';
                btn.innerText = act.label;
                btn.onclick = () => {
                    if (act.type === 'OPEN_MAP') window.openRoutePopup();
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

        // Loading
        const loadingId = 'loading-' + Date.now();
        const loadRow = document.createElement('div');
        loadRow.id = loadingId;
        loadRow.innerHTML = '<div class="atomic-msg-bubble bot">...</div>';
        els.msgs.appendChild(loadRow);
        scrollToBottom();

        try {
            // REQUISIÇÃO AO BACKEND
            const res = await fetch(CONFIG.API_ENDPOINT, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ message: txt, session_id: state.sessionId })
            });
            
            if (!res.ok) throw new Error(`Server Error: ${res.status}`);
            
            const data = await res.json();
            document.getElementById(loadingId)?.remove();
            
            // Atualiza sessão se o backend mandar
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

    // --- Persistência ---
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
            const msg = "Fala aí! Sou o Thiago da Atomic. Posso ajudar com Preços, Consertos ou Endereço?";
            renderMessage('bot', msg, [], [{label:'Ver Endereço', type:'OPEN_MAP'}]);
        }
    }

    if(!loadHistory()) checkEmptyState();

    // --- Drag & Click Logic ---
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