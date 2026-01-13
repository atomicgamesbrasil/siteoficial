// === CHATBOT 3.6 (ORIGINAL PHYSICS RESTORED) ===
// Baseado na v2.1 Original - Ajustado para IDs atuais

(function() {
    console.log("Atomic Chat: Loading Original Logic...");

    // --- CONFIGURATION ---
    const BACKEND_URL = 'https://atomic-thiago-backend.onrender.com/chat';

    // --- DOM ELEMENTS (Mapeado para o index.html atual) ---
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
        console.error("Atomic Chat: UI elements missing.");
        return;
    }

    // --- STATE ---
    // Usando a estrutura exata da v2.1
    let state = { isOpen: false, isDragging: false, startX: 0, startY: 0, initialLeft: 0, initialTop: 0 };
    
    // Armazenamento seguro (Try/Catch para evitar erros locais)
    const getStorage = (k) => { try { return localStorage.getItem(k); } catch(e) { return null; } };
    const setStorage = (k, v) => { try { localStorage.setItem(k, v); } catch(e) {} };

    let sessionId = getStorage('atomic_session_id') || 'sess_' + Date.now();

    // --- UI LOGIC (Original v2.1) ---
    function updateChatUI(open) {
        state.isOpen = open;
        
        // Toggle classes
        if(open) {
            els.win.classList.add('open');
            els.bubble.classList.add('open');
            els.badge.style.display = 'none';
        } else {
            els.win.classList.remove('open');
            els.bubble.classList.remove('open');
            els.badge.style.display = 'flex'; // Exibe o badge se tiver msg
        }
        
        if (open) {
            // Morph effect for mobile (Original v2.1 logic)
            if(window.innerWidth <= 480) {
                const rect = els.bubble.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                els.win.style.transformOrigin = "bottom right"; // Simplificado para garantir funcionamento
            }

            // Animation: Hide bubble
            els.bubble.style.transform = 'scale(0)'; 
            els.bubble.style.opacity = '0';
            els.bubble.style.pointerEvents = 'none';
            
            // Focus logic
            if(window.innerWidth > 768) setTimeout(() => els.input.focus(), 350);
            scrollToBottom();
        } else {
            // Animation: Show bubble
            els.bubble.style.transform = 'scale(1)';
            els.bubble.style.opacity = '1';
            els.bubble.style.pointerEvents = 'auto';
            els.input.blur();
        }
    }

    // --- ACTIONS ---
    function openChat() {
        if(state.isOpen) return;
        // Tenta usar History API, se falhar (local), ignora e abre igual
        try { history.pushState({chat: true}, '', '#chat'); } catch(e) {}
        updateChatUI(true);
    }

    function closeChat() {
        if(!state.isOpen) return;
        // Tenta voltar no history, se falhar, fecha manual
        try { 
            if(history.state && history.state.chat) history.back(); 
            else updateChatUI(false);
        } catch(e) {
            updateChatUI(false);
        }
    }

    function toggleChat() { state.isOpen ? closeChat() : openChat(); }

    window.addEventListener('popstate', () => { if(state.isOpen) updateChatUI(false); });
    function scrollToBottom() { els.msgs.scrollTop = els.msgs.scrollHeight; }

    // --- DRAG PHYSICS (Cópia exata da v2.1 "Magnetic") ---
    if(els.bubble) {
        const updatePos = (x, y) => { els.bubble.style.left = `${x}px`; els.bubble.style.top = `${y}px`; };
        
        // Touch Start
        els.bubble.addEventListener('touchstart', (e) => {
            const t = e.touches[0];
            state.startX = t.clientX; state.startY = t.clientY;
            const rect = els.bubble.getBoundingClientRect();
            state.initialLeft = rect.left; state.initialTop = rect.top;
            state.isDragging = false;
            
            els.bubble.style.transition = 'none'; // Remove animação para arrastar instantâneo
        }, { passive: true });

        // Touch Move
        els.bubble.addEventListener('touchmove', (e) => {
            const t = e.touches[0];
            const dx = t.clientX - state.startX;
            const dy = t.clientY - state.startY;
            
            // Sensibilidade de arrasto (10px)
            if (Math.sqrt(dx*dx + dy*dy) > 10) state.isDragging = true;
            
            if (state.isDragging) { 
                e.preventDefault(); // Evita scroll da tela
                updatePos(state.initialLeft + dx, state.initialTop + dy); 
            }
        }, { passive: false });

        // Touch End
        els.bubble.addEventListener('touchend', (e) => {
            els.bubble.style.transition = 'all 0.3s ease'; // Retorna animação suave
            
            if (!state.isDragging) {
                // FOI UM CLIQUE (Toque rápido sem arrastar)
                e.preventDefault(); 
                els.bubble.style.transform = 'scale(1)'; 
                toggleChat(); // Abre/Fecha
            } else {
                // FOI UM ARRASTO (Soltou a bolha)
                els.bubble.style.transform = 'scale(1)';
                
                // Lógica de "Imã" para colar na parede (v2.1)
                const rect = els.bubble.getBoundingClientRect();
                const midX = window.innerWidth / 2;
                const snapX = (rect.left + rect.width/2) < midX ? 24 : window.innerWidth - rect.width - 24;
                let snapY = rect.top;
                
                // Limites verticais
                if(snapY < 24) snapY = 24;
                if(snapY > window.innerHeight - 100) snapY = window.innerHeight - 100;
                
                updatePos(snapX, snapY);
            }
            state.isDragging = false;
        });
        
        // Mouse Click (Desktop)
        els.bubble.addEventListener('click', (e) => { 
            if(!state.isDragging) toggleChat(); 
        });

        // Close Button
        els.closeBtn.onclick = (e) => { 
            e.stopPropagation(); 
            closeChat(); 
        };
    }

    // --- MESSAGING ---
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
        
        // Avatar HTML
        const avatarHtml = role === 'bot' 
            ? `<div class="message-avatar">🎮</div>` 
            : `<div class="message-avatar">👤</div>`;
        
        const contentDiv = document.createElement('div'); contentDiv.className = 'message-content';
        const bubble = document.createElement('div'); bubble.className = 'message-bubble';
        
        if(content) bubble.appendChild(parseText(content));
        
        // Products
        if(prods && prods.length > 0) {
            prods.forEach(p => {
                const card = document.createElement('div'); card.className = 'product-card';
                card.innerHTML = `
                    <div class="product-info"><h4>${p.name || p.nome}</h4><span>${p.id}</span></div>
                    <div class="product-price">${p.price || p.preco}</div>`;
                card.onclick = (e) => {
                    e.stopPropagation();
                    window.open(`https://wa.me/5521995969378?text=Tenho interesse em: ${p.name}`);
                };
                bubble.appendChild(card);
            });
        }

        // Link Action
        if(link) {
           const btn = document.createElement('a'); 
           btn.href = link; btn.target = '_blank';
           btn.className = 'action-button';
           btn.innerHTML = `NEGOCIAR AGORA <i class="fas fa-arrow-right"></i>`;
           bubble.appendChild(btn);
        }

        // Context Actions
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
                            if(window.innerWidth < 768) updateChatUI(false); // Fecha chat no mobile
                            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    } else if (act.url) {
                         window.open(act.url, '_blank');
                    }
                };
                actionContainer.appendChild(btn);
            });
            bubble.appendChild(actionContainer);
        }

        contentDiv.appendChild(bubble);
        
        // Order based on role
        if(role === 'bot') {
            div.innerHTML = avatarHtml;
            div.appendChild(contentDiv);
        } else {
            div.appendChild(contentDiv);
            div.insertAdjacentHTML('beforeend', avatarHtml);
        }
        
        els.msgs.appendChild(div); 
        scrollToBottom();
        
        // Save history safely
        const hist = JSON.parse(getStorage('atomic_chat_history') || '[]');
        hist.push({ role, content, prods, link, actions });
        setStorage('atomic_chat_history', JSON.stringify(hist));
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
                setStorage('atomic_session_id', sessionId);
            }
            
            if(data.success !== false) {
                addMsg('bot', data.response, data.produtos_sugeridos, data.action_link, data.local_actions);
            } else {
                 addMsg('bot', 'Tive um problema técnico. Pode tentar de novo?');
            }

        } catch(e) { 
            console.error(e);
            document.getElementById('typing')?.remove();
            addMsg('bot', '⚠️ Sem conexão. Verifique a internet.'); 
        }
    }

    // --- INIT ---
    els.form.addEventListener('submit', sendMessage);
    els.sendBtn.addEventListener('click', sendMessage);
    
    // Quick Actions
    document.querySelectorAll('.quick-action-btn').forEach(btn => {
        if(btn.dataset.msg) {
            btn.addEventListener('click', () => {
                els.input.value = btn.dataset.msg;
                sendMessage();
            });
        }
    });

    // Load History
    const savedHist = getStorage('atomic_chat_history');
    if (savedHist) {
        try { JSON.parse(savedHist).forEach(m => addMsg(m.role, m.content, m.prods, m.link, m.actions)); } catch(e){}
    } else {
        setTimeout(() => addMsg('bot', 'E aí! 👋 Sou o **Thiago**, especialista da Atomic Games.\nPosso ajudar com Peças, PC Gamer ou Manutenção?'), 1000);
    }

    // --- GLOBAL API (Recreated from v2.1) ---
    window.AtomicChat = {
        open: function() { openChat(); },
        openWithContext: function(message) {
            openChat();
            addMsg('bot', message, [], null, [{label: 'WhatsApp', url: 'https://wa.me/5521995969378', icon: 'fab fa-whatsapp'}]);
        }
    };
    
    console.log("Atomic Chat: Logic Restored.");

})();