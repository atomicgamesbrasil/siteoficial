# Atomic Games — Site Oficial

Bem-vindo ao repositório do **site oficial da Atomic Games**.

Este projeto representa o **front-end institucional e comercial** da Atomic Games, funcionando como a principal interface pública da marca, integrando catálogo, identidade visual, experiência do usuário e comunicação direta com o chatbot inteligente.

---

## Visão Geral

O site da Atomic Games foi desenvolvido com foco em:

- Performance e carregamento rápido
- Experiência mobile-first
- Arquitetura desacoplada (front-end independente)
- Integração limpa com serviços externos (Chatbot, APIs e catálogo)
- Identidade visual forte e coerente com o universo gamer e tecnológico

O site **não executa lógica cognitiva**, não processa regras de negócio complexas e não toma decisões. Ele atua exclusivamente como **camada de apresentação e interação**.

---

## Arquitetura do Projeto

### Estrutura Conceitual

```
[ Usuário ]
     ↓
[ Site Atomic Games ]
     ↓
[ Chatbot Externo (chatbot.js) ]
     ↓
[ API Backend ]
     ↓
[ Motor Cognitivo (Gemini) ]
```

### Responsabilidades do Site

- Renderizar páginas institucionais e comerciais
- Exibir catálogo e informações visuais
- Carregar o chatbot via script externo
- Disparar eventos de interação do usuário
- Não armazenar nem processar dados sensíveis

---

## Integração do Chatbot

O chatbot **não está embutido no código do site**.

Ele é carregado via script externo, geralmente desta forma:

```html
<script src="https://atomicgamesbrasil.github.io/chatbot/chatbot.js"></script>
```

### Importante

- O site **não conhece a lógica do chatbot**
- O site **não possui acesso ao cérebro do bot**
- Toda comunicação ocorre via HTTP (`POST /chat`)
- O site apenas hospeda o ponto de entrada visual

Isso garante:
- Segurança
- Facilidade de atualização
- Independência entre front-end e inteligência

---

## Segurança

O site segue os seguintes princípios:

- Nenhum dado sensível é coletado diretamente
- Nenhuma chave de API é exposta
- Nenhuma lógica crítica roda no navegador
- Toda inteligência está isolada no backend

O chatbot possui sua própria camada de proteção (XSS, sanitização, timeout, abort, rate limit), sem depender do site.

---

## Tecnologias Utilizadas

- HTML5 semântico
- CSS moderno (layout responsivo)
- JavaScript puro (sem frameworks pesados)
- GitHub Pages para hospedagem estática
- Integração externa via HTTP

---

## Hospedagem

O site é hospedado via **GitHub Pages**, garantindo:

- Alta disponibilidade
- Baixo custo
- Deploy simples
- Versionamento transparente

---

## Manutenção e Evolução

Este repositório representa **apenas a camada visual**.

Evoluções futuras podem incluir:
- Melhorias visuais e de UX
- Novas páginas institucionais
- Ajustes de performance
- Atualização de integrações externas

Qualquer evolução cognitiva ou de automação ocorre **fora deste repositório**.

---

## Autor e Idealização

Projeto idealizado, arquitetado e dirigido por:

**Tiago Castro**  
Fundador e Criador da Atomic Games  
Direção de Produto, Arquitetura e Experiência

---

## Licença

Este projeto é de uso exclusivo da Atomic Games.  
Todos os direitos reservados.
