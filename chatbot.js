// === CHATBOT 3.4 (STABLE CLIENT) ===
// Runs in the BROWSER. UI Logic only.

document.addEventListener('DOMContentLoaded', () => {

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
    
    // Critical Safety Check
    if (!els.bubble || !els.win) {
        console.warn("Atomic Chat: UI elements not found. Script paused.");
        return;
    }

    // --- STATE ---
    let state = { isOpen: false, isDragging: false };
    let sessionId = localStorage.getItem('atomic_session_id') || 'sess_' + Date.now();

    // --- UI LOGIC ---
    function updateChatUI(open) {
        state.isOpen = open;
        
        // CSS Classes
        if (open) {
            els.win.classList.add('open');
            els.bubble.classList.add('open');
            els.badge.style.display = 'none';
        } else {
            els.win.classList.remove('open');
            els.bubble.classList.remove('open');
            els.badge.style.display = 'flex';
        }
        
        if (open) {
            // Animation: Hide bubble, show window
            Object.assign(els.bubble.style, { transform: 'scale(0)', opacity: '0', pointerEvents: 'none' });
            
            // Mobile adjustments
            if(window.innerWidth <= 480) els.win.style.transformOrigin = "bottom right";
            
            // Focus and scroll
            if(window.innerWidth > 768) setTimeout(() => els.input.focus(), 350);
            scrollToBottom();
        } else {
            // Animation: Show bubble, hide window
            Object.assign(els.bubble.style, { transform: 'scale(1)', opacity: '1', pointerEvents: 'auto' });
            els.input.blur();
        }
    }

    function openChat() { 
        if(state.isOpen) return;
        
        // 1. OPEN UI FIRST (Critical fix: Visual feedback must happen before logic errors)
        updateChatUI(true); 
        
        // 2. Try History API (Secondary)
        try { history.pushState({chat: true}, '', '#chat'); } catch(e) { /* Ignore environment errors */ }
    }
    
    function closeChat() { 
        if(!state.isOpen) return;
        
        // 1. Try Back (if supported)
        let handled = false;
        try {
            if(history.state && history.state.chat) {
                history.back();
                handled = true;
            }
        } catch(e) {}
        
        // 2. Force UI Close if history didn't handle it
        if (!handled) updateChatUI(false);
    }

    function toggleChat() { state.isOpen ? closeChat() : openChat(); }

    // Handle Browser Back Button
    window.addEventListener('popstate', () => { if(state.isOpen) updateChatUI(false); });
    function scrollToBottom() { els.msgs.scrollTop = els.msgs.scrollHeight; }

    // --- INTERACTION (DRAG VS CLICK) ---
    // Simplified robust logic
    if(els.bubble) {
        let startX, startY, initialLeft, initialTop;
        let hasMoved = false;

        // TOUCH START
        els.bubble.addEventListener('touchstart', (e) => {
            const t = e.touches[0];
            startX = t.clientX; startY = t.clientY;
            const rect = els.bubble.getBoundingClientRect();
            initialLeft = rect.left; initialTop = rect.top;
            hasMoved = false;
            els.bubble.style.transition = 'none'; // Remove lag
        }, { passive: true });

        // TOUCH MOVE
        els.bubble.addEventListener('touchmove', (e) => {
            const t = e.touches[0];
            const dx = t.clientX - startX;
            const dy = t.clientY - startY;
            
            // Threshold for "drag" vs "trembling finger"
            if (Math.sqrt(dx*dx + dy*dy) > 10) {
                hasMoved = true;
                e.preventDefault(); // Prevent scrolling while dragging bubble
                els.bubble.style.left = `${initialLeft + dx}px`;
                els.bubble.style.top = `${initialTop + dy}px`;
            }
        }, { passive: false });

        // TOUCH END
        els.bubble.addEventListener('touchend', (e) => {
            els.bubble.style.transition = 'all 0.3s ease';
            
            if (hasMoved) {
                // Snap to wall logic
                const rect = els.bubble.getBoundingClientRect();
                const snapX = (rect.left + rect.width/2) < window.innerWidth/2 ? 24 : window.innerWidth - rect.width - 24;
                let snapY = Math.min(Math.max(rect.top, 24), window.innerHeight - 100);
                els.bubble.style.left = `${snapX}px`;
                els.bubble.style.top = `${snapY}px`;
                
                // Prevent the subsequent 'click' event from firing
                e.preventDefault(); 
            }
            // If NOT moved, we do nothing here. The browser will fire a 'click' event naturally.
        });
        
        // CLICK (Handles both Mouse and Touch Taps)
        els.bubble.addEventListener('click', (e) => { 
            // If it was a drag operation (handled in touchend), ignore this click
            if(hasMoved) return; 
            
            e.stopPropagation();
            toggleChat(); 
        });
        
        // Close button
        els.closeBtn.onclick = (e) => { 
            e.stopPropagation(); 
            closeChat(); 
        };
    }

    // --- RENDERER ---
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
        
        const avatar = document.createElement('div'); avatar.className = 'message-avatar';
        avatar.textContent = role === 'bot' ? '🎮' : '👤';
        
        const contentDiv = document.createElement('div'); contentDiv.className = 'message-content';
        const bubble = document.createElement('div'); bubble.className = 'message-bubble';
        
        if(content) bubble.appendChild(parseText(content));
        
        // Products
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

        // Action Link
        if(link) {
           const btn = document.createElement('a'); 
           btn.href = link; btn.target = '_blank';
           btn.className = 'action-button';
           btn.innerHTML = `NEGOCIAR AGORA <i class="fas fa-arrow-right"></i>`;
           bubble.appendChild(btn);
        }

        // Local Actions
        if(actions && actions.length > 0) {
            const actionContainer = document.createElement('div');
            Object.assign(actionContainer.style, { marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' });
            
            actions.forEach(act => {
                const btn = document.createElement('button');
                btn.className = 'quick-action-btn'; 
                btn.style.width = '100%'; btn.style.textAlign = 'left';
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

    function saveHistory(msg) {
        try {
            let history = JSON.parse(localStorage.getItem('atomic_chat_history') || '[]');
            history.push(msg);
            localStorage.setItem('atomic_chat_history', JSON.stringify(history));
        } catch(e) {}
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

    try {
        const savedHist = localStorage.getItem('atomic_chat_history');
        if (savedHist) JSON.parse(savedHist).forEach(m => addMsg(m.role, m.content, m.prods, m.link, m.actions));
        else setTimeout(() => addMsg('bot', 'E aí! 👋 Sou o **Thiago**, especialista da Atomic Games.\nPosso ajudar com Peças, PC Gamer ou Manutenção?'), 1000);
    } catch(e) {}

    // Expose global hook securely
    window.AtomicChat = {
        openWithContext: function(message) {
            openChat();
            addMsg('bot', message, [], null, [{label: 'WhatsApp', url: 'https://wa.me/5521995969378', icon: 'fab fa-whatsapp'}]);
        }
    };
    
    console.log("Atomic Chatbot 3.4 Ready");

});
