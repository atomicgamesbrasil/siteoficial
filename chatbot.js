// === CHATBOT 2.3 (DARK MODE & FIXED POSITION) ===
// Visual "Dark Gamer" corrigido e fixado na tela.

(function() {
    // 0. AUTO-INJECT HTML STRUCTURE
    function injectChatStructure() {
        if (document.getElementById('chat-container')) return; 

        const chatHTML = `
            <!-- CHAT BUBBLE -->
            <button class="chat-bubble" id="chat-bubble" aria-label="Abrir chat">
                <img src="https://raw.githubusercontent.com/atomicgamesbrasil/siteoficial/main/img%20site/thchatbot.jpg" alt="Chat" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">
                <span class="chat-bubble-badge" id="chat-badge" style="display: none;">1</span>
            </button>

            <!-- CHAT WINDOW -->
            <div class="chat-container" id="chat-container">
                <div class="chat-header">
                    <div class="chat-header-avatar">
                        <img src="https://raw.githubusercontent.com/atomicgamesbrasil/siteoficial/main/img%20site/thchatbot.jpg" alt="Avatar">
                    </div>
                    <div class="chat-header-info">
                        <div class="chat-header-name">Thiago - <span>Atomic Games</span></div>
                        <div class="chat-header-status">Online agora</div>
                    </div>
                    <button class="chat-header-close" id="chat-close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 18L18 6M6 6l12 12"/></svg></button>
                </div>

                <div class="chat-messages" id="chat-messages">
                    <!-- Mensagens entram aqui -->
                </div>

                <!-- (Quick Actions removidas conforme solicitado) -->

                <div class="chat-input-area">
                    <form class="chat-input-form" id="chat-form">
                        <input type="text" class="chat-input" id="chat-input" placeholder="Digite sua dúvida..." autocomplete="off">
                        <button type="submit" class="chat-send-btn" id="chat-send"><svg viewBox="0 0 24 24"><path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z"/></svg></button>
                    </form>
                    <p class="chat-footer-text">⚡ Powered by Google Gemini</p>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', chatHTML);
    }

    // 0.1 INJECT STYLES (DARK MODE & FIXED POSITION FIX)
    const style = document.createElement('style');
    style.innerHTML = `
        /* === ATOMIC CHAT STYLES (DARK MODE) === */
        .no-transition { transition: none !important; }
        .chat-open { overflow: hidden; }

        /* BUBBLE - FIXO NA TELA */
        .chat-bubble { 
            position: fixed !important; 
            bottom: 24px; 
            right: 24px; 
            width: 64px; 
            height: 64px; 
            border-radius: 50%; 
            background: #000; 
            border: 2px solid #FFD700; 
            cursor: pointer; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.5); 
            z-index: 2147483647; /* Máximo Z-Index */
            transition: transform 0.3s ease; 
            touch-action: none; 
            padding: 0;
            overflow: hidden;
        }
        .chat-bubble:hover { transform: scale(1.1); box-shadow: 0 0 15px rgba(255, 215, 0, 0.6); }
        .chat-bubble-badge { position: absolute; top: 0; right: 0; width: 20px; height: 20px; background: #22c55e; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: #fff; border: 2px solid #000; }

        /* CONTAINER - MODO ESCURO */
        .chat-container { 
            position: fixed !important; 
            bottom: 100px; 
            right: 24px; 
            width: 360px; 
            height: 500px; 
            max-height: 80vh;
            background: #111827; /* Fundo Escuro */
            border: 1px solid #374151;
            border-radius: 16px; 
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8); 
            display: flex; 
            flex-direction: column; 
            overflow: hidden; 
            z-index: 2147483647; 
            opacity: 0; 
            visibility: hidden; 
            transform: translateY(20px) scale(0.95); 
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); 
            font-family: 'Inter', sans-serif; 
        }
        .chat-container.open { opacity: 1; visibility: visible; transform: translateY(0) scale(1); }

        /* HEADER */
        .chat-header { 
            background: #000000; 
            padding: 16px; 
            display: flex; 
            align-items: center; 
            gap: 12px; 
            border-bottom: 2px solid #FFD700; /* Linha Dourada */
        }
        .chat-header-avatar { width: 40px; height: 40px; border-radius: 50%; overflow: hidden; border: 2px solid #FFD700; }
        .chat-header-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .chat-header-info { flex: 1; }
        .chat-header-name { color: #FFFFFF; font-weight: 700; font-size: 15px; }
        .chat-header-name span { color: #FFD700; }
        .chat-header-status { color: #22c55e; font-size: 11px; font-weight: 500; display: flex; align-items: center; gap: 4px; }
        .chat-header-status::before { content: ''; width: 6px; height: 6px; background: #22c55e; border-radius: 50%; }
        .chat-header-close { background: transparent; border: none; color: #9CA3AF; cursor: pointer; padding: 4px; }
        .chat-header-close:hover { color: #FFF; }
        .chat-header-close svg { width: 20px; height: 20px; }

        /* MESSAGES AREA */
        .chat-messages { 
            flex: 1; 
            overflow-y: auto; 
            padding: 20px; 
            background: #111827; /* Fundo Escuro */
            display: flex; 
            flex-direction: column; 
            gap: 16px; 
            scrollbar-width: thin;
            scrollbar-color: #374151 #111827;
        }
        
        /* MESSAGE BUBBLES */
        .message { display: flex; gap: 10px; animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        .message.user { flex-direction: row-reverse; }
        
        .message-avatar { 
            width: 28px; height: 28px; border-radius: 50%; 
            display: flex; align-items: center; justify-content: center; font-size: 12px; 
            flex-shrink: 0;
        }
        .message.bot .message-avatar { background: #FFD700; color: #000; font-weight: bold; }
        .message.user .message-avatar { background: #374151; color: #FFF; }

        .message-content { max-width: 80%; }
        
        .message-bubble { 
            padding: 10px 14px; 
            border-radius: 12px; 
            font-size: 13px; 
            line-height: 1.5; 
            color: #E5E7EB;
        }
        .message.bot .message-bubble { 
            background: #1F2937; /* Cinza Escuro */
            border: 1px solid #374151;
            border-top-left-radius: 2px;
        }
        .message.user .message-bubble { 
            background: linear-gradient(135deg, #FFD700 0%, #FF8C00 100%); /* Gold Gradient */
            color: #000;
            font-weight: 500;
            border-top-right-radius: 2px;
            box-shadow: 0 2px 10px rgba(255, 215, 0, 0.2);
        }

        /* PRODUCTS */
        .chat-product-card { 
            background: #1F2937; 
            border: 1px solid #374151; 
            border-radius: 8px; 
            padding: 8px; 
            margin-top: 8px; 
            display: flex; 
            align-items: center; 
            gap: 10px; 
            cursor: pointer; 
            transition: border-color 0.2s;
        }
        .chat-product-card:hover { border-color: #FFD700; }
        .chat-product-card img { width: 40px; height: 40px; border-radius: 4px; object-fit: cover; background: #000; }
        .product-info h4 { font-size: 12px; color: #FFF; margin: 0; }
        .product-price { font-size: 12px; font-weight: 700; color: #FFD700; }

        /* ACTION BUTTON (Link) */
        .action-button { 
            display: block; 
            text-align: center; 
            margin-top: 8px; 
            background: #22c55e; 
            color: #FFF; 
            padding: 8px; 
            border-radius: 6px; 
            text-decoration: none; 
            font-size: 12px; 
            font-weight: bold; 
        }
        .action-button:hover { background: #16a34a; }

        /* FOOTER / INPUT */
        .chat-input-area { 
            padding: 12px 16px; 
            background: #000000; 
            border-top: 1px solid #374151; 
        }
        .chat-input-form { display: flex; gap: 8px; align-items: center; }
        .chat-input { 
            flex: 1; 
            padding: 10px 14px; 
            background: #1F2937; 
            border: 1px solid #374151; 
            border-radius: 20px; 
            font-size: 13px; 
            color: #FFF; 
            outline: none; 
        }
        .chat-input:focus { border-color: #FFD700; }
        .chat-send-btn { 
            width: 40px; height: 40px; 
            border-radius: 50%; 
            background: #FFD700; 
            border: none; 
            cursor: pointer; 
            display: flex; align-items: center; justify-content: center; 
            transition: transform 0.2s;
        }
        .chat-send-btn:hover { transform: scale(1.1); }
        .chat-send-btn svg { width: 18px; height: 18px; fill: #000; }
        .chat-footer-text { text-align: center; font-size: 10px; color: #4B5563; margin-top: 8px; }

        /* TYPING */
        .typing-dots span { display: inline-block; width: 4px; height: 4px; background: #9CA3AF; border-radius: 50%; margin: 0 2px; animation: bounce 1.4s infinite both; }
        .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
        .typing-dots span:nth-child(2) { animation-delay: -0.16s; }
        @keyframes bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }

        /* MOBILE OVERRIDES */
        @media (max-width: 480px) {
            .chat-container { bottom: 0; right: 0; left: 0; width: 100%; height: 100%; max-height: none; border-radius: 0; }
        }
    `;
    document.head.appendChild(style);

    // Call Injection
    injectChatStructure();

    // 1. ROBUST ELEMENT MAPPING
    const getEl = (id) => document.getElementById(id);

    const els = { 
        bubble: getEl('chat-bubble'), 
        win: getEl('chat-container'), 
        msgs: getEl('chat-messages'), 
        input: getEl('chat-input'),
        badge: getEl('chat-badge'),
        form: getEl('chat-form'),
        closeBtn: getEl('chat-close'),
        sendBtn: getEl('chat-send')
    };

    // 2. STATE & VARS
    let state = { isOpen: false, isDragging: false, startX: 0, startY: 0, initialLeft: 0, initialTop: 0 };
    let sessionId = localStorage.getItem('chat_sess_id') || 'sess-' + Date.now();
    let msgHistory = []; 

    // 3. UI LOGIC
    function updateChatUI(open) {
        state.isOpen = open;
        els.win.classList.toggle('open', open);
        els.bubble.classList.toggle('open', open);
        
        if(els.badge) els.badge.style.display = open ? 'none' : 'flex';
        document.body.classList.toggle('chat-open', open);
        
        if (open) {
            // Mobile adjust
            if(window.innerWidth <= 480) {
                const rect = els.bubble.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                els.win.style.transformOrigin = `${centerX}px ${centerY}px`;
            }

            // Hide bubble visually but keep it in DOM
            els.bubble.style.transform = 'scale(0)'; 
            els.bubble.style.pointerEvents = 'none';
            
            if(window.innerWidth > 768 && els.input) setTimeout(() => els.input.focus(), 350);
            scrollToBottom();
        } else {
            els.bubble.style.transform = 'scale(1)';
            els.bubble.style.pointerEvents = 'auto';
            if(els.input) els.input.blur();
        }
    }

    // 4. HISTORY API
    function openChat() {
        if(state.isOpen) return;
        history.pushState({chat: true}, '', '#chat'); 
        updateChatUI(true);
    }

    function closeChat() {
        if(!state.isOpen) return;
        if(history.state && history.state.chat) history.back(); 
        else updateChatUI(false);
    }

    window.addEventListener('popstate', (e) => {
        updateChatUI(!!(e.state && e.state.chat));
    });

    function scrollToBottom() { if(els.msgs) els.msgs.scrollTop = els.msgs.scrollHeight; }

    // 5. DRAG PHYSICS (Simpler for Stability)
    // Removed complex drag to ensure position fixed stability
    els.bubble.addEventListener('click', (e) => { 
        if(state.isOpen) closeChat(); else openChat(); 
    });

    if(els.closeBtn) els.closeBtn.onclick = (e) => { e.stopPropagation(); closeChat(); };

    // 6. MESSAGING SYSTEM
    function parseText(text) {
        if(!text) return document.createTextNode("");
        const div = document.createElement('div');
        div.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
        return div;
    }

    function addMsg(role, content, prods, link, actions = [], save = true) {
        const div = document.createElement('div'); div.className = `message ${role}`;
        
        const avatar = document.createElement('div'); 
        avatar.className = 'message-avatar';
        avatar.innerHTML = role === 'bot' ? 'T' : '<i class="ph-fill ph-user"></i>';
        if(role === 'user') avatar.textContent = 'VC';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';

        const bubble = document.createElement('div'); bubble.className = 'message-bubble';
        
        if(content) bubble.appendChild(parseText(content));
        
        // Products
        if(prods?.length) {
            prods.forEach(p => {
                const card = document.createElement('div'); card.className = 'chat-product-card';
                card.innerHTML = `
                    <img src="${p.image || 'https://placehold.co/100/000/fff'}" loading="lazy">
                    <div class="product-info">
                        <h4>${p.name || p.nome}</h4>
                        <span class="product-price">${p.price || p.preco}</span>
                    </div>`;
                
                card.onclick = (e) => {
                    e.stopPropagation();
                    window.open(`https://wa.me/5521995969378?text=Interesse em: ${p.name}`);
                };
                bubble.appendChild(card);
            });
        }

        // Link
        if(link) {
           const btn = document.createElement('a'); btn.href=link; btn.target='_blank';
           btn.className = 'action-button';
           btn.innerHTML = 'NEGOCIAR NO WHATSAPP <i class="fab fa-whatsapp"></i>'; 
           bubble.appendChild(btn);
        }

        // Local Actions (Scroll)
        if (actions && actions.length > 0) {
             // Optional: Render small chips if needed, but keeping it clean for now as requested.
        }

        contentDiv.appendChild(bubble);
        div.appendChild(avatar);
        div.appendChild(contentDiv);
        els.msgs.appendChild(div); 
        scrollToBottom();

        if (save) {
            msgHistory.push({ role, content, prods, link, actions });
            localStorage.setItem('atomic_chat_history_v2', JSON.stringify(msgHistory));
        }
    }

    function addTyping() {
        const div = document.createElement('div'); div.id='typing'; div.className='typing-indicator';
        div.style.padding = '0 20px';
        div.innerHTML = `<div class="typing-dots"><span></span><span></span><span></span></div>`;
        els.msgs.appendChild(div); scrollToBottom();
    }

    // 7. CONTEXT BRAIN
    async function send() {
        if(!els.input) return;
        const txt = els.input.value.trim();
        if(!txt) return;
        
        els.input.value = ''; 
        addMsg('user', txt); 
        addTyping();
        
        const localActions = [];

        try {
            let data;
            
            // Connect to AtomicBrain (index.tsx)
            if (window.AtomicBrain && typeof window.AtomicBrain.ask === 'function') {
                data = await window.AtomicBrain.ask(txt, sessionId);
            } else {
                console.warn("Brain loading...");
                // Retry once quickly
                await new Promise(r => setTimeout(r, 500));
                if (window.AtomicBrain) data = await window.AtomicBrain.ask(txt, sessionId);
                else throw new Error("Brain disconnected");
            }
            
            const typing = document.getElementById('typing');
            if(typing) typing.remove();
            
            if(data.success) {
                if(data.session_id) { sessionId = data.session_id; localStorage.setItem('chat_sess_id', sessionId); }
                
                const aiActions = data.local_actions || [];
                const combinedActions = [...localActions, ...aiActions];

                // Execute Local Actions (Scroll)
                if(combinedActions.length > 0) {
                    combinedActions.forEach(act => {
                        if(act.targetId) {
                            const target = document.getElementById(act.targetId);
                            if(target) target.scrollIntoView({ behavior: 'smooth' });
                        }
                    });
                }

                addMsg('bot', data.response, data.produtos_sugeridos, data.action_link, combinedActions);
            } else {
                addMsg('bot', 'Desculpe, tive um erro técnico.', [], null, localActions);
            }
        } catch (e) { 
            console.error(e);
            const typing = document.getElementById('typing');
            if(typing) typing.remove();
            addMsg('bot', 'Estou conectando aos servidores... Tente novamente em alguns segundos.', [], null, localActions); 
        }
    }

    // 8. EVENT LISTENERS
    if(els.sendBtn) els.sendBtn.onclick = (e) => { e.preventDefault(); send(); };
    if(els.form) els.form.addEventListener('submit', (e) => { e.preventDefault(); send(); });
    
    // 9. INIT
    try {
        const savedHist = localStorage.getItem('atomic_chat_history_v2');
        if (savedHist) {
            msgHistory = JSON.parse(savedHist);
            msgHistory.forEach(m => addMsg(m.role, m.content, m.prods, m.link, m.actions, false));
        } else {
            setTimeout(() => addMsg('bot', 'Fala Gamer! 🎮\nSou o Thiago. Posso ajudar com Orçamentos, PCs ou Consoles?'), 1000);
        }
    } catch(e) {}

    console.log("Atomic Chat: Dark Mode & Fixed Position Active.");
})();