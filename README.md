# Atomic Games – Chatbot Embed

Widget de chatbot plug-and-play, autossuficiente no front-end, projetado para integração em qualquer site de terceiros via uma única tag <script>.

Toda a lógica cognitiva, tomada de decisão, segurança, regras e inteligência artificial reside exclusivamente no backend.
O front-end atua apenas como renderizador passivo e canal de comunicação HTTP.

---

## Visão Geral da Arquitetura

Frontend (chatbot.js):
- Autônomo
- Injeta seu próprio HTML e CSS
- Nenhuma lógica de decisão
- Nenhum conhecimento hardcoded
- Apenas envia mensagens e renderiza respostas

Backend (/chat):
- Orquestra o cérebro cognitivo
- Lê artefatos JSON (intenções, regras, conhecimento, guardrails)
- Decide intenção, segurança e escalonamento
- Usa LLM apenas como redator final

---

## Estrutura do Repositório

chatbot/
├── chatbot.js
├── index.html
└── README.md

O index.html é apenas para demonstração.
Em produção, apenas o chatbot.js é necessário.

---

## Como Integrar no Site

Adicionar antes do fechamento do </body>:

<script src="https://SEU-DOMINIO/chatbot.js"></script>

---

## Configuração

No topo do chatbot.js:

const CONFIG = {
  API_URL: 'https://api.atomicgames.com/chat',
  TIMEOUT_MS: 20000
};

---

## Protocolo de Comunicação

POST /chat

Payload:

{
  "message": "Texto do usuário",
  "session_id": "string|null",
  "origin": "embedded-chatbot",
  "channel": "website"
}

---

## Resposta Esperada

{
  "reply": "Mensagem do bot",
  "actions": [],
  "session_id": "string",
  "escalate": false
}

---

## Eventos Globais

atomic_chat_action
atomic_chat_escalate
atomic_chat_error

---

## Segurança

- Escape de HTML (XSS)
- Sanitização de URL
- Rate limit
- Timeout com AbortController
- Alerta de dados sensíveis
- Nenhuma execução dinâmica

---

## Licença

Uso interno – Atomic Games
