// === CHATBOT 2.0 (FLUID & MAGNETIC) ===
(function() {
    const els = { 
        bubble: document.getElementById('chatBubble'), 
        win: document.getElementById('chatWindow'), 
        msgs: document.getElementById('chatMessages'), 
        input: document.getElementById('chatInput'),
        badge: document.getElementById('chatBadge')
    };
    
    // Check if chatbot elements exist (in case of partial page loads)
    if (!els.bubble || !els.win) return;

    let state = { isOpen: false, isDragging: false, startX: 0, startY: 0, initialLeft: 0, initialTop: 0 };
    let sessionId = localStorage.getItem('chat_sess_id');

    // --- UI LOGIC ---
    function updateChatUI(open) {
        state.isOpen = open;
        els.win.classList.toggle('open', open);
        els.badge.style.display = open ? 'none' : 'flex';
        document.body.classList.toggle('chat-open', open);
        
        if (open) {
            // Open logic
            els.bubble.style.transform = 'scale(0.8) translateY(20px)';
            els.bubble.style.opacity = '0';
            els.bubble.style.pointerEvents = 'none';
            if(window.innerWidth > 768) setTimeout(() => els.input.focus(), 300);
            scrollToBottom();
        } else {
            // Close logic
            els.bubble.style.transform = 'scale(1)';
            els.bubble.style.opacity = '1';
            els.bubble.style.pointerEvents = 'auto';
        }
    }

    // --- HISTORY API LOGIC (ANDROID BACK BUTTON FIX) ---
    function openChat() {
        if(state.isOpen) return;
        history.pushState({chat: true}, '', '#chat'); 
        updateChatUI(true);
    }

    function closeChat() {
        if(!state.isOpen) return;
        // Check if we have history state to go back to, otherwise just close UI
        history.back(); 
    }

    // Listen for browser back button
    window.addEventListener('popstate', (e) => {
        if(state.isOpen) {
            updateChatUI(false);
        }
    });

    function scrollToBottom() { els.msgs.scrollTop = els.msgs.scrollHeight; }

    // --- DRAG & MAGNETIC SNAP PHYSICS ---
    if(els.bubble) {
        // Initialize Position logic
        const updatePos = (x, y) => { els.bubble.style.left = `${x}px`; els.bubble.style.top = `${y}px`; };
        
        els.bubble.addEventListener('touchstart', (e) => {
            const t = e.touches[0];
            state.startX = t.clientX; state.startY = t.clientY;
            const rect = els.bubble.getBoundingClientRect();
            state.initialLeft = rect.left; state.initialTop = rect.top;
            state.isDragging = false;
            
            // Kill transition for 1:1 movement
            els.bubble.classList.add('no-transition');
            els.bubble.classList.remove('snapping');
            
            els.bubble.style.transform = 'scale(0.95)';
            // Switch to left/top positioning instantly to prevent jumps
            els.bubble.style.bottom = 'auto'; els.bubble.style.right = 'auto'; 
            updatePos(rect.left, rect.top);
        }, { passive: true });

        els.bubble.addEventListener('touchmove', (e) => {
            const t = e.touches[0];
            const dx = t.clientX - state.startX;
            const dy = t.clientY - state.startY;
            
            if (Math.sqrt(dx*dx + dy*dy) > 5) state.isDragging = true;
            if (state.isDragging) {
                e.preventDefault();
                updatePos(state.initialLeft + dx, state.initialTop + dy);
            }
        }, { passive: false });

        els.bubble.addEventListener('touchend', (e) => {
            // Re-enable transition for the snap animation
            els.bubble.classList.remove('no-transition');
            els.bubble.style.transform = 'scale(1)';
            
            if (!state.isDragging) {
                e.preventDefault(); 
                openChat(); // Use new open handler with History API
            } else {
                // Magnetic Snap Logic
                els.bubble.classList.add('snapping');
                const rect = els.bubble.getBoundingClientRect();
                const midX = window.innerWidth / 2;
                const snapX = (rect.left + rect.width/2) < midX ? 20 : window.innerWidth - rect.width - 20;
                
                // Bound Y to screen
                let snapY = rect.top;
                if(snapY < 20) snapY = 20;
                if(snapY > window.innerHeight - 100) snapY = window.innerHeight - 100;

                updatePos(snapX, snapY);
            }
            state.isDragging = false;
        });
        
        // Desktop Click
        els.bubble.addEventListener('click', (e) => { 
            if(e.detail) {
                if(state.isOpen) closeChat(); else openChat();
            } 
        });
        
        document.getElementById('closeChatBtn').onclick = (e) => { 
            e.stopPropagation(); 
            closeChat(); 
        };
    }

    // --- MESSAGING LOGIC ---
    function parseText(text) {
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

    function addMsg(role, content, prods, link) {
        const div = document.createElement('div'); div.className = `message ${role}`;
        const bubble = document.createElement('div'); bubble.className = 'message-bubble';
        
        if(content) bubble.appendChild(parseText(content));
        
        if(prods?.length) {
            const scroll = document.createElement('div'); scroll.className = 'chat-products-scroll';
            prods.forEach(p => {
                const card = document.createElement('div'); card.className = 'chat-product-card';
                card.innerHTML = `<img src="${p.image||'https://placehold.co/100'}" loading="lazy">
                                  <div class="chat-product-title">${p.name||p.nome}</div>
                                  <div class="chat-product-price">${p.price||p.preco}</div>`;
                const btn = document.createElement('button'); btn.className='chat-add-btn'; btn.innerText='VER';
                btn.onclick = () => window.open(`https://wa.me/5521995969378?text=Interesse em: ${encodeURIComponent(p.name||p.nome)}`);
                card.appendChild(btn); scroll.appendChild(card);
            });
            bubble.appendChild(scroll);
        }

        if(link) {
           const btn = document.createElement('a'); btn.href=link; btn.target='_blank';
           btn.className = 'block mt-2 text-center bg-green-500 text-white font-bold py-2 rounded-lg text-xs';
           btn.innerText = 'NEGOCIAR AGORA'; bubble.appendChild(btn);
        }

        div.appendChild(bubble); els.msgs.appendChild(div); scrollToBottom();
    }

    function addTyping() {
        const div = document.createElement('div'); div.id='typing'; div.className='message bot';
        div.innerHTML = `<div class="message-bubble"><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>`;
        els.msgs.appendChild(div); scrollToBottom();
    }

    async function send() {
        const txt = els.input.value.trim();
        if(!txt) return;
        els.input.value = ''; addMsg('user', txt); addTyping();
        
        // Ensure CONFIG is available (it should be in global scope from main.js or defined here)
        // For safety, we can default if not found, but it should be there.
        const api = (typeof CONFIG !== 'undefined' && CONFIG.CHAT_API) ? CONFIG.CHAT_API : 'https://atomic-thiago-backend.onrender.com/chat';

        try {
            const res = await fetch(api, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ message: txt, session_id: sessionId }) });
            const data = await res.json();
            document.getElementById('typing').remove();
            if(data.success) {
                if(data.session_id) { sessionId = data.session_id; localStorage.setItem('chat_sess_id', sessionId); }
                addMsg('bot', data.response, data.produtos_sugeridos, data.action_link);
            } else addMsg('bot', 'Desculpe, tive um erro técnico.');
        } catch { 
            document.getElementById('typing') ? document.getElementById('typing').remove() : null; 
            addMsg('bot', 'Sem conexão com a internet.'); 
        }
    }

    // Init Chat
    document.getElementById('sendBtn').onclick = send;
    els.input.onkeypress = e => e.key==='Enter' && send();
    
    // First Load
    if(els.msgs.children.length === 0) {
       setTimeout(() => addMsg('bot', 'E aí! 👋 Sou o **Thiago**, especialista da Atomic Games.\nPosso te ajudar a montar um PC, escolher um console ou ver acessórios?'), 1000);
    }
})();