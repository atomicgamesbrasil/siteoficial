// === CHATBOT 3.2 (CLIENT-SIDE BODY) ===
// This code runs in the BROWSER. It has NO Brain, NO Keys.
// It just displays what the backend sends.

(function() {
    // --- CONFIGURATION ---
    // Point this to your actual deployed backend URL
    const BACKEND_URL = 'https://atomic-thiago-backend.onrender.com/chat';

    // --- DOM ELEMENTS (Must match index.html IDs) ---
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
    if (!els.bubble || !els.win) return;

    // --- STATE MANAGEMENT ---
    let state = { isOpen: false, isDragging: false };
    let sessionId = localStorage.getItem('atomic_session_id') || 'sess_' + Date.now();

    // --- UI: OPEN/CLOSE ---
    function updateChatUI(open) {
        state.isOpen = open;
        els.win.classList.toggle('open', open);
        els.bubble.classList.toggle('open', open);
        els.badge.style.display = open ? 'none' : 'flex';
        
        if (open) {
            // Mobile adjustments
            if(window.innerWidth <= 480) els.win.style.transformOrigin = "bottom right";
            
            // Hide bubble, show window
            els.bubble.style.transform = 'scale(0)'; 
            els.bubble.style.opacity = '0';
            els.bubble.style.pointerEvents = 'none';
            
            if(window.innerWidth > 768) setTimeout(() => els.input.focus(), 350);
            scrollToBottom();
        } else {
            // Show bubble, hide window
            els.bubble.style.transform = 'scale(1)';
            els.bubble.style.opacity = '1';
            els.bubble.style.pointerEvents = 'auto';
            els.input.blur();
        }
    }

    function toggleChat() { state.isOpen ? closeChat() : openChat(); }
    function openChat() { if(!state.isOpen) { history.pushState({chat: true}, '', '#chat'); updateChatUI(true); } }
    function closeChat() { if(state.isOpen) history.back(); }

    window.addEventListener('popstate', () => { if(state.isOpen) updateChatUI(false); });
    function scrollToBottom() { els.msgs.scrollTop = els.msgs.scrollHeight; }

    // --- UI: DRAG & DROP PHYSICS ---
    if(els.bubble) {
        let startX, startY, initialLeft, initialTop;
        const updatePos = (x, y) => { els.bubble.style.left = `${x}px`; els.bubble.style.top = `${y}px`; };
        
        els.bubble.addEventListener('touchstart', (e) => {
            const t = e.touches[0];
            startX = t.clientX; startY = t.clientY;
            const rect = els.bubble.getBoundingClientRect();
            initialLeft = rect.left; initialTop = rect.top;
            state.isDragging = false;
            els.bubble.style.transition = 'none';
            updatePos(rect.left, rect.top);
        }, { passive: true });

        els.bubble.addEventListener('touchmove', (e) => {
            const t = e.touches[0];
            const dx = t.clientX - startX;
            const dy = t.clientY - startY;
            if (Math.sqrt(dx*dx + dy*dy) > 10) state.isDragging = true;
            if (state.isDragging) { e.preventDefault(); updatePos(initialLeft + dx, initialTop + dy); }
        }, { passive: false });

        els.bubble.addEventListener('touchend', (e) => {
            els.bubble.style.transition = 'all 0.3s ease';
            if (!state.isDragging) {
                e.preventDefault(); openChat(); 
            } else {
                // Snap logic
                const rect = els.bubble.getBoundingClientRect();
                const snapX = (rect.left + rect.width/2) < window.innerWidth/2 ? 24 : window.innerWidth - rect.width - 24;
                let snapY = Math.min(Math.max(rect.top, 24), window.innerHeight - 100);
                updatePos(snapX, snapY);
            }
            state.isDragging = false;
        });
        
        els.bubble.addEventListener('click', () => { if(!state.isDragging) toggleChat(); });
        els.closeBtn.onclick = (e) => { e.stopPropagation(); closeChat(); };
    }

    // --- RENDERER: MESSAGES & CARDS ---
    function parseText(text) {
        if(!text) return document.createTextNode("");
        const frag = document.createDocumentFragment();
        // Support bolding via **text** and newlines
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
        
        // 1. Avatar
        const avatar = document.createElement('div'); avatar.className = 'message-avatar';
        avatar.textContent = role === 'bot' ? '🎮' : '👤';
        
        // 2. Bubble Container
        const contentDiv = document.createElement('div'); contentDiv.className = 'message-content';
        const bubble = document.createElement('div'); bubble.className = 'message-bubble';
        
        // 3. Text Content
        if(content) bubble.appendChild(parseText(content));
        
        // 4. Products Carousel (JSON from Backend)
        if(prods && prods.length > 0) {
            prods.forEach(p => {
                const card = document.createElement('div'); card.className = 'product-card';
                card.innerHTML = `
                    <div class="product-info">
                        <h4>${p.name}</h4>
                        <span>${p.id}</span>
                    </div>
                    <div class="product-price">${p.price}</div>
                `;
                card.onclick = (e) => {
                    e.stopPropagation();
                    // If site has a modal function, use it. Otherwise, open WhatsApp.
                    if(window.showProductDetail) {
                        if(window.innerWidth <= 768) updateChatUI(false);
                        window.showProductDetail(p.id);
                    } else {
                        window.open(`https://wa.me/5521995969378?text=Tenho interesse em: ${p.name}`);
                    }
                };
                bubble.appendChild(card);
            });
        }

        // 5. Call to Action Button
        if(link) {
           const btn = document.createElement('a'); 
           btn.href = link; btn.target = '_blank';
           btn.className = 'action-button';
           btn.innerHTML = `NEGOCIAR AGORA <i class="fas fa-arrow-right"></i>`;
           bubble.appendChild(btn);
        }

        // 6. Local Site Actions (Scroll Buttons)
        if(actions && actions.length > 0) {
            const actionContainer = document.createElement('div');
            actionContainer.style.marginTop = '10px';
            actionContainer.style.display = 'flex';
            actionContainer.style.flexDirection = 'column';
            actionContainer.style.gap = '8px';
            
            actions.forEach(act => {
                const btn = document.createElement('button');
                btn.className = 'quick-action-btn'; 
                btn.style.width = '100%';
                btn.style.textAlign = 'left';
                btn.innerHTML = `${act.label} <i class="${act.icon || 'fas fa-arrow-right'}"></i>`;
                btn.onclick = () => {
                    if(act.targetId) {
                        const target = document.getElementById(act.targetId);
                        if(target) {
                            if(window.innerWidth < 768) updateChatUI(false);
                            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    }
                };
                actionContainer.appendChild(btn);
            });
            bubble.appendChild(actionContainer);
        }

        contentDiv.appendChild(bubble);
        div.appendChild(role === 'user' ? contentDiv : avatar);
        div.appendChild(role === 'user' ? avatar : contentDiv);

        els.msgs.appendChild(div); 
        scrollToBottom();
        saveHistory({ role, content, prods, link, actions });
    }

    // --- HISTORY ---
    function saveHistory(msg) {
        let history = JSON.parse(localStorage.getItem('atomic_chat_history') || '[]');
        history.push(msg);
        localStorage.setItem('atomic_chat_history', JSON.stringify(history));
    }

    // --- NETWORK: SEND TO BACKEND ---
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
            // THE CRITICAL PART: Calling the secure backend
            const res = await fetch(BACKEND_URL, { 
                method: 'POST', 
                headers: {'Content-Type':'application/json'}, 
                body: JSON.stringify({ message: txt, session_id: sessionId }) 
            });
            
            const data = await res.json();
            document.getElementById('typing')?.remove();
            
            if(data.session_id) {
                sessionId = data.session_id;
                localStorage.setItem('atomic_session_id', sessionId);
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

    // --- INITIALIZATION ---
    els.form.addEventListener('submit', sendMessage);
    els.sendBtn.addEventListener('click', sendMessage);
    
    // Quick Actions from HTML
    document.querySelectorAll('.quick-action-btn').forEach(btn => {
        if(btn.dataset.msg) {
            btn.addEventListener('click', () => {
                els.input.value = btn.dataset.msg;
                sendMessage();
            });
        }
    });

    // Load History
    try {
        const savedHist = localStorage.getItem('atomic_chat_history');
        if (savedHist) {
            JSON.parse(savedHist).forEach(m => addMsg(m.role, m.content, m.prods, m.link, m.actions));
        } else {
            setTimeout(() => addMsg('bot', 'E aí! 👋 Sou o **Thiago**, especialista da Atomic Games.\nPosso ajudar com Peças, PC Gamer ou Manutenção?'), 1000);
        }
    } catch(e) {}

    // Global Hook (for other parts of your site to open chat)
    window.AtomicChat = {
        openWithContext: function(message) {
            if(!state.isOpen) openChat();
            addMsg('bot', message, [], null, [{label: 'WhatsApp', url: 'https://wa.me/5521995969378', icon: 'fab fa-whatsapp'}]);
        }
    };

})();
