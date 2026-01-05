

// === GLOBAL PWA VARIABLES ===
let deferredPrompt;

// 1. Capture standard event immediately
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
});

const CONFIG = {
    GITHUB_USER: "atomicgamesbrasil",
    GITHUB_REPO: "siteoficial",
    GITHUB_BRANCH: "main",
    CHAT_API: 'https://atomic-thiago-backend.onrender.com/chat',
    PAINEL_API_BASE: "https://painel-atomic.onrender.com/api"
};
const BASE_IMG_URL = `https://raw.githubusercontent.com/${CONFIG.GITHUB_USER}/${CONFIG.GITHUB_REPO}/${CONFIG.GITHUB_BRANCH}/`;

// --- ANALYTICS ---
const trackAtomicEvent = (type) => {
    if (type === 'visit') {
        if (sessionStorage.getItem('atomic_visited')) return;
        sessionStorage.setItem('atomic_visited', 'true');
    }
    fetch(`${CONFIG.PAINEL_API_BASE}/public/visit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
        keepalive: true
    }).catch(err => console.warn('[Atomic Analytics] Error:', err));
};

// Initial Data Placeholders
let allProducts = [];
let cart = [];
let promoBanners = [];
let currentFilter = 'all';
let debounceTimer;
let els = {};

// Utils
const formatPrice = p => typeof p === 'number' ? p.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : p;
const showToast = (msg, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="ph-bold ${type === 'success' ? 'ph-check-circle' : 'ph-warning-circle'} text-xl"></i><span>${msg}</span>`;
    els.toastContainer.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateY(20px) scale(0.8)'; setTimeout(() => toast.remove(), 300); }, 3000);
};
const getCategoryClass = cat => ({ console: 'category-console', games: 'category-games', acessorios: 'category-acessorios', hardware: 'category-hardware' }[cat] || 'category-games');


// =========================================================================
// BLOCO LÓGICO DA CALCULADORA (INTEGRADO NO MAIN.JS)
// Fonte de Dados: Pesquisa de Orçamentos 2025-2026 (PDF)
// =========================================================================

const DB_SERVICOS = {
    config: {
        // Tabela 2.2 do Relatório e Seção 5.1
        valor_hora: {
            "JR": 50.00,  // Baseado na faixa R$40-60 (Limpezas, formatações)
            "SR": 125.00  // Baseado na faixa R$100-150 (Reparos placa, diagnósticos)
        },
        // Item 6.1 do Relatório (Logística)
        logistica: {
            "BALCAO": 0.00,
            "RAIO_CURTO": 0.00,      // < 5km (Embutido)
            "RAIO_MEDIO": 30.00,     // 5-15km (Zona Norte)
            "RAIO_LONGO": 60.00      // > 15km (Zona Oeste estimada)
        },
        // Item 3.4 (Controles) e 1.1 (Markup Geral)
        // Markup padrão para componentes gerais
        markup_padrao: 2.0 // 100% Markup
    },
    aparelhos: [
        {
            id: "PS5",
            label: "PlayStation 5",
            servicos: [
                // Dados baseados na Seção 3.1 e Tabela 5.1
                // Limpeza Metal Liq: Custo R$50, MO R$250 -> Total Sugerido R$300-450
                { 
                    id: "LIMPEZA_METAL", 
                    label: "Limpeza Completa (Metal Líquido)", 
                    horas: 2.0, 
                    nivel: "SR", 
                    complexidade: 1.0, 
                    custo_peca: 50.00, 
                    risco: "ALTO",
                    obs: "Inclui Metal Líquido"
                },
                // HDMI: Custo R$40, MO R$260 -> Total Sugerido R$300-450
                { 
                    id: "TROCA_HDMI", 
                    label: "Troca de Conector HDMI", 
                    horas: 2.0, // Aprox para chegar a 260 MO com SR(125) * 1.04
                    nivel: "SR", 
                    complexidade: 1.04, 
                    custo_peca: 40.00, 
                    risco: "MEDIO",
                    obs: "Microsolda obrigatória"
                },
                // Diagnóstico Placa: MO Pura
                { 
                    id: "DIAGNOSTICO", 
                    label: "Não Liga (Diagnóstico Placa)", 
                    horas: 3.0, 
                    nivel: "SR", 
                    complexidade: 1.0, 
                    custo_peca: 0.00, 
                    risco: "ALTO",
                    obs: "Orçamento sob análise"
                }
            ]
        },
        {
            id: "PS4",
            label: "PlayStation 4",
            servicos: [
                // Tabela 5.1: Limpeza PS4 -> Custo R$10, MO R$110 -> Total R$100-150
                { 
                    id: "LIMPEZA_PREVENTIVA", 
                    label: "Limpeza Preventiva e Pasta", 
                    horas: 2.2, // 2.2 * 50 = 110
                    nivel: "JR", 
                    complexidade: 1.0, 
                    custo_peca: 10.00, 
                    risco: "BAIXO",
                    obs: "Pasta térmica prata"
                },
                // HDMI PS4 (Inferido similar ao PS5 mas menor risco/custo)
                { 
                    id: "TROCA_HDMI", 
                    label: "Troca de HDMI", 
                    horas: 1.5, 
                    nivel: "SR", 
                    complexidade: 1.0, 
                    custo_peca: 30.00, 
                    risco: "MEDIO",
                    obs: "Solda padrão"
                },
                // HD Sistema
                { 
                    id: "SISTEMA", 
                    label: "Reinstalação de Sistema (Erro)", 
                    horas: 1.5, 
                    nivel: "JR", 
                    complexidade: 1.0, 
                    custo_peca: 0.00, 
                    risco: "BAIXO",
                    obs: "Não inclui peça (HD)"
                }
            ]
        },
        {
            id: "XBOX_SERIES",
            label: "Xbox Series S/X",
            servicos: [
                // Seção 3.2: Similar ao PC/PS4
                { 
                    id: "LIMPEZA_COMPLETA", 
                    label: "Limpeza Completa", 
                    horas: 2.2, 
                    nivel: "JR", 
                    complexidade: 1.0, 
                    custo_peca: 10.00, 
                    risco: "BAIXO",
                    obs: "Pasta térmica"
                },
                { 
                    id: "ERRO_SSD", 
                    label: "Erro de Sistema / SSD", 
                    horas: 2.0, 
                    nivel: "SR", 
                    complexidade: 1.0, 
                    custo_peca: 0.00, 
                    risco: "MEDIO",
                    obs: "Requer ferramentas proprietárias"
                }
            ]
        },
        {
            id: "SWITCH",
            label: "Nintendo Switch",
            servicos: [
                // Seção 3.3 e Tabela 5.1
                // Drift: Custo peca baixo, MO tecnica.
                { 
                    id: "DRIFT_JOYCON", 
                    label: "Troca de Analógico (Drift)", 
                    horas: 0.8, 
                    nivel: "JR", 
                    complexidade: 1.0, 
                    custo_peca: 25.00, 
                    risco: "BAIXO",
                    obs: "Por alavanca"
                },
                // Tela Lite: Custo R$150, MO R$200 -> Total R$350-500
                { 
                    id: "TROCA_TELA_LITE", 
                    label: "Troca de Tela (Switch Lite)", 
                    horas: 1.6, // 1.6 * 125 = 200
                    nivel: "SR", 
                    complexidade: 1.0, 
                    custo_peca: 150.00, 
                    risco: "ALTO",
                    obs: "Desmontagem total"
                }
            ]
        },
        {
            id: "PC",
            label: "PC Gamer / Notebook",
            servicos: [
                // Tabela 5.1
                // Formatacao Simples: MO R$60 -> Total R$50-80
                { 
                    id: "FORMATACAO_SIMPLES", 
                    label: "Formatação (Sem Backup)", 
                    horas: 1.2, // 1.2 * 50 = 60
                    nivel: "JR", 
                    complexidade: 1.0, 
                    custo_peca: 0.00, 
                    risco: "BAIXO",
                    obs: "Drivers básicos"
                },
                // Formatacao Completa: MO R$120 -> Total R$100-150
                { 
                    id: "FORMATACAO_COMPLETA", 
                    label: "Formatação Completa + Backup", 
                    horas: 2.4, // 2.4 * 50 = 120
                    nivel: "JR", 
                    complexidade: 1.0, 
                    custo_peca: 0.00, 
                    risco: "BAIXO",
                    obs: "Backup até 50GB"
                },
                // Limpeza Note: Custo R$10, MO R$110 -> Total R$120-180
                { 
                    id: "LIMPEZA_NOTE", 
                    label: "Limpeza Interna Notebook", 
                    horas: 2.2, // 2.2 * 50 = 110
                    nivel: "JR", 
                    complexidade: 1.0, 
                    custo_peca: 10.00, 
                    risco: "MEDIO",
                    obs: "Troca de pasta"
                }
            ]
        },
        {
            id: "CONTROLE",
            label: "Controles (DualSense/Xbox)",
            servicos: [
                // Seção 3.4
                { 
                    id: "DRIFT_CONTROLE", 
                    label: "Reparo de Drift (Analógico)", 
                    horas: 1.0, 
                    nivel: "JR", 
                    complexidade: 1.2, 
                    custo_peca: 25.00, 
                    risco: "BAIXO",
                    obs: "Solda necessária"
                },
                { 
                    id: "BATERIA", 
                    label: "Troca de Bateria", 
                    horas: 0.5, 
                    nivel: "JR", 
                    complexidade: 1.0, 
                    custo_peca: 50.00, 
                    risco: "BAIXO",
                    obs: "Peça de reposição"
                }
            ]
        }
    ]
};

// =========================================================================
// MOTOR LÓGICO (ENGINE)
// Implementação da fórmula da seção 2.1: Pf = (Cp * Mp) + Llog + (Th * Vh * Ct)
// =========================================================================

const AtomicCalculator = {
    /**
     * Inicializa o módulo (Carregamento de dados, se necessário)
     */
    init: function() {
        console.log("[Calculadora] Engine inicializada com DB v2025");
    },

    /**
     * Retorna lista de aparelhos para popular o Select
     */
    getAparelhos: function() {
        return DB_SERVICOS.aparelhos.map(a => ({ id: a.id, label: a.label }));
    },

    /**
     * Retorna lista de serviços para um aparelho específico
     */
    getServicos: function(aparelhoId) {
        const aparelho = DB_SERVICOS.aparelhos.find(a => a.id === aparelhoId);
        return aparelho ? aparelho.servicos : [];
    },

    /**
     * Formata horas para texto amigável
     */
    formatarTempo: function(horas) {
        if (horas < 24) return `Até ${Math.ceil(horas * 1.5)}h úteis`; // Margem de segurança
        return `${Math.ceil(horas / 8)} a ${Math.ceil(horas / 4)} dias úteis`;
    },

    /**
     * Executa o cálculo principal
     * @param {string} aparelhoId 
     * @param {string} servicoId 
     * @param {string} logisticaTipo (Opcional, default BALCAO)
     */
    calcular: function(aparelhoId, servicoId, logisticaTipo = "BALCAO") {
        const aparelho = DB_SERVICOS.aparelhos.find(a => a.id === aparelhoId);
        if (!aparelho) return { sucesso: false, erro: "Aparelho não encontrado" };

        const servico = aparelho.servicos.find(s => s.id === servicoId);
        if (!servico) return { sucesso: false, erro: "Serviço não encontrado" };

        // Variáveis Econômicas
        const valorHora = DB_SERVICOS.config.valor_hora[servico.nivel];
        const custoLogistica = DB_SERVICOS.config.logistica[logisticaTipo] || 0;
        const markupPeca = DB_SERVICOS.config.markup_padrao; // Poderia ser específico do serviço se necessário

        // Fórmula: (CustoPeca * Markup) + Logistica + (Horas * ValorHora * Complexidade)
        const componentePeca = servico.custo_peca * markupPeca;
        const componenteMO = servico.horas * valorHora * servico.complexidade;
        
        const precoFinal = componentePeca + custoLogistica + componenteMO;

        // Arredondamento para margem comercial (Min/Max)
        // A pesquisa sugere faixas. Vamos criar um range de -10% a +10% ou fixar no calculado.
        // Para segurança do orçamento, geramos um intervalo.
        const precoMin = Math.floor(precoFinal / 10) * 10; // Arredonda para baixo (dezena)
        const precoMax = Math.ceil((precoFinal * 1.2) / 10) * 10; // +20% margem segura

        return {
            sucesso: true,
            aparelho: aparelho.label,
            servico: servico.label,
            preco_min: precoMin.toFixed(2).replace('.', ','),
            preco_max: precoMax.toFixed(2).replace('.', ','),
            horas_estimadas: servico.horas,
            risco: servico.risco,
            custo_logistica: custoLogistica,
            detalhes: servico.obs
        };
    }
};

// Exposição Global para uso interno do site
window.Calculadora = AtomicCalculator;


// --- CALCULATOR & SERVICES UI LOGIC ---
function initServiceCalculator() {
    // Inicializa Engine Global
    if (window.Calculadora) {
        window.Calculadora.init();
        populateDeviceSelect();
    } else {
        console.error('[Atomic] Calculadora Engine não carregada');
        const sel = document.getElementById('deviceSelect');
        if(sel) sel.innerHTML = '<option>Erro interno</option>';
    }
}

function populateDeviceSelect() {
    const sel = document.getElementById('deviceSelect');
    if (!sel) return;
    
    const aparelhos = window.Calculadora.getAparelhos();
    sel.innerHTML = '<option value="">Selecione o aparelho...</option>';
    aparelhos.forEach(a => {
        const opt = document.createElement('option');
        opt.value = a.id;
        opt.textContent = a.label;
        sel.appendChild(opt);
    });

    // Reset dependents
    sel.addEventListener('change', populateIssueSelect);
}

function populateIssueSelect() {
    const devId = document.getElementById('deviceSelect').value;
    const issueSel = document.getElementById('issueSelect');
    
    issueSel.innerHTML = '<option value="">Selecione o problema...</option>';
    issueSel.disabled = !devId;
    
    if (!devId) return;

    const servicos = window.Calculadora.getServicos(devId);
    servicos.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = s.label;
        issueSel.appendChild(opt);
    });
}

function handleServiceSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const deviceId = fd.get('device');
    const issueId = fd.get('issue');
    // Logistica pode ser implementada visualmente depois, por padrão assume BALCAO (0)
    const logisticsId = "BALCAO"; 
    const clientName = fd.get('clientName');
    const clientPhone = fd.get('clientPhone');

    if (!window.Calculadora || !deviceId || !issueId) return;

    // 1. Executa Cálculo (Engine)
    const resultado = window.Calculadora.calcular(deviceId, issueId, logisticsId);

    if (resultado.sucesso) {
        // 2. Atualiza UI
        const resDiv = document.getElementById('serviceResult');
        const priceTxt = document.getElementById('priceRange');
        const timeTxt = document.getElementById('timeEstimate');
        
        resDiv.classList.remove('hidden');
        priceTxt.textContent = `R$ ${resultado.preco_min} - R$ ${resultado.preco_max}`;
        timeTxt.textContent = window.Calculadora.formatarTempo(resultado.horas_estimadas);

        // 3. Estrutura Objeto de Pedido (Em Memória)
        // Este é o contrato para o Painel Atomic
        const pedidoEstruturado = {
            origem: "calculadora_site",
            versao_dados: "2025-v1",
            cliente: {
                nome: clientName,
                telefone: clientPhone
            },
            servico_calculado: {
                aparelho_id: deviceId,
                aparelho_label: resultado.aparelho,
                servico_id: issueId,
                servico_label: resultado.servico,
                variaveis_aplicadas: {
                    horas_tecnicas: resultado.horas_estimadas,
                    risco: resultado.risco
                }
            },
            resultado_financeiro: {
                estimativa_min: resultado.preco_min,
                estimativa_max: resultado.preco_max,
                tempo_estimado_texto: timeTxt.textContent,
                taxa_logistica: resultado.custo_logistica
            },
            status_integracao: "AGUARDANDO_PROCESSAMENTO"
        };

        console.log('[Atomic] Pedido Gerado (Memória):', pedidoEstruturado);
        
        // 4. Integração com Chatbot (Contexto)
        if (window.Chatbot && window.Chatbot.atualizarContexto) {
            window.Chatbot.atualizarContexto(pedidoEstruturado);
        }

        // 5. WhatsApp Redirect (Ação Final)
        // Serializa para texto humano
        const waMsg = `*ORÇAMENTO OFICIAL ATOMIC*\n\n` +
                      `👤 *Cliente:* ${clientName}\n` +
                      `🎮 *Aparelho:* ${resultado.aparelho}\n` +
                      `⚠️ *Serviço:* ${resultado.servico}\n` +
                      `💰 *Estimativa:* R$ ${resultado.preco_min} a R$ ${resultado.preco_max}\n` +
                      `⏳ *Prazo:* ${timeTxt.textContent}\n\n` +
                      `_Orçamento sujeito a análise técnica presencial._`;
        
        window.open(`https://wa.me/5521995969378?text=${encodeURIComponent(waMsg)}`, '_blank');
        trackAtomicEvent('whatsapp');
    }
}

