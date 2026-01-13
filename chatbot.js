
/**
 * ATOMIC GAMES CHATBOT v3.7 (Production Release Candidate)
 * 
 * Arquitetura: Dumb Frontend / Smart Backend
 * Segurança: Strict URL Whitelist, DOM API, Telemetry-First Logic
 * Timeout: 120s (Extended for cold starts)
 */

(function (window, document, undefined) {
    'use strict';

    // --- 1. CONFIGURAÇÃO & ESTADO ---
    const CONFIG = {
        API_URL: 'https://atomic-thiago-backend.onrender.com/chat',
        TIMEOUT: 120000, // 120 segundos (2 min)
        STORAGE_KEY_SESSION: 'atomic_sess_id',
        STORAGE_KEY_HISTORY: 'atomic_chat_history',
        THEME: {
            primary: '#10b981', // Emerald 500
            secondary: '#3b82f6', // Blue 500
            botBg: '#f3f4f6',
            userBg: '#10b981',
            textDark: '#1f2937',
            textLight: '#ffffff'
        }
    };

    let state = {
        isOpen: false,
        isLoading: false,
        isDragging: false,
        sessionId: sessionStorage.getItem(CONFIG.STORAGE_KEY_SESSION) || null,
        drag: { startX: 0, startY: 0, initialLeft: 0, initialTop: 0 }
    };

    // --- 2. MÓDULO DE ESTILOS (CSS-IN-JS) ---
    const Styles = {
        inject: () => {
            if (document.getElementById('atomic-chat-styles')) return;
            const style = document.createElement('style');
            style.id = 'atomic-chat-styles';
            style.textContent = `
                /* Reset & Container */
                #atomic-chat-root { position: fixed; z-index: 9999; font-family: 'Segoe UI', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
                #atomic-chat-root * { box-sizing: border-box; }
                
                /* Bubble (Launcher) */
                #atomic-chat-bubble {
                    position: fixed; bottom: 20px; right: 20px; width: 60px; height: 60px;
                    background: ${CONFIG.THEME.primary}; border-radius: 50%; box-shadow: 0 4px 12px rgba(0,0,0,0.25);
                    cursor: pointer; display: flex; align-items: center; justify-content: center;
                    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s;
                    z-index: 10000; touch-action: none; user-select: none;
                }
                #atomic-chat-bubble:hover { transform: scale(1.1); }
                #atomic-chat-bubble svg { width: 32px; height: 32px; fill: white; }
                #atomic-chat-bubble.hidden { transform: scale(0); opacity: 0; pointer-events: none; }
                
                /* Notification Badge */
                #atomic-chat-badge {
                    position: absolute; top: -5px; right: -5px; background: red; color: white;
                    font-size: 11px; font-weight: bold; border-radius: 50%; width: 20px; height: 20px;
                    display: flex; align-items: center; justify-content: center; border: 2px solid white;
                }

                /* Window (Main UI) */
                #atomic-chat-window {
                    position: fixed; bottom: 20px; right: 20px; width: 380px; height: 600px; max-height: 80vh;
                    background: white; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.15);
                    display: flex; flex-direction: column; overflow: hidden;
                    transform-origin: bottom right; transition: transform 0.3s ease, opacity 0.3s ease;
                    transform: scale(0); opacity: 0; pointer-events: none; z-index: 10000;
                }
                #atomic-chat-window.open { transform: scale(1); opacity: 1; pointer-events: auto; }

                /* Header */
                .atomic-header {
                    background: linear-gradient(135deg, ${CONFIG.THEME.primary} 0%, ${CONFIG.THEME.secondary} 100%);
                    color: white; padding: 16px;
                    display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
                }
                .atomic-header-title { font-weight: bold; font-size: 16px; display: flex; align-items: center; gap: 8px; }
                .atomic-status-dot { width: 8px; height: 8px; background: #fff; border-radius: 50%; box-shadow: 0 0 4px rgba(255,255,255,0.5); }
                .atomic-close-btn { background: none; border: none; color: white; cursor: pointer; opacity: 0.8; font-size: 20px; padding: 0; }
                .atomic-close-btn:hover { opacity: 1; }

                /* Messages Area */
                #atomic-chat-messages {
                    flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px;
                    background: #f9fafb; scroll-behavior: smooth;
                }
                
                /* Message Bubbles */
                .atomic-msg { max-width: 85%; line-height: 1.5; font-size: 14px; position: relative; animation: atomicFadeIn 0.3s ease; }
                .atomic-msg.user { align-self: flex-end; }
                .atomic-msg.bot { align-self: flex-start; }
                
                .atomic-msg-bubble { padding: 10px 14px; border-radius: 12px; word-wrap: break-word; }
                .atomic-msg.user .atomic-msg-bubble { background: ${CONFIG.THEME.userBg}; color: white; border-bottom-right-radius: 2px; }
                .atomic-msg.bot .atomic-msg-bubble { background: ${CONFIG.THEME.botBg}; color: ${CONFIG.THEME.textDark}; border-bottom-left-radius: 2px; }

                /* Typing Indicator */
                .atomic-typing { display: flex; gap: 4px; padding: 12px 16px; background: #f3f4f6; border-radius: 12px; align-self: flex-start; width: fit-content; }
                .atomic-dot { width: 6px; height: 6px; background: #9ca3af; border-radius: 50%; animation: atomicBounce 1.4s infinite ease-in-out both; }
                .atomic-dot:nth-child(1) { animation-delay: -0.32s; }
                .atomic-dot:nth-child(2) { animation-delay: -0.16s; }

                /* Products (Legacy Integration) */
                .atomic-products-scroll { display: flex; gap: 10px; overflow-x: auto; padding: 10px 0; margin-top: 8px; scrollbar-width: thin; }
                .atomic-product-card {
                    min-width: 140px; max-width: 140px; background: white; border: 1px solid #e5e7eb; border-radius: 8px;
                    padding: 8px; display: flex; flex-direction: column; align-items: center; text-align: center;
                }
                .atomic-product-img { width: 100%; height: 80px; object-fit: contain; margin-bottom: 8px; }
                .atomic-product-title { font-size: 11px; font-weight: 600; color: #374151; margin-bottom: 4px; line-height: 1.3; height: 28px; overflow: hidden; }
                .atomic-product-price { font-size: 12px; color: #059669; font-weight: bold; margin-bottom: 8px; }
                .atomic-product-btn {
                    width: 100%; background: ${CONFIG.THEME.primary}; color: ${CONFIG.THEME.textLight}; border: none; padding: 6px; font-size: 10px;
                    border-radius: 4px; cursor: pointer; font-weight: bold; text-transform: uppercase;
                }

                /* Actions & Links */
                .atomic-actions-container { display: flex; flex-direction: column; gap: 6px; margin-top: 8px; }
                .atomic-btn {
                    background: white; border: 1px solid #e5e7eb; color: #374151; padding: 8px 12px;
                    border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; text-align: left;
                    transition: all 0.2s; display: flex; align-items: center; justify-content: space-between;
                }
                .atomic-btn:hover { background: #fef08a; border-color: #facc15; color: black; }
                .atomic-btn-primary { background: #10b981; color: white; border: none; text-align: center; justify-content: center; }
                .atomic-btn-primary:hover { background: #059669; }
                .atomic-link { text-decoration: none; display: block; }

                /* Input Area */
                .atomic-footer { padding: 12px; border-top: 1px solid #e5e7eb; background: white; display: flex; gap: 8px; }
                #atomic-chat-input {
                    flex: 1; padding: 10px 14px; border: 1px solid #e5e7eb; border-radius: 20px; outline: none;
                    font-size: 14px; transition: border-color 0.2s;
                }
                #atomic-chat-input:focus { border-color: #10b981; }
                #atomic-send-btn {
                    background: #10b981; color: white; border: none; width: 36px; height: 36px; border-radius: 50%;
                    cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
                }
                #atomic-send-btn:disabled { background: #d1d5db; cursor: not-allowed; }

                /* Mobile Responsive */
                @media (max-width: 480px) {
                    #atomic-chat-window { width: 100%; height: 100%; bottom: 0; right: 0; max-height: 100%; border-radius: 0; }
                    #atomic-chat-bubble { bottom: 15px; right: 15px; }
                }

                @keyframes atomicFadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes atomicBounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
            `;
            document.head.appendChild(style);
        }
    };

    // --- 3. MÓDULO DE DOM & RENDERIZAÇÃO ---
    const DOM = {
        els: {},

        createWidget: () => {
            const root = document.createElement('div');
            root.id = 'atomic-chat-root';

            // HTML Estático seguro
            root.innerHTML = `
                <div id="atomic-chat-bubble" role="button" aria-label="Abrir chat" tabindex="0">
                    <div id="atomic-chat-badge" style="display: none;">1</div>
                    <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"></path></svg>
                </div>
                <div id="atomic-chat-window" aria-hidden="true" role="dialog" aria-modal="true" aria-label="Atendimento Atomic Games">
                    <div class="atomic-header">
                        <div class="atomic-header-title">
                            <div class="atomic-status-dot"></div> Thiago (IA)
                        </div>
                        <button class="atomic-close-btn" aria-label="Fechar chat">✕</button>
                    </div>
                    <div id="atomic-chat-messages" role="log" aria-live="polite"></div>
                    <form class="atomic-footer">
                        <input type="text" id="atomic-chat-input" placeholder="Digite sua dúvida..." aria-label="Mensagem">
                        <button type="submit" id="atomic-send-btn" aria-label="Enviar">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                        </button>
                    </form>
                </div>
            `;
            document.body.appendChild(root);
            
            // Cache elements - Seletores corrigidos
            DOM.els = {
                bubble: document.getElementById('atomic-chat-bubble'),
                badge: document.getElementById('atomic-chat-badge'),
                window: document.getElementById('atomic-chat-window'),
                messages: document.getElementById('atomic-chat-messages'),
                input: document.getElementById('atomic-chat-input'),
                sendBtn: document.getElementById('atomic-send-btn'),
                form: document.querySelector('.atomic-footer'),
                closeBtn: document.querySelector('.atomic-close-btn')
            };
        },

        /**
         * SAFETY: URL VALIDATION (WHITELIST)
         */
        isSafeUrl: (str) => {
            try {
                const url = new URL(str, window.location.href);
                return ['http:', 'https:', 'mailto:', 'tel:', 'whatsapp:'].includes(url.protocol);
            } catch (e) { return false; }
        },

        /**
         * SAFETY: SANITIZATION
         */
        sanitize: (str) => {
            if (!str) return '';
            return String(str).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
        },

        parseMarkdown: (text) => {
            // 1. Sanitiza primeiro (remove qualquer HTML malicioso)
            let safeText = DOM.sanitize(text);
            
            // 2. Aplica formatação segura permitida
            safeText = safeText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); // Bold
            safeText = safeText.replace(/\*(.*?)\*/g, '<em>$1</em>'); // Italic
            safeText = safeText.replace(/\n/g, '<br>'); // Line breaks
            
            return safeText;
        },

        renderMessage: (role, text, actions = [], products = [], save = true) => {
            const div = document.createElement('div');
            div.className = `atomic-msg ${role}`;
            
            const bubble = document.createElement('div');
            bubble.className = 'atomic-msg-bubble';
            bubble.innerHTML = DOM.parseMarkdown(text); // Safe markdown parsing

            // Integração Legada: Renderizar Produtos (DOM API Only)
            if (products && products.length > 0) {
                const scroll = document.createElement('div');
                scroll.className = 'atomic-products-scroll';
                
                products.forEach(p => {
                    const card = document.createElement('div');
                    card.className = 'atomic-product-card';
                    
                    // Image
                    const img = document.createElement('img');
                    img.className = 'atomic-product-img';
                    img.alt = p.name || 'Produto';
                    
                    if (p.image) {
                        if (DOM.isSafeUrl(p.image)) {
                            img.src = p.image;
                        } else {
                            // Imagem bloqueada: Placeholder + Telemetria
                            img.src = 'https://placehold.co/100';
                            window.dispatchEvent(new CustomEvent('atomic_chat_security', { 
                                detail: { 
                                    type: 'blocked_product_image', 
                                    url: p.image, 
                                    productId: p.id || null, 
                                    sessionId: state.sessionId,
                                    timestamp: Date.now()
                                } 
                            }));
                            console.warn('Blocked unsafe product image URL:', p.image);
                        }
                    } else {
                        img.src = 'https://placehold.co/100';
                    }

                    // Title
                    const title = document.createElement('div');
                    title.className = 'atomic-product-title';
                    title.textContent = p.name || p.nome;

                    // Price
                    const price = document.createElement('div');
                    price.className = 'atomic-product-price';
                    price.textContent = p.price || p.preco;

                    // Button
                    const btn = document.createElement('button');
                    btn.className = 'atomic-product-btn';
                    btn.textContent = 'Ver Detalhes';
                    
                    // Interaction
                    btn.onclick = (e) => {
                        e.stopPropagation();
                        if (window.showProductDetail && p.id) {
                            if (window.innerWidth <= 768) Methods.toggleChat(false);
                            window.showProductDetail(p.id);
                        } else {
                            const safeName = encodeURIComponent(p.name || p.nome || '');
                            window.open(`https://wa.me/5521995969378?text=Interesse em: ${safeName}`);
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

            // Renderizar Actions
            if (actions && actions.length > 0) {
                const actContainer = document.createElement('div');
                actContainer.className = 'atomic-actions-container';
                
                actions.forEach(act => {
                    const label = act.label;
                    const url = act.url;
                    const payload = act.payload;
                    const isPrimary = act.type === 'human_handoff' || act.type === 'primary';
                    const targetId = act.targetId;

                    let btn;
                    const isUnsafeUrl = url && !DOM.isSafeUrl(url);

                    if (url && !isUnsafeUrl) {
                        // Link Seguro
                        btn = document.createElement('a');
                        btn.href = url;
                        btn.target = '_blank';
                        btn.rel = 'noopener noreferrer';
                        btn.className = `atomic-btn atomic-link ${isPrimary ? 'atomic-btn-primary' : ''}`;
                    } else {
                        // Gera elemento botão (para ações internas ou fallback de link inseguro)
                        btn = document.createElement('button');
                        btn.className = `atomic-btn ${isPrimary ? 'atomic-btn-primary' : ''}`;
                        
                        if (isUnsafeUrl) {
                            // Link inseguro detectado: Botão inerte + Telemetria
                            btn.disabled = true;
                            btn.title = 'Link bloqueado por segurança';
                            
                            window.dispatchEvent(new CustomEvent('atomic_chat_security', {
                                detail: { 
                                    type: 'blocked_action_url', 
                                    url: url, 
                                    sessionId: state.sessionId,
                                    timestamp: Date.now()
                                }
                            }));
                            console.warn('Blocked unsafe action URL:', url);
                        } else {
                            // Ação funcional normal (Scroll ou Payload)
                            btn.onclick = () => {
                                if (targetId) {
                                    const el = document.getElementById(targetId);
                                    if (el) {
                                        if(window.innerWidth < 768) Methods.toggleChat(false);
                                        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }
                                } else if (payload) {
                                    window.dispatchEvent(new CustomEvent('atomic_chat_action', { detail: act }));
                                }
                            };
                        }
                    }

                    // Text Content Only (No innerHTML)
                    const span = document.createElement('span');
                    span.textContent = label;
                    btn.appendChild(span);

                    actContainer.appendChild(btn);
                });
                bubble.appendChild(actContainer);
            }

            div.appendChild(bubble);
            DOM.els.messages.appendChild(div);
            DOM.scrollToBottom();

            if (save) {
                Methods.saveHistory({ role, text, actions, products });
            }
        },

        renderTyping: () => {
            const div = document.createElement('div');
            div.id = 'atomic-typing-indicator';
            div.className = 'atomic-msg bot';
            div.innerHTML = `
                <div class="atomic-typing">
                    <div class="atomic-dot"></div><div class="atomic-dot"></div><div class="atomic-dot"></div>
                </div>
            `;
            DOM.els.messages.appendChild(div);
            DOM.scrollToBottom();
        },

        removeTyping: () => {
            const el = document.getElementById('atomic-typing-indicator');
            if (el) el.remove();
        },

        renderError: (msg) => {
            const errorMsg = msg || '**Erro de conexão.**\nVerifique sua internet e tente novamente.';
            DOM.renderMessage('bot', errorMsg, [], [], false);
            window.dispatchEvent(new Event('atomic_chat_error'));
        },

        scrollToBottom: () => {
            DOM.els.messages.scrollTop = DOM.els.messages.scrollHeight;
        }
    };

    // --- 4. LÓGICA & REDE ---
    const Methods = {
        toggleChat: (open) => {
            state.isOpen = open;
            if (open) {
                DOM.els.window.classList.add('open');
                DOM.els.bubble.classList.add('hidden');
                DOM.els.badge.style.display = 'none';
                if (window.innerWidth > 768) setTimeout(() => DOM.els.input.focus(), 300);
                DOM.scrollToBottom();
            } else {
                DOM.els.window.classList.remove('open');
                DOM.els.bubble.classList.remove('hidden');
                DOM.els.input.blur();
            }
        },

        sendMessage: async (text) => {
            if (!text.trim() || state.isLoading) return;
            
            // UI Update
            DOM.renderMessage('user', text);
            DOM.els.input.value = '';
            DOM.els.input.disabled = true; // Lock UI
            DOM.els.sendBtn.disabled = true; // Lock UI
            
            DOM.renderTyping();
            state.isLoading = true;

            // AbortController para Timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);

            try {
                const payload = {
                    message: text,
                    session_id: state.sessionId,
                    origin: 'embedded-chatbot',
                    channel: 'website'
                };

                const response = await fetch(CONFIG.API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    signal: controller.signal
                });

                if (!response.ok) throw new Error('Network error');

                const data = await response.json();
                
                // Gestão de Sessão (Backend Soberano)
                if (data.session_id) {
                    state.sessionId = data.session_id;
                    sessionStorage.setItem(CONFIG.STORAGE_KEY_SESSION, state.sessionId);
                }

                const products = data.produtos_sugeridos || []; 
                DOM.renderMessage('bot', data.reply, data.actions, products);

                if (data.escalate) {
                    window.dispatchEvent(new CustomEvent('atomic_chat_escalate', { detail: data }));
                }

            } catch (error) {
                if (error.name === 'AbortError') {
                    window.dispatchEvent(new CustomEvent('atomic_chat_error', { 
                        detail: { type: 'timeout', sessionId: state.sessionId, timestamp: Date.now() } 
                    }));
                    DOM.renderError('**O servidor demorou muito para responder.**\nTente novamente mais tarde.');
                } else {
                    DOM.renderError();
                }
            } finally {
                clearTimeout(timeoutId);
                DOM.removeTyping();
                state.isLoading = false;
                DOM.els.input.disabled = false; // Unlock UI
                DOM.els.sendBtn.disabled = false; // Unlock UI
                setTimeout(() => DOM.els.input.focus(), 100);
            }
        },

        saveHistory: (msgObj) => {
            try {
                let history = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY_HISTORY) || '[]');
                history.push(msgObj);
                if (history.length > 50) history = history.slice(-50);
                localStorage.setItem(CONFIG.STORAGE_KEY_HISTORY, JSON.stringify(history));
            } catch (e) { console.warn('Chat history save failed'); }
        },

        loadHistory: () => {
            try {
                const history = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY_HISTORY));
                if (history && Array.isArray(history) && history.length > 0) {
                    history.forEach(m => DOM.renderMessage(m.role, m.text, m.actions, m.products, false));
                } else {
                    setTimeout(() => {
                        DOM.renderMessage('bot', 'Olá! 👋 Sou o assistente virtual da Atomic Games.\nComo posso ajudar você hoje?', [], [], false);
                    }, 500);
                }
            } catch (e) { console.error('History load error'); }
        }
    };

    // --- 5. DRAG PHYSICS (LEGACY) ---
    const Physics = {
        setup: () => {
            const b = DOM.els.bubble;
            
            const onTouchStart = (e) => {
                const t = e.touches[0];
                state.drag.startX = t.clientX; state.drag.startY = t.clientY;
                const rect = b.getBoundingClientRect();
                state.drag.initialLeft = rect.left; state.drag.initialTop = rect.top;
                state.isDragging = false;
                b.style.transition = 'none';
            };

            const onTouchMove = (e) => {
                const t = e.touches[0];
                const dx = t.clientX - state.drag.startX;
                const dy = t.clientY - state.drag.startY;
                if (Math.sqrt(dx*dx + dy*dy) > 10) state.isDragging = true;
                if (state.isDragging) {
                    e.preventDefault();
                    b.style.left = `${state.drag.initialLeft + dx}px`;
                    b.style.top = `${state.drag.initialTop + dy}px`;
                    b.style.bottom = 'auto'; b.style.right = 'auto';
                }
            };

            const onTouchEnd = (e) => {
                b.style.transition = ''; // Restore CSS transition
                if (!state.isDragging) {
                    Methods.toggleChat(true);
                } else {
                    // Snap logic
                    const rect = b.getBoundingClientRect();
                    const midX = window.innerWidth / 2;
                    const snapX = (rect.left + rect.width/2) < midX ? 20 : window.innerWidth - rect.width - 20;
                    b.style.left = `${snapX}px`;
                }
                state.isDragging = false;
            };

            b.addEventListener('touchstart', onTouchStart, { passive: true });
            b.addEventListener('touchmove', onTouchMove, { passive: false });
            b.addEventListener('touchend', onTouchEnd);
            b.addEventListener('click', (e) => { if (!state.isDragging) Methods.toggleChat(true); });
        }
    };

    // --- 6. INTEGRAÇÃO EXTERNA (GLOBAL API) ---
    window.AtomicChat = {
        processBudget: function(context) {
            if (!context || context.status !== 'completed') return;

            // 1. Abrir Chat
            if (!state.isOpen) Methods.toggleChat(true);

            // 2. Formatar
            const fmt = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            let serviceName = context.service.name;
            let priceStr = `${fmt(context.financial.totalMin)} a ${fmt(context.financial.totalMax)}`;

            if (context.service.customDescription) {
                serviceName = `${context.service.name}: "${context.service.customDescription}"`;
                priceStr = "Sob Análise Técnica";
            }

            const msg = `Olá **${context.customer.name || 'Gamer'}**! 👋\n` +
                        `Recebi sua estimativa para o **${context.device.modelLabel}**.\n\n` +
                        `🔧 Serviço: ${serviceName}\n` +
                        `💰 Estimativa: **${priceStr}**\n` +
                        `📍 Logística: ${context.logistics.label}\n\n` +
                        `Posso confirmar o agendamento?`;

            // 3. Gerar Link WhatsApp
            const waMsg = `*ORÇAMENTO TÉCNICO (WEB)*\n\n` +
                          `👤 *${context.customer.name}*\n` +
                          `📱 ${context.customer.phone}\n` +
                          `--------------------------------\n` +
                          `🎮 *Aparelho:* ${context.device.modelLabel}\n` +
                          `🛠️ *Serviço:* ${serviceName}\n` +
                          `📍 *Logística:* ${context.logistics.label}\n` +
                          `💰 *Estimativa:* ${priceStr}`;
            
            const waLink = `https://wa.me/5521995969378?text=${encodeURIComponent(waMsg)}`;

            // 4. Injetar
            setTimeout(() => {
                DOM.renderMessage('bot', msg, [
                    { type: 'human_handoff', label: 'Agendar no WhatsApp', url: waLink, icon: 'whatsapp' }
                ], [], true);
            }, 600);
        }
    };

    // --- 7. INICIALIZAÇÃO ---
    const init = () => {
        Styles.inject();
        DOM.createWidget();
        Physics.setup();
        
        // Listeners
        DOM.els.form.addEventListener('submit', (e) => {
            e.preventDefault();
            Methods.sendMessage(DOM.els.input.value);
        });

        DOM.els.closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            Methods.toggleChat(false);
        });

        // Load History
        Methods.loadHistory();

        // Warmup Backend
        fetch(CONFIG.API_URL.replace('/chat', ''), { method: 'HEAD', mode: 'no-cors' }).catch(()=>{});
    };

    // Boot
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})(window, document);
