
// === CHATBOT 3.2 (BRAIN INTEGRATION: CLASSIFICATION & SECURITY + STABILITY FIX) ===
// Inclui: Injeção de CSS/HTML + Lógica de Classificação Local + Payload Higienizado

(function() {
    // --- 1. ESTILOS E ESTRUTURA ---
    const STYLES = `
        :root { --chat-primary: #10b981; --chat-bg: #ffffff; --chat-dark: #1f2937; }
        #chatBubble {
            position: fixed; bottom: 20px; right: 20px; width: 60px; height: 60px;
            background: var(--chat-primary); border-radius: 50%; box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            cursor: pointer; z-index: 9999; display: flex; align-items: center; justify-content: center;
            transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        #chatBubble:hover { transform: scale(1.1); }
        #chatBubble svg { width: 32px; height: 32px; fill: white; }
        #chatBadge {
            position: absolute; top: -5px; right: -5px; background: #ef4444; color: white;
            font-size: 11px; font-weight: bold; width: 20px; height: 20px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center; border: 2px solid white;
        }
        #chatWindow {
            position: fixed; bottom: 90px; right: 20px; width: 380px; height: 600px; max-height: 80vh;
            background: #fff; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.15);
            display: flex; flex-direction: column; overflow: hidden; z-index: 9999;
            transform: scale(0); transform-origin: bottom right; opacity: 0; pointer-events: none;
            transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1); font-family: 'Segoe UI', sans-serif;
        }
        #chatWindow.open { transform: scale(1); opacity: 1; pointer-events: auto; }
        .chat-header {
            background: #111827; color: white; padding: 16px; display: flex; align-items: center; justify-content: space-between;
        }
        .chat-profile { display: flex; align-items: center; gap: 12px; }
        .chat-avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid #10b981; }
        .chat-info h3 { margin: 0; font-size: 16px; font-weight: 600; }
        .chat-status { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #10b981; }
        .status-dot { width: 8px; height: 8px; background: #10b981; border-radius: 50%; }
        .chat-controls button { background: none; border: none; color: #9ca3af; cursor: pointer; padding: 4px; transition: color 0.2s; }
        .chat-controls button:hover { color: white; }
        
        #chatMessages { flex: 1; overflow-y: auto; padding: 20px; background: #f3f4f6; display: flex; flex-direction: column; gap: 12px; }
        .message { display: flex; flex-direction: column; max-width: 85%; animation: fadeIn 0.3s ease; }
        .message.user { align-self: flex-end; align-items: flex-end; }
        .message.bot { align-self: flex-start; align-items: flex-start; }
        .message-bubble {
            padding: 12px 16px; border-radius: 12px; font-size: 14px; line-height: 1.5; position: relative; word-wrap: break-word;
        }
        .message.user .message-bubble { background: #facc15; color: #111827; border-bottom-right-radius: 2px; font-weight: 500; }
        .message.bot .message-bubble { background: #1f2937; color: #f3f4f6; border-bottom-left-radius: 2px; }
        
        .chat-input-area { padding: 12px; background: white; border-top: 1px solid #e5e7eb; display: flex; gap: 8px; align-items: center; }
        #chatInput { flex: 1; padding: 10px 14px; border: 1px solid #e5e7eb; border-radius: 24px; outline: none; transition: border-color 0.2s; }
        #chatInput:focus { border-color: #10b981; }
        #sendBtn { width: 40px; height: 40px; background: #111827; border-radius: 50%; border: none; color: #facc15; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: transform 0.2s; }
        #sendBtn:hover { transform: scale(1.05); }

        /* Typing & Products */
        .typing-indicator { display: flex; gap: 4px; padding: 4px; }
        .typing-dot { width: 6px; height: 6px; background: #9ca3af; border-radius: 50%; animation: bounce 1.4s infinite ease-in-out; }
        .typing-dot:nth-child(1) { animation-delay: -0.32s; }
        .typing-dot:nth-child(2) { animation-delay: -0.16s; }
        @keyframes bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        .chat-products-scroll { display: flex; gap: 10px; overflow-x: auto; padding: 10px 0; width: 100%; scrollbar-width: none; }
        .chat-product-card { min-width: 140px; background: white; border-radius: 8px; padding: 10px; display: flex; flex-direction: column; align-items: center; gap: 8px; border: 1px solid #374151; }
        .chat-product-card img { width: 80px; height: 80px; object-fit: contain; }
        .chat-product-title { font-size: 12px; font-weight: bold; text-align: center; color: #111827; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .chat-product-price { color: #10b981; font-weight: 800; font-size: 13px; }
        .chat-add-btn { background: #111827; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 10px; font-weight: bold; cursor: pointer; width: 100%; }

        @media (max-width: 480px) {
            #chatWindow { width: 100%; height: 100%; bottom: 0; right: 0; border-radius: 0; max-height: 100%; }
            #chatBubble { bottom: 20px; right: 20px; }
        }
    `;

    const HTML = `
        <div id="chatBubble">
            <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
            <div id="chatBadge">1</div>
        </div>
        <div id="chatWindow">
            <div class="chat-header">
                <div class="chat-profile">
                    <img src="https://ui-avatars.com/api/?name=Thiago+Atomic&background=10b981&color=fff" class="chat-avatar" alt="Avatar">
                    <div class="chat-info">
                        <h3>Thiago - Atomic</h3>
                        <div class="chat-status"><div class="status-dot"></div>Online Agora</div>
                    </div>
                </div>
                <div class="chat-controls">
                    <button id="resetChatBtn" title="Limpar conversa">🗑️</button>
                    <button id="closeChatBtn" title="Minimizar">✖</button>
                </div>
            </div>
            <div id="chatMessages"></div>
            <div class="chat-input-area">
                <input type="text" id="chatInput" placeholder="Digite sua dúvida..." autocomplete="off">
                <button id="sendBtn"><svg style="width:20px;height:20px;fill:currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button>
            </div>
        </div>
    `;

    function injectInterface() {
        if (document.getElementById('chatBubble')) return; 
        const style = document.createElement('style'); style.textContent = STYLES; document.head.appendChild(style);
        const container = document.createElement('div'); container.id = 'atomic-chat-root'; container.innerHTML = HTML; document.body.appendChild(container);
    }
    injectInterface();

    // --- 2. CÉREBRO (BRAIN) ---
    const BRAIN = {
        classification: {
            leigo: ["computador lento", "travando", "não entendo", "vírus", "luz piscando", "barulho estranho", "coisa de computador", "não liga", "tela azul"],
            entusiasta: ["fps", "hz", "overclock", "gargalo", "driver", "bios", "nvme", "thermal throttling", "xmp", "chipset", "gpu", "cpu", "water cooler"]
        },
        guardrails: {
            blocklist: ["crack", "ativador", "torrent", "baixar de graça", "pirata", "senha do banco", "cartão de crédito", "cvv", "conserta agora", "garante que resolve", "certeza absoluta"],
            responses: {
                piracy: "🔒 **Segurança:** Por questões éticas e de segurança, nossa loja trabalha exclusivamente com softwares originais. Não realizamos instalações de programas não licenciados.",
                financial: "🔒 **Segurança:** Para sua segurança, por favor não compartilhe senhas ou dados financeiros por aqui. Nosso atendimento solicitará apenas o necessário no balcão.",
                generic: "🔒 **Segurança:** Identifiquei termos que violam nossas diretrizes de segurança. Por favor, reformule sua dúvida."
            }
        },
        site_actions: {
            services: { keys: ["conserto", "reparo", "arrumar", "quebrado", "simulador", "orçamento"], id: "services", label: "Abrir Simulador de Reparo" },
            location: { keys: ["onde", "endereço", "local", "fica", "chegar", "perto"], id: "location", label: "Ver Mapa e Endereço" }
        }
    };

    const els = { 
        bubble: document.getElementById('chatBubble'), 
        win: document.getElementById('chatWindow'), 
        msgs: document.getElementById('chatMessages'), 
        input: document.getElementById('chatInput'),
        badge: document.getElementById('chatBadge')
    };

    let state = { isOpen: false, isDragging: false, startX: 0, startY: 0, initialLeft: 0, initialTop: 0 };
    let sessionId = localStorage.getItem('chat_sess_id');
    let msgHistory = []; 

    // --- 3. UI CONTROLS ---
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

    // --- 4. DRAG PHYSICS ---
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
            if (!state.isDragging) { e.preventDefault(); els.bubble.style.transform = 'scale(1)'; openChat(); } 
            else {
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
        document.getElementById('resetChatBtn').onclick = (e) => { 
            e.stopPropagation(); 
            if(confirm('Limpar histórico?')) { 
                localStorage.removeItem('atomic_chat_history'); localStorage.removeItem('chat_sess_id'); 
                msgHistory = []; els.msgs.innerHTML = ''; sessionId = null; 
                setTimeout(() => addMsg('bot', 'Histórico limpo!'), 200); 
            } 
        };
    }

    // --- 5. MESSAGING & RENDER ---
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
        let cleanContent = content;
        if (role === 'bot' && msgHistory.length > 0) {
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
                btn.onclick = (e) => {
                    e.stopPropagation();
                    if (window.showProductDetail && p.id) {
                        if(window.innerWidth <= 768) updateChatUI(false); 
                        window.showProductDetail(p.id);
                    } else { window.open(`https://wa.me/5521995969378?text=Interesse em: ${p.name}`); }
                };
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
                actBtn.onclick = () => { if (act.targetId) { const el = document.getElementById(act.targetId); if(el) { if(window.innerWidth < 768) updateChatUI(false); el.scrollIntoView({behavior:'smooth'}); } } else if (act.url) window.open(act.url, '_blank'); };
                actionContainer.appendChild(actBtn);
            });
            bubble.appendChild(actionContainer);
        }
        div.appendChild(bubble); els.msgs.appendChild(div); scrollToBottom();
        if (save) { msgHistory.push({ role, content, prods, link, actions }); localStorage.setItem('atomic_chat_history', JSON.stringify(msgHistory)); }
    }

    // --- 6. INTELLIGENCE & API LOGIC ---
    function classifyUser(text) {
        const t = text.toLowerCase();
        if (BRAIN.classification.entusiasta.some(k => t.includes(k))) return 'ENTUSIASTA';
        if (BRAIN.classification.leigo.some(k => t.includes(k))) return 'LEIGO';
        return 'INDEFINIDO';
    }

    function checkSecurity(text) {
        const t = text.toLowerCase();
        if (BRAIN.guardrails.blocklist.some(k => t.includes(k))) {
            if (t.includes('senha') || t.includes('cartão') || t.includes('cvv')) return BRAIN.guardrails.responses.financial;
            if (t.includes('crack') || t.includes('pirata') || t.includes('torrent') || t.includes('ativador')) return BRAIN.guardrails.responses.piracy;
            return BRAIN.guardrails.responses.generic;
        }
        return null;
    }

    function checkContextActions(text) {
        const lower = text.toLowerCase();
        let actions = [];
        if (BRAIN.site_actions.services.keys.some(k => lower.includes(k))) {
            const serviceSec = document.getElementById('services');
            let dir = (serviceSec && serviceSec.getBoundingClientRect().top < 0) ? '👆' : '👇';
            actions.push({ label: `${BRAIN.site_actions.services.label} ${dir}`, icon: 'ph-wrench', targetId: 'services' });
        }
        if (BRAIN.site_actions.location.keys.some(k => lower.includes(k))) 
            actions.push({ label: BRAIN.site_actions.location.label, icon: 'ph-map-pin', targetId: 'location' });
        return actions;
    }

    function getEmergencyResponse(text) {
        const lower = text.toLowerCase();
        if (lower.match(/(lento|travando|barulho|esquentando|manutenção|conserto|reparo|formatar)/)) 
            return "Notei que você está precisando de assistência técnica. No momento estou com uma instabilidade, mas use nosso **Simulador de Reparo** abaixo!";
        if (lower.match(/(preço|valor|custa|quanto)/)) 
            return "Para valores exatos, preciso que nossa equipe analise. Clique no botão abaixo para simular um orçamento!";
        return "Estou com uma pequena instabilidade de conexão. Mas não se preocupe! Nossa equipe humana está pronta no WhatsApp.";
    }

    async function send() {
        const txt = els.input.value.trim();
        if(!txt) return;

        // 1. SEGURANÇA (Rodando Localmente)
        const securityAlert = checkSecurity(txt);
        if (securityAlert) {
             els.input.value = ''; addMsg('user', txt);
             setTimeout(() => addMsg('bot', securityAlert, [], null, [], true), 600);
             return;
        }

        // 2. CLASSIFICAÇÃO (Rodando Localmente)
        const userProfile = classifyUser(txt);
        console.log(`[AtomicBrain] Classificado: ${userProfile}`);

        els.input.value = ''; addMsg('user', txt); 
        const loadingDiv = document.createElement('div'); loadingDiv.id='typing'; loadingDiv.className='message bot';
        loadingDiv.innerHTML = `<div class="message-bubble"><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>`;
        els.msgs.appendChild(loadingDiv); scrollToBottom();

        const localActions = checkContextActions(txt);
        const api = (typeof CONFIG !== 'undefined' && CONFIG.CHAT_API) ? CONFIG.CHAT_API : 'https://atomic-thiago-backend.onrender.com/chat';

        try {
            // FIX CRÍTICO: Removido 'client_context' para evitar erro 500 no Backend
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s Timeout
            
            const res = await fetch(api, { 
                method: 'POST', 
                headers: {'Content-Type':'application/json'}, 
                body: JSON.stringify({ 
                    message: txt, 
                    session_id: sessionId
                }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            const data = await res.json();
            document.getElementById('typing')?.remove();
            
            if(data.success) {
                if(data.session_id) { sessionId = data.session_id; localStorage.setItem('chat_sess_id', sessionId); }
                const finalActions = [...localActions, ...(data.actions || [])];
                let responseText = data.response || "";
                if (responseText.length > 20 && !/[.!?;]$/.test(responseText.trim())) responseText += "...";
                addMsg('bot', responseText, data.produtos_sugeridos, data.action_link, finalActions);
            } else { throw new Error("API Logical Error"); }
        } catch (e) { 
            console.warn("Fallback Triggered:", e);
            document.getElementById('typing')?.remove();
            localStorage.removeItem('chat_sess_id'); sessionId = null;
            addMsg('bot', getEmergencyResponse(txt), [], null, localActions); 
        }
    }

    document.getElementById('sendBtn').onclick = send;
    els.input.addEventListener('keydown', (e) => { if(e.key === 'Enter') send(); });
    ['mousedown', 'touchstart'].forEach(evt => els.input.addEventListener(evt, (e) => { e.stopPropagation(); els.input.focus(); }));

    try {
        const savedHist = localStorage.getItem('atomic_chat_history');
        if (savedHist) { JSON.parse(savedHist).forEach(m => addMsg(m.role, m.content, m.prods, m.link, m.actions, false)); }
        else { setTimeout(() => addMsg('bot', 'E aí! 👋 Sou o **Thiago**, especialista da Atomic Games.\nComo posso ajudar hoje?'), 1000); }
    } catch(e) {}

    setTimeout(() => {
        const api = (typeof CONFIG !== 'undefined' && CONFIG.CHAT_API) ? CONFIG.CHAT_API : 'https://atomic-thiago-backend.onrender.com/chat';
        fetch(api.replace('/chat', ''), { method: 'HEAD', mode: 'no-cors' }).catch(() => {});
    }, 2000);

    window.AtomicChat = {
        processBudget: function(context) {
            if (!context || context.status !== 'completed') return;
            if (!state.isOpen) openChat();
            const fmt = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            let name = context.service.name;
            let price = `${fmt(context.financial.totalMin)} a ${fmt(context.financial.totalMax)}`;
            if (context.service.customDescription) { name += `: "${context.service.customDescription}"`; price = "Sob Análise"; }
            
            const msg = `Olá **${context.customer.name}**! 👋 Recebi seu orçamento para **${context.device.modelLabel}**.\n🔧 ${name}\n💰 ${price}\nPosso confirmar?`;
            const url = `https://wa.me/5521995969378?text=${encodeURIComponent(`*ORÇAMENTO*\n${context.device.modelLabel} - ${name}\nValor: ${price}`)}`;
            setTimeout(() => { addMsg('bot', msg, [], null, [{ label: 'Agendar no WhatsApp', icon: 'ph-whatsapp-logo', url }], true); }, 500);
        }
    };
})();
