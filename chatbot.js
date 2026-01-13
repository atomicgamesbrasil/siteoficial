// === CHATBOT 3.5 (NUCLEAR FIX) ===
// Runs in the BROWSER. UI Logic only.

(function() {
    console.log("Atomic Chat: Initializing...");

    // --- CONFIGURATION ---
    const BACKEND_URL = 'https://atomic-thiago-backend.onrender.com/chat';

    // --- DOM ELEMENTS ---
    const els = { 
        bubble: document.getElementById('chat-bubble'), 
        win: document.getElementById('chat-container'), 
        msgs: document.getElementById('chat-messages'), 
        input: document.getElementById('chat-input'),
        badge: document.getElementById('chat-badge'),
        closeBtn: document.getElementById('chat-close'),
        sendBtn: document.getElementById('chat-send'),
        form: document.getElementById('chat-form')
    };

    // Safety check
    if (!els.bubble || !els.win) {
        console.error("Atomic Chat: Critical elements not found in HTML.");
        return;
    }

    // --- STORAGE HELPER (Prevents crashes in incognito/iframe) ---
    const SafeStorage = {
        getItem: (key) => {
            try { return localStorage.getItem(key); } catch(e) { return null; }
        },
        setItem: (key, val) => {
            try { localStorage.setItem(key, val); } catch(e) { }
        }
    };

    // --- STATE ---
    let state = { isOpen: false, isDragging: false, dragStartTime: 0 };
    let sessionId = SafeStorage.getItem('atomic_session_id') || 'sess_' + Date.now();

    // --- CORE ACTIONS ---
    function setChatState(open) {
        state.isOpen = open;
        if (open) {
            els.win.classList.add('open');
            els.bubble.classList.add('open');
            els.badge.style.display = 'none';
            // Animation reset
            els.bubble.style.transform = 'scale(0)';
            els.bubble.style.opacity = '0';
            els.bubble.style.pointerEvents = 'none';
            
            if(window.innerWidth > 768) setTimeout(() => els.input.focus(), 350);
            scrollToBottom();
            
            // History State (Safe)
            try { history.pushState({chat: true}, '', '#chat'); } catch(e) {}
        } else {
            els.win.classList.remove('open');
            els.bubble.classList.remove('open');
            els.badge.style.display = 'flex';
            
            els.bubble.style.transform = 'scale(1)';
            els.bubble.style.opacity = '1';
            els.bubble.style.pointerEvents = 'auto';
            els.input.blur();
        }
    }

    function toggleChat() { setChatState(!state.isOpen); }
    
    // Browser Back Button Handler
    window.addEventListener('popstate', () => { if(state.isOpen) setChatState(false); });
    function scrollToBottom() { els.msgs.scrollTop = els.msgs.scrollHeight; }

    // --- DRAG & CLICK LOGIC (REWRITTEN) ---
    if(els.bubble) {
        let startX, startY, initialLeft, initialTop;
        
        // 1. TOUCH START
        els.bubble.addEventListener('touchstart', (e) => {
            state.isDragging = false;
            state.dragStartTime = Date.now();
            const t = e.touches[0];
            startX = t.clientX; startY = t.clientY;
            
            const rect = els.bubble.getBoundingClientRect();
            initialLeft = rect.left; initialTop = rect.top;
            
            els.bubble.style.transition = 'none'; // Instant movement
        }, { passive: true });

        // 2. TOUCH MOVE
        els.bubble.addEventListener('touchmove', (e) => {
            const t = e.touches[0];
            const dx = t.clientX - startX;
            const dy = t.clientY - startY;
            
            // If moved more than 10px, treat as drag
            if (Math.sqrt(dx*dx + dy*dy) > 10) {
                state.isDragging = true;
                e.preventDefault(); // Stop page scrolling
                els.bubble.style.left = `${initialLeft + dx}px`;
                els.bubble.style.top = `${initialTop + dy}px`;
            }
        }, { passive: false });

        // 3. TOUCH END (Handles Tap vs Drag Drop)
        els.bubble.addEventListener('touchend', (e) => {
            els.bubble.style.transition = 'all 0.3s ease'; // Restore animation
            
            if (state.isDragging) {
                // Snap Logic
                const rect = els.bubble.getBoundingClientRect();
                const snapX = (rect.left + rect.width/2) < window.innerWidth/2 ? 24 : window.innerWidth - rect.width - 24;
                let snapY = Math.min(Math.max(rect.top, 24), window.innerHeight - 100);
                els.bubble.style.left = `${snapX}px`;
                els.bubble.style.top = `${snapY}px`;
                
                // Prevent click firing after drag
                e.preventDefault();
                e.stopPropagation();
            } else {
                // IT WAS A TAP! (Not a drag)
                // If the tap was quick (< 200ms), open immediately
                if (Date.now() - state.dragStartTime < 300) {
                    e.preventDefault(); // Prevent phantom mouse clicks
                    toggleChat();
                }
            }
            state.isDragging = false;
        });

        // 4. MOUSE CLICK (Desktop Backup)
        els.bubble.addEventListener('click', (e) => {
            // If touch handled it, ignore mouse click
            if (state.isDragging) return;
            toggleChat();
        });

        els.closeBtn.onclick = (e) => { e.stopPropagation(); setChatState(false); };
    }

    // --- MESSAGING LOGIC ---
    function parseText(text) {
        if(!text) return document.createTextNode("");
        const frag = document.createDocumentFragment();
        text.split('\n').forEach((line, i) => {
            if(i>0) frag.appendChild(document.createElement('br'));
            line.split('**').forEach((part, j) => {
                j%2 ? frag.appendChild(Object.assign(document.createElement('b'),{textContent:part})) 
                    : frag.appendChild(document.createTextNode(part));
            });
        });
        return frag;
    }

    function addMsg(role, content, prods = [], link = null, actions = []) {
        const div = document.createElement('div'); 
        div.className = `message ${role}`;
        
        div.innerHTML = role === 'bot' 
            ? `<div class="message-avatar">🎮</div>` 
            : `<div class="message-avatar">👤</div>`;
        
        const contentDiv = document.createElement('div'); contentDiv.className = 'message-content';
        const bubble = document.createElement('div'); bubble.className = 'message-bubble';
        
        if(content) bubble.appendChild(parseText(content));
        
        // Render Products
        if(prods && prods.length > 0) {
            prods.forEach(p => {
                const card = document.createElement('div'); card.className = 'product-card';
                card.innerHTML = `
                    <div class="product-info"><h4>${p.name}</h4><span>${p.id}</span></div>
                    <div class="product-price">${p.price}</div>`;
                card.onclick = (e) => {
                    e.stopPropagation();
                    window.open(`https://wa.me/5521995969378?text=Tenho interesse em: ${p.name}`);
                };
                bubble.appendChild(card);
            });
        }

        // Render Link
        if(link) {
           const btn = document.createElement('a'); 
           btn.href = link; btn.target = '_blank';
           btn.className = 'action-button';
           btn.innerHTML = `NEGOCIAR AGORA <i class="fas fa-arrow-right"></i>`;
           bubble.appendChild(btn);
        }

        // Render Local Actions
        if(actions && actions.length > 0) {
            const actionContainer = document.createElement('div');
            Object.assign(actionContainer.style, { marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' });
            actions.forEach(act => {
                const btn = document.createElement('button');
                btn.className = 'quick-action-btn'; 
                btn.style.width = '100%'; btn.style.textAlign = 'left';
                btn.innerHTML = `${act.label} <i class="${act.icon || 'fas fa-arrow-right'}"></i>`;
                btn.onclick = () => {
                    const target = document.getElementById(act.targetId);
                    if(target) {
                        if(window.innerWidth < 768) setChatState(false);
                        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                };
                actionContainer.appendChild(btn);
            });
            bubble.appendChild(actionContainer);
        }

        contentDiv.appendChild(bubble);
        if(role === 'bot') div.appendChild(contentDiv);
        else div.insertBefore(contentDiv, div.firstChild); // Swap for user
        
        els.msgs.appendChild(div); 
        scrollToBottom();
        
        // Save to History
        const hist = JSON.parse(SafeStorage.getItem('atomic_chat_history') || '[]');
        hist.push({ role, content, prods, link, actions });
        SafeStorage.setItem('atomic_chat_history', JSON.stringify(hist));
    }

    function addTyping() {
        const div = document.createElement('div'); div.id='typing'; div.className='typing-indicator';
        div.innerHTML = `<div class="message-avatar">🎮</div><div class="typing-dots"><span></span><span></span><span></span></div>`;
        els.msgs.appendChild(div); scrollToBottom();
    }

    async function sendMessage(e) {
        if(e) e.preventDefault();
        const txt = els.input.value.trim();
        if(!txt) return;
        
        els.input.value = ''; 
        addMsg('user', txt); 
        addTyping();
        
        try {
            const res = await fetch(BACKEND_URL, { 
                method: 'POST', 
                headers: {'Content-Type':'application/json'}, 
                body: JSON.stringify({ message: txt, session_id: sessionId }) 
            });
            
            const data = await res.json();
            document.getElementById('typing')?.remove();
            
            if(data.session_id) {
                sessionId = data.session_id;
                SafeStorage.setItem('atomic_session_id', sessionId);
            }
            
            if(data.success !== false) {
                addMsg('bot', data.response, data.produtos_sugeridos, data.action_link, data.local_actions);
            } else {
                 addMsg('bot', 'Tive um problema técnico. Pode tentar de novo?');
            }
        } catch(e) { 
            console.error(e);
            document.getElementById('typing')?.remove();
            addMsg('bot', '⚠️ Sem conexão com a base. Verifique sua internet.'); 
        }
    }

    // --- INIT ---
    els.form.addEventListener('submit', sendMessage);
    els.sendBtn.addEventListener('click', sendMessage);
    
    document.querySelectorAll('.quick-action-btn').forEach(btn => {
        if(btn.dataset.msg) {
            btn.addEventListener('click', () => {
                els.input.value = btn.dataset.msg;
                sendMessage();
            });
        }
    });

    // Load History
    const savedHist = SafeStorage.getItem('atomic_chat_history');
    if (savedHist) {
        JSON.parse(savedHist).forEach(m => addMsg(m.role, m.content, m.prods, m.link, m.actions));
    } else {
        setTimeout(() => addMsg('bot', 'E aí! 👋 Sou o **Thiago**, especialista da Atomic Games.\nPosso ajudar com Peças, PC Gamer ou Manutenção?'), 1000);
    }

    window.AtomicChat = { open: () => setChatState(true) };
    console.log("Atomic Chat: Ready to rock.");

})();
