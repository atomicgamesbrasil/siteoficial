# Changelog

## [2.3.0] - 2026-01-10

### Added
- Injeção automática de HTML e CSS
- Suporte completo a ARIA e acessibilidade
- AbortController com timeout configurável
- Eventos globais para ações, erros e escalonamento
- Sanitização rigorosa de URLs
- Parser Markdown seguro
- Detecção preventiva de dados sensíveis

### Changed
- Remoção total de lógica cognitiva do frontend
- Frontend agora é renderizador passivo
- Protocolo HTTP unificado via POST /chat

### Security
- Proteção contra XSS
- Bloqueio de protocolos inseguros
- localStorage encapsulado com try/catch

---

## [2.2.0] - 2025-12

- Persistência de sessão via localStorage
- UI flutuante com drag & snap
- Renderização dinâmica de ações

---

## [2.1.0] - 2025-11

- Primeira versão embedável
- Comunicação básica frontend-backend
