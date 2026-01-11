
// === CHATBOT PRODUCTION CLIENT (ATOMIC GAMES) ===
// Features: Interface V2.1 (Classic Thiago) + Network V2.6 (Robustness)
(function() {
    // 1. Support Global Config Override
    const GLOBAL_CONFIG = window.ATOMIC_CONFIG || {};
    
    const CONFIG = {
        // FIXED: Pointing directly to your Render Backend
        API_URL: GLOBAL_CONFIG.API_URL || 'https://atomic-thiago-backend.onrender.com/chat',
        TIMEOUT_MS: 60000, // 60s timeout to allow Render Free Tier to wake up
        ASSETS: {
            ICON_BUBBLE: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="#ffffff" viewBox="0 0 256 256"><path d="M216,48H40A16,16,0,0,0,24,64V224a15.84,15.84,0,0,0,9.25,14.5A16.05,16.05,0,0,0,40,240a15.89,15.89,0,0,0,10.25-3.78l.09-.07L83,208H216a16,16,0,0,0,16-16V64A16,16,0,0,0,216,48ZM216,192H83a8,8,0,0,0-5.23,1.95L48,220.67V64H216Z"></path></svg>',
            ICON_SEND: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#ffffff" viewBox="0 0 256 256"><path d="M227.32,28.68a16,16,0,0,0-15.66-4.08l-.15,0L19.57,82.84a16,16,0,0,0-2.42,29.84l85.62,40.55,40.55,85.62A15.86,15.86,0,0,0,157.74,248q.69,0,1.38-.06a15.88,15.88,0,0,0,14-11.51l58.2-191.94c0-.05,0-.1,0-.15A16,16,0,0,0,227.32,28.68ZM157.83,231.85l-36.4-76.85L180.28,96.15a8,8,0,0,1,11.31,11.31l-58.85,58.85Zm-50.3-106.1-58.85-58.85a8,8,0,0,1,11.31-11.31L180.28,96.15Z"></path></svg>',
            ICON_CLOSE: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#ffffff" viewBox="0 0 256 256"><path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path></svg>'
        }
    };

    // --- UTILS: SAFE STORAGE ---
    const safeStorage = {
        getItem: (key) => { try { return localStorage.getItem(key); } catch(e) { return null; } },
        setItem: (key, val) => { try { localStorage.setItem(key, val); } catch(e) { } },
        removeItem: (key) => { try { localStorage.removeItem(key); } catch(e) { } }
    };

    // --- 1. INJECT STYLES ---
    const style = document.createElement('style');
    style.innerHTML = `
        :root { --chat-primary: #007bff; --chat-bg: #ffffff; --chat-text: #333; --chat-user-bg: #007bff; --chat-user-text: #fff; --chat-badge-bg: #ff3b30; }
        
        #chatBubble { position: fixed; bottom: 20px; right: 20px; width: 60px; height: 60px; background: var(--chat-primary); border-radius: 50%; box-shadow: 0 4px 15px rgba(0,0,0,0.2); cursor: pointer; z-index: 9999; display: flex; align-items: center; justify-content: center; transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s; }
        #chatBubble:hover { transform: scale(1.1); }
        #chatBubble.snapping { transition: left 0.3s ease, top 0.3s ease; }
        #chatBubble:focus { outline: 3px solid rgba(0,123,255,0.5); outline-offset: 2px; }

        @keyframes chat-pulse {
            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255,0,0,0.0); }
            50% { transform: scale(1.08); box-shadow: 0 0 12px 6px rgba(255,0,0,0.12); }
            100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255,0,0,0.0); }
        }
        #chatBubble.pulse { animation: chat-pulse 1.6s infinite ease-in-out; }

        #chatBadge { position: absolute; top: -5px; right: -5px; background: var(--chat-badge-bg); color: white; font-size: 11px; font-weight: bold; min-width: 20px; height: 20px; padding: 0 6px; border-radius: 10px; display: none; align-items: center; justify-content: center; border: 2px solid white; box-sizing: border-box; }
        #chatBadge.show { display: flex; }
        
        #chatWindow { position: fixed; bottom: 90px; right: 20px; width: 380px; height: 600px; max-height: 80vh; background: var(--chat-bg); border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.15); z-index: 9999; display: flex; flexDirection: column; overflow: hidden; transform-origin: bottom right; transform: scale(0); opacity: 0; pointer-events: none; transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
        #chatWindow.open { transform: scale(1); opacity: 1; pointer-events: all; }
        
        #chatHeader { background: var(--chat-primary); color: white; padding: 18px 20px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
        #chatHeader h3 { margin: 0; font-size: 16px; font-weight: 600; }
        #chatHeader p { margin: 2px 0 0; font-size: 12px; opacity: 0.9; }
        #closeChatBtn { background: none; border: none; color: white; cursor: pointer; padding: 5px; border-radius: 50%; display: flex; transition: background 0.2s; }
        #closeChatBtn:hover { background: rgba(255,255,255,0.2); }
        #closeChatBtn:focus { outline: 2px solid white; }

        #chatMessages { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 15px; scroll-behavior: smooth; background: #f8f9fa; }
        
        .message { display: flex; flex-direction: column; max-width: 85%; }
        .message.user { align-self: flex-end; align-items: flex-end; }
        .message.bot { align-self: flex-start; align-items: flex-start; }
        
        .message-bubble { padding: 12px 16px; border-radius: 16px; font-size: 14px; line-height: 1.5; word-wrap: break-word; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .message.user .message-bubble { background: var(--chat-user-bg); color: var(--chat-user-text); border-bottom-right-radius: 4px; }
        .message.bot .message-bubble { background: white; color: var(--chat-text); border-bottom-left-radius: 4px; border: 1px solid #eee; }

        /* PRODUCT CARDS (V2.1 STYLE) */
        .chat-products-scroll { display: flex; overflow-x: auto; gap: 10px; padding: 10px 0; scrollbar-width: thin; }
        .chat-product-card { min-width: 140px; max-width: 140px; background: #fff; border: 1px solid #eee; border-radius: 10px; padding: 10px; display: flex; flex-direction: column; align-items: center; text-align: center; }
        .chat-product-card img { width: 80px; height: 80px; object-fit: contain; margin-bottom: 8px; }
        .chat-product-title { font-size: 11px; font-weight: 600; color: #333; margin-bottom: 5px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; height: 28px; }
        .chat-product-price { font-size: 13px; font-weight: bold; color: #007bff; margin-bottom: 8px; }
        .chat-add-btn { background: #007bff; color: white; border: none; padding: 6px 12px; border-radius: 15px; font-size: 10px; font-weight: bold; cursor: pointer; width: 100%; transition: background 0.2s; }
        .chat-add-btn:hover { background: #0056b3; }
        
        #chatControls { padding: 15px; background: white; border-top: 1px solid #eee; display: flex; gap: 10px; align-items: center; flex-shrink: 0; }
        #chatInput { flex: 1; padding: 12px 16px; border: 1px solid #ddd; border-radius: 24px; font-size: 14px; outline: none; transition: border-color 0.2s; }
        #chatInput:focus { border-color: var(--chat-primary); }
        #chatInput:disabled { background: #f0f0f0; cursor: not-allowed; }
        #sendBtn { width: 40px; height: 40px; background: var(--chat-primary); border: none; border-radius: 50%; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: transform 0.2s; flex-shrink: 0; }
        #sendBtn:hover { transform: scale(1.05); }
        #sendBtn:disabled { background: #ccc; cursor: not-allowed; transform: none; }
        #sendBtn:focus { outline: 2px solid var(--chat-primary); outline-offset: 2px; }
        
        .message-actions { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; width: 100%; }
        .chat-action-btn { display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 10px 12px; background: #f1f3f5; border: none; border-radius: 8px; color: #333; font-weight: 600; font-size: 12px; cursor: pointer; transition: background 0.2s; text-decoration: none; font-family: inherit; }
        .chat-action-btn:hover { background: #ffc107; color: #000; }
        .chat-action-btn.primary { background: #10b981; color: white; }
        .chat-action-btn.primary:hover { background: #059669; }

        .typing-indicator { display: flex; gap: 4px; padding: 4px 8px; }
        .typing-dot { width: 6px; height: 6px; background: #ccc; border-radius: 50%; animation: typing 1.4s infinite ease-in-out both; }
        .typing-dot:nth-child(1) { animation-delay: -0.32s; }
        .typing-dot:nth-child(2) { animation-delay: -0.16s; }
        @keyframes typing { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }

        @media (max-width: 480px) {
            #chatWindow { width: 100%; height: 100%; max-height: 100%; bottom: 0; right: 0; border-radius: 0; }
        }
    `;
    document.head.appendChild(style);

    // --- 2. INJECT DOM ---
    if (!document.getElementById('chatBubble')) {
        const bubble = document.createElement('div');
        bubble.id = 'chatBubble';
        bubble.setAttribute('role', 'button');
        bubble.setAttribute('aria-expanded', 'false');
        bubble.setAttribute('aria-label', 'Abrir Chat de Atendimento');
        bubble.setAttribute('tabindex', '0');
        bubble.innerHTML = `${CONFIG.ASSETS.ICON_BUBBLE}<div id="chatBadge">0</div>`;
        document.body.appendChild(bubble);

        const win = document.createElement('div');
        win.id = 'chatWindow';
        win.setAttribute('role', 'dialog');
        win.setAttribute('aria-modal', 'false');
        win.setAttribute('aria-label', 'Janela de Chat');
        win.innerHTML = `
            <div id="chatHeader">
                <div>
                    <h3>Assistente Virtual</h3>
                    <p>Online agora</p>
                </div>
                <button id="closeChatBtn" aria-label="Fechar Chat">${CONFIG.ASSETS.ICON_CLOSE}</button>
            </div>
            <div id="chatMessages" role="log" aria-live="polite" aria-atomic="false"></div>
            <div id="chatControls">
                <input type="text" id="chatInput" placeholder="Digite sua mensagem..." autocomplete="off" aria-label="Digite sua mensagem">
                <button id="sendBtn" aria-label="Enviar mensagem">${CONFIG.ASSETS.ICON_SEND}</button>
            </div>
        `;
        document.body.appendChild(win);
    }

    const els = {
        bubble: document.getElementById('chatBubble'),
        win: document.getElementById('chatWindow'),
        msgs: document.getElementById('chatMessages'),
        input: document.getElementById('chatInput'),
        badge: document.getElementById('chatBadge'),
        closeBtn: document.getElementById('closeChatBtn'),
        sendBtn: document.getElementById('sendBtn')
    };

    let state = { isOpen: false, isDragging: false, startX: 0, startY: 0, initialLeft: 0, initialTop: 0 };
    let sessionId = safeStorage.getItem('chat_sess_id');
    let isSending = false;
    let lastMsgTime = 0;
    let msgHistory = [];

    // --- 3. BADGE & A11Y ---
    function showBadge(count) {
        const n = Math.max(0, Number(count || els.badge.textContent || 0));
        els.badge.textContent = n > 99 ? '99+' : String(n);
        if (n > 0) {
            els.badge.classList.add('show');
            els.bubble.classList.add('pulse');
        } else {
            els.badge.classList.remove('show');
            els.bubble.classList.remove('pulse');
        }
    }

    function incrementBadge(by = 1) {
        const current = parseInt(els.badge.textContent || '0') || 0;
        const newVal = current + Math.max(0, by);
        showBadge(newVal);
        if (newVal > 0) {
            announceForA11y(`Você tem ${newVal} nova${newVal > 1 ? 's' : ''} mensagem${newVal > 1 ? 's' : ''}`);
        }
    }

    function clearBadge() { showBadge(0); }

    function announceForA11y(text) {
        let el = document.getElementById('chat-a11y');
        if (!el) {
            el = document.createElement('div');
            el.id = 'chat-a11y';
            el.style.position = 'absolute';
            el.style.left = '-9999px';
            el.setAttribute('aria-live', 'polite');
            document.body.appendChild(el);
        }
        el.textContent = text;
    }

    // --- 4. UI LOGIC ---
    function scrollToBottom() { els.msgs.scrollTop = els.msgs.scrollHeight; }

    function updateChatUI(open) {
        state.isOpen = open;
        els.win.classList.toggle('open', open);
        els.bubble.setAttribute('aria-expanded', String(open));
        
        if (open) {
            clearBadge();
            els.bubble.style.transform = 'scale(0)';
            els.bubble.style.opacity = '0';
            els.bubble.style.pointerEvents = 'none';
            if (window.innerWidth > 768) setTimeout(() => els.input.focus(), 300);
            scrollToBottom();
            announceForA11y('Janela de chat aberta');
        } else {
            els.bubble.style.transform = 'scale(1)';
            els.bubble.style.opacity = '1';
            els.bubble.style.pointerEvents = 'auto';
            els.input.blur();
            els.bubble.focus();
        }
    }

    els.bubble.addEventListener('click', () => { if(!state.isDragging) updateChatUI(true); });
    els.bubble.addEventListener('keydown', (e) => { 
        if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); updateChatUI(true); } 
    });
    els.closeBtn.addEventListener('click', () => updateChatUI(false));

    // --- 5. DRAG PHYSICS ---
    const setPos = (x, y) => { els.bubble.style.left = `${x}px`; els.bubble.style.top = `${y}px`; els.bubble.style.bottom = 'auto'; els.bubble.style.right = 'auto'; };
    
    els.bubble.addEventListener('touchstart', (e) => {
        const t = e.touches[0];
        state.startX = t.clientX; state.startY = t.clientY;
        const rect = els.bubble.getBoundingClientRect();
        state.initialLeft = rect.left; state.initialTop = rect.top;
        state.isDragging = false;
        els.bubble.classList.remove('snapping');
    }, { passive: true });

    els.bubble.addEventListener('touchmove', (e) => {
        const t = e.touches[0];
        const dx = t.clientX - state.startX;
        const dy = t.clientY - state.startY;
        if (Math.sqrt(dx*dx + dy*dy) > 10) state.isDragging = true;
        if (state.isDragging) {
            e.preventDefault();
            setPos(state.initialLeft + dx, state.initialTop + dy);
        }
    }, { passive: false });

    els.bubble.addEventListener('touchend', () => {
        if (state.isDragging) {
            els.bubble.classList.add('snapping');
            const rect = els.bubble.getBoundingClientRect();
            const midX = window.innerWidth / 2;
            const snapX = (rect.left + rect.width/2) < midX ? 20 : window.innerWidth - rect.width - 20;
            let snapY = rect.top;
            if (snapY < 20) snapY = 20;
            if (snapY > window.innerHeight - 100) snapY = window.innerHeight - 100;
            setPos(snapX, snapY);
        }
        setTimeout(() => { state.isDragging = false; }, 100);
    });

    // --- 6. SECURITY & PARSING ---
    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function parseMarkdownSafe(text) {
        if (!text) return '';
        let safe = escapeHtml(text);
        return safe.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\*(.*?)\*/g, '<i>$1</i>');
    }

    function isSafeUrl(string) {
        try {
            const url = new URL(string, window.location.href);
            if (['mailto:', 'tel:', 'whatsapp:'].includes(url.protocol)) return true;
            if (url.protocol === 'http:' || url.protocol === 'https:') {
                if (url.origin === window.location.origin) return true;
                return url.protocol === 'https:';
            }
            return false;
        } catch (_) { return false; }
    }

    // --- 7. MESSAGE RENDERER ---
    function addMessage(role, content, prods = [], link = null, actions = [], save = true) {
        const div = document.createElement('div');
        div.className = `message ${role}`;
        
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.innerHTML = parseMarkdownSafe(content);
        
        // Product Cards
        if(prods && prods.length > 0) {
            const scroll = document.createElement('div'); 
            scroll.className = 'chat-products-scroll';
            prods.forEach(p => {
                const card = document.createElement('div'); 
                card.className = 'chat-product-card';
                
                const img = document.createElement('img');
                img.src = p.image || 'https://placehold.co/100';
                img.loading = 'lazy';
                
                const title = document.createElement('div');
                title.className = 'chat-product-title';
                title.textContent = p.name || p.nome;
                
                const price = document.createElement('div');
                price.className = 'chat-product-price';
                price.textContent = p.price || p.preco;
                
                const btn = document.createElement('button'); 
                btn.className = 'chat-add-btn'; 
                btn.textContent = 'VER DETALHES';
                
                btn.onclick = (e) => {
                    e.stopPropagation();
                    if (window.showProductDetail && p.id) {
                        if(window.innerWidth <= 768) updateChatUI(false); 
                        window.showProductDetail(p.id);
                    } else {
                        window.open(`https://wa.me/5521995969378?text=Interesse em: ${encodeURIComponent(p.name||p.nome)}`);
                    }
                };
                
                card.appendChild(img);
                card.appendChild(title);
                card.appendChild(price);
                card.appendChild(btn);
                scroll.appendChild(card);
            });
            bubble.appendChild(scroll);
        }

        // Link Button
        if(link) {
           const btn = document.createElement('a'); btn.href=link; btn.target='_blank';
           btn.className = 'block mt-2 text-center bg-green-500 text-white font-bold py-2 rounded-lg text-xs hover:bg-green-600 transition';
           btn.style = 'display:block; margin-top:8px; text-align:center; background:#28a745; color:white; font-weight:bold; padding:8px; border-radius:8px; font-size:12px; text-decoration:none;';
           btn.textContent = 'NEGOCIAR AGORA'; 
           bubble.appendChild(btn);
        }

        // Action Buttons
        if (actions && Array.isArray(actions) && actions.length > 0) {
            const actionsContainer = document.createElement('div');
            actionsContainer.className = 'message-actions';
            actions.forEach(action => {
                if (!action.label) return;
                
                const actBtn = document.createElement('button');
                actBtn.className = action.type === 'human_handoff' ? 'chat-action-btn primary' : 'chat-action-btn';
                
                const span = document.createElement('span');
                span.textContent = action.label;
                actBtn.appendChild(span);
                
                if(action.icon) {
                    const icon = document.createElement('i');
                    icon.className = `ph-bold ${action.icon}`;
                    actBtn.appendChild(icon);
                }

                if (action.url && isSafeUrl(action.url)) {
                    actBtn.onclick = () => window.open(action.url, '_blank');
                } else if (action.targetId) {
                    actBtn.onclick = () => {
                        const target = document.getElementById(action.targetId);
                        if(target) {
                            if(window.innerWidth < 768) updateChatUI(false);
                            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    }
                } else {
                    actBtn.onclick = () => window.dispatchEvent(new CustomEvent('atomic_chat_action', { detail: { action } }));
                }
                
                actionsContainer.appendChild(actBtn);
            });
            div.appendChild(actionsContainer);
        }

        div.appendChild(bubble);
        els.msgs.appendChild(div);
        scrollToBottom();

        // History
        if (save) {
            msgHistory.push({ role, content, prods, link, actions });
            safeStorage.setItem('atomic_chat_history', JSON.stringify(msgHistory));
        }
    }

    function addTyping() {
        const id = 'typing-' + Date.now();
        const div = document.createElement('div');
        div.id = id;
        div.className = 'message bot';
        div.innerHTML = `<div class="message-bubble"><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>`;
        els.msgs.appendChild(div);
        scrollToBottom();
        return id;
    }

    function removeTyping(id) { const el = document.getElementById(id); if (el) el.remove(); }

    // --- 8. CONTEXT AWARENESS ---
    function checkSiteContext(text) {
        const t = text.toLowerCase();
        const actions = [];
        if (t.includes('limpeza') || t.includes('manutenção') || t.includes('conserto') || t.includes('reparo')) {
            actions.push({ label: 'Abrir Simulador de Reparo', icon: 'ph-wrench', targetId: 'services' });
        }
        if (t.includes('onde fica') || t.includes('endereço') || t.includes('localização')) {
            actions.push({ label: 'Ver Mapa e Endereço', icon: 'ph-map-pin', targetId: 'location' });
        }
        return actions;
    }

    // --- 9. API COMMUNICATION (Network Layer) ---
    const RETRY_CONFIG = { maxRetries: 3, baseDelay: 1000 };
    const outgoingQueue = [];

    function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

    window.addEventListener('online', () => {
        if (outgoingQueue.length) {
            window.dispatchEvent(new CustomEvent('atomic_chat_retry', { detail: { queued: outgoingQueue.length } }));
            flushQueue();
        }
    });

    async function flushQueue() {
        while (outgoingQueue.length) {
            const item = outgoingQueue.shift();
            try {
                await sendMessagePayload(item.txt, item.attempt || 0);
            } catch (err) {
                item.attempt = (item.attempt || 0) + 1;
                if (item.attempt <= RETRY_CONFIG.maxRetries) {
                    outgoingQueue.unshift(item);
                    await wait(RETRY_CONFIG.baseDelay * Math.pow(2, item.attempt));
                } else {
                    window.dispatchEvent(new CustomEvent('atomic_chat_error', { detail: { error: 'max_retries_exceeded', info: err && err.message } }));
                }
                break;
            }
        }
    }

    async function sendMessagePayload(txt, attempt = 0) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS);
        
        const localActions = checkSiteContext(txt);

        const payload = {
            message: txt,
            session_id: sessionId,
            origin: 'embedded-chatbot',
            channel: 'website'
        };

        try {
            const res = await fetch(CONFIG.API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal,
                credentials: 'omit'
            });

            clearTimeout(timeoutId);

            if (!res.ok) {
                const text = await res.text().catch(()=>null);
                throw new Error(`Server error: ${res.status} ${text||''}`);
            }

            const data = await res.json();
            if (!data || typeof data.reply === 'undefined' && !data.response) throw new Error('Invalid response schema');

            const replyText = data.reply || data.response;
            const actions = (Array.isArray(data.actions) ? data.actions : []).concat(localActions);
            const products = data.produtos_sugeridos || [];
            const actionLink = data.action_link || null;

            if (data.session_id) {
                sessionId = data.session_id;
                safeStorage.setItem('chat_sess_id', sessionId);
            }

            addMessage('bot', replyText, products, actionLink, actions, true);
            
            if (data.notify) {
                const unread = Number(data.notify.unread || 1);
                if (!state.isOpen) incrementBadge(unread);
                else if (data.notify.message) addMessage('bot', data.notify.message, [], null, [], true);
                window.dispatchEvent(new CustomEvent('atomic_chat_notify', { detail: data.notify }));
            } else {
                if (!state.isOpen) incrementBadge(1);
            }

            if (data.escalate) {
                els.input.placeholder = "Atendimento humano solicitado...";
                window.dispatchEvent(new CustomEvent('atomic_chat_escalate', { detail: data }));
                els.input.disabled = true;
                els.sendBtn.disabled = true;
            } else {
                els.input.disabled = false;
                setTimeout(()=> els.input.focus(), 100);
            }

            return data;

        } catch (err) {
            clearTimeout(timeoutId);
            throw err;
        }
    }

    async function sendMessage() {
        if (isSending) return;
        const now = Date.now();
        if (now - lastMsgTime < 1000) return;
        lastMsgTime = now;

        const txt = els.input.value.trim();
        if (!txt) return;

        const sensitiveKeywords = ['senha','password','cvv','cartão de crédito','cartao de credito','cpf'];
        if (sensitiveKeywords.some(k => txt.toLowerCase().includes(k))) {
            addMessage('bot','⚠️ Por motivos de segurança, não compartilhe senhas ou dados financeiros por aqui.', [], null, [], true);
            return;
        }

        els.input.value = '';
        addMessage('user', txt, [], null, [], true);

        if (!navigator.onLine) {
            outgoingQueue.push({ txt, attempt: 0 });
            window.dispatchEvent(new CustomEvent('atomic_chat_queue', { detail: { queued: outgoingQueue.length } }));
            addMessage('bot', 'Você está sem conexão. Mensagem enfileirada para envio automático.', [], null, [], false);
            return;
        }

        isSending = true;
        els.sendBtn.disabled = true;
        els.input.disabled = true;
        const typingId = addTyping();

        let attempt = 0;
        while (attempt <= RETRY_CONFIG.maxRetries) {
            try {
                await sendMessagePayload(txt, attempt);
                removeTyping(typingId);
                break;
            } catch (e) {
                if (attempt === RETRY_CONFIG.maxRetries) {
                    removeTyping(typingId);
                    const isAbort = e && e.name === 'AbortError';
                    const errorMsg = isAbort ? 'O servidor está acordando. Tente novamente em 1 minuto.' : 'Desculpe, tive um problema de conexão. Tente novamente em instantes.';
                    addMessage('bot', errorMsg, [], null, [], false);
                    window.dispatchEvent(new CustomEvent('atomic_chat_error', { detail: { error: e && e.message } }));
                    break;
                } else {
                    attempt++;
                    window.dispatchEvent(new CustomEvent('atomic_chat_retry', { detail: { attempt, error: e && e.message } }));
                    const backoff = RETRY_CONFIG.baseDelay * Math.pow(2, attempt - 1);
                    await wait(backoff);
                }
            }
        }
        isSending = false;
        els.sendBtn.disabled = false;
        if (!outgoingQueue.length) els.input.disabled = false;
    }

    els.sendBtn.addEventListener('click', sendMessage);
    els.input.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendMessage(); });

    // --- 10. MOBILE INPUT FIX ---
    ['mousedown', 'mouseup', 'click', 'touchstart', 'touchend'].forEach(evt => {
        els.input.addEventListener(evt, (e) => {
            e.stopPropagation();
            if (evt === 'mousedown') els.input.focus();
        });
    });

    // --- 11. INITIALIZATION ---
    try {
        const savedHist = safeStorage.getItem('atomic_chat_history');
        if (savedHist) {
            msgHistory = JSON.parse(savedHist);
            msgHistory.forEach(m => addMessage(m.role, m.content, m.prods, m.link, m.actions, false));
        } else {
            setTimeout(() => {
                addMessage('bot', 'E aí! 👋 Sou o **Thiago**, especialista da Atomic Games.\nPosso te ajudar a montar um PC, escolher um console ou fazer um orçamento de manutenção?', [], null, [], true);
            }, 1000);
        }
    } catch(e) { console.error("History load error", e); }

    // --- 12. SERVER WARM-UP (Wakes up Render) ---
    setTimeout(() => {
        // Automatically strips '/chat' to ping the root URL
        const baseUrl = CONFIG.API_URL.replace('/chat', '');
        fetch(baseUrl, { method: 'HEAD', mode: 'no-cors' }).catch(() => {});
    }, 1500);

    // --- 13. GLOBAL API HOOK ---
    window.AtomicChat = {
        processBudget: function(context) {
            if (!context || context.status !== 'completed') return;
            if (!state.isOpen) updateChatUI(true);
            const fmt = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            let finalServiceName = context.service.name;
            let finalPriceStr = `${fmt(context.financial.totalMin)} a ${fmt(context.financial.totalMax)}`;
            if (context.service.customDescription) {
                finalServiceName = `${context.service.name}: "${context.service.customDescription}"`;
                finalPriceStr = "Sob Análise Técnica";
            }
            const msg = `Olá **${context.customer.name || 'Gamer'}**! 👋\nRecebi sua estimativa para o **${context.device.modelLabel}**.\n\n🔧 Serviço: ${finalServiceName}\n💰 Estimativa: **${finalPriceStr}**\n📍 Logística: ${context.logistics.label}\n\nPosso confirmar o agendamento ou você tem alguma dúvida sobre o serviço?`;
            const waMsg = `*ORÇAMENTO TÉCNICO (WEB)*\n\n👤 *${context.customer.name}*\n📱 ${context.customer.phone}\n--------------------------------\n🎮 *Aparelho:* ${context.device.modelLabel}\n🛠️ *Serviço:* ${finalServiceName}\n📍 *Logística:* ${context.logistics.label}\n💰 *Estimativa:* ${finalPriceStr}\n--------------------------------\n*Obs:* Vim pelo Chat do Site.`;
            const waLink = `https://wa.me/5521995969378?text=${encodeURIComponent(waMsg)}`;
            setTimeout(() => {
                addMessage('bot', msg, [], null, [{ label: 'Agendar no WhatsApp', icon: 'ph-whatsapp-logo', url: waLink }], true);
            }, 500);
        }
    };

})();