// --- STANDARD COMMERCE LOGIC ---
async function loadGamesFromGitHub() {
    try {
        const res = await fetch(`${BASE_IMG_URL}produtos.json?t=${Date.now()}`);
        if (res.ok) {
            const data = await res.json();
            if (data.length) allProducts = data.map(p => ({
                id: (p.id || Date.now()).toString(),
                name: p.name,
                category: p.category,
                price: formatPrice(p.price),
                image: (p.image || "").replace('/img/', '/img%20site/'),
                desc: p.desc
            }));
        }
    } catch (e) { /* Fail silently or show error */ }
    renderProducts(currentFilter, els.searchInput?.value || '');
}

async function loadBannersFromGitHub() {
    try {
        const res = await fetch(`${BASE_IMG_URL}banners.json?t=${Date.now()}`);
        if (res.ok) { promoBanners = await res.json(); renderPromos(); }
    } catch (e) {}
}

function renderPromos() {
    const container = document.getElementById('promoBannersContainer');
    if (!container || !promoBanners.length) return;
    
    const valid = promoBanners.filter(b => b.image && b.image.trim() !== '').slice(0, 2);
    if (!valid.length) { container.style.display = 'none'; return; }

    container.innerHTML = '';
    container.style.display = '';
    
    valid.forEach(b => {
        const link = document.createElement('a');
        link.className = 'promo-banner-link group';
        link.href = b.link || '#';
        if(b.link?.startsWith('http')) { link.target = '_blank'; link.rel = 'noopener'; }
        
        const img = document.createElement('img');
        img.src = `${BASE_IMG_URL}BANNER%20SAZIONAL/${encodeURIComponent(b.image)}`;
        img.className = 'promo-banner-img';
        
        link.append(img);
        container.append(link);
    });
}

