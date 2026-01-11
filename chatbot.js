
// === CHATBOT 2.4 (RESILIENT: QUEUE & RETRY) ===
(function() {
    const CONFIG = {
        API_URL: 'https://atomic-thiago-backend.onrender.com/chat',
        TIMEOUT_MS: 40000, // Increased to 40s to handle Render cold starts
        MAX_RETRIES: 3,
        RETRY_DELAY_BASE: 1000,
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
        :root { --chat-primary: #007bff; --chat-bg: #ffffff; --chat-text: #333; --chat-user-bg: #007bff; --chat-user-text: #fff; }
        #chatBubble { position: fixed; bottom: 20px; right: 20px; width: 60px; height: 60px; background: var(--chat-primary); border-radius: 50%; box-shadow: 0 4px 15px rgba(0,0,0,0.2); cursor: pointer; z-index: 9999; display: flex; align-items: center; justify-content: center; transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s; }
        #chatBubble:hover { transform: scale(1.1); }
        #chatBubble.snapping { transition: left 0.3s ease, top 0.3s ease; }
        #chatBubble:focus { outline: 3px solid rgba(0,123,255,0.5); outline-offset: 2px; }

        #chatBadge { position: absolute; top: -5px; right: -5px; background: #ff4444; color: white; font-size: 12px; font-weight: bold; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; display: none; }
        
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
        
        #chatControls { padding: 15px; background: white; border-top: 1px solid #eee; display: flex; gap: 10px; align-items: center; flex-shrink: 0; }
        #chatInput { flex: 1; padding: 12px 16px; border: 1px solid #ddd; border-radius: 24px; font-size: 14px; outline: none; transition: border-color 0.2s; }
        #chatInput:focus { border-color: var(--chat-primary); }
        #chatInput:disabled { background: #f0f0f0; cursor: not-allowed; }
        #sendBtn { width: 40px; height: 40px; background: var(--chat-primary); border: none; border-radius: 50%; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: transform 0.2s; flex-shrink: 0; }
        #sendBtn:hover { transform: scale(1.05); }
        #sendBtn:disabled { background: #ccc; cursor: not-allowed; transform: none; }
        #sendBtn:focus { outline: 2px solid var(--chat-primary); outline-offset: 2px; }
        
        .message-actions { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; width: 100%; }

        /* Action Buttons */
        .chat-action-btn { display: block; width: 100%; padding: 10px; background: #f1f3f5; border: none; border-radius: 8px; color: #333; font-weight: 600; font-size: 12px; cursor: pointer; text-align: center; transition: background 0.2s; text-decoration: none; font-family: inherit; }
        .chat-action-btn:hover { background: #e9ecef; }
        .chat-action-btn.primary { background: #10b981; color: white; }
        .chat-action-btn.primary:hover { background: #059669; }
        .chat-action-btn:focus { outline: 2px solid var(--chat-primary); outline-offset: 1px; }

        /* Typing Indicator */
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

    // --- 2. INJECT DOM (Accessible) ---
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
    
    // Message Queue System
    let messageQueue = [];
    let isProcessingQueue = false;

    // --- 3. UI LOGIC & ACCESSIBILITY ---
    function scrollToBottom() { els.msgs.scrollTop = els.msgs.scrollHeight; }

    function updateChatUI(open) {
        state.isOpen = open;
        els.win.classList.toggle('open', open);
        els.badge.style.display = 'none';
        els.bubble.setAttribute('aria-expanded', String(open));
        
        if (open) {
            els.bubble.style.transform = 'scale(0)';
            els.bubble.style.opacity = '0';
            els.bubble.style.pointerEvents = 'none';
            // A11y Focus Management
            if (window.innerWidth > 768) {
                setTimeout(() => els.input.focus(), 300);
            }
            scrollToBottom();
        } else {
            els.bubble.style.transform = 'scale(1)';
            els.bubble.style.opacity = '1';
            els.bubble.style.pointerEvents = 'auto';
            els.input.blur();
            els.bubble.focus(); // Return focus to trigger
        }
    }

    els.bubble.addEventListener('click', () => { if(!state.isDragging) updateChatUI(true); });
    els.bubble.addEventListener('keydown', (e) => { 
        if(e.key === 'Enter' || e.key === ' ') { 
            e.preventDefault(); 
            updateChatUI(true); 
        } 
    });
    
    els.closeBtn.addEventListener('click', () => updateChatUI(false));

    // --- 4. DRAG PHYSICS ---
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

    // --- 5. SECURITY & PARSING ---

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function parseMarkdownSafe(text) {
        if (!text) return '';
        let safe = escapeHtml(text);
        safe = safe
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
            .replace(/\*(.*?)\*/g, '<i>$1</i>');
        return safe;
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
        } catch (_) { 
            return false; 
        }
    }

    // --- 6. MESSAGE RENDERER ---

    function addMessage(role, content, actions = []) {
        const div = document.createElement('div');
        div.className = `message ${role}`;
        
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.innerHTML = parseMarkdownSafe(content);
        div.appendChild(bubble);
        
        if (actions && Array.isArray(actions) && actions.length > 0) {
            const actionsContainer = document.createElement('div');
            actionsContainer.className = 'message-actions';
            
            actions.forEach(action => {
                if (!action.label) return;

                const isHandoff = action.type === 'human_handoff';
                const className = isHandoff ? 'chat-action-btn primary' : 'chat-action-btn';

                if (action.url && isSafeUrl(action.url)) {
                    const a = document.createElement('a');
                    a.className = className;
                    a.href = action.url;
                    a.target = '_blank';
                    a.rel = 'noopener noreferrer';
                    a.textContent = action.label;
                    actionsContainer.appendChild(a);
                } else {
                    const btn = document.createElement('button');
                    btn.className = className;
                    btn.textContent = action.label;
                    btn.onclick = () => {
                        const event = new CustomEvent('atomic_chat_action', { detail: { action } });
                        window.dispatchEvent(event);
                    };
                    actionsContainer.appendChild(btn);
                }
            });
            div.appendChild(actionsContainer);
        }

        els.msgs.appendChild(div);
        scrollToBottom();
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

    function removeTyping(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    // --- 7. QUEUE & NETWORK LOGIC ---

    async function fetchWithRetry(url, options, retries = CONFIG.MAX_RETRIES, backoff = CONFIG.RETRY_DELAY_BASE) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS);
            
            const res = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(timeoutId);
            
            if (!res.ok) {
                // Do not retry 4xx errors (client faults), only 5xx or network
                if (res.status >= 400 && res.status < 500) throw new Error(`Client Error: ${res.status}`);
                throw new Error(`Server Error: ${res.status}`);
            }
            return res;
        } catch (err) {
            if (retries <= 0 || err.name === 'AbortError') throw err; // Don't retry aborts (timeouts) indefinitely
            
            // Dispatch Retry Event
            window.dispatchEvent(new CustomEvent('atomic_chat_retry', { detail: { attemptsLeft: retries - 1, error: err.message } }));
            
            await new Promise(resolve => setTimeout(resolve, backoff));
            return fetchWithRetry(url, options, retries - 1, backoff * 2);
        }
    }

    async function processQueue() {
        if (isProcessingQueue || messageQueue.length === 0) return;
        
        // Check internet connection
        if (!navigator.onLine) {
            window.addEventListener('online', processQueue, { once: true });
            return;
        }

        isProcessingQueue = true;
        els.sendBtn.disabled = true;
        els.input.disabled = true;
        const typingId = addTyping();

        try {
            const currentMsg = messageQueue[0]; // Peek
            const payload = {
                message: currentMsg,
                session_id: sessionId,
                origin: 'embedded-chatbot',
                channel: 'website'
            };

            const res = await fetchWithRetry(CONFIG.API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'omit'
            });

            const data = await res.json();
            
            // Success: Remove from queue
            messageQueue.shift();
            removeTyping(typingId);

            if (!data || typeof data.reply === 'undefined') throw new Error('Invalid response schema');

            if (data.session_id) {
                sessionId = data.session_id;
                safeStorage.setItem('chat_sess_id', sessionId);
            }

            addMessage('bot', data.reply, data.actions);

            if (data.escalate) {
                els.input.placeholder = "Atendimento humano solicitado...";
                window.dispatchEvent(new CustomEvent('atomic_chat_escalate', { detail: data }));
            } else {
                els.input.disabled = false;
                setTimeout(() => els.input.focus(), 100);
            }

        } catch (e) {
            removeTyping(typingId);
            console.error(e);
            
            // Failure logic: Drop message from queue to avoid stuck loop, but notify user.
            messageQueue.shift();
            
            let errorMsg = 'Desculpe, tive um problema de conexão.';
            if (e.name === 'AbortError') errorMsg = 'O servidor demorou muito. Verifique sua conexão.';
            
            addMessage('bot', errorMsg);
            window.dispatchEvent(new CustomEvent('atomic_chat_error', { detail: { error: e.message } }));
            
            els.input.disabled = false;
        } finally {
            isProcessingQueue = false;
            // If there are more messages, keep processing
            if (messageQueue.length > 0) {
                processQueue();
            } else {
                els.sendBtn.disabled = false;
            }
        }
    }

    // Listen for network recovery
    window.addEventListener('online', processQueue);

    function enqueueMessage() {
        const txt = els.input.value.trim();
        if (!txt) return;

        // G - Sensitive Data Warning
        const sensitiveKeywords = ['senha', 'password', 'cvv', 'cartão de crédito', 'cartao de credito', 'cpf'];
        if (sensitiveKeywords.some(k => txt.toLowerCase().includes(k))) {
            addMessage('bot', '⚠️ Por motivos de segurança, não compartilhe senhas ou dados financeiros por aqui.');
            return;
        }

        els.input.value = '';
        addMessage('user', txt);

        // Add to queue
        messageQueue.push(txt);
        
        // Dispatch Queue Event
        window.dispatchEvent(new CustomEvent('atomic_chat_queue', { detail: { queueLength: messageQueue.length } }));

        // Trigger processing
        processQueue();
    }

    els.sendBtn.addEventListener('click', enqueueMessage);
    els.input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') enqueueMessage();
    });

    // Initial Welcome
    if (!els.msgs.hasChildNodes()) {
         addMessage('bot', 'Olá! Como posso ajudar você hoje?');
    }

})();
