
(function() {
    'use strict';
    // Atomic Chatbot Logic (Same as provided previously)
    console.log('Atomic Chatbot v5.9.1 Initializing...');
    
    const getEl = (id) => document.getElementById(id);
    const els = {
        bubble: getEl('chatBubble'),
        win: getEl('chatWindow'),
        msgs: getEl('chatMessages'),
        input: getEl('chatInput'),
        sendBtn: getEl('sendBtn'),
        closeBtn: getEl('closeChatBtn'),
        resetBtn: getEl('resetChatBtn')
    };

    if (!els.bubble || !els.win) return;

    let state = { isOpen: false, messages: [] };

    function toggleChat(open) {
        state.isOpen = open;
        if (open) {
            els.win.classList.add('open');
            els.bubble.style.opacity = '0';
            els.bubble.style.pointerEvents = 'none';
            document.body.classList.add('chat-open');
        } else {
            els.win.classList.remove('open');
            els.bubble.style.opacity = '1';
            els.bubble.style.pointerEvents = 'auto';
            document.body.classList.remove('chat-open');
        }
    }

    els.bubble.addEventListener('click', () => toggleChat(true));
    if(els.closeBtn) els.closeBtn.addEventListener('click', () => toggleChat(false));
    
    // Mock Send Logic
    function sendMessage() {
        const text = els.input.value.trim();
        if(!text) return;
        
        appendMessage('user', text);
        els.input.value = '';
        
        setTimeout(() => {
            appendMessage('bot', 'Olá! Sou o assistente virtual da Atomic. Como posso ajudar com consoles ou PCs hoje?');
        }, 1000);
    }

    function appendMessage(role, text) {
        const div = document.createElement('div');
        div.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'} mb-2`;
        div.innerHTML = `<div class="p-3 rounded-xl max-w-[85%] text-sm ${role === 'user' ? 'bg-yellow-400 text-black' : 'bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700'}">${text}</div>`;
        els.msgs.appendChild(div);
        els.msgs.scrollTop = els.msgs.scrollHeight;
    }

    if(els.sendBtn) els.sendBtn.addEventListener('click', sendMessage);
    if(els.input) els.input.addEventListener('keypress', (e) => { if(e.key === 'Enter') sendMessage(); });

})();