function renderProducts(filter, term = "", forceAll = false) {
    if (!els.productGrid) return;
    
    const lowerTerm = term.toLowerCase();
    const filtered = allProducts.filter(p => 
        (filter === 'all' || (p.category || 'games').toLowerCase().includes(filter)) &&
        (!term || p.name.toLowerCase().includes(lowerTerm))
    );

    const limit = window.innerWidth < 768 ? 6 : 10;
    const toShow = forceAll || term ? filtered : filtered.slice(0, limit);
    
    els.loadMore.classList.toggle('hidden', forceAll || term || filtered.length <= limit);
    els.noResults.classList.toggle('hidden', filtered.length > 0);
    els.productGrid.innerHTML = '';

    toShow.forEach((p, i) => {
        const art = document.createElement('article');
        art.className = 'product-card bg-card border border-base flex flex-col h-full group';
        art.innerHTML = `
            <div class="product-img-box" role="button" tabindex="0">
                <img src="${p.image}" loading="lazy" alt="${p.name}" onerror="this.src='https://placehold.co/400?text=ATOMIC'">
                <span class="category-tag ${getCategoryClass(p.category)} absolute top-3 left-3">${p.category}</span>
            </div>
            <div class="p-4 flex-grow flex flex-col">
                <h3 class="font-bold text-sm mb-1 group-hover:text-yellow-500 transition line-clamp-2">${p.name}</h3>
                <p class="text-xs text-muted mb-4 flex-grow line-clamp-2">${p.desc}</p>
                <div class="mt-auto flex justify-between items-center">
                    <span class="font-black text-lg text-gradient">${p.price}</span>
                    <button class="add-btn bg-gradient-to-r from-yellow-400 to-orange-500 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg hover:scale-105 transition"><i class="ph-bold ph-plus text-black"></i></button>
                </div>
            </div>
        `;
        
        // Event Listeners
        const imgBox = art.querySelector('.product-img-box');
        const addBtn = art.querySelector('.add-btn');
        
        const openDetail = () => showProductDetail(p.id);
        imgBox.onclick = openDetail;
        imgBox.onkeydown = (e) => e.key === 'Enter' && openDetail();
        addBtn.onclick = (e) => { e.stopPropagation(); addToCart(p.id); };

        els.productGrid.appendChild(art);
    });
}

