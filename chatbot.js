(function() {
    'use strict';

    console.log('Atomic Chatbot v5.0 (Integrated Modal) Initializing...');

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
        // Texto: #e4e4e7
        
        const css = `
            /* --- JANELA PRINCIPAL --- */
            #chatWindow, #atomic-chat-window, .chat-window {
                background-color: #09090b !important;
                border: 1px solid #333 !important;
                box-shadow: 0 20px 50px rgba(0,0,0,0.9) !important;
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
            .chat-header h3 {
                color: #ffffff !important; font-weight: 700 !important;
                font-size: 15px !important; margin: 0 !important;
                display: flex; align-items: center; gap: 10px; text-transform: uppercase;
            }
            .chat-header h3::before {
                content: ''; display: block; width: 10px; height: 10px;
                background-color: #ffc107; border-radius: 50%;
                box-shadow: 0 0 10px rgba(255, 193, 7, 0.5);
            }
            .chat-header button {
                color: #a1a1aa !important; background: none !important; border: none !important;
                cursor: pointer; transition: color 0.2s; font-size: 18px;
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

            /* --- AÇÕES & PRODUTOS --- */
            .chat-product-card {
                background: #18181b !important; border: 1px solid #333 !important;
                border-radius: 8px !important; margin-top: 10px !important; padding: 12px !important;
                border-left: 3px solid #ffc107 !important;
            }
            .chat-product-title { color: #fff; font-weight: 600; font-size: 13px; }
            .chat-product-price { color: #ffc107; font-weight: bold; font-size: 14px; }
            
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

            /* --- MODAL GLOBAL (BASE) --- */
            .atomic-modal-overlay {
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                background: rgba(0,0,0,0.9); z-index: 100000;
                display: none; justify-content: center; align-items: center;
                backdrop-filter: blur(8px);
                animation: atomicFadeIn 0.3s ease;
            }
            .atomic-modal-overlay.active { display: flex; }
            
            .atomic-modal-content {
                background: #09090b; border: 1px solid #333; border-radius: 12px;
                width: 90%; max-width: 450px;
                display: flex; flex-direction: column; overflow: hidden;
                box-shadow: 0 0 40px rgba(255, 193, 7, 0.15);
                animation: atomicSlideUp 0.3s ease;
            }

            /* --- CALCULATOR SPECIFIC --- */
            .atomic-calc-header {
                background: #18181b; padding: 15px 20px; border-bottom: 2px solid #ffc107;
                display: flex; justify-content: space-between; align-items: center;
            }
            .atomic-calc-header h2 { color: #fff; font-size: 16px; margin: 0; text-transform: uppercase; display: flex; gap: 8px; align-items: center; }
            .atomic-calc-close { color: #666; font-size: 24px; background: none; border: none; cursor: pointer; }
            .atomic-calc-close:hover { color: #fff; }

            .atomic-calc-body { padding: 20px; color: #e4e4e7; }
            
            .atomic-field-group { margin-bottom: 15px; text-align: left; }
            .atomic-field-group label { display: block; font-size: 12px; color: #a1a1aa; margin-bottom: 5px; font-weight: 600; text-transform: uppercase; }
            
            .atomic-input, .atomic-select {
                width: 100%; padding: 12px; border-radius: 8px;
                background: #18181b; border: 1px solid #333;
                color: #fff; font-family: inherit; font-size: 14px;
                box-sizing: border-box; outline: none; transition: border 0.3s;
            }
            .atomic-input:focus, .atomic-select:focus { border-color: #ffc107; }

            .atomic-price-display {
                background: #18181b; padding: 15px; border-radius: 8px;
                text-align: center; margin: 20px 0; border: 1px dashed #444;
            }
            .atomic-price-label { font-size: 12px; color: #888; text-transform: uppercase; }
            .atomic-price-value { font-size: 24px; color: #ffc107; font-weight: 800; margin-top: 5px; }

            .atomic-radio-group { display: flex; gap: 15px; margin-top: 5px; }
            .atomic-radio-label { display: flex; align-items: center; gap: 6px; font-size: 13px; cursor: pointer; }
            .atomic-radio-label input { accent-color: #ffc107; }

            .atomic-calc-btn {
                width: 100%; background: #ffc107; color: #000;
                padding: 14px; border: none; border-radius: 8px;
                font-weight: 800; text-transform: uppercase; font-size: 14px;
                cursor: pointer; transition: transform 0.2s;
            }
            .atomic-calc-btn:hover { transform: scale(1.02); box-shadow: 0 0 15px rgba(255, 193, 7, 0.4); }

            /* --- BUBBLE --- */
            #chatBubble, #atomic-chat-trigger {
                background-color: #ffc107 !important; box-shadow: 0 0 20px rgba(255, 193, 7, 0.4) !important;
            }

            @keyframes atomicFadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes atomicSlideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        `;

        const styleEl = document.createElement('style');
        styleEl.id = styleId;
        styleEl.innerHTML = css;
        document.head.appendChild(styleEl);
    }

    injectAtomicStyles();

    // ==========================================================================
    // 0.1 MODAL GENERATORS
    // ==========================================================================
    
    // MAPA MODAL (Mantido simples)
    function createMapModal() {
        if (document.getElementById('atomic-map-modal')) return;
        const html = `
            <div id="atomic-map-modal" class="atomic-modal-overlay">
                <div class="atomic-modal-content" style="max-width:600px;">
                    <div class="atomic-calc-header">
                        <h2>📍 Localização Atomic</h2>
                        <button class="atomic-calc-close" onclick="document.getElementById('atomic-map-modal').classList.remove('active')">&times;</button>
                    </div>
                    <div style="height:350px;">
                        <iframe src="https://maps.google.com/maps?q=Atomic+Games+Madureira+Av+Ministro+Edgard+Romero+81&t=&z=15&ie=UTF8&iwloc=&output=embed" style="width:100%; height:100%; border:0;" allowfullscreen></iframe>
                    </div>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    }

    // CALCULADORA INTEGRADA (O "CORAÇÃO" DA SOLUÇÃO)
    function createCalculatorModal() {
        if (document.getElementById('atomic-calc-modal')) return;

        const html = `
            <div id="atomic-calc-modal" class="atomic-modal-overlay">
                <div class="atomic-modal-content">
                    <div class="atomic-calc-header">
                        <h2>🧮 Calculadora Rápida</h2>
                        <button class="atomic-calc-close" id="btn-close-calc">&times;</button>
                    </div>
                    <div class="atomic-calc-body">
                        
                        <div class="atomic-field-group">
                            <label>Seu Nome</label>
                            <input type="text" id="at-calc-name" class="atomic-input" placeholder="Como te chamamos?">
                        </div>

                        <div class="atomic-field-group">
                            <label>Aparelho</label>
                            <select id="at-calc-model" class="atomic-select">
                                <option value="ps5">PlayStation 5</option>
                                <option value="ps4">PlayStation 4</option>
                                <option value="xboxss">Xbox Series S/X</option>
                                <option value="xboxone">Xbox One</option>
                                <option value="nswitch">Nintendo Switch</option>
                                <option value="control">Controle (DualSense/Xbox)</option>
                            </select>
                        </div>

                        <div class="atomic-field-group">
                            <label>Problema / Serviço</label>
                            <select id="at-calc-service" class="atomic-select">
                                <option value="clean">Limpeza Completa + Pasta Térmica</option>
                                <option value="drift">Analógico puxando (Drift)</option>
                                <option value="hdmi">Troca de HDMI / Não dá vídeo</option>
                                <option value="power">Não Liga / Desliga Sozinho</option>
                                <option value="other">Outro Defeito</option>
                            </select>
                        </div>

                        <div class="atomic-price-display">
                            <div class="atomic-price-label">Estimativa de Preço</div>
                            <div class="atomic-price-value" id="at-calc-result">R$ 150,00</div>
                        </div>

                        <div class="atomic-field-group">
                            <label>Logística</label>
                            <div class="atomic-radio-group">
                                <label class="atomic-radio-label">
                                    <input type="radio" name="at_logistics" value="Levarei na Loja" checked>
                                    Levo na Loja
                                </label>
                                <label class="atomic-radio-label">
                                    <input type="radio" name="at_logistics" value="Motoboy">
                                    Buscar de Motoboy
                                </label>
                            </div>
                        </div>

                        <button id="at-btn-finish" class="atomic-calc-btn">
                            ✅ Finalizar e Agendar
                        </button>

                    </div>
                </div>
            </div>`;
        
        document.body.insertAdjacentHTML('beforeend', html);

        // Lógica Interna da Calculadora
        const els = {
            modal: document.getElementById('atomic-calc-modal'),
            close: document.getElementById('btn-close-calc'),
            model: document.getElementById('at-calc-model'),
            service: document.getElementById('at-calc-service'),
            result: document.getElementById('at-calc-result'),
            submit: document.getElementById('at-btn-finish'),
            name: document.getElementById('at-calc-name')
        };

        // Estimativas (Simplificadas para UX rápida)
        const prices = {
            'clean': { min: 100, max: 180 },
            'drift': { min: 80, max: 120 },
            'hdmi': { min: 250, max: 450 },
            'power': { min: 300, max: 800 },
            'other': { min: 0, max: 0 } // A combinar
        };

        function updatePrice() {
            const s = els.service.value;
            const m = els.model.value;
            let p = prices[s] || { min: 0, max: 0 };
            
            // Pequeno ajuste por modelo
            if (m === 'ps5' || m === 'xboxss') { p.min += 50; p.max += 50; }
            if (m === 'control') { p = { min: 60, max: 150 }; } // Override pra controle

            if (s === 'other') {
                els.result.innerText = "A Combinar";
                els.result.style.color = "#aaa";
            } else {
                els.result.innerText = `R$ ${p.min} - R$ ${p.max}`;
                els.result.style.color = "#ffc107";
            }
        }

        // Listeners
        els.model.addEventListener('change', updatePrice);
        els.service.addEventListener('change', updatePrice);
        els.close.addEventListener('click', () => els.modal.classList.remove('active'));
        els.modal.addEventListener('click', (e) => { if(e.target === els.modal) els.modal.classList.remove('active'); });

        // AÇÃO FINAL: ENVIAR PARA O BOT
        els.submit.addEventListener('click', async () => {
            const name = els.name.value.trim() || "Cliente Amigo";
            const model = els.model.options[els.model.selectedIndex].text;
            const service = els.service.options[els.service.selectedIndex].text;
            const price = els.result.innerText;
            const logistics = document.querySelector('input[name="at_logistics"]:checked').value;

            // 1. Fecha Modal
            els.modal.classList.remove('active');

            // 2. Abre Bot (se estiver fechado)
            updateChatUI(true);
            
            // 3. Feedback visual imediato
            renderMessage('bot', `Só um segundo, ${name}... processando seu agendamento.`);

            // 4. Envia para o Backend (Simulação de Order)
            try {
                const payload = { name, model, service, priceMin: price, priceMax: "", logistics };
                
                const res = await fetch(CONFIG.ORDER_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                const data = await res.json();
                
                if(data.success) {
                    renderMessage('bot', data.reply, [], data.actions);
                } else {
                    renderMessage('bot', "Tive um erro ao gerar o link, mas me chama no Zap assim mesmo!");
                }
            } catch (err) {
                console.error(err);
                renderMessage('bot', "Sem internet? Pode me chamar no WhatsApp direto que a gente resolve.");
            }
        });

        // Init
        updatePrice();
    }

    function showMapModal() { createMapModal(); document.getElementById('atomic-map-modal').classList.add('active'); }
    function showCalculatorModal() { 
        createCalculatorModal(); 
        document.getElementById('atomic-calc-modal').classList.add('active'); 
        // Fecha o chat para dar foco no modal, se quiser. Ou mantém aberto. 
        // O usuário pediu "pop-up, pum, abrisse". Vamos manter o chat aberto atrás ou fechar?
        // Geralmente modais cobrem tudo. Vamos manter o estado atual.
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
        ORDER_ENDPOINT: 'https://atomic-thiago-backend.onrender.com/api/orders',
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
                
                // --- LÓGICA DE ACTIONS ATUALIZADA ---
                btn.onclick = () => {
                    // Ação 1: Abrir Mapa
                    if (act.type === 'OPEN_MAP') {
                        showMapModal();
                    } 
                    // Ação 2: Calculadora (AGORA MODAL DEDICADO)
                    else if (act.type === 'OPEN_BUDGET') {
                        showCalculatorModal();
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