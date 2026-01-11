# Atomic Games Brasil — Site Oficial

Bem-vindo ao repositório do **site oficial da Atomic Games Brasil**.

Este projeto representa a presença institucional da Atomic Games na web, integrando identidade visual, informações da loja, canais de contato e o **Chatbot Inteligente Atomic**, responsável pelo atendimento automatizado inicial aos clientes.

---

## 📌 Visão Geral

O site foi projetado para ser:

- **Leve e rápido**, com carregamento otimizado
- **Responsivo**, funcionando perfeitamente em desktop e mobile
- **Institucional e comercial**, apresentando a Atomic Games como referência em games e informática
- **Integrado ao chatbot**, que atua como primeiro ponto de contato com o cliente

O front-end é totalmente desacoplado da inteligência do chatbot. Toda a lógica cognitiva, regras, intenções e segurança residem no backend.

---

## 🤖 Chatbot Inteligente Atomic

O site integra o **Chatbot Atomic** por meio de um script externo (`chatbot.js`).

### Características do chatbot no front-end:

- Widget flutuante independente da estrutura do site
- Injeção automática de HTML e CSS
- Comunicação exclusiva via HTTP com o backend
- Nenhuma lógica de decisão local (frontend é passivo)
- Suporte a:
  - Mensagens de texto
  - Ações (botões)
  - Escalonamento para atendimento humano
  - Persistência de sessão
  - Tratamento de erros e reconexão

> ⚠️ Importante: o site **não contém** regras de atendimento, preços, prazos ou lógica de negócio. Tudo isso é responsabilidade do backend.

---

## 🧠 Arquitetura (Front-end)

```
[ Usuário ]
     ↓
[ Site Oficial ]
     ↓
[ chatbot.js ]  →  POST /chat
     ↓
[ Backend / API ]  →  Gemini (redator)
```

O front-end apenas:

- Renderiza a interface
- Envia mensagens
- Exibe respostas e ações retornadas

---

## 📁 Estrutura do Projeto

```
siteoficial/
├── index.html
├── assets/
│   ├── imagens/
│   ├── css/
│   └── js/
└── README.md
```

O chatbot **não está versionado neste repositório**. Ele é carregado externamente via `<script>`.

---

## 🚀 Como Integrar o Chatbot

Basta incluir o script no HTML:

```html
<script src="https://SEU-ENDPOINT/chatbot.js"></script>
```

Nenhuma outra configuração é necessária no site.

---

## 🔐 Segurança

- O front-end não processa dados sensíveis
- Toda validação ocorre no backend
- Proteções contra XSS e injeção são aplicadas no chatbot

---

## 🧩 Tecnologias Utilizadas

- HTML5
- CSS3
- JavaScript (Vanilla)
- Integração HTTP com API externa

---

## 👤 Autor & Idealização

Este projeto foi **idealizado, arquitetado e dirigido** por:

**Tiago (Thiago Castro)**  
Fundador da **Atomic Games Brasil**

Responsável por:

- Conceito do site
- Arquitetura do chatbot
- Definição de fluxos de atendimento
- Direção técnica e funcional do projeto

---

## 📄 Licença

Este projeto é de uso exclusivo da Atomic Games Brasil.

Todos os direitos reservados.

---

© Atomic Games Brasil