function updateCartUI() {
    if (!els.cartCount) return;
    els.cartCount.textContent = cart.length;
    els.cartCount.classList.toggle('hidden', !cart.length);
    els.checkoutBtn.disabled = !cart.length;
    els.cartItems.innerHTML = '';
    
    let total = 0;
    if (!cart.length) {
        els.cartItems.innerHTML = '<div class="text-center py-12 text-muted">Carrinho vazio</div>';
    } else {
        cart.forEach((item, idx) => {
            total += parseFloat(item.price.replace('R$', '').replace(/\./g, '').replace(',', '.').trim()) || 0;
            const row = document.createElement('div');
            row.className = 'flex gap-4 bg-base p-4 rounded-2xl border border-base mb-2';
            row.innerHTML = `
                <img src="${item.image}" class="w-16 h-16 object-contain rounded-xl bg-white">
                <div class="flex-grow min-w-0">
                    <p class="font-bold text-sm truncate">${item.name}</p>
                    <p class="text-xs text-gradient font-bold">${item.price}</p>
                </div>
                <button class="text-red-500 hover:bg-red-100 p-2 rounded-xl"><i class="ph-bold ph-trash"></i></button>
            `;
            row.querySelector('button').onclick = () => { cart.splice(idx, 1); saveCart(); updateCartUI(); };
            els.cartItems.appendChild(row);
        });
    }
    els.cartTotal.textContent = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function addToCart(id) {
    const p = allProducts.find(x => x.id == id);
    if (p) { cart.push(p); saveCart(); updateCartUI(); showToast('Adicionado ao carrinho!'); trackAtomicEvent('add_to_cart'); }
}

function saveCart() { localStorage.setItem('atomic_cart', JSON.stringify(cart)); }

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    trackAtomicEvent('visit');
    
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});

    els = {
        productGrid: document.getElementById('productGrid'),
        loadMore: document.getElementById('loadMoreContainer'),
        noResults: document.getElementById('noResults'),
        searchInput: document.getElementById('searchInput'),
        toastContainer: document.getElementById('toastContainer'),
        cartCount: document.getElementById('cartCount'),
        cartItems: document.getElementById('cartItemsContainer'),
        cartTotal: document.getElementById('cartTotal'),
        checkoutBtn: document.getElementById('checkoutBtn'),
        cartModal: document.getElementById('cartModal'),
        cartOverlay: document.getElementById('cartOverlay'),
        mobileMenu: document.getElementById('mobileMenu'),
        mobileOverlay: document.getElementById('mobileMenuOverlay'),
        detailModal: document.getElementById('productDetailModal'),
        detailOverlay: document.getElementById('productDetailOverlay')
    };

    // Load Data
    loadGamesFromGitHub();
    loadBannersFromGitHub();
    initServiceCalculator(); // Now uses Calculator Engine

    // Event Bindings
    if (localStorage.getItem('atomic_cart')) { 
        try { cart = JSON.parse(localStorage.getItem('atomic_cart')); updateCartUI(); } catch(e) {} 
    }

    // Bind Calculator Submit
    document.getElementById('serviceForm')?.addEventListener('submit', handleServiceSubmit);
    
    // UI Toggles
    const toggle = (el, ov) => { el.classList.toggle('open'); ov.classList.toggle('open'); document.body.style.overflow = el.classList.contains('open') ? 'hidden' : ''; };
    
    document.getElementById('openCartBtn')?.addEventListener('click', () => toggle(els.cartModal, els.cartOverlay));
    document.getElementById('closeCartBtn')?.addEventListener('click', () => toggle(els.cartModal, els.cartOverlay));
    document.getElementById('cartOverlay')?.addEventListener('click', () => toggle(els.cartModal, els.cartOverlay));
    
    document.getElementById('mobileMenuOpenBtn')?.addEventListener('click', () => toggle(els.mobileMenu, els.mobileOverlay));
    document.getElementById('closeMobileMenuBtn')?.addEventListener('click', () => toggle(els.mobileMenu, els.mobileOverlay));
    document.getElementById('mobileMenuOverlay')?.addEventListener('click', () => toggle(els.mobileMenu, els.mobileOverlay));

    document.getElementById('closeDetailBtn')?.addEventListener('click', () => toggle(els.detailModal, els.detailOverlay));
    document.getElementById('productDetailOverlay')?.addEventListener('click', () => toggle(els.detailModal, els.detailOverlay));

    // Filters & Search
    document.querySelectorAll('.filter-btn').forEach(btn => btn.addEventListener('click', e => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        currentFilter = e.currentTarget.dataset.category;
        renderProducts(currentFilter, els.searchInput.value);
    }));

    els.searchInput?.addEventListener('input', e => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => renderProducts(currentFilter, e.target.value), 300);
    });

    document.getElementById('checkoutBtn')?.addEventListener('click', () => {
        if (!cart.length) return;
        const msg = `*PEDIDO LOJA*\n` + cart.map(i => `• ${i.name} (${i.price})`).join('\n') + `\nTotal: ${els.cartTotal.textContent}`;
        window.open(`https://wa.me/5521995969378?text=${encodeURIComponent(msg)}`, '_blank');
        trackAtomicEvent('whatsapp');
    });
});

// Global Helpers
window.showProductDetail = (id) => {
    const p = allProducts.find(x => x.id == id);
    if (!p) return;
    document.getElementById('modalProductImage').src = p.image;
    document.getElementById('modalProductName').textContent = p.name;
    document.getElementById('modalProductDescription').textContent = p.desc || 'Sem descrição';
    document.getElementById('modalProductPrice').textContent = p.price;
    document.getElementById('modalProductCategory').textContent = p.category;
    
    // Rebind Buttons
    const addBtn = document.getElementById('modalAddToCartBtn');
    const newAdd = addBtn.cloneNode(true);
    addBtn.parentNode.replaceChild(newAdd, addBtn);
    newAdd.onclick = () => { addToCart(id); els.detailModal.classList.remove('open'); els.detailOverlay.classList.remove('open'); document.body.style.overflow=''; };

    els.detailModal.classList.add('open');
    els.detailOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
};
