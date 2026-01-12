
// === CHATBOT 2.8 (MODO HÍBRIDO: RETRY + WAIT TIME CORRIGIDO) ===
(function() {
    
    // --- 0. CONFIGURAÇÃO E DADOS LOCAIS ---
    const UI_HELPER = {
        critical_blocklist: [
            "crack", "ativador", "torrent", "baixar de graça", "pirata", 
            "senha do banco", "cartão de crédito", "cvv", "conserta agora"
        ],
        site_actions: {
            services: { 
                keys: [
                    "conserto", "reparo", "arrumar", "quebrado", "simulador", "orçamento",
                    "lento", "travando", "barulho", "aquecendo", "tela azul", "manutenção", "limpeza", "formatar", "virus", "laggando"
                ], 
                id: "services", 
                label: "Abrir Simulador de Reparo" 
            },
            location: { 
                keys: ["onde", "endereço", "local", "fica", "chegar", "perto", "loja"], 
                id: "location", 
                label: "Ver Mapa e Endereço" 
            }
        }
    };

    const els = { 
        bubble: document.getElementById('chatBubble'), 
        win: document.getElementById('chatWindow'), 
        msgs: document.getElementById('chatMessages'), 
        input: document.getElementById('chatInput'),
        badge: document.getElementById('chatBadge')
    };
    
    if (!els.bubble || !els.win) return;

    let state = { isOpen: false, isDragging: false, startX: 0, startY: 0, initialLeft: 0, initialTop: 0 };
    let sessionId = localStorage.getItem('chat_sess_id');
    let msgHistory = []; 

    // --- 1. UI CONTROL ---
    function updateChatUI(open) {
        state.isOpen = open;
        els.win.classList.toggle('open', open);
        els.badge.style.display = open ? 'none' : 'flex';
        document.body.classList.toggle('chat-open', open);
        if (open) {
            if(window.innerWidth <= 480) {
                const rect = els.bubble.getBoundingClientRect();
                els.win.style.transformOrigin = `${rect.left + rect.width/2}px ${rect.top + rect.height/2}px`;
            }
            els.bubble.style.transform = 'scale(0)'; els.bubble.style.opacity = '0'; els.bubble.style.pointerEvents = 'none';
            if(window.innerWidth > 768) setTimeout(() => els.input.focus(), 350);
            scrollToBottom();
        } else {
            els.bubble.style.transform = 'scale(1)'; els.bubble.style.opacity = '1'; els.bubble.style.pointerEvents = 'auto';
            els.input.blur();
        }
    }
    function openChat() { if(state.isOpen) return; history.pushState({chat: true}, '', '#chat'); updateChatUI(true); }
    function closeChat() { if(!state.isOpen) return; history.back(); }
    window.addEventListener('popstate', () => { if(state.isOpen) updateChatUI(false); });
    function scrollToBottom() { els.msgs.scrollTop = els.msgs.scrollHeight; }

    // --- 2. DRAG PHYSICS ---
    if(els.bubble) {
        const updatePos = (x, y) => { els.bubble.style.left = `${x}px`; els.bubble.style.top = `${y}px`; };
        els.bubble.addEventListener('touchstart', (e) => {
            const t = e.touches[0]; state.startX = t.clientX; state.startY = t.clientY;
            const rect = els.bubble.getBoundingClientRect(); state.initialLeft = rect.left; state.initialTop = rect.top;
            state.isDragging = false; els.bubble.classList.add('no-transition'); els.bubble.classList.remove('snapping');
            els.bubble.style.transform = 'scale(0.95)'; updatePos(rect.left, rect.top);
        }, { passive: true });
        els.bubble.addEventListener('touchmove', (e) => {
            const t = e.touches[0]; const dx = t.clientX - state.startX; const dy = t.clientY - state.startY;
            if (Math.sqrt(dx*dx + dy*dy) > 15) state.isDragging = true;
            if (state.isDragging) { e.preventDefault(); updatePos(state.initialLeft + dx, state.initialTop + dy); }
        }, { passive: false });
        els.bubble.addEventListener('touchend', (e) => {
            els.bubble.classList.remove('no-transition');
            if (!state.isDragging) { e.preventDefault(); els.bubble.style.transform = 'scale(1)'; openChat(); } else {
                els.bubble.style.transform = 'scale(1)'; els.bubble.classList.add('snapping');
                const rect = els.bubble.getBoundingClientRect(); const midX = window.innerWidth / 2;
                const snapX = (rect.left + rect.width/2) < midX ? 20 : window.innerWidth - rect.width - 20;
                let snapY = rect.top; if(snapY < 20) snapY = 20; if(snapY > window.innerHeight - 100) snapY = window.innerHeight - 100;
                updatePos(snapX, snapY);
            }
            state.isDragging = false;
        });
        els.bubble.addEventListener('click', (e) => { if(e.detail && !state.isDragging) { if(state.isOpen) closeChat(); else openChat(); } });
        document.getElementById('closeChatBtn').onclick = (e) => { e.stopPropagation(); closeChat(); };
        const resetBtn = document.getElementById('resetChatBtn');
        if(resetBtn) resetBtn.onclick = (e) => { e.stopPropagation(); if(confirm('Limpar histórico?')) { localStorage.removeItem('atomic_chat_history'); localStorage.removeItem('chat_sess_id'); msgHistory = []; els.msgs.innerHTML = ''; sessionId = null; setTimeout(() => addMsg('bot', 'Histórico limpo!'), 200); } };
    }

    // --- 3. RENDERING ---
    function parseText(text) {
        if(!text) return document.createTextNode("");
        const frag = document.createDocumentFragment();
        text.split('\n').forEach((line, i) => {
            if(i>0) frag.appendChild(document.createElement('br'));
            line.split('**').forEach((part, j) => { j%2 ? frag.appendChild(Object.assign(document.createElement('b'),{textContent:part})) : frag.appendChild(document.createTextNode(part)); });
        });
        return frag;
    }

    function addMsg(role, content, prods, link, actions = [], save = true) {
        // === CORREÇÃO DE MEMÓRIA: REMOVE APRESENTAÇÃO REPETIDA ===
        let cleanContent = content;
        if (role === 'bot' && msgHistory.length > 0) {
             // Regex agressivo para remover "Olá sou Thiago" no início da frase
             cleanContent = cleanContent.replace(/^(Olá|Oi|E aí|Opa)(!|,|\.)? (Eu )?(Sou|Aqui é) o Thiago.*?(\.|\!|\?|\n)/si, "").trim();
             if(cleanContent.length > 0) cleanContent = cleanContent.charAt(0).toUpperCase() + cleanContent.slice(1);
        }

        const div = document.createElement('div'); div.className = `message ${role}`;
        const bubble = document.createElement('div'); bubble.className = 'message-bubble';
        if(cleanContent) bubble.appendChild(parseText(cleanContent));
        
        if(prods?.length) {
            const scroll = document.createElement('div'); scroll.className = 'chat-products-scroll';
            prods.forEach(p => {
                const card = document.createElement('div'); card.className = 'chat-product-card';
                const img = document.createElement('img'); img.src = p.image || 'https://placehold.co/100';
                const title = document.createElement('div'); title.className = 'chat-product-title'; title.textContent = p.name || p.nome;
                const price = document.createElement('div'); price.className = 'chat-product-price'; price.textContent = p.price || p.preco;
                const btn = document.createElement('button'); btn.className = 'chat-add-btn'; btn.textContent = 'VER DETALHES';
                btn.onclick = (e) => { e.stopPropagation(); if(window.showProductDetail) window.showProductDetail(p.id); else window.open(`https://wa.me/5521995969378?text=Interesse em: ${p.name}`); };
                card.append(img, title, price, btn); scroll.appendChild(card);
            });
            bubble.appendChild(scroll);
        }

        if(link) {
           const btn = document.createElement('a'); btn.href=link; btn.target='_blank';
           btn.className = 'block mt-2 text-center bg-green-500 text-white font-bold py-2 rounded-lg text-xs hover:bg-green-600';
           btn.textContent = 'NEGOCIAR AGORA'; bubble.appendChild(btn);
        }

        if (actions && actions.length > 0) {
            const actionContainer = document.createElement('div'); actionContainer.className = 'mt-3 flex flex-col gap-2';
            actions.forEach(act => {
                const actBtn = document.createElement('button');
                actBtn.className = 'flex items-center justify-between w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs font-bold hover:bg-yellow-400 hover:text-black transition-colors';
                actBtn.innerHTML = `<span>${act.label}</span><i class="ph-bold ${act.icon}"></i>`;
                actBtn.onclick = () => { if (act.targetId) document.getElementById(act.targetId)?.scrollIntoView({behavior:'smooth'}); else if (act.url) window.open(act.url, '_blank'); };
                actionContainer.appendChild(actBtn);
            });
            bubble.appendChild(actionContainer);
        }
        div.appendChild(bubble); els.msgs.appendChild(div); scrollToBottom();
        if (save) { msgHistory.push({ role, content, prods, link, actions }); localStorage.setItem('atomic_chat_history', JSON.stringify(msgHistory)); }
    }

    // --- 4. INTELLIGENCE ---
    function getVisualContext(text) {
        const lower = text.toLowerCase();
        let actions = [];
        if (UI_HELPER.site_actions.services.keys.some(k => lower.includes(k))) 
            actions.push({ label: `${UI_HELPER.site_actions.services.label} 👇`, icon: 'ph-wrench', targetId: 'services' });
        if (UI_HELPER.site_actions.location.keys.some(k => lower.includes(k))) 
            actions.push({ label: UI_HELPER.site_actions.location.label, icon: 'ph-map-pin', targetId: 'location' });
        return actions;
    }

    // === MODO DE EMERGÊNCIA LOCAL (FALLBACK) ===
    function getEmergencyResponse(text) {
        const lower = text.toLowerCase();
        if (lower.match(/(lento|travando|barulho|esquentando|manutenção|conserto|reparo|formatar)/)) {
            return "Notei que você está precisando de assistência técnica. No momento estou com uma instabilidade para consultar detalhes, mas você pode usar nosso **Simulador de Reparo** abaixo para ter uma estimativa agora mesmo!";
        }
        if (lower.match(/(preço|valor|custa|quanto)/)) {
            return "Para te passar o valor exato, preciso que nossa equipe analise. Mas você pode clicar no botão abaixo para simular um orçamento ou chamar no WhatsApp!";
        }
        return "Estou com uma pequena instabilidade de conexão com meu servidor central. Mas não se preocupe! Nossa equipe humana está pronta no WhatsApp, ou você pode usar os botões abaixo.";
    }

    async function send() {
        const txt = els.input.value.trim();
        if(!txt) return;

        if (UI_HELPER.critical_blocklist.some(term => txt.toLowerCase().includes(term))) {
             els.input.value = ''; addMsg('user', txt);
             setTimeout(() => addMsg('bot', '🔒 **Segurança:** Identifiquei termos não permitidos. Não realizamos procedimentos em softwares ilegais.', [], null, [], true), 600);
             return;
        }

        els.input.value = ''; addMsg('user', txt); 
        const loadingDiv = document.createElement('div'); loadingDiv.id='typing'; loadingDiv.className='message bot';
        loadingDiv.innerHTML = `<div class="message-bubble"><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>`;
        els.msgs.appendChild(loadingDiv); scrollToBottom();

        const localActions = getVisualContext(txt);
        const api = (typeof CONFIG !== 'undefined' && CONFIG.CHAT_API) ? CONFIG.CHAT_API : 'https://atomic-thiago-backend.onrender.com/chat';

        try {
            // REMOVIDO: AbortController com 10s. Isso causava o erro imediato em cold starts.
            // Agora confiamos no timeout padrão do navegador (~60s), dando tempo para o Render acordar.
            
            const res = await fetch(api, { 
                method: 'POST', 
                headers: {'Content-Type':'application/json'}, 
                body: JSON.stringify({ message: txt, session_id: sessionId })
            });

            const data = await res.json();
            
            document.getElementById('typing')?.remove();
            
            if(data.success) {
                if(data.session_id) { sessionId = data.session_id; localStorage.setItem('chat_sess_id', sessionId); }
                const finalActions = [...localActions, ...(data.actions || [])];
                
                let responseText = data.response || "";
                if (responseText && responseText.length > 20 && !/[.!?;]$/.test(responseText.trim())) responseText += "...";

                addMsg('bot', responseText, data.produtos_sugeridos, data.action_link, finalActions);
            } else {
                throw new Error("API Logical Error"); 
            }
        } catch (e) { 
            console.warn("Chatbot Fallback Triggered:", e);
            document.getElementById('typing')?.remove();
            
            // Em caso de erro real (servidor offline após tempo limite), reseta ID e usa fallback
            localStorage.removeItem('chat_sess_id'); sessionId = null;
            const emergencyText = getEmergencyResponse(txt);
            addMsg('bot', emergencyText, [], null, localActions); 
        }
    }

    document.getElementById('sendBtn').onclick = send;
    els.input.addEventListener('keydown', (e) => { if(e.key === 'Enter') send(); });
    ['mousedown', 'touchstart'].forEach(evt => els.input.addEventListener(evt, (e) => { e.stopPropagation(); els.input.focus(); }));

    try {
        const savedHist = localStorage.getItem('atomic_chat_history');
        if (savedHist) {
            msgHistory = JSON.parse(savedHist);
            msgHistory.forEach(m => addMsg(m.role, m.content, m.prods, m.link, m.actions, false));
        } else {
            setTimeout(() => addMsg('bot', 'E aí! 👋 Sou o **Thiago**, especialista da Atomic Games.\nPosso te ajudar a montar um PC, escolher um console ou fazer um orçamento de manutenção?'), 1000);
        }
    } catch(e) {}

    // Wake up API silently (Ping)
    setTimeout(() => {
        const api = (typeof CONFIG !== 'undefined' && CONFIG.CHAT_API) ? CONFIG.CHAT_API : 'https://atomic-thiago-backend.onrender.com/chat';
        fetch(api.replace('/chat', ''), { method: 'HEAD', mode: 'no-cors' }).catch(() => {});
    }, 2000);

    // External Trigger
    window.AtomicChat = {
        processBudget: function(context) {
            if (!context || context.status !== 'completed') return;
            if (!state.isOpen) openChat();
            const fmt = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            let servName = context.service.name;
            let priceStr = `${fmt(context.financial.totalMin)} a ${fmt(context.financial.totalMax)}`;
            if (context.service.customDescription) { servName += `: "${context.service.customDescription}"`; priceStr = "Sob Análise"; }
            
            const msg = `Olá **${context.customer.name || 'Gamer'}**! 👋\nRecebi sua estimativa para o **${context.device.modelLabel}**.\n\n🔧 Serviço: ${servName}\n💰 Estimativa: **${priceStr}**\n\nPosso confirmar o agendamento?`;
            const waLink = `https://wa.me/5521995969378?text=${encodeURIComponent(`*ORÇAMENTO WEB*\n${context.device.modelLabel} - ${servName}\nValor: ${priceStr}`)}`;
            
            setTimeout(() => { addMsg('bot', msg, [], null, [{ label: 'Agendar no WhatsApp', icon: 'ph-whatsapp-logo', url: waLink }], true); }, 500);
        }
    };
})();
