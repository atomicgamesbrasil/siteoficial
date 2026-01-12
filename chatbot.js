
// === CHATBOT PRODUCTION CLIENT (ATOMIC GAMES) ===
// Features: Interface V2.3 (Contrast Fixes + Badge Logic) + Network V2.7
(function() {
    // 1. Support Global Config Override
    const GLOBAL_CONFIG = window.ATOMIC_CONFIG || {};
    
    const CONFIG = {
        API_URL: GLOBAL_CONFIG.API_URL || 'https://atomic-thiago-backend.onrender.com/chat',
        TIMEOUT_MS: 120000, 
        ASSETS: {
            ICON_BUBBLE: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="#ffffff" viewBox="0 0 256 256"><path d="M216,48H40A16,16,0,0,0,24,64V224a15.84,15.84,0,0,0,9.25,14.5A16.05,16.05,0,0,0,40,240a15.89,15.89,0,0,0,10.25-3.78l.09-.07L83,208H216a16,16,0,0,0,16-16V64A16,16,0,0,0,216,48ZM216,192H83a8,8,0,0,0-5.23,1.95L48,220.67V64H216Z"></path></svg>',
            ICON_SEND: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256"><path d="M227.32,28.68a16,16,0,0,0-15.66-4.08l-.15,0L19.57,82.84a16,16,0,0,0-2.42,29.84l85.62,40.55,40.55,85.62A15.86,15.86,0,0,0,157.74,248q.69,0,1.38-.06a15.88,15.88,0,0,0,14-11.51l58.2-191.94c0-.05,0-.1,0-.15A16,16,0,0,0,227.32,28.68ZM157.83,231.85l-36.4-76.85L180.28,96.15a8,8,0,0,1,11.31,11.31l-58.85,58.85Zm-50.3-106.1-58.85-58.85a8,8,0,0,1,11.31-11.31L180.28,96.15Z"></path></svg>',
            ICON_CLOSE: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256"><path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path></svg>',
            ICON_TRASH: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256"><path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"></path></svg>'
        }
    };

    const safeStorage = {
        getItem: (key) => { try { return localStorage.getItem(key); } catch(e) { return null; } },
        setItem: (key, val) => { try { localStorage.setItem(key, val); } catch(e) { } },
        removeItem: (key) => { try { localStorage.removeItem(key); } catch(e) { } }
    };

    // --- 1. INJECT STYLES ---
    const style = document.createElement('style');
    style.innerHTML = `
        :root {
            /* Light Mode Default */
            --chat-primary: #111111;
            --chat-accent: #007bff;
            --chat-bg: #ffffff;
            --chat-surface: #f8f9fa;
            --chat-text: #333333;
            --chat-user-bg: #007bff;
            --chat-user-text: #ffffff;
            --chat-bot-bg: #f1f3f5;
            --chat-bot-text: #333333;
            --chat-border: #e9ecef;
            --chat-badge-bg: #ff3b30;
        }

        /* Dark Mode Support */
        @media (prefers-color-scheme: dark) {
            :root {
                --chat-primary: #000000;
                --chat-bg: #1a1a1a;
                --chat-surface: #252525;
                --chat-text: #ffffff;
                --chat-bot-bg: #333333;
                --chat-bot-text: #ffffff;
                --chat-border: #444444;
            }
        }
        
        /* Force Dark Mode Class */
        body.dark-mode {
             --chat-primary: #000000;
             --chat-bg: #1a1a1a;
             --chat-surface: #252525;
             --chat-text: #ffffff;
             --chat-bot-bg: #333333;
             --chat-bot-text: #ffffff;
             --chat-border: #444444;
        }

        #chatBubble { position: fixed; bottom: 20px; right: 20px; width: 60px; height: 60px; background: var(--chat-primary); border-radius: 50%; box-shadow: 0 4px 20px rgba(0,0,0,0.3); cursor: pointer; z-index: 9999; display: flex; align-items: center; justify-content: center; transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); border: 2px solid rgba(255,255,255,0.1); }
        #chatBubble:hover { transform: scale(1.1); }
        #chatBubble.snapping { transition: left 0.3s ease, top 0.3s ease; }
        
        /* Badge Notification Animation */
        @keyframes badge-pop { 0% { transform: scale(0); } 80% { transform: scale(1.2); } 100% { transform: scale(1); } }

        #chatBadge { position: absolute; top: 0; right: 0; background: var(--chat-badge-bg); color: white; font-size: 11px; font-weight: bold; min-width: 20px; height: 20px; padding: 0 6px; border-radius: 10px; display: none; align-items: center; justify-content: center; border: 2px solid var(--chat-primary); box-sizing: border-box; animation: badge-pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        #chatBadge.show { display: flex; }
        
        #chatWindow { position: fixed; bottom: 90px; right: 20px; width: 380px; height: 600px; max-height: 80vh; background: var(--chat-bg); border-radius: 16px; box-shadow: 0 12px 48px rgba(0,0,0,0.25); z-index: 9999; display: flex; flexDirection: column; overflow: hidden; transform-origin: bottom right; transform: scale(0); opacity: 0; pointer-events: none; transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s; font-family: 'Inter', system-ui, sans-serif; border: 1px solid var(--chat-border); }
        #chatWindow.open { transform: scale(1); opacity: 1; pointer-events: all; }
        
        #chatHeader { background: var(--chat-primary); color: white; padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; border-bottom: 1px solid rgba(255,255,255,0.1); }
        #chatHeader h3 { margin: 0; font-size: 15px; font-weight: 700; letter-spacing: 0.5px; }
        #chatHeader p { margin: 2px 0 0; font-size: 11px; opacity: 0.8; color: #4CAF50; font-weight: 600; display: flex; align-items: center; gap: 4px; }
        #chatHeader p::before { content: ''; width: 6px; height: 6px; background: #4CAF50; border-radius: 50%; display: inline-block; }
        
        .header-controls { display: flex; gap: 8px; }
        .icon-btn { background: rgba(255,255,255,0.1); border: none; color: white; cursor: pointer; padding: 8px; border-radius: 8px; display: flex; transition: background 0.2s; }
        .icon-btn:hover { background: rgba(255,255,255,0.25); }
        
        #chatMessages { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px; scroll-behavior: smooth; background: var(--chat-surface); }
        
        .message { display: flex; flex-direction: column; max-width: 85%; animation: slideIn 0.3s ease; }
        @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        .message.user { align-self: flex-end; align-items: flex-end; }
        .message.bot { align-self: flex-start; align-items: flex-start; }
        
        .message-bubble { padding: 12px 16px; border-radius: 12px; font-size: 14px; line-height: 1.5; word-wrap: break-word; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .message.user .message-bubble { background: var(--chat-user-bg); color: var(--chat-user-text); border-bottom-right-radius: 2px; }
        .message.bot .message-bubble { background: var(--chat-bot-bg); color: var(--chat-bot-text); border-bottom-left-radius: 2px; border: 1px solid var(--chat-border); }
        
        /* FIX FOR DARK MODE TEXT VISIBILITY */
        .message.bot .message-bubble strong, .message.bot .message-bubble b { color: inherit; font-weight: 700; }
        .message-bubble { color: inherit; } 

        .chat-products-scroll { display: flex; overflow-x: auto; gap: 12px; padding: 8px 0; scrollbar-width: thin; }
        .chat-product-card { min-width: 140px; max-width: 140px; background: var(--chat-bg); border: 1px solid var(--chat-border); border-radius: 12px; padding: 10px; display: flex; flex-direction: column; align-items: center; text-align: center; transition: transform 0.2s; }
        .chat-product-card img { width: 80px; height: 80px; object-fit: contain; margin-bottom: 8px; border-radius: 4px; }
        .chat-product-title { font-size: 11px; font-weight: 600; color: var(--chat-text); margin-bottom: 5px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; height: 28px; }
        .chat-product-price { font-size: 13px; font-weight: bold; color: var(--chat-accent); margin-bottom: 8px; }
        
        .chat-add-btn { background: var(--chat-accent); color: white; border: none; padding: 8px 12px; border-radius: 6px; font-size: 10px; font-weight: bold; cursor: pointer; width: 100%; transition: opacity 0.2s; }
        
        #chatControls { padding: 16px; background: var(--chat-bg); border-top: 1px solid var(--chat-border); display: flex; gap: 10px; align-items: center; flex-shrink: 0; }
        
        /* INPUT VISIBILITY FIX */
        #chatInput { flex: 1; padding: 12px 16px; background: var(--chat-surface); color: var(--chat-text); border: 1px solid var(--chat-border); border-radius: 24px; font-size: 14px; outline: none; transition: border-color 0.2s; }
        #chatInput:focus { border-color: var(--chat-accent); }
        #chatInput::placeholder { color: #888; opacity: 1; }
        
        #sendBtn { width: 40px; height: 40px; background: var(--chat-accent); border: none; border-radius: 50%; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: transform 0.2s; flex-shrink: 0; }
        #sendBtn:hover { transform: scale(1.05); }
        #sendBtn:disabled { background: #ccc; cursor: not-allowed; }

        .chat-action-btn { display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 12px; background: var(--chat-surface); border: 1px solid var(--chat-border); border-radius: 8px; color: var(--chat-text); font-weight: 600; font-size: 12px; cursor: pointer; transition: all 0.2s; margin-top: 4px; }
        .chat-action-btn:hover { background: var(--chat-border); border-color: var(--chat-accent); }
        .chat-action-btn.primary { background: #10b981; color: white; border: none; }
        .chat-action-btn.primary:hover { background: #059669; }

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
        bubble.setAttribute('aria-label', 'Abrir Chat');
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
                    <h3>Assistente Atomic</h3>
                    <p>Thiago está Online</p>
                </div>
                <div class="header-controls">
                    <button id="clearChatBtn" class="icon-btn" aria-label="Limpar Histórico" title="Reiniciar conversa">${CONFIG.ASSETS.ICON_TRASH}</button>
                    <button id="closeChatBtn" class="icon-btn" aria-label="Fechar Chat">${CONFIG.ASSETS.ICON_CLOSE}</button>
                </div>
            </div>
            <div id="chatMessages" role="log" aria-live="polite" aria-atomic="false"></div>
            <div id="chatControls">
                <input type="text" id="chatInput" placeholder="Digite sua mensagem..." autocomplete="off">
                <button id="sendBtn" aria-label="Enviar">${CONFIG.ASSETS.ICON_SEND}</button>
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
        clearBtn: document.getElementById('clearChatBtn'),
        sendBtn: document.getElementById('sendBtn')
    };

    let state = { isOpen: false, isDragging: false, startX: 0, startY: 0, initialLeft: 0, initialTop: 0 };
    let sessionId = safeStorage.getItem('chat_sess_id');
    let isSending = false;
    let lastMsgTime = 0;
    let msgHistory = [];

    // --- 3. BADGE LOGIC ---
    function showBadge(count) {
        const n = Math.max(0, Number(count || els.badge.textContent || 0));
        els.badge.textContent = n > 99 ? '99+' : String(n);
        if (n > 0) {
            els.badge.classList.add('show');
        } else {
            els.badge.classList.remove('show');
        }
    }

    function incrementBadge(by = 1) {
        const current = parseInt(els.badge.textContent || '0') || 0;
        showBadge(current + Math.max(0, by));
    }

    function clearBadge() { showBadge(0); }

    // --- 4. UI INTERACTIONS ---
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
        } else {
            els.bubble.style.transform = 'scale(1)';
            els.bubble.style.opacity = '1';
            els.bubble.style.pointerEvents = 'auto';
            els.input.blur();
            els.bubble.focus();
        }
    }

    els.bubble.addEventListener('click', () => { if(!state.isDragging) updateChatUI(true); });
    els.bubble.addEventListener('keydown', (e) => { if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); updateChatUI(true); } });
    els.closeBtn.addEventListener('click', () => updateChatUI(false));
    
    // --- FIXED TRASH CAN LOGIC ---
    els.clearBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if(confirm('Reiniciar a conversa e apagar histórico?')) {
            safeStorage.removeItem('atomic_chat_history');
            safeStorage.removeItem('chat_sess_id');
            sessionId = null;
            msgHistory = [];
            els.msgs.innerHTML = '';
            // Force reset badge
            showBadge(0);
            // Re-add welcome immediately
            addWelcomeMessage();
        }
    });

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

    // --- 6. UTILS & PARSING ---
    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function parseMarkdownSafe(text) {
        if (!text) return '';
        let safe = escapeHtml(text);
        return safe
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
            .replace(/\*(.*?)\*/g, '<i>$1</i>')
            .replace(/__(.*?)__/g, '<u>$1</u>');
    }

    function isSafeUrl(string) {
        try {
            const url = new URL(string, window.location.href);
            if (['mailto:', 'tel:', 'whatsapp:'].includes(url.protocol)) return true;
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (_) { return false; }
    }

    // --- 7. MESSAGE RENDERER ---
    function addMessage(role, content, prods = [], link = null, actions = [], save = true) {
        const div = document.createElement('div');
        div.className = `message ${role}`;
        
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.innerHTML = parseMarkdownSafe(content);
        
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
                btn.textContent = 'VER';
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
        div.innerHTML = `<div class="message-bubble"><div class="typing-indicator" style="display:flex;gap:4px;"><div style="width:6px;height:6px;background:#ccc;border-radius:50%;animation:typing 1.4s infinite ease-in-out both;animation-delay:-0.32s"></div><div style="width:6px;height:6px;background:#ccc;border-radius:50%;animation:typing 1.4s infinite ease-in-out both;animation-delay:-0.16s"></div><div style="width:6px;height:6px;background:#ccc;border-radius:50%;animation:typing 1.4s infinite ease-in-out both;"></div></div></div>`;
        els.msgs.appendChild(div);
        scrollToBottom();
        return id;
    }

    function removeTyping(id) { const el = document.getElementById(id); if (el) el.remove(); }
    
    // --- UPDATED WELCOME LOGIC ---
    function addWelcomeMessage() {
         setTimeout(() => {
            addMessage('bot', 'E aí! 👋 Sou o **Thiago**, especialista da Atomic Games.\nPosso te ajudar a montar um PC, escolher um console ou fazer um orçamento de manutenção?', [], null, [], true);
            // FIX: Ensure badge appears on welcome message if closed
            if(!state.isOpen) incrementBadge(1);
        }, 500);
    }

    // --- 8. CONTEXT AWARENESS ---
    function checkSiteContext(text) {
        const t = text.toLowerCase();
        const actions = [];
        if (t.includes('limpeza') || t.includes('manutenção') || t.includes('conserto') || t.includes('reparo')) {
            actions.push({ label: 'Abrir Simulador de Reparo', icon: 'ph-wrench', targetId: 'services' });
        }
        return actions;
    }

    // --- 9. API COMMUNICATION ---
    const RETRY_CONFIG = { maxRetries: 3, baseDelay: 1000 };
    const outgoingQueue = [];

    function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

    window.addEventListener('online', () => {
        if (outgoingQueue.length) flushQueue();
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

            if (!res.ok) throw new Error(`Server error: ${res.status}`);

            const data = await res.json();
            if (!data || (typeof data.reply === 'undefined' && !data.response)) throw new Error('Invalid response');

            const replyText = data.reply || data.response;
            const actions = (Array.isArray(data.actions) ? data.actions : []).concat(localActions);
            const products = data.produtos_sugeridos || [];

            if (data.session_id) {
                sessionId = data.session_id;
                safeStorage.setItem('chat_sess_id', sessionId);
            }

            addMessage('bot', replyText, products, data.action_link, actions, true);
            
            if (data.notify && !state.isOpen) incrementBadge(data.notify.unread || 1);
            else if (!state.isOpen) incrementBadge(1);

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
            addMessage('bot', 'Você está sem conexão. Mensagem enfileirada.', [], null, [], false);
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
                    const errorMsg = isAbort 
                        ? 'O servidor demorou muito para responder (Timeout). Tente novamente em instantes.' 
                        : 'Erro de conexão com o servidor. Verifique sua internet.';
                    addMessage('bot', errorMsg, [], null, [], false);
                    break;
                } else {
                    attempt++;
                    const backoff = RETRY_CONFIG.baseDelay * Math.pow(2, attempt - 1);
                    await wait(backoff);
                }
            }
        }
        isSending = false;
        els.sendBtn.disabled = false;
        if (!outgoingQueue.length) els.input.disabled = false;
        setTimeout(() => els.input.focus(), 100);
    }

    els.sendBtn.addEventListener('click', sendMessage);
    els.input.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendMessage(); });

    ['mousedown', 'mouseup', 'click', 'touchstart', 'touchend'].forEach(evt => {
        els.input.addEventListener(evt, (e) => { e.stopPropagation(); if (evt === 'mousedown') els.input.focus(); });
    });

    // --- 11. INITIALIZATION ---
    const savedHist = safeStorage.getItem('atomic_chat_history');
    if (savedHist) {
        try {
            msgHistory = JSON.parse(savedHist);
            msgHistory.forEach(m => addMessage(m.role, m.content, m.prods, m.link, m.actions, false));
        } catch(e) { safeStorage.removeItem('atomic_chat_history'); addWelcomeMessage(); }
    } else {
        addWelcomeMessage();
    }

    // --- 12. SERVER WARM-UP ---
    setTimeout(() => {
        const baseUrl = CONFIG.API_URL.replace('/chat', '');
        fetch(baseUrl, { method: 'HEAD', mode: 'no-cors' }).catch(() => {});
    }, 1500);

    // --- 13. GLOBAL HOOKS ---
    window.AtomicChat = {
        open: () => updateChatUI(true),
        close: () => updateChatUI(false)
    };

})();
