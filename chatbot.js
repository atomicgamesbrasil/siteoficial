
// === CHATBOT 2.1 (FLUID, MAGNETIC & SITE-AWARE) ===
(function() {
    // --- 0. CÉREBRO LOCAL (INTEGRAÇÃO DE SEGURANÇA & CONTEXTO) ---
    const BRAIN = {
        security: {
            forbidden_terms: [
                "crack", "ativador", "torrent", "baixar de graça", "pirata",
                "senha do banco", "cartão de crédito", "cvv", "conserta agora", 
                "garante que resolve", "certeza absoluta", "senha", "password", "cpf"
            ],
            response: "🔒 Por questões de segurança e ética, não posso processar solicitações contendo dados sensíveis, pirataria ou promessas de resultado sem avaliação."
        },
        // Mapeamento de Intenções para Palavras-Chave
        intents: {
            manutencao: {
                keywords: ["limpeza", "manutenção", "conserto", "reparo", "orçamento", "arrumar", "quebrado", "lento", "travando", "pasta térmica", "formatar", "formatação"],
                // Resposta Oficial Baseada no knowledge.json
                reply: "Sim, somos especialistas nisso! 🛠️\n\nRealizamos desde **Limpeza Preventiva** (com troca de pasta térmica e cable management) até **Diagnósticos Avançados** e **Formatação**.\n\nPara te dar uma estimativa de valor agora mesmo, recomendo usar nosso Simulador aqui abaixo:",
                force_local: true // Força resposta local, ignora backend
            },
            localizacao: {
                keywords: ["onde fica", "endereço", "localização", "chegar", "perto", "bairro", "loja física"],
                reply: "Estamos localizados num ponto estratégico para melhor te atender! 📍\n\nVocê pode ver o mapa exato e traçar a rota clicando no botão abaixo.",
                force_local: true
            },
            vendas: {
                keywords: ["comprar", "preço", "quanto custa", "gamer", "pc", "upgrade", "loja", "vende"],
                reply: "Com certeza! Trabalhamos com **PCs Gamer de Alta Performance**, Periféricos e Upgrades.\n\nVocê busca algo para rodar jogos competitivos ou para trabalho pesado?",
                force_local: false // Deixa o backend responder, mas adiciona contexto se necessário
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
    
    // Check if chatbot elements exist (in case of partial page loads)
    if (!els.bubble || !els.win) return;

    let state = { isOpen: false, isDragging: false, startX: 0, startY: 0, initialLeft: 0, initialTop: 0 };
    let sessionId = localStorage.getItem('chat_sess_id');
    let msgHistory = []; // Local history storage

    // --- UI LOGIC ---
    function updateChatUI(open) {
        state.isOpen = open;
        els.win.classList.toggle('open', open);
        els.badge.style.display = open ? 'none' : 'flex';
        document.body.classList.toggle('chat-open', open);
        
        if (open) {
            // Morph effect for mobile
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

    // --- HISTORY API ---
    function openChat() {
        if(state.isOpen) return;
        history.pushState({chat: true}, '', '#chat'); 
        updateChatUI(true);
    }

    function closeChat() {
        if(!state.isOpen) return;
        history.back(); 
    }

    window.addEventListener('popstate', (e) => {
        if(state.isOpen) updateChatUI(false);
    });

    function scrollToBottom() { els.msgs.scrollTop = els.msgs.scrollHeight; }

    // --- DRAG PHYSICS ---
    if(els.bubble) {
        const updatePos = (x, y) => { els.bubble.style.left = `${x}px`; els.bubble.style.top = `${y}px`; };
        
        els.bubble.addEventListener('touchstart', (e) => {
            const t = e.touches[0];
            state.startX = t.clientX; state.startY = t.clientY;
            const rect = els.bubble.getBoundingClientRect();
            state.initialLeft = rect.left; state.initialTop = rect.top;
            state.isDragging = false;
            
            els.bubble.classList.add('no-transition');
            els.bubble.classList.remove('snapping');
            els.bubble.style.transform = 'scale(0.95)';
            els.bubble.style.bottom = 'auto'; els.bubble.style.right = 'auto'; 
            updatePos(rect.left, rect.top);
        }, { passive: true });

        els.bubble.addEventListener('touchmove', (e) => {
            const t = e.touches[0];
            const dx = t.clientX - state.startX;
            const dy = t.clientY - state.startY;
            if (Math.sqrt(dx*dx + dy*dy) > 15) state.isDragging = true;
            if (state.isDragging) { e.preventDefault(); updatePos(state.initialLeft + dx, state.initialTop + dy); }
        }, { passive: false });

        els.bubble.addEventListener('touchend', (e) => {
            els.bubble.classList.remove('no-transition');
            if (!state.isDragging) {
                e.preventDefault(); els.bubble.style.transform = 'scale(1)'; openChat(); 
            } else {
                els.bubble.style.transform = 'scale(1)';
                els.bubble.classList.add('snapping');
                const rect = els.bubble.getBoundingClientRect();
                const midX = window.innerWidth / 2;
                const snapX = (rect.left + rect.width/2) < midX ? 20 : window.innerWidth - rect.width - 20;
                let snapY = rect.top;
                if(snapY < 20) snapY = 20;
                if(snapY > window.innerHeight - 100) snapY = window.innerHeight - 100;
                updatePos(snapX, snapY);
            }
            state.isDragging = false;
        });
        
        els.bubble.addEventListener('click', (e) => { if(e.detail && !state.isDragging) { if(state.isOpen) closeChat(); else openChat(); } });
        document.getElementById('closeChatBtn').onclick = (e) => { e.stopPropagation(); closeChat(); };
        
        // --- CHAT RESET LOGIC ---
        const resetBtn = document.getElementById('resetChatBtn');
        if(resetBtn) {
            resetBtn.onclick = (e) => {
                e.stopPropagation();
                if(confirm('Tem certeza que deseja limpar o histórico da conversa?')) {
                    localStorage.removeItem('atomic_chat_history');
                    localStorage.removeItem('chat_sess_id');
                    msgHistory = [];
                    els.msgs.innerHTML = '';
                    sessionId = null;
                    
                    setTimeout(() => {
                        addMsg('bot', 'Histórico limpo! Como posso ajudar agora?', [], null, [], false);
                    }, 200);
                }
            };
        }
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
        const bubble = document.createElement('div'); bubble.className = 'message-bubble';
        
        if(content) bubble.appendChild(parseText(content));
        
        // --- PRODUTOS (VITRINE NO CHAT) - HARDENED ---
        if(prods?.length) {
            const scroll = document.createElement('div'); scroll.className = 'chat-products-scroll';
            prods.forEach(p => {
                const card = document.createElement('div'); card.className = 'chat-product-card';
                
                // Create Image
                const img = document.createElement('img');
                img.src = p.image || 'https://placehold.co/100';
                img.loading = 'lazy';
                
                // Create Title
                const title = document.createElement('div');
                title.className = 'chat-product-title';
                title.textContent = p.name || p.nome;
                
                // Create Price
                const price = document.createElement('div');
                price.className = 'chat-product-price';
                price.textContent = p.price || p.preco;
                
                // Create Button
                const btn = document.createElement('button'); 
                btn.className = 'chat-add-btn'; 
                btn.textContent = 'VER DETALHES';
                
                // CORREÇÃO CRÍTICA DE UX MOBILE
                btn.onclick = (e) => {
                    e.stopPropagation();
                    const prodId = p.id; 
                    
                    if (window.showProductDetail && prodId) {
                        // Se estiver no mobile, fecha o chat para mostrar o modal
                        if(window.innerWidth <= 768) {
                            updateChatUI(false); 
                        }
                        window.showProductDetail(prodId);
                    } else {
                        window.open(`https://wa.me/5521995969378?text=Interesse em: ${encodeURIComponent(p.name||p.nome)}`);
                    }
                };
                
                card.appendChild(img);
                card.appendChild(title);
                card.appendChild(price);
                card.appendChild(btn);
                scroll.appendChild(card);
            });
            bubble.appendChild(scroll);
        }

        // --- LINKS DE AÇÃO (Botão Verde Padrão) ---
        if(link) {
           const btn = document.createElement('a'); btn.href=link; btn.target='_blank';
           btn.className = 'block mt-2 text-center bg-green-500 text-white font-bold py-2 rounded-lg text-xs hover:bg-green-600 transition';
           btn.textContent = 'NEGOCIAR AGORA'; bubble.appendChild(btn);
        }

        // --- AÇÕES INTELIGENTES (Botões de Contexto do Site) ---
        if (actions && actions.length > 0) {
            const actionContainer = document.createElement('div');
            actionContainer.className = 'mt-3 flex flex-col gap-2';
            actions.forEach(act => {
                const actBtn = document.createElement('button');
                actBtn.className = 'flex items-center justify-between w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-yellow-400 hover:text-black transition-colors';
                
                const span = document.createElement('span');
                span.textContent = act.label;
                const icon = document.createElement('i');
                icon.className = `ph-bold ${act.icon}`;
                
                actBtn.appendChild(span);
                actBtn.appendChild(icon);
                
                // Suporte a URL direta ou Target ID
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

        div.appendChild(bubble); els.msgs.appendChild(div); scrollToBottom();

        if (save) {
            msgHistory.push({ role, content, prods, link, actions });
            localStorage.setItem('atomic_chat_history', JSON.stringify(msgHistory));
        }
    }

    function addTyping() {
        const div = document.createElement('div'); div.id='typing'; div.className='message bot';
        div.innerHTML = `<div class="message-bubble"><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>`;
        els.msgs.appendChild(div); scrollToBottom();
    }

    // --- CONTEXT AWARENESS (O Cérebro Local - ATUALIZADO) ---
    function checkSiteContext(text) {
        const t = text.toLowerCase();
        const actions = [];
        let matchedIntent = null;

        // Verifica intenções mapeadas no BRAIN
        if (BRAIN.intents.manutencao.keywords.some(k => t.includes(k))) {
            const serviceSec = document.getElementById('services');
            let dir = '👇';
            if(serviceSec) {
                const rect = serviceSec.getBoundingClientRect();
                if(rect.top < 0) dir = '👆';
            }
            actions.push({
                label: `Abrir Simulador de Reparo ${dir}`,
                icon: 'ph-wrench',
                targetId: 'services'
            });
            matchedIntent = BRAIN.intents.manutencao;
        }

        else if (BRAIN.intents.localizacao.keywords.some(k => t.includes(k))) {
            actions.push({
                label: 'Ver Mapa e Endereço',
                icon: 'ph-map-pin',
                targetId: 'location'
            });
            matchedIntent = BRAIN.intents.localizacao;
        }

        return { actions, matchedIntent };
    }

    async function send() {
        const txt = els.input.value.trim();
        if(!txt) return;

        // 1. GUARDIÃO (SEGURANÇA)
        if (BRAIN.security.forbidden_terms.some(term => txt.toLowerCase().includes(term))) {
            els.input.value = '';
            addMsg('user', txt);
            setTimeout(() => { addMsg('bot', BRAIN.security.response, [], null, [], true); }, 600);
            return; 
        }
        
        els.input.value = ''; 
        addMsg('user', txt); 
        addTyping();
        
        // 2. DETECÇÃO DE CONTEXTO E INTENÇÃO LOCAL
        const contextData = checkSiteContext(txt);
        
        // 3. INTERCEPÇÃO DE CÉREBRO LOCAL (Híbrido)
        // Se for uma intenção crítica e estiver marcada como force_local, respondemos direto
        // sem consultar o backend (que pode ser genérico/burro).
        if (contextData.matchedIntent && contextData.matchedIntent.force_local) {
            setTimeout(() => {
                document.getElementById('typing').remove();
                addMsg('bot', contextData.matchedIntent.reply, [], null, contextData.actions);
            }, 800); // Delay natural
            return;
        }

        // 4. FALLBACK PARA BACKEND (Se não for crítico ou se for papo furado)
        const api = (typeof CONFIG !== 'undefined' && CONFIG.CHAT_API) ? CONFIG.CHAT_API : 'https://atomic-thiago-backend.onrender.com/chat';

        try {
            const res = await fetch(api, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ message: txt, session_id: sessionId }) });
            const data = await res.json();
            
            document.getElementById('typing').remove();
            
            if(data.success) {
                if(data.session_id) { sessionId = data.session_id; localStorage.setItem('chat_sess_id', sessionId); }
                // Mescla ações locais com ações do servidor
                const finalActions = [...contextData.actions, ...(data.actions || [])];
                addMsg('bot', data.response, data.produtos_sugeridos, data.action_link, finalActions);
            } else {
                addMsg('bot', 'Desculpe, tive um erro técnico.', [], null, contextData.actions);
            }
        } catch { 
            document.getElementById('typing') ? document.getElementById('typing').remove() : null; 
            addMsg('bot', 'Sem conexão com a internet.', [], null, contextData.actions); 
        }
    }

    document.getElementById('sendBtn').onclick = send;
    
    els.input.addEventListener('keydown', (e) => {
        if(e.key === 'Enter') send();
        e.stopPropagation(); 
    });
    
    ['mousedown', 'mouseup', 'click', 'touchstart', 'touchend'].forEach(evt => {
        els.input.addEventListener(evt, (e) => {
            e.stopPropagation();
            if (evt === 'mousedown') els.input.focus();
        });
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

    setTimeout(() => {
        const api = (typeof CONFIG !== 'undefined' && CONFIG.CHAT_API) ? CONFIG.CHAT_API : 'https://atomic-thiago-backend.onrender.com/chat';
        const baseUrl = api.replace('/chat', ''); 
        fetch(baseUrl, { method: 'HEAD', mode: 'no-cors' }).catch(() => {});
    }, 1500);

    // === ATOMIC GLOBAL API (HOOK DE INTEGRAÇÃO FASE 5) ===
    window.AtomicChat = {
        /**
         * Recebe o Objeto de Contexto Único da Calculadora e inicia o atendimento.
         * @param {Object} context - Objeto budgetContext gerado no main.js
         */
        processBudget: function(context) {
            if (!context || context.status !== 'completed') return;

            // 1. Abre o Chat
            if (!state.isOpen) openChat();

            // 2. Formata Valores (Helper simples)
            const fmt = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            
            // --- TRATAMENTO DE ORÇAMENTO PERSONALIZADO (OUTRO DEFEITO) ---
            let finalServiceName = context.service.name;
            let finalPriceStr = `${fmt(context.financial.totalMin)} a ${fmt(context.financial.totalMax)}`;

            // Se tiver descrição personalizada, concatena e muda preço para Sob Análise
            if (context.service.customDescription) {
                finalServiceName = `${context.service.name}: "${context.service.customDescription}"`;
                finalPriceStr = "Sob Análise Técnica";
            }
            // -------------------------------------------------------------

            // 3. Constrói a Mensagem Contextual
            const msg = `Olá **${context.customer.name || 'Gamer'}**! 👋\n` +
                        `Recebi sua estimativa para o **${context.device.modelLabel}**.\n\n` +
                        `🔧 Serviço: ${finalServiceName}\n` +
                        `💰 Estimativa: **${finalPriceStr}**\n` +
                        `📍 Logística: ${context.logistics.label}\n\n` +
                        `Posso confirmar o agendamento ou você tem alguma dúvida sobre o serviço?`;

            // 4. Gera Link do WhatsApp (Baseado no Contexto)
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

            // 5. Injeta a Mensagem no Chat com Ação
            // Pequeno delay para parecer natural após o clique no botão calcular
            setTimeout(() => {
                addMsg('bot', msg, [], null, [
                    { label: 'Agendar no WhatsApp', icon: 'ph-whatsapp-logo', url: waLink }
                ], true);
            }, 500);
        }
    };

})();
