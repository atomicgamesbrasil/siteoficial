// === CHATBOT 2.5 (HYBRID: v2.1 LOGIC + DARK MODE + ATOMIC BRAIN) ===
(function() {
    
    // 1. INJECT HTML STRUCTURE (Matches v2.1 IDs)
    function injectChatStructure() {
        if (document.getElementById('atomic-chat-widget')) return;

        const html = `
        <div id="atomic-chat-widget">
            <div id="chatBubble" class="chat-bubble" role="button" aria-label="Abrir Chat">
                <img src="https://raw.githubusercontent.com/atomicgamesbrasil/siteoficial/main/img%20site/thchatbot.jpg" alt="Chat" draggable="false">
                <div id="chatBadge" class="chat-bubble-badge" style="display: none;">1</div>
            </div>
            
            <div id="chatWindow" class="chat-window">
                <header class="chat-header">
                    <div class="chat-header-info">
                        <div class="chat-avatar-small"><img src="https://raw.githubusercontent.com/atomicgamesbrasil/siteoficial/main/img%20site/thchatbot.jpg" alt="Thiago"></div>
                        <div class="chat-status">
                            <h4>Thiago - <span style="color: #FFD700;">Atomic</span></h4>
                            <span><span class="status-dot"></span> Online Agora</span>
                        </div>
                    </div>
                    <div class="chat-actions">
                        <button id="resetChatBtn" class="chat-action-btn" title="Limpar Conversa"><i class="ph-bold ph-trash"></i></button>
                        <button id="closeChatBtn" class="chat-action-btn" title="Fechar"><i class="ph-bold ph-x"></i></button>
                    </div>
                </header>
                
                <div id="chatMessages" class="chat-messages"></div>
                
                <footer class="chat-input-area">
                    <input type="text" id="chatInput" class="chat-input" placeholder="Digite sua dúvida..." autocomplete="off">
                    <button id="sendBtn" class="chat-send-btn" aria-label="Enviar"><i class="ph-fill ph-paper-plane-right"></i></button>
                </footer>
            </div>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', html);
    }

    // 2. INJECT CSS (Dark Mode Visuals for v2.1 Structure)
    function injectStyles() {
        const style = document.createElement('style');
        style.innerHTML = `
            /* === CORE POSITIONING (FIXED) === */
            #chatBubble {
                position: fixed;
                bottom: 24px;
                right: 24px;
                width: 64px;
                height: 64px;
                z-index: 2147483647;
                border-radius: 50%;
                background: #000;
                border: 2px solid #FFD700;
                cursor: pointer;
                box-shadow: 0 4px 20px rgba(0,0,0,0.6);
                transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                display: flex; align-items: center; justify-content: center;
                overflow: hidden;
            }
            #chatBubble:hover { transform: scale(1.1); box-shadow: 0 0 15px rgba(255, 215, 0, 0.5); }
            #chatBubble img { width: 100%; height: 100%; object-fit: cover; }
            
            .chat-bubble-badge {
                position: absolute; top: 0; right: 0;
                background: #22c55e; color: white;
                font-size: 10px; font-weight: bold;
                width: 20px; height: 20px;
                border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
                border: 2px solid #000;
            }

            #chatWindow {
                position: fixed;
                bottom: 100px; right: 24px;
                width: 360px; height: 520px; max-height: 80vh;
                background: #111827; /* Dark BG */
                border: 1px solid #374151;
                border-radius: 16px;
                display: flex; flex-direction: column;
                z-index: 2147483647;
                box-shadow: 0 20px 60px rgba(0,0,0,0.8);
                opacity: 0; pointer-events: none;
                transform: translateY(20px) scale(0.95);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                font-family: 'Inter', sans-serif;
            }
            #chatWindow.open { opacity: 1; pointer-events: auto; transform: translateY(0) scale(1); }

            /* === HEADER === */
            .chat-header {
                background: #000;
                padding: 16px;
                display: flex; justify-content: space-between; align-items: center;
                border-bottom: 2px solid #FFD700;
            }
            .chat-header-info { display: flex; align-items: center; gap: 12px; }
            .chat-avatar-small { width: 36px; height: 36px; border-radius: 50%; overflow: hidden; border: 2px solid #FFD700; }
            .chat-avatar-small img { width: 100%; height: 100%; object-fit: cover; }
            .chat-status h4 { color: #fff; font-size: 14px; font-weight: bold; margin: 0; }
            .chat-status span { font-size: 11px; color: #22c55e; display: flex; align-items: center; gap: 4px; }
            .status-dot { width: 6px; height: 6px; background: #22c55e; border-radius: 50%; }
            
            .chat-action-btn { background: none; border: none; color: #9CA3AF; cursor: pointer; transition: color 0.2s; font-size: 18px; }
            .chat-action-btn:hover { color: #fff; }
            #resetChatBtn:hover { color: #ef4444; }

            /* === MESSAGES === */
            .chat-messages {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
                display: flex; flex-direction: column; gap: 16px;
                background: #111827;
                scrollbar-width: thin; scrollbar-color: #374151 #111827;
            }
            .message { display: flex; flex-direction: column; max-width: 85%; animation: fadeIn 0.3s; }
            .message.user { align-self: flex-end; align-items: flex-end; }
            .message.bot { align-self: flex-start; align-items: flex-start; }
            
            .message-bubble {
                padding: 12px 16px;
                border-radius: 12px;
                font-size: 14px; line-height: 1.5;
                color: #E5E7EB;
                position: relative;
            }
            .message.bot .message-bubble {
                background: #1F2937;
                border: 1px solid #374151;
                border-top-left-radius: 2px;
            }
            .message.user .message-bubble {
                background: linear-gradient(135deg, #FFD700 0%, #FF8C00 100%);
                color: #000; font-weight: 600;
                border-top-right-radius: 2px;
                box-shadow: 0 4px 15px rgba(255, 215, 0, 0.2);
            }

            /* === PRODUCT CARDS (v2.1 Style adapted to Dark Mode) === */
            .chat-products-scroll {
                display: flex; gap: 10px; overflow-x: auto;
                padding: 10px 0; width: 100%;
            }
            .chat-product-card {
                min-width: 140px; width: 140px;
                background: #000;
                border: 1px solid #374151;
                border-radius: 8px;
                padding: 8px;
                display: flex; flex-direction: column; gap: 6px;
                flex-shrink: 0;
            }
            .chat-product-card img { width: 100%; height: 100px; object-fit: contain; background: #fff; border-radius: 4px; }
            .chat-product-title { font-size: 11px; color: #fff; font-weight: bold; line-height: 1.2; height: 28px; overflow: hidden; }
            .chat-product-price { font-size: 12px; color: #FFD700; font-weight: bold; }
            .chat-add-btn {
                background: #374151; color: #fff; border: none;
                border-radius: 4px; padding: 6px; font-size: 10px; font-weight: bold;
                cursor: pointer; transition: background 0.2s;
            }
            .chat-add-btn:hover { background: #FFD700; color: #000; }

            /* === ACTIONS === */
            .chat-smart-action {
                display: flex; align-items: center; justify-content: space-between;
                width: 100%; padding: 10px; margin-top: 6px;
                background: #1F2937; color: #E5E7EB;
                border: 1px solid #374151; border-radius: 8px;
                font-size: 12px; font-weight: bold; cursor: pointer;
                transition: all 0.2s;
            }
            .chat-smart-action:hover { border-color: #FFD700; color: #FFD700; background: #000; }
            
            .chat-whatsapp-btn {
                display: block; width: 100%; text-align: center;
                background: #22c55e; color: #fff;
                font-weight: bold; font-size: 12px;
                padding: 10px; margin-top: 8px; border-radius: 8px;
                text-decoration: none;
            }
            .chat-whatsapp-btn:hover { background: #16a34a; }

            /* === INPUT AREA === */
            .chat-input-area {
                padding: 12px 16px; background: #000;
                border-top: 1px solid #374151;
                display: flex; gap: 8px;
            }
            .chat-input {
                flex: 1; background: #1F2937; border: 1px solid #374151;
                color: #fff; padding: 10px 14px; border-radius: 20px; font-size: 14px;
                outline: none;
            }
            .chat-input:focus { border-color: #FFD700; }
            .chat-send-btn {
                width: 40px; height: 40px; border-radius: 50%;
                background: #FFD700; color: #000; border: none;
                display: flex; align-items: center; justify-content: center;
                cursor: pointer; transition: transform 0.2s;
            }
            .chat-send-btn:hover { transform: scale(1.1); }

            /* === UTILS === */
            .typing-indicator { display: flex; gap: 4px; padding: 4px; }
            .typing-dot { width: 6px; height: 6px; background: #9CA3AF; border-radius: 50%; animation: bounce 1.4s infinite ease-in-out; }
            .typing-dot:nth-child(1) { animation-delay: -0.32s; }
            .typing-dot:nth-child(2) { animation-delay: -0.16s; }
            @keyframes bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

            /* Mobile Adjustments */
            @media (max-width: 480px) {
                #chatWindow { bottom: 0; right: 0; left: 0; width: 100%; height: 100%; max-height: none; border-radius: 0; }
                .chat-header { padding-top: 16px; }
            }
        `;
        document.head.appendChild(style);
    }

    // Call Injections
    injectStyles();
    injectChatStructure();

    // === CHATBOT LOGIC (From v2.1 + AtomicBrain) ===
    const els = { 
        bubble: document.getElementById('chatBubble'), 
        win: document.getElementById('chatWindow'), 
        msgs: document.getElementById('chatMessages'), 
        input: document.getElementById('chatInput'),
        badge: document.getElementById('chatBadge'),
        sendBtn: document.getElementById('sendBtn'),
        resetBtn: document.getElementById('resetChatBtn'),
        closeBtn: document.getElementById('closeChatBtn')
    };

    let state = { isOpen: false, isDragging: false, startX: 0, startY: 0, initialLeft: 0, initialTop: 0 };
    let sessionId = localStorage.getItem('chat_sess_id') || 'sess-' + Date.now();
    let msgHistory = []; 

    // --- UI LOGIC ---
    function updateChatUI(open) {
        state.isOpen = open;
        els.win.classList.toggle('open', open);
        if(els.badge) els.badge.style.display = open ? 'none' : 'flex';
        
        if (open) {
            // Morph effect logic
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

    // --- HISTORY API ---
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

    function scrollToBottom() { els.msgs.scrollTop = els.msgs.scrollHeight; }

    // --- DRAG PHYSICS (From v2.1) ---
    // Note: CSS sets default fixed pos, JS overrides via inline styles during drag.
    if(els.bubble) {
        const updatePos = (x, y) => { els.bubble.style.left = `${x}px`; els.bubble.style.top = `${y}px`; };
        
        els.bubble.addEventListener('touchstart', (e) => {
            const t = e.touches[0];
            state.startX = t.clientX; state.startY = t.clientY;
            const rect = els.bubble.getBoundingClientRect();
            state.initialLeft = rect.left; state.initialTop = rect.top;
            state.isDragging = false;
            
            els.bubble.style.transition = 'none'; // Disable transition for direct control
            els.bubble.style.bottom = 'auto'; els.bubble.style.right = 'auto'; 
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
            els.bubble.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'; // Restore transition
            if (!state.isDragging) {
                e.preventDefault(); openChat(); 
            } else {
                // Snap to side
                const rect = els.bubble.getBoundingClientRect();
                const midX = window.innerWidth / 2;
                const snapX = (rect.left + rect.width/2) < midX ? 24 : window.innerWidth - rect.width - 24;
                let snapY = rect.top;
                if(snapY < 20) snapY = 20;
                if(snapY > window.innerHeight - 100) snapY = window.innerHeight - 100;
                updatePos(snapX, snapY);
            }
            state.isDragging = false;
        });
        
        els.bubble.addEventListener('click', (e) => { 
            if(!state.isDragging) { if(state.isOpen) closeChat(); else openChat(); } 
        });
    }

    if(els.closeBtn) els.closeBtn.onclick = (e) => { e.stopPropagation(); closeChat(); };
    if(els.resetBtn) els.resetBtn.onclick = (e) => {
        e.stopPropagation();
        if(confirm('Limpar conversa?')) {
            msgHistory = [];
            localStorage.setItem('atomic_chat_history_v2', JSON.stringify([]));
            els.msgs.innerHTML = '';
            sessionId = 'sess-' + Date.now();
            setTimeout(() => addMsg('bot', 'Histórico limpo! Como posso ajudar agora?', [], null, [], false), 300);
        }
    };

    // --- MESSAGING LOGIC ---
    function parseText(text) {
        if(!text) return document.createTextNode("");
        const div = document.createElement('div');
        div.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
        return div;
    }

    function addMsg(role, content, prods, link, actions = [], save = true) {
        const div = document.createElement('div'); div.className = `message ${role}`;
        
        const bubble = document.createElement('div'); bubble.className = 'message-bubble';
        if(content) bubble.appendChild(parseText(content));
        
        // Products (Horizontal Scroll - v2.1 Feature)
        if(prods?.length) {
            const scroll = document.createElement('div'); scroll.className = 'chat-products-scroll';
            prods.forEach(p => {
                const card = document.createElement('div'); card.className = 'chat-product-card';
                card.innerHTML = `
                    <img src="${p.image || 'https://placehold.co/100/000/fff'}" loading="lazy">
                    <div class="chat-product-title">${p.name || p.nome}</div>
                    <div class="chat-product-price">${p.price || p.preco}</div>
                    <button class="chat-add-btn">VER WHATSAPP</button>
                `;
                card.onclick = (e) => {
                    e.stopPropagation();
                    window.open(`https://wa.me/5521995969378?text=Interesse em: ${p.name}`);
                };
                scroll.appendChild(card);
            });
            bubble.appendChild(scroll);
        }

        // Action Link
        if(link) {
           const btn = document.createElement('a'); btn.href=link; btn.target='_blank';
           btn.className = 'chat-whatsapp-btn';
           btn.innerHTML = 'NEGOCIAR NO WHATSAPP <i class="ph-bold ph-whatsapp-logo"></i>'; 
           bubble.appendChild(btn);
        }

        // Smart Actions
        if (actions && actions.length > 0) {
            const actionContainer = document.createElement('div');
            actions.forEach(act => {
                const actBtn = document.createElement('button');
                actBtn.className = 'chat-smart-action';
                actBtn.innerHTML = `<span>${act.label}</span><i class="ph-bold ${act.icon}"></i>`;
                actBtn.onclick = () => {
                    if (act.targetId) {
                        const target = document.getElementById(act.targetId);
                        if(target) {
                            if(window.innerWidth < 768) updateChatUI(false);
                            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    }
                };
                actionContainer.appendChild(actBtn);
            });
            bubble.appendChild(actionContainer);
        }

        div.appendChild(bubble); els.msgs.appendChild(div); scrollToBottom();

        if (save) {
            msgHistory.push({ role, content, prods, link, actions });
            localStorage.setItem('atomic_chat_history_v2', JSON.stringify(msgHistory));
        }
    }

    function addTyping() {
        const div = document.createElement('div'); div.id='typing'; div.className='message bot';
        div.innerHTML = `<div class="message-bubble"><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>`;
        els.msgs.appendChild(div); scrollToBottom();
    }

    // --- CONTEXT BRAIN (Integration with AtomicBrain) ---
    async function send() {
        const txt = els.input.value.trim();
        if(!txt) return;
        
        els.input.value = ''; 
        addMsg('user', txt); 
        addTyping();
        
        // Local Context Logic (from v2.1)
        const localActions = [];
        const t = txt.toLowerCase();
        if (t.includes('manutenção') || t.includes('conserto') || t.includes('quebrado')) {
            localActions.push({ label: 'Simular Reparo', icon: 'ph-wrench', targetId: 'services' });
        }
        if (t.includes('onde') || t.includes('endereço') || t.includes('loja')) {
            localActions.push({ label: 'Ver Mapa', icon: 'ph-map-pin', targetId: 'location' });
        }

        try {
            let data;
            
            // Connect to AtomicBrain (index.tsx)
            if (window.AtomicBrain && typeof window.AtomicBrain.ask === 'function') {
                data = await window.AtomicBrain.ask(txt, sessionId);
            } else {
                // Retry once
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

                addMsg('bot', data.response, data.produtos_sugeridos, data.action_link, combinedActions);
            } else {
                addMsg('bot', 'Desculpe, tive um erro técnico.', [], null, localActions);
            }
        } catch (e) { 
            const typing = document.getElementById('typing'); if(typing) typing.remove();
            addMsg('bot', 'Estou conectando aos servidores...', [], null, localActions); 
        }
    }

    els.sendBtn.onclick = send;
    els.form = document.querySelector('.chat-input-area'); // Fallback form simulation
    els.input.addEventListener('keydown', (e) => {
        if(e.key === 'Enter') send();
    });

    // LOAD HISTORY
    try {
        const savedHist = localStorage.getItem('atomic_chat_history_v2');
        if (savedHist) {
            msgHistory = JSON.parse(savedHist);
            msgHistory.forEach(m => addMsg(m.role, m.content, m.prods, m.link, m.actions, false));
        } else {
            setTimeout(() => addMsg('bot', 'Fala Gamer! 🎮\nSou o Thiago. Posso ajudar com Orçamentos, PCs ou Consoles?'), 1000);
        }
    } catch(e) {}

    console.log("Atomic Chat: v2.5 Hybrid Active");

    // Expose for Global Context (Calculator)
    window.AtomicChat = {
        processBudget: function(context) {
            if (!context) return;
            if (!state.isOpen) openChat();
            
            const msg = `Recebi sua estimativa para o **${context.device.modelLabel}**.\n` +
                        `Serviço: ${context.service.name}\n` +
                        `Estimativa: **R$ ${context.financial.totalMin} a ${context.financial.totalMax}**`;
            
            const link = `https://wa.me/5521995969378?text=${encodeURIComponent("Olá, fiz um orçamento no site: " + context.device.modelLabel)}`;
            
            setTimeout(() => addMsg('bot', msg, [], link, [], true), 500);
        }
    };
})();