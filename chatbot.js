// === CHATBOT 2.1 (FLUID, MAGNETIC & SITE-AWARE) ===
(function() {
    // ===== Helpers =====
    function safeGet(id) { return document.getElementById(id) || null; }

    function isSafeHttp(url) {
        try { const u = new URL(url, location.href); return u.protocol === 'http:' || u.protocol === 'https:'; }
        catch(e) { return false; }
    }

    function safeImageSrc(src) {
        try { const u = new URL(src, location.href); if (u.protocol === 'http:'||u.protocol==='https:') return u.href; } catch(e) {}
        return 'https://placehold.co/100';
    }

    function removeTyping() { const t = document.getElementById('typing'); if (t) t.remove(); }

    async function postJsonWithTimeout(url, body, timeout = 10000) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        try {
            const res = await fetch(url, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body), signal: controller.signal });
            clearTimeout(id);
            if (!res.ok) return { ok:false, status: res.status, data: null };
            let data;
            try { data = await res.json(); } catch(e) { return { ok:false, status:res.status, error:'invalid-json' }; }
            return { ok:true, status: res.status, data };
        } catch(err) { clearTimeout(id); return { ok:false, error: err }; }
    }

    // Element Selection
    const els = { 
        bubble: safeGet('chatBubble'), 
        win: safeGet('chatWindow'), 
        msgs: safeGet('chatMessages'), 
        input: safeGet('chatInput'), 
        badge: safeGet('chatBadge')
    };
    
    // Check if chatbot elements exist (in case of partial page loads)
    if (!els.bubble || !els.win) return;

    let state = { isOpen: false, isDragging: false, startX: 0, startY: 0, initialLeft: 0, initialTop: 0 };
    let sessionId = localStorage.getItem('chat_sess_id');
    let msgHistory = []; // Local history storage
    let sending = false; // Prevent duplicate requests

    function saveHistory() {
        const MAX = 200;
        if (msgHistory.length > MAX) msgHistory = msgHistory.slice(-MAX);
        localStorage.setItem('atomic_chat_history', JSON.stringify(msgHistory));
    }

    // ============================================================================
    // [NOVA INTELIGÊNCIA] ATOMIC BRAIN - CAMADA DE INTERPRETAÇÃO SEMÂNTICA
    // ============================================================================
    const AtomicBrain = {
        personas: {
            enthusiast: {
                id: 'entusiasta_competitivo',
                keywords: ['overclock', 'vrm', 'latência', 'cas', 'gargalo', 'fps', 'benchmark', 'water cooler', 'rtx', 'dlss', 'hz', 'ms', 'temperatura', 'bottleneck'],
                instruction: 'Detected_Enthusiast: Responda com tecnicalidade, direto ao ponto. Sem analogias simples. Fale de performance bruta.'
            },
            remote_worker: {
                id: 'profissional_remoto',
                keywords: ['teams', 'zoom', 'travando', 'lento', 'trabalho', 'reunião', 'estabilidade', 'ssd', 'office', 'planilha', 'excel', 'meet', 'home office'],
                instruction: 'Detected_RemoteWorker: Foco em "Time is Money". Soluções para estabilidade/boot rápido. Sugira SSD como "ressuscitador".'
            },
            layman: {
                id: 'comprador_leigo',
                keywords: ['filho', 'criança', 'barato', 'não entendo', 'presente', 'roda tudo', 'básico', 'escola', 'estudar', 'jogar roblox', 'minecraft', 'ajuda'],
                instruction: 'Detected_Layman: ATIVAR MOTOR DE ANALOGIAS. (Ex: CPU=Chef, RAM=Mesa). Seja educativo, protetor e evite jargões.'
            }
        },
        guardrails: {
            data_recovery: {
                trigger: ['recuperar', 'arquivos', 'perdi', 'hd', 'formatou', 'salvar fotos'],
                alert: 'LEGAL_WARNING: Nunca prometer 100% de recuperação de dados. Mencionar "Tentativa de recuperação".'
            },
            pricing: {
                trigger: ['preço', 'valor', 'quanto', 'custa', 'orçamento'],
                alert: 'PRICING_RULE: Informe que valores são estimativas sujeitas a avaliação técnica presencial.'
            }
        },
        analyze: function(text) {
            const lowerText = text.toLowerCase();
            let detectedPersona = 'padrao_generico'; // Default
            let systemNotes = [];
            let highestScore = 0;

            // 1. Classificação de Persona (Pontuação)
            for (const [key, profile] of Object.entries(this.personas)) {
                let score = 0;
                profile.keywords.forEach(word => {
                    if (lowerText.includes(word)) score++;
                });
                
                if (score > highestScore) {
                    highestScore = score;
                    detectedPersona = profile.id;
                    if (score >= 1) systemNotes = [profile.instruction]; 
                }
            }

            // 2. Verificação de Guardrails
            for (const [key, rule] of Object.entries(this.guardrails)) {
                if (rule.trigger.some(t => lowerText.includes(t))) {
                    systemNotes.push(rule.alert);
                }
            }

            // 3. Intenção de "Triagem" para Calculadora
            if (lowerText.match(/(lento|travando|ruim|desligando|esquentando|defeito|quebrado)/)) {
                systemNotes.push('INTENT: TRIAGEM_TECNICA -> Sugerir Calculadora de Orçamento ao final.');
            }

            return {
                persona: detectedPersona,
                context_tags: systemNotes,
                timestamp: new Date().toISOString()
            };
        }
    };

    // --- UI LOGIC ---
    function updateChatUI(open) {
        state.isOpen = open;
        els.win.classList.toggle('open', open);
        if (els.badge) els.badge.style.display = open ? 'none' : 'flex';
        document.body.classList.toggle('chat-open', open);
        
        // A11y updates
        if (els.bubble) els.bubble.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (els.msgs) els.msgs.setAttribute('aria-live','polite');

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
            
            if(window.innerWidth > 768 && els.input) setTimeout(() => els.input.focus(), 350);
            scrollToBottom();
        } else {
            els.bubble.style.transform = 'scale(1)';
            els.bubble.style.opacity = '1';
            els.bubble.style.pointerEvents = 'auto';
            if(els.input) els.input.blur();
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

    function scrollToBottom() { if(els.msgs) els.msgs.scrollTop = els.msgs.scrollHeight; }

    // --- DRAG PHYSICS (Touch + Mouse) ---
    if(els.bubble) {
        const updatePos = (x, y) => { els.bubble.style.left = `${x}px`; els.bubble.style.top = `${y}px`; };
        
        // Touch Handlers
        els.bubble.addEventListener('touchstart', (e) => {
            const t = e.touches[0];
            state.startX = t.clientX; state.startY = t.clientY;
            const rect = els.bubble.getBoundingClientRect();
            state.initialLeft = rect.left; state.initialTop = rect.top;
            state.isDragging = false;
            
            els.bubble.classList.add('no-transition');
            els.bubble.classList.remove('snapping');
            els.bubble.style.transform = 'scale(0.95)';
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

        // Mouse Handlers (Desktop Drag)
        els.bubble.addEventListener('mousedown', (e) => {
            state.startX = e.clientX; state.startY = e.clientY;
            const rect = els.bubble.getBoundingClientRect();
            state.initialLeft = rect.left; state.initialTop = rect.top;
            state.isDragging = false;
            els.bubble.classList.add('no-transition');
            // Prevent text selection during drag
            e.preventDefault();
        });

        // Mousemove needs to be on document to handle fast movements outside bubble
        document.addEventListener('mousemove', (e) => {
            if (state.startX === undefined || state.startX === null) return;
            // Only update if mouse is down (startX set)
            const dx = e.clientX - state.startX;
            const dy = e.clientY - state.startY;
            if (Math.sqrt(dx*dx + dy*dy) > 5) state.isDragging = true;
            if (state.isDragging) {
                updatePos(state.initialLeft + dx, state.initialTop + dy);
            }
        });

        document.addEventListener('mouseup', (e) => {
             // Only act if we were interacting with the bubble
            if (state.startX === undefined || state.startX === null) return;

            els.bubble.classList.remove('no-transition');
            if (!state.isDragging) {
                 // Check if it was a click on the bubble
                 const rect = els.bubble.getBoundingClientRect();
                 if(e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
                     els.bubble.style.transform = 'scale(1)'; 
                     if(state.isOpen) closeChat(); else openChat();
                 }
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
            state.startX = null; state.startY = null;
        });

        // Click handler (for keyboard or specific click logic not covered by mouseup)
        els.bubble.addEventListener('click', (e) => { 
            if(e.detail === 0) { if(state.isOpen) closeChat(); else openChat(); }
        });

        const closeBtn = document.getElementById('closeChatBtn');
        if(closeBtn) closeBtn.onclick = (e) => { e.stopPropagation(); closeChat(); };
        
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
                img.src = safeImageSrc(p.image || p.imagem); // Hardened
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
                
                btn.onclick = (e) => {
                    e.stopPropagation();
                    const prodId = p.id; 
                    
                    if (window.showProductDetail && prodId) {
                        if(window.innerWidth <= 768) {
                            updateChatUI(false); 
                        }
                        window.showProductDetail(prodId);
                    } else {
                        // Safe fallback using minimal name
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
        if(link && isSafeHttp(link)) {
           const btn = document.createElement('a'); 
           btn.href = link; 
           btn.target = '_blank';
           btn.rel = 'noopener noreferrer'; // Security patch
           btn.className = 'block mt-2 text-center bg-green-500 text-white font-bold py-2 rounded-lg text-xs hover:bg-green-600 transition';
           btn.textContent = 'NEGOCIAR AGORA'; 
           bubble.appendChild(btn);
        }

        // --- AÇÕES INTELIGENTES (Botões de Contexto do Site) ---
        if (actions && actions.length > 0) {
            const actionContainer = document.createElement('div');
            actionContainer.className = 'mt-3 flex flex-col gap-2';
            actions.forEach(act => {
                const actBtn = document.createElement('button');
                // Sanitize icon class name briefly
                const iconClass = (typeof act.icon === 'string' && act.icon.length < 64) ? act.icon.replace(/[^\w- ]/g,'') : 'ph-question';
                actBtn.className = 'flex items-center justify-between w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-yellow-400 hover:text-black transition-colors';
                
                const span = document.createElement('span');
                span.textContent = act.label;
                const icon = document.createElement('i');
                icon.className = `ph-bold ${iconClass}`;
                
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
                    } else if (act.url && isSafeHttp(act.url)) {
                        window.open(act.url, '_blank', 'noopener noreferrer');
                    }
                };
                actionContainer.appendChild(actBtn);
            });
            bubble.appendChild(actionContainer);
        }

        div.appendChild(bubble); els.msgs.appendChild(div); scrollToBottom();

        if (save) {
            // Save minimal info
            msgHistory.push({ 
                role, 
                content, 
                prods: prods?.map(p => ({ id: p.id, name: p.name || p.nome, price: p.price || p.preco, image: p.image || p.imagem })), 
                link, 
                actions: actions?.map(a => ({ label: a.label, icon: a.icon, url: a.url, targetId: a.targetId })) 
            });
            saveHistory();
        }
    }

    function addTyping() {
        const div = document.createElement('div'); div.id='typing'; div.className='message bot';
        div.innerHTML = `<div class="message-bubble"><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>`;
        els.msgs.appendChild(div); scrollToBottom();
    }

    // --- CONTEXT AWARENESS (O Cérebro Local) ---
    function checkSiteContext(text) {
        const t = text.toLowerCase();
        const actions = [];

        if (t.includes('limpeza') || t.includes('manutenção') || t.includes('conserto') || t.includes('reparo') || t.includes('orçamento') || t.includes('arrumar') || t.includes('quebrado')) {
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
        }

        if (t.includes('onde fica') || t.includes('endereço') || t.includes('localização') || t.includes('chegar')) {
            actions.push({
                label: 'Ver Mapa e Endereço',
                icon: 'ph-map-pin',
                targetId: 'location'
            });
        }

        return actions;
    }

    async function send() {
        if (sending) return;
        
        const txt = els.input.value.trim();
        if(!txt) return;
        
        els.input.value = ''; 
        addMsg('user', txt); 
        addTyping();
        
        sending = true;

        // 1. Análise Semântica (Triagem)
        const contextAnalysis = AtomicBrain.analyze(txt);
        
        // 2. Análise de UI Local (Links de rolagem)
        const localActions = checkSiteContext(txt);
        
        const api = (typeof CONFIG !== 'undefined' && CONFIG.CHAT_API) ? CONFIG.CHAT_API : 'https://atomic-thiago-backend.onrender.com/chat';

        try {
            // INJEÇÃO DE CONTEXTO NO PAYLOAD
            const payload = { 
                message: txt, 
                session_id: sessionId,
                client_context: {
                    persona: contextAnalysis.persona,
                    context_tags: contextAnalysis.context_tags.slice(0, 5).map(t => t.slice(0, 200)), // Limit size
                    timestamp: contextAnalysis.timestamp
                }
            };

            const resp = await postJsonWithTimeout(api, payload, 10000);
            
            removeTyping();
            
            if(!resp.ok) {
                 addMsg('bot', 'Desculpe, tive um erro técnico.', [], null, localActions);
                 return;
            }

            const data = resp.data || {};
            if(data.success) {
                if(data.session_id) { sessionId = data.session_id; localStorage.setItem('chat_sess_id', sessionId); }
                addMsg('bot', data.response, data.produtos_sugeridos, data.action_link, localActions);
            } else {
                addMsg('bot', 'Desculpe, tive um erro técnico.', [], null, localActions);
            }
        } catch { 
            removeTyping();
            addMsg('bot', 'Sem conexão com a internet.', [], null, localActions); 
        } finally {
            sending = false;
        }
    }

    const sendBtn = document.getElementById('sendBtn');
    if (sendBtn) sendBtn.onclick = send;
    
    if (els.input) {
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
    }

    // LOAD HISTORY
    try {
        const savedHist = localStorage.getItem('atomic_chat_history');
        if (savedHist) {
            msgHistory = JSON.parse(savedHist);
            // Limit loaded history
            if (msgHistory.length > 200) msgHistory = msgHistory.slice(-200);
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
        processBudget: function(context) {
            if (!context || context.status !== 'completed') return;

            if (!state.isOpen) openChat();

            const customerName = context.customer?.name || 'Gamer';
            const phone = context.customer?.phone || 'N/A';
            const modelLabel = context.device?.modelLabel || 'Dispositivo';
            const logisticsLabel = context.logistics?.label || 'Não informado';
            const totalMin = context.financial?.totalMin ?? 0;
            const totalMax = context.financial?.totalMax ?? 0;

            const fmt = (val) => isFinite(val) ? val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—';
            
            let finalServiceName = context.service?.name || 'Serviço';
            let finalPriceStr = `${fmt(totalMin)} a ${fmt(totalMax)}`;

            if (context.service?.customDescription) {
                finalServiceName = `${context.service.name}: "${context.service.customDescription}"`;
                finalPriceStr = "Sob Análise Técnica";
            }

            const msg = `Olá **${customerName}**! 👋\n` +
                        `Recebi sua estimativa para o **${modelLabel}**.\n\n` +
                        `🔧 Serviço: ${finalServiceName}\n` +
                        `💰 Estimativa: **${finalPriceStr}**\n` +
                        `📍 Logística: ${logisticsLabel}\n\n` +
                        `Posso confirmar o agendamento ou você tem alguma dúvida sobre o serviço?`;

            // Avoid storing PII in the generated link inside history if possible, but keeping logic consistent with old version for now
            const waMsg = `*ORÇAMENTO TÉCNICO (WEB)*\n\n` +
                          `👤 *${customerName}*\n` +
                          `📱 ${phone}\n` +
                          `--------------------------------\n` +
                          `🎮 *Aparelho:* ${modelLabel}\n` +
                          `🛠️ *Serviço:* ${finalServiceName}\n` +
                          `📍 *Logística:* ${logisticsLabel}\n` +
                          `💰 *Estimativa:* ${finalPriceStr}\n` +
                          `--------------------------------\n` +
                          `*Obs:* Vim pelo Chat do Site.`;
            
            const waLink = `https://wa.me/5521995969378?text=${encodeURIComponent(waMsg)}`;

            setTimeout(() => {
                addMsg('bot', msg, [], null, [
                    { label: 'Agendar no WhatsApp', icon: 'ph-whatsapp-logo', url: waLink }
                ], true);
            }, 500);
        }
    };

})();
