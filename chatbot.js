// === CHATBOT 3.7 (LEGACY LOGIC RESTORED) ===
// Estrutura v2.1 exata, adaptada para os IDs do novo HTML.

(function() {
    // --- Mapeamento de IDs (HTML Novo -> Lógica Antiga) ---
    const els = { 
        bubble: document.getElementById('chat-bubble'), 
        win: document.getElementById('chat-container'), 
        msgs: document.getElementById('chat-messages'), 
        input: document.getElementById('chat-input'),
        badge: document.getElementById('chat-badge'),
        closeBtn: document.getElementById('chat-close'), // Botão X do topo
        sendBtn: document.getElementById('chat-send'),
        form: document.getElementById('chat-form')
    };
    
    // Check if chatbot elements exist (in case of partial page loads)
    if (!els.bubble || !els.win) return;

    // --- ESTADO (Idêntico v2.1) ---
    let state = { isOpen: false, isDragging: false, startX: 0, startY: 0, initialLeft: 0, initialTop: 0 };
    let sessionId = localStorage.getItem('chat_sess_id');
    let msgHistory = []; // Local history storage

    // --- UI LOGIC ---
    function updateChatUI(open) {
        state.isOpen = open;
        
        if (open) {
            els.win.classList.add('open');
            els.bubble.classList.add('open');
            if(els.badge) els.badge.style.display = 'none';
            document.body.classList.add('chat-open');

            // Morph effect for mobile (Lógica v2.1 mantida)
            if(window.innerWidth <= 480) {
                const rect = els.bubble.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                // Ajuste para o CSS atual
                els.win.style.transformOrigin = "bottom right"; 
            }

            els.bubble.style.transform = 'scale(0)'; 
            els.bubble.style.opacity = '0';
            els.bubble.style.pointerEvents = 'none';
            
            if(window.innerWidth > 768) setTimeout(() => els.input.focus(), 350);
            scrollToBottom();
        } else {
            els.win.classList.remove('open');
            els.bubble.classList.remove('open');
            if(els.badge) els.badge.style.display = 'flex';
            document.body.classList.remove('chat-open');

            els.bubble.style.transform = 'scale(1)';
            els.bubble.style.opacity = '1';
            els.bubble.style.pointerEvents = 'auto';
            els.input.blur();
        }
    }

    // --- HISTORY API (Idêntico v2.1 com proteção de erro) ---
    function openChat() {
        if(state.isOpen) return;
        updateChatUI(true); // UI Primeiro para garantir abertura visual
        try { history.pushState({chat: true}, '', '#chat'); } catch(e) {}
    }

    function closeChat() {
        if(!state.isOpen) return;
        try {
            if(history.state && history.state.chat) history.back();
            else updateChatUI(false);
        } catch(e) { updateChatUI(false); }
    }

    window.addEventListener('popstate', (e) => {
        if(state.isOpen) updateChatUI(false);
    });

    function scrollToBottom() { els.msgs.scrollTop = els.msgs.scrollHeight; }

    // --- DRAG PHYSICS (Lógica v2.1 Exata) ---
    if(els.bubble) {
        const updatePos = (x, y) => { els.bubble.style.left = `${x}px`; els.bubble.style.top = `${y}px`; };
        
        els.bubble.addEventListener('touchstart', (e) => {
            const t = e.touches[0];
            state.startX = t.clientX; state.startY = t.clientY;
            const rect = els.bubble.getBoundingClientRect();
            state.initialLeft = rect.left; state.initialTop = rect.top;
            state.isDragging = false;
            
            // Remove transição para arrastar suavemente
            els.bubble.style.transition = 'none';
            els.bubble.style.transform = 'scale(0.95)';
        }, { passive: true });

        els.bubble.addEventListener('touchmove', (e) => {
            const t = e.touches[0];
            const dx = t.clientX - state.startX;
            const dy = t.clientY - state.startY;
            if (Math.sqrt(dx*dx + dy*dy) > 15) state.isDragging = true;
            if (state.isDragging) { 
                e.preventDefault(); 
                updatePos(state.initialLeft + dx, state.initialTop + dy); 
            }
        }, { passive: false });

        els.bubble.addEventListener('touchend', (e) => {
            els.bubble.style.transition = 'all 0.3s ease'; // Restaura animação
            
            if (!state.isDragging) {
                e.preventDefault(); 
                els.bubble.style.transform = 'scale(1)'; 
                if(state.isOpen) closeChat(); else openChat(); 
            } else {
                els.bubble.style.transform = 'scale(1)';
                // Snapping Logic (Imã)
                const rect = els.bubble.getBoundingClientRect();
                const midX = window.innerWidth / 2;
                const snapX = (rect.left + rect.width/2) < midX ? 24 : window.innerWidth - rect.width - 24;
                let snapY = rect.top;
                if(snapY < 24) snapY = 24;
                if(snapY > window.innerHeight - 100) snapY = window.innerHeight - 100;
                updatePos(snapX, snapY);
            }
            state.isDragging = false;
        });
        
        // Click Desktop
        els.bubble.addEventListener('click', (e) => { 
            if(e.detail && !state.isDragging) { 
                if(state.isOpen) closeChat(); else openChat(); 
            } 
        });
        
        els.closeBtn.onclick = (e) => { e.stopPropagation(); closeChat(); };
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

    function addMsg(role, content, prods, link, actions = [], save = true) {
        const div = document.createElement('div'); div.className = `message ${role}`;
        
        // Avatar HTML (Adaptado para layout novo)
        const avatarHtml = role === 'bot' 
            ? `<div class="message-avatar">🎮</div>` 
            : `<div class="message-avatar">👤</div>`;

        const contentDiv = document.createElement('div'); contentDiv.className = 'message-content';
        const bubble = document.createElement('div'); bubble.className = 'message-bubble';
        
        if(content) bubble.appendChild(parseText(content));
        
        // --- PRODUTOS (LÓGICA CRÍTICA DE POP-UP RESTAURADA) ---
        if(prods?.length) {
            // Usando classes do CSS atual mas lógica JS antiga
            prods.forEach(p => {
                const card = document.createElement('div'); card.className = 'product-card';
                card.style.cursor = 'pointer';

                card.innerHTML = `
                    <div class="product-info"><h4>${p.name || p.nome}</h4><span>ID: ${p.id}</span></div>
                    <div class="product-price">${p.price || p.preco}</div>
                `;
                
                // EVENTO DE CLIQUE: Tenta abrir modal do site, senão abre WhatsApp
                card.onclick = (e) => {
                    e.stopPropagation();
                    const prodId = p.id; 
                    
                    if (window.showProductDetail && prodId) {
                        // Se estiver no mobile, fecha o chat para mostrar o modal
                        if(window.innerWidth <= 768) {
                            updateChatUI(false); 
                        }
                        window.showProductDetail(prodId);
                    } else {
                        // Fallback se não tiver a função no site
                        window.open(`https://wa.me/5521995969378?text=Interesse em: ${encodeURIComponent(p.name||p.nome)}`);
                    }
                };
                
                bubble.appendChild(card);
            });
        }

        // --- LINKS DE AÇÃO ---
        if(link) {
           const btn = document.createElement('a'); btn.href=link; btn.target='_blank';
           btn.className = 'action-button';
           btn.innerHTML = 'NEGOCIAR AGORA <i class="fas fa-arrow-right"></i>';
           bubble.appendChild(btn);
        }

        // --- AÇÕES INTELIGENTES (Contexto do Site) ---
        if (actions && actions.length > 0) {
            const actionContainer = document.createElement('div');
            // Inline style para garantir funcionamento sem CSS extra
            Object.assign(actionContainer.style, { marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' });
            
            actions.forEach(act => {
                const actBtn = document.createElement('button');
                actBtn.className = 'quick-action-btn'; // Reutilizando classe existente
                actBtn.style.textAlign = 'left';
                actBtn.style.width = '100%';
                
                actBtn.innerHTML = `${act.label} <i class="${act.icon || 'fas fa-arrow-right'}"></i>`;
                
                // Lógica de Scroll ou URL
                actBtn.onclick = () => {
                    if (act.targetId) {
                        const target = document.getElementById(act.targetId);
                        if(target) {
                            if(window.innerWidth < 768) updateChatUI(false);
                            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    } else if (act.url) {
                        window.open(act.url, '_blank');
                    }
                };
                actionContainer.appendChild(actBtn);
            });
            bubble.appendChild(actionContainer);
        }

        contentDiv.appendChild(bubble);

        // Montagem do balão
        if(role === 'bot') {
            div.innerHTML = avatarHtml;
            div.appendChild(contentDiv);
        } else {
            div.appendChild(contentDiv);
            div.insertAdjacentHTML('beforeend', avatarHtml);
        }

        els.msgs.appendChild(div); scrollToBottom();

        if (save) {
            msgHistory.push({ role, content, prods, link, actions });
            localStorage.setItem('atomic_chat_history', JSON.stringify(msgHistory));
        }
    }

    function addTyping() {
        const div = document.createElement('div'); div.id='typing'; div.className='typing-indicator';
        div.innerHTML = `<div class="message-avatar">🎮</div><div class="typing-dots"><span></span><span></span><span></span></div>`;
        els.msgs.appendChild(div); scrollToBottom();
    }

    // --- CONTEXT AWARENESS (O Cérebro Local - RESTAURADO) ---
    function checkSiteContext(text) {
        const t = text.toLowerCase();
        const actions = [];

        if (t.includes('limpeza') || t.includes('manutenção') || t.includes('conserto') || t.includes('reparo') || t.includes('orçamento')) {
            actions.push({
                label: `Abrir Simulador de Reparo`,
                icon: 'fas fa-wrench',
                targetId: 'services' // ID do HTML
            });
        }

        if (t.includes('onde fica') || t.includes('endereço') || t.includes('localização')) {
            actions.push({
                label: 'Ver Mapa e Endereço',
                icon: 'fas fa-map-marker-alt',
                targetId: 'location' // ID do HTML
            });
        }

        return actions;
    }

    async function send(e) {
        if(e) e.preventDefault();
        const txt = els.input.value.trim();
        if(!txt) return;
        
        els.input.value = ''; 
        addMsg('user', txt); 
        addTyping();
        
        const localActions = checkSiteContext(txt);
        const api = 'https://atomic-thiago-backend.onrender.com/chat';

        try {
            const res = await fetch(api, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ message: txt, session_id: sessionId }) });
            const data = await res.json();
            
            document.getElementById('typing')?.remove();
            
            if(data.success !== false) {
                if(data.session_id) { sessionId = data.session_id; localStorage.setItem('chat_sess_id', sessionId); }
                addMsg('bot', data.response, data.produtos_sugeridos, data.action_link, [...(data.local_actions || []), ...localActions]);
            } else {
                addMsg('bot', 'Desculpe, tive um erro técnico.', [], null, localActions);
            }
        } catch(err) { 
            console.error(err);
            document.getElementById('typing')?.remove(); 
            addMsg('bot', 'Sem conexão com a internet.', [], null, localActions); 
        }
    }

    els.form.addEventListener('submit', send);
    els.sendBtn.addEventListener('click', send);

    // Botões Rápidos (Quick Actions)
    document.querySelectorAll('.quick-action-btn').forEach(btn => {
        if(btn.dataset.msg) {
            btn.addEventListener('click', () => {
                els.input.value = btn.dataset.msg;
                send();
            });
        }
    });

    // LOAD HISTORY
    try {
        const savedHist = localStorage.getItem('atomic_chat_history');
        if (savedHist) {
            msgHistory = JSON.parse(savedHist);
            msgHistory.forEach(m => addMsg(m.role, m.content, m.prods, m.link, m.actions, false));
        } else {
            setTimeout(() => addMsg('bot', 'E aí! 👋 Sou o **Thiago**, especialista da Atomic Games.\nPosso te ajudar a montar um PC, escolher um console ou fazer um orçamento de manutenção?'), 1000);
        }
    } catch(e) { console.error("History load error", e); }


    // === ATOMIC GLOBAL API (HOOK DE INTEGRAÇÃO - RESTAURADO) ===
    window.AtomicChat = {
        open: function() { openChat(); },
        
        /**
         * Recebe o Objeto de Contexto Único da Calculadora e inicia o atendimento.
         * Lógica essencial para integração com o site principal.
         */
        processBudget: function(context) {
            if (!context || context.status !== 'completed') return;

            // 1. Abre o Chat
            if (!state.isOpen) openChat();

            // 2. Formata Valores
            const fmt = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            
            let finalServiceName = context.service.name;
            let finalPriceStr = `${fmt(context.financial.totalMin)} a ${fmt(context.financial.totalMax)}`;

            if (context.service.customDescription) {
                finalServiceName = `${context.service.name}: "${context.service.customDescription}"`;
                finalPriceStr = "Sob Análise Técnica";
            }

            // 3. Constrói a Mensagem Contextual
            const msg = `Olá **${context.customer.name || 'Gamer'}**! 👋\n` +
                        `Recebi sua estimativa para o **${context.device.modelLabel}**.\n\n` +
                        `🔧 Serviço: ${finalServiceName}\n` +
                        `💰 Estimativa: **${finalPriceStr}**\n` +
                        `📍 Logística: ${context.logistics.label}\n\n` +
                        `Posso confirmar o agendamento ou você tem alguma dúvida sobre o serviço?`;

            // 4. Gera Link do WhatsApp
            const waMsg = `*ORÇAMENTO TÉCNICO (WEB)*\n\n` +
                          `👤 *${context.customer.name}*\n` +
                          `📱 ${context.customer.phone}\n` +
                          `--------------------------------\n` +
                          `🎮 *Aparelho:* ${context.device.modelLabel}\n` +
                          `🛠️ *Serviço:* ${finalServiceName}\n` +
                          `📍 *Logística:* ${context.logistics.label}\n` +
                          `💰 *Estimativa:* ${finalPriceStr}\n` +
                          `--------------------------------\n` +
                          `*Obs:* Vim pelo Chat do Site.`;
            
            const waLink = `https://wa.me/5521995969378?text=${encodeURIComponent(waMsg)}`;

            // 5. Injeta a Mensagem
            setTimeout(() => {
                addMsg('bot', msg, [], null, [
                    { label: 'Agendar no WhatsApp', icon: 'fab fa-whatsapp', url: waLink }
                ], true);
            }, 500);
        }
    };
    
    console.log("Atomic Chat: v3.7 (Restore Complete)");

})();
