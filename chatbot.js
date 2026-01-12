
// === CHATBOT PRODUCTION CLIENT (ATOMIC GAMES) ===
// Version: 3.1 (Fix: Visibility & Corrupt History Auto-Clean)
(function() {
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

    // --- 2. ESTILOS INJETADOS (FORÇANDO VISIBILIDADE) ---
    const style = document.createElement('style');
    style.innerHTML = `
        :root {
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
            --chat-input-bg: #ffffff;
            --chat-input-text: #333333;
        }

        @media (prefers-color-scheme: dark) {
            :root {
                --chat-primary: #000000;
                --chat-bg: #1a1a1a;
                --chat-surface: #252525;
                --chat-text: #ffffff;
                --chat-bot-bg: #333333;
                --chat-bot-text: #ffffff;
                --chat-border: #444444;
                --chat-input-bg: #2d2d2d;
                --chat-input-text: #ffffff;
            }
        }
        
        body.dark-mode {
             --chat-primary: #000000;
             --chat-bg: #1a1a1a;
             --chat-surface: #252525;
             --chat-text: #ffffff;
             --chat-bot-bg: #333333;
             --chat-bot-text: #ffffff;
             --chat-border: #444444;
             --chat-input-bg: #2d2d2d;
             --chat-input-text: #ffffff;
        }

        #chatBubble { position: fixed; bottom: 20px; right: 20px; width: 60px; height: 60px; background: var(--chat-primary); border-radius: 50%; box-shadow: 0 4px 20px rgba(0,0,0,0.3); cursor: pointer; z-index: 2147483647; display: flex; align-items: center; justify-content: center; transition: transform 0.3s; border: 2px solid rgba(255,255,255,0.1); }
        #chatBubble:hover { transform: scale(1.1); }
        
        #chatBadge { position: absolute; top: 0; right: 0; background: var(--chat-badge-bg); color: white; font-size: 11px; font-weight: bold; min-width: 20px; height: 20px; padding: 0 6px; border-radius: 10px; display: none; align-items: center; justify-content: center; border: 2px solid var(--chat-primary); box-sizing: border-box; }
        #chatBadge.show { display: flex; }
        
        #chatWindow { position: fixed; bottom: 90px; right: 20px; width: 380px; height: 600px; max-height: 80vh; background: var(--chat-bg); border-radius: 16px; box-shadow: 0 12px 48px rgba(0,0,0,0.25); z-index: 2147483647; display: flex; flexDirection: column; overflow: hidden; transform-origin: bottom right; transform: scale(0); opacity: 0; pointer-events: none; transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s; font-family: 'Inter', system-ui, sans-serif; border: 1px solid var(--chat-border); }
        #chatWindow.open { transform: scale(1); opacity: 1; pointer-events: all; }
        
        #chatHeader { background: var(--chat-primary); color: white; padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; border-bottom: 1px solid rgba(255,255,255,0.1); }
        #chatHeader h3 { margin: 0; font-size: 15px; font-weight: 700; color: white !important; }
        #chatHeader p { margin: 2px 0 0; font-size: 11px; opacity: 0.8; color: #4CAF50 !important; font-weight: 600; display: flex; align-items: center; gap: 4px; }
        
        .header-controls { display: flex; gap: 8px; }
        .icon-btn { background: rgba(255,255,255,0.1); border: none; color: white; cursor: pointer; padding: 8px; border-radius: 8px; display: flex; }
        
        #chatMessages { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px; scroll-behavior: smooth; background: var(--chat-surface); }
        
        .message { display: flex; flex-direction: column; max-width: 85%; }
        .message.user { align-self: flex-end; align-items: flex-end; }
        .message.bot { align-self: flex-start; align-items: flex-start; }
        
        .message-bubble { padding: 12px 16px; border-radius: 12px; font-size: 14px; line-height: 1.5; word-wrap: break-word; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        
        /* CORES FORÇADAS (!important) para corrigir invisibilidade */
        .message.user .message-bubble { background: var(--chat-user-bg) !important; color: var(--chat-user-text) !important; border-bottom-right-radius: 2px; }
        .message.bot .message-bubble { background: var(--chat-bot-bg) !important; color: var(--chat-bot-text) !important; border-bottom-left-radius: 2px; border: 1px solid var(--chat-border); }
        
        .message-bubble * { color: inherit !important; } 

        /* Product Cards */
        .chat-products-scroll { display: flex; overflow-x: auto; gap: 12px; padding: 8px 0; scrollbar-width: thin; }
        .chat-product-card { min-width: 140px; max-width: 140px; background: var(--chat-bg); border: 1px solid var(--chat-border); border-radius: 12px; padding: 10px; display: flex; flex-direction: column; align-items: center; text-align: center; }
        .chat-product-title { font-size: 11px; font-weight: 600; color: var(--chat-text) !important; margin-bottom: 5px; height: 28px; overflow: hidden; }
        .chat-product-price { font-size: 13px; font-weight: bold; color: var(--chat-accent) !important; margin-bottom: 8px; }
        .chat-add-btn { background: var(--chat-accent); color: white !important; border: none; padding: 8px 12px; border-radius: 6px; font-size: 10px; font-weight: bold; cursor: pointer; width: 100%; }
        
        #chatControls { padding: 16px; background: var(--chat-bg); border-top: 1px solid var(--chat-border); display: flex; gap: 10px; align-items: center; flex-shrink: 0; }
        
        #chatInput { flex: 1; padding: 12px 16px; background: var(--chat-input-bg) !important; color: var(--chat-input-text) !important; border: 1px solid var(--chat-border); border-radius: 24px; font-size: 14px; outline: none; }
        #chatInput::placeholder { color: #888 !important; opacity: 1; }
        
        #sendBtn { width: 40px; height: 40px; background: var(--chat-accent); border: none; border-radius: 50%; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        #sendBtn:disabled { background: #ccc; }

        .chat-action-btn { display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 12px; background: var(--chat-surface); border: 1px solid var(--chat-border); border-radius: 8px; color: var(--chat-text) !important; font-weight: 600; font-size: 12px; cursor: pointer; margin-top: 4px; }
        .chat-action-btn.primary { background: #10b981; color: white !important; border: none; }

        @media (max-width: 480px) {
            #chatWindow { width: 100%; height: 100%; max-height: 100%; bottom: 0; right: 0; border-radius: 0; }
        }
    `;
    document.head.appendChild(style);

    // --- 3. DOM INJECTION ---
    if (!document.getElementById('chatBubble')) {
        const bubble = document.createElement('div');
        bubble.id = 'chatBubble';
        bubble.setAttribute('role', 'button');
        bubble.innerHTML = `${CONFIG.ASSETS.ICON_BUBBLE}<div id="chatBadge">0</div>`;
        document.body.appendChild(bubble);

        const win = document.createElement('div');
        win.id = 'chatWindow';
        win.setAttribute('role', 'dialog');
        win.innerHTML = `
            <div id="chatHeader">
                <div><h3>Assistente Atomic</h3><p>Thiago está Online</p></div>
                <div class="header-controls">
                    <button id="clearChatBtn" class="icon-btn" title="Reiniciar">${CONFIG.ASSETS.ICON_TRASH}</button>
                    <button id="closeChatBtn" class="icon-btn">${CONFIG.ASSETS.ICON_CLOSE}</button>
                </div>
            </div>
            <div id="chatMessages"></div>
            <div id="chatControls">
                <input type="text" id="chatInput" placeholder="Digite sua mensagem..." autocomplete="off">
                <button id="sendBtn">${CONFIG.ASSETS.ICON_SEND}</button>
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
    let msgHistory = [];

    // --- 4. CORE FUNCTIONS ---
    function scrollToBottom() { els.msgs.scrollTop = els.msgs.scrollHeight; }

    function updateChatUI(open) {
        state.isOpen = open;
        els.win.classList.toggle('open', open);
        if (open) {
            els.badge.style.display = 'none'; // Clear badge
            els.bubble.style.transform = 'scale(0)';
            els.bubble.style.pointerEvents = 'none';
            if (window.innerWidth > 768) setTimeout(() => els.input.focus(), 300);
            scrollToBottom();
        } else {
            els.bubble.style.transform = 'scale(1)';
            els.bubble.style.pointerEvents = 'auto';
            els.input.blur();
        }
    }

    // --- 5. HISTORY & CLEANUP ---
    els.clearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if(confirm('Limpar histórico e reiniciar conversa?')) {
            fullReset();
        }
    });

    function fullReset() {
        safeStorage.removeItem('atomic_chat_history');
        safeStorage.removeItem('chat_sess_id');
        sessionId = null;
        msgHistory = [];
        els.msgs.innerHTML = '';
        els.badge.textContent = '0';
        els.badge.style.display = 'none';
        addWelcomeMessage();
    }

    // --- 6. DRAG LOGIC ---
    const updatePos = (x, y) => { els.bubble.style.left = `${x}px`; els.bubble.style.top = `${y}px`; els.bubble.style.bottom = 'auto'; els.bubble.style.right = 'auto'; };
    els.bubble.addEventListener('touchstart', (e) => {
        state.startX = e.touches[0].clientX; state.startY = e.touches[0].clientY;
        const rect = els.bubble.getBoundingClientRect();
        state.initialLeft = rect.left; state.initialTop = rect.top;
        state.isDragging = false;
    }, { passive: true });
    els.bubble.addEventListener('touchmove', (e) => {
        const dx = e.touches[0].clientX - state.startX;
        const dy = e.touches[0].clientY - state.startY;
        if (Math.sqrt(dx*dx + dy*dy) > 10) state.isDragging = true;
        if (state.isDragging) { e.preventDefault(); updatePos(state.initialLeft + dx, state.initialTop + dy); }
    }, { passive: false });
    els.bubble.addEventListener('touchend', () => {
        if (!state.isDragging) updateChatUI(true);
        else { els.bubble.style.transform = 'scale(1)'; updatePos(window.innerWidth - 80, window.innerHeight - 100); }
        state.isDragging = false;
    });
    els.bubble.addEventListener('click', () => { if(!state.isDragging) updateChatUI(true); });
    els.closeBtn.addEventListener('click', () => updateChatUI(false));

    // --- 7. RENDERING ---
    function parseMarkdownSafe(text) {
        if (!text) return '';
        let safe = String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;');
        return safe.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    }

    function addMessage(role, content, prods = [], link = null, actions = [], save = true) {
        if (!content && (!prods || prods.length === 0)) return; // Prevent empty bubbles

        const div = document.createElement('div');
        div.className = `message ${role}`;
        
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.innerHTML = parseMarkdownSafe(content);
        
        if(prods && prods.length > 0) {
            const scroll = document.createElement('div'); scroll.className = 'chat-products-scroll';
            prods.forEach(p => {
                const card = document.createElement('div'); card.className = 'chat-product-card';
                const img = document.createElement('img'); img.src = p.image || 'https://placehold.co/100';
                const title = document.createElement('div'); title.className = 'chat-product-title'; title.textContent = p.name || p.nome;
                const price = document.createElement('div'); price.className = 'chat-product-price'; price.textContent = p.price || p.preco;
                const btn = document.createElement('button'); btn.className = 'chat-add-btn'; btn.textContent = 'VER';
                btn.onclick = () => window.open(`https://wa.me/5521995969378?text=Interesse em: ${encodeURIComponent(p.name||p.nome)}`);
                card.append(img, title, price, btn);
                scroll.appendChild(card);
            });
            bubble.appendChild(scroll);
        }

        if (actions && actions.length > 0) {
            const actionsContainer = document.createElement('div'); actionsContainer.className = 'message-actions';
            actions.forEach(action => {
                const actBtn = document.createElement('button');
                actBtn.className = action.type === 'human_handoff' ? 'chat-action-btn primary' : 'chat-action-btn';
                actBtn.textContent = action.label;
                if (action.url) actBtn.onclick = () => window.open(action.url, '_blank');
                actionsContainer.appendChild(actBtn);
            });
            div.appendChild(actionsContainer);
        }

        div.appendChild(bubble); els.msgs.appendChild(div); scrollToBottom();
        if (save) {
            msgHistory.push({ role, content, prods, link, actions });
            if (msgHistory.length > 50) msgHistory.shift(); // Limit history size
            safeStorage.setItem('atomic_chat_history', JSON.stringify(msgHistory));
        }
    }

    function addWelcomeMessage() {
         setTimeout(() => {
            addMessage('bot', 'E aí! 👋 Sou o **Thiago**, especialista da Atomic Games.\nPosso te ajudar a montar um PC, escolher um console ou fazer um orçamento de manutenção?', [], null, [], true);
            if(!state.isOpen) {
                els.badge.textContent = '1';
                els.badge.style.display = 'flex';
            }
        }, 500);
    }

    // --- 8. SEND LOGIC ---
    async function sendMessage() {
        if (isSending) return;
        const txt = els.input.value.trim();
        if (!txt) return;

        els.input.value = '';
        addMessage('user', txt, [], null, [], true);
        isSending = true;
        els.sendBtn.disabled = true;

        // Typing effect
        const typingId = 'typing-' + Date.now();
        const typingDiv = document.createElement('div'); typingDiv.id = typingId; typingDiv.className = 'message bot';
        typingDiv.innerHTML = '<div class="message-bubble">...</div>';
        els.msgs.appendChild(typingDiv); scrollToBottom();

        try {
            const res = await fetch(CONFIG.API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: txt, session_id: sessionId, origin: 'embedded-chatbot' })
            });
            const data = await res.json();
            document.getElementById(typingId)?.remove();
            
            if (data.session_id) { sessionId = data.session_id; safeStorage.setItem('chat_sess_id', sessionId); }
            addMessage('bot', data.reply || data.response, data.produtos_sugeridos, null, data.actions, true);

        } catch (e) {
            document.getElementById(typingId)?.remove();
            addMessage('bot', 'Erro de conexão. Verifique sua internet.', [], null, [], false);
        }
        isSending = false;
        els.sendBtn.disabled = false;
        els.input.focus();
    }

    els.sendBtn.addEventListener('click', sendMessage);
    els.input.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendMessage(); });

    // --- 9. INIT & RECOVERY ---
    try {
        const savedHist = safeStorage.getItem('atomic_chat_history');
        if (savedHist) {
            const parsed = JSON.parse(savedHist);
            // Validation: Check if it's a valid array and has content
            if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].content) {
                msgHistory = parsed;
                msgHistory.forEach(m => addMessage(m.role, m.content, m.prods, m.link, m.actions, false));
            } else {
                throw new Error("Corrupt history");
            }
        } else {
            addWelcomeMessage();
        }
    } catch(e) {
        // Auto-recover from corrupt history (Fixes empty chat issue)
        fullReset();
    }

    // Ping server
    setTimeout(() => { fetch(CONFIG.API_URL.replace('/chat', ''), { method: 'HEAD', mode: 'no-cors' }).catch(() => {}); }, 1500);

    window.AtomicChat = { open: () => updateChatUI(true), close: () => updateChatUI(false) };

})();
