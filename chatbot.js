
// === CHATBOT 2.2 (BRAIN INJECTED: Knowledge, Rules, Guardrails) ===
(function() {
    
    // --- 0. CÉREBRO LOCAL (DADOS DOS ARQUIVOS JSON) ---
    const BRAIN = {
        // rules.json (Para detectar Persona)
        rules: {
            leigo: ["lento", "travando", "não entendo", "vírus", "luz piscando", "barulho", "estranho", "coisa de computador", "ruim", "ajuda"],
            entusiasta: ["fps", "hz", "overclock", "gargalo", "driver", "bios", "nvme", "thermal", "throttling", "xmp", "chipset", "gpu", "cpu", "build"]
        },
        // guardrails.json (Segurança e Protocolos)
        guardrails: {
            forbidden: ["crack", "ativador", "torrent", "baixar de graça", "pirata", "senha do banco", "cartão de crédito", "cvv", "conserta agora", "garante", "certeza"],
            responses: {
                fallback_preco: "💰 **Sobre Valores:** Como assistente virtual, não tenho acesso a preços exatos sem avaliação física. O valor depende das peças e da complexidade. Traga para um diagnóstico!",
                fallback_prazo: "⏱️ **Sobre Prazos:** Trabalhamos com estimativas. Serviços simples levam geralmente de 24h a 48h úteis, dependendo da fila de bancada.",
                fallback_pirataria: "🚫 **Política de Segurança:** Trabalhamos exclusivamente com softwares originais e procedimentos oficiais. Não realizamos instalações de programas não licenciados.",
                fallback_diagnostico: "🩺 **Diagnóstico:** Pelos sintomas, podem ser vários fatores. Dizer o que é sem testar as peças seria irresponsável. Recomendo trazer para nossa bancada."
            }
        },
        // knowledge.json (Conteúdo Técnico Adaptativo)
        knowledge: {
            formatacao: {
                keywords: ["formatar", "formatação", "windows", "resetar", "instalar sistema"],
                leigo: "A formatação é como resetar o PC para o 'modo de fábrica'. Ele fica zerado, rápido e sem vírus. \n\n✅ Inclui: Windows original, drivers e pacote básico.\n⚠️ Atenção: O backup de arquivos é cobrado à parte.",
                entusiasta: "Realizamos instalação limpa (Clean Install) via mídia oficial, configuração de partições UEFI/GPT, atualização de BIOS e drivers estáveis direto do fabricante."
            },
            limpeza: {
                keywords: ["limpeza", "poeira", "esquentando", "aquecendo", "barulho", "ventoinha", "pasta térmica", "pasta termica"],
                leigo: "A poeira age como um cobertor nas peças, fazendo elas esquentarem e o PC ficar lento. Nossa limpeza remove essa sujeira e trocamos a pasta térmica para o processador 'respirar' melhor.",
                entusiasta: "Manutenção preventiva focada em fluxo de ar e redução térmica. Inclui cable management, remoção de poeira com ar comprimido e aplicação de pasta térmica de alta condutividade (ex: MasterGel/Arctic)."
            },
            upgrade: {
                keywords: ["upgrade", "melhorar", "rápido", "ssd", "memória", "ram", "placa de vídeo"],
                leigo: "Para deixar o PC mais rápido, geralmente recomendamos trocar o HD antigo por um SSD (que é 10x mais rápido) ou aumentar a memória RAM para abrir mais programas ao mesmo tempo.",
                entusiasta: "Analisamos o equilíbrio do seu setup para evitar gargalos (bottleneck). Podemos sugerir SSDs NVMe para OS, expansão de RAM em Dual Channel ou upgrades de GPU conforme sua fonte suporte."
            }
        },
        // intents.json (Mapeamento de Ações)
        context_actions: {
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
    
    if (!els.bubble || !els.win) return;

    let state = { isOpen: false, isDragging: false, startX: 0, startY: 0, initialLeft: 0, initialTop: 0 };
    let sessionId = localStorage.getItem('chat_sess_id');
    let msgHistory = []; 

    // --- UI LOGIC (MANTIDA INTACTA) ---
    function updateChatUI(open) {
        state.isOpen = open;
        els.win.classList.toggle('open', open);
        els.badge.style.display = open ? 'none' : 'flex';
        document.body.classList.toggle('chat-open', open);
        
        if (open) {
            if(window.innerWidth <= 480) {
                const rect = els.bubble.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                els.win.style.transformOrigin = `${centerX}px ${centerY}px`;
            }
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

    function openChat() { if(state.isOpen) return; history.pushState({chat: true}, '', '#chat'); updateChatUI(true); }
    function closeChat() { if(!state.isOpen) return; history.back(); }
    window.addEventListener('popstate', (e) => { if(state.isOpen) updateChatUI(false); });
    function scrollToBottom() { els.msgs.scrollTop = els.msgs.scrollHeight; }

    // --- DRAG PHYSICS (MANTIDA INTACTA) ---
    if(els.bubble) {
        const updatePos = (x, y) => { els.bubble.style.left = `${x}px`; els.bubble.style.top = `${y}px`; };
        els.bubble.addEventListener('touchstart', (e) => {
            const t = e.touches[0]; state.startX = t.clientX; state.startY = t.clientY;
            const rect = els.bubble.getBoundingClientRect(); state.initialLeft = rect.left; state.initialTop = rect.top;
            state.isDragging = false; els.bubble.classList.add('no-transition'); els.bubble.classList.remove('snapping');
            els.bubble.style.transform = 'scale(0.95)'; els.bubble.style.bottom = 'auto'; els.bubble.style.right = 'auto'; updatePos(rect.left, rect.top);
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
        if(resetBtn) {
            resetBtn.onclick = (e) => {
                e.stopPropagation();
                if(confirm('Tem certeza que deseja limpar o histórico da conversa?')) {
                    localStorage.removeItem('atomic_chat_history'); localStorage.removeItem('chat_sess_id'); msgHistory = []; els.msgs.innerHTML = ''; sessionId = null;
                    setTimeout(() => { addMsg('bot', 'Histórico limpo! Como posso ajudar agora?', [], null, [], false); }, 200);
                }
            };
        }
    }

    // --- MESSAGING HELPER ---
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
        const div = document.createElement('div'); div.className = `message ${role}`;
        const bubble = document.createElement('div'); bubble.className = 'message-bubble';
        if(content) bubble.appendChild(parseText(content));
        
        if(prods?.length) {
            const scroll = document.createElement('div'); scroll.className = 'chat-products-scroll';
            prods.forEach(p => {
                const card = document.createElement('div'); card.className = 'chat-product-card';
                const img = document.createElement('img'); img.src = p.image || 'https://placehold.co/100'; img.loading = 'lazy';
                const title = document.createElement('div'); title.className = 'chat-product-title'; title.textContent = p.name || p.nome;
                const price = document.createElement('div'); price.className = 'chat-product-price'; price.textContent = p.price || p.preco;
                const btn = document.createElement('button'); btn.className = 'chat-add-btn'; btn.textContent = 'VER DETALHES';
                btn.onclick = (e) => { e.stopPropagation(); const prodId = p.id; if (window.showProductDetail && prodId) { if(window.innerWidth <= 768) { updateChatUI(false); } window.showProductDetail(prodId); } else { window.open(`https://wa.me/5521995969378?text=Interesse em: ${encodeURIComponent(p.name||p.nome)}`); } };
                card.append(img, title, price, btn); scroll.appendChild(card);
            });
            bubble.appendChild(scroll);
        }

        if(link) {
           const btn = document.createElement('a'); btn.href=link; btn.target='_blank';
           btn.className = 'block mt-2 text-center bg-green-500 text-white font-bold py-2 rounded-lg text-xs hover:bg-green-600 transition';
           btn.textContent = 'NEGOCIAR AGORA'; bubble.appendChild(btn);
        }

        if (actions && actions.length > 0) {
            const actionContainer = document.createElement('div'); actionContainer.className = 'mt-3 flex flex-col gap-2';
            actions.forEach(act => {
                const actBtn = document.createElement('button');
                actBtn.className = 'flex items-center justify-between w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-yellow-400 hover:text-black transition-colors';
                const span = document.createElement('span'); span.textContent = act.label;
                const icon = document.createElement('i'); icon.className = `ph-bold ${act.icon}`;
                actBtn.append(span, icon);
                actBtn.onclick = () => {
                    if (act.targetId) { const target = document.getElementById(act.targetId); if(target) { if(window.innerWidth < 768) updateChatUI(false); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); } } 
                    else if (act.url) { window.open(act.url, '_blank'); }
                };
                actionContainer.appendChild(actBtn);
            });
            bubble.appendChild(actionContainer);
        }
        div.appendChild(bubble); els.msgs.appendChild(div); scrollToBottom();
        if (save) { msgHistory.push({ role, content, prods, link, actions }); localStorage.setItem('atomic_chat_history', JSON.stringify(msgHistory)); }
    }

    function addTyping() {
        const div = document.createElement('div'); div.id='typing'; div.className='message bot';
        div.innerHTML = `<div class="message-bubble"><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>`;
        els.msgs.appendChild(div); scrollToBottom();
    }

    // === PROCESSAMENTO INTELIGENTE (CÉREBRO) ===
    function processBrain(text) {
        const lower = text.toLowerCase();
        let actions = [];
        
        // 1. Detectar Contexto para Botões
        if (BRAIN.context_actions.services.keys.some(k => lower.includes(k))) {
            const serviceSec = document.getElementById('services');
            let dir = serviceSec && serviceSec.getBoundingClientRect().top < 0 ? '👆' : '👇';
            actions.push({ label: `${BRAIN.context_actions.services.label} ${dir}`, icon: 'ph-wrench', targetId: 'services' });
        }
        if (BRAIN.context_actions.location.keys.some(k => lower.includes(k))) {
            actions.push({ label: BRAIN.context_actions.location.label, icon: 'ph-map-pin', targetId: 'location' });
        }

        // 2. Guardrails (Segurança e Protocolos)
        if (BRAIN.guardrails.forbidden.some(k => lower.includes(k))) {
             return { type: 'block', text: BRAIN.guardrails.responses.fallback_pirataria, actions };
        }
        if (lower.includes('preço') || lower.includes('valor') || lower.includes('quanto custa')) {
             return { type: 'safe_response', text: BRAIN.guardrails.responses.fallback_preco, actions };
        }
        if (lower.includes('prazo') || lower.includes('tempo') || lower.includes('demora')) {
             return { type: 'safe_response', text: BRAIN.guardrails.responses.fallback_prazo, actions };
        }

        // 3. Detectar Nível de Usuário
        const isEntusiasta = BRAIN.rules.entusiasta.some(k => lower.includes(k));
        const userLevel = isEntusiasta ? 'entusiasta' : 'leigo';

        // 4. Buscar Conhecimento Específico (Intent)
        let knowledgeKey = null;
        if (BRAIN.knowledge.formatacao.keywords.some(k => lower.includes(k))) knowledgeKey = 'formatacao';
        else if (BRAIN.knowledge.limpeza.keywords.some(k => lower.includes(k))) knowledgeKey = 'limpeza';
        else if (BRAIN.knowledge.upgrade.keywords.some(k => lower.includes(k))) knowledgeKey = 'upgrade';

        if (knowledgeKey) {
            return { 
                type: 'knowledge', 
                text: BRAIN.knowledge[knowledgeKey][userLevel], 
                actions 
            };
        }

        // 5. Sem match local -> Backend
        return { type: 'backend', actions };
    }

    async function send() {
        const txt = els.input.value.trim();
        if(!txt) return;

        els.input.value = ''; 
        addMsg('user', txt); 
        addTyping();

        // --- CÉREBRO ATUA AQUI ---
        const decision = processBrain(txt);

        // Se o cérebro resolveu localmente (Guardrail ou Knowledge Base)
        if (decision.type !== 'backend') {
            setTimeout(() => {
                document.getElementById('typing').remove();
                addMsg('bot', decision.text, [], null, decision.actions);
            }, 800); // Delay para naturalidade
            return;
        }

        // Se não, vai pro Backend (Fallback para papo genérico)
        const api = (typeof CONFIG !== 'undefined' && CONFIG.CHAT_API) ? CONFIG.CHAT_API : 'https://atomic-thiago-backend.onrender.com/chat';
        try {
            const res = await fetch(api, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ message: txt, session_id: sessionId }) });
            const data = await res.json();
            document.getElementById('typing').remove();
            
            if(data.success) {
                if(data.session_id) { sessionId = data.session_id; localStorage.setItem('chat_sess_id', sessionId); }
                const finalActions = [...decision.actions, ...(data.actions || [])];
                addMsg('bot', data.response, data.produtos_sugeridos, data.action_link, finalActions);
            } else {
                addMsg('bot', 'Desculpe, tive um erro técnico.', [], null, decision.actions);
            }
        } catch { 
            document.getElementById('typing') ? document.getElementById('typing').remove() : null; 
            addMsg('bot', 'Sem conexão com a internet.', [], null, decision.actions); 
        }
    }

    document.getElementById('sendBtn').onclick = send;
    els.input.addEventListener('keydown', (e) => { if(e.key === 'Enter') send(); e.stopPropagation(); });
    ['mousedown', 'mouseup', 'click', 'touchstart', 'touchend'].forEach(evt => { els.input.addEventListener(evt, (e) => { e.stopPropagation(); if (evt === 'mousedown') els.input.focus(); }); });

    try {
        const savedHist = localStorage.getItem('atomic_chat_history');
        if (savedHist) {
            msgHistory = JSON.parse(savedHist);
            msgHistory.forEach(m => addMsg(m.role, m.content, m.prods, m.link, m.actions, false));
        } else {
            setTimeout(() => addMsg('bot', 'E aí! 👋 Sou o **Thiago**, especialista da Atomic Games.\nPosso te ajudar a montar um PC, escolher um console ou fazer um orçamento de manutenção?'), 1000);
        }
    } catch(e) { console.error("History load error", e); }

    setTimeout(() => {
        const api = (typeof CONFIG !== 'undefined' && CONFIG.CHAT_API) ? CONFIG.CHAT_API : 'https://atomic-thiago-backend.onrender.com/chat';
        fetch(api.replace('/chat', ''), { method: 'HEAD', mode: 'no-cors' }).catch(() => {});
    }, 1500);

    window.AtomicChat = {
        processBudget: function(context) {
            if (!context || context.status !== 'completed') return;
            if (!state.isOpen) openChat();
            const fmt = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            let finalServiceName = context.service.name;
            let finalPriceStr = `${fmt(context.financial.totalMin)} a ${fmt(context.financial.totalMax)}`;
            if (context.service.customDescription) {
                finalServiceName = `${context.service.name}: "${context.service.customDescription}"`;
                finalPriceStr = "Sob Análise Técnica";
            }
            const msg = `Olá **${context.customer.name || 'Gamer'}**! 👋\nRecebi sua estimativa para o **${context.device.modelLabel}**.\n\n🔧 Serviço: ${finalServiceName}\n💰 Estimativa: **${finalPriceStr}**\n📍 Logística: ${context.logistics.label}\n\nPosso confirmar o agendamento?`;
            const waMsg = `*ORÇAMENTO TÉCNICO (WEB)*\n\n👤 *${context.customer.name}*\n📱 ${context.customer.phone}\n--------------------------------\n🎮 *Aparelho:* ${context.device.modelLabel}\n🛠️ *Serviço:* ${finalServiceName}\n📍 *Logística:* ${context.logistics.label}\n💰 *Estimativa:* ${finalPriceStr}\n--------------------------------\n*Obs:* Vim pelo Chat do Site.`;
            const waLink = `https://wa.me/5521995969378?text=${encodeURIComponent(waMsg)}`;
            setTimeout(() => { addMsg('bot', msg, [], null, [{ label: 'Agendar no WhatsApp', icon: 'ph-whatsapp-logo', url: waLink }], true); }, 500);
        }
    };
})();
