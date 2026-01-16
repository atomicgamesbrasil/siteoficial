// === CALCULATOR MODULE ===
import { formatPrice } from './utils.js';
import { trackAtomicEvent, submitOrderToAPI, prepareBudgetForPanel } from './api.js';

const LOGISTICS_COST = { shop: 0, local: 15, interzonal: 35, remote: 50 };

const CALCULATOR_DATA = {
    console_modern: {
        label: "Consoles Atuais (PS/Xbox)",
        models: {
            ps5: { name: "PlayStation 5 (Fat / Slim / Pro)", services: { cleaning: { name: "Limpeza Preventiva (Metal Líquido)", min: 250, max: 400, note: "Risco Alto (Curto-circuito)" }, hdmi: { name: "Troca de HDMI (2.1)", min: 350, max: 550, note: "Microsolda Avançada" }, drive: { name: "Reparo Leitor de Disco", min: 300, max: 500, note: "Mecânica/Laser" }, custom_issue: { name: "Outro Defeito / Diagnóstico", min: 0, max: 0, note: "Sob Análise Técnica" } } },
            xbox_series: { name: "Xbox Series X / S", services: { cleaning: { name: "Limpeza Completa", min: 200, max: 350, note: "Troca pasta térmica premium" }, hdmi: { name: "Troca de HDMI", min: 300, max: 450, note: "Microsolda" }, ssd_repair: { name: "Reparo Circuito SSD", min: 400, max: 600, note: "Nível 3 (Placa)" }, custom_issue: { name: "Outro Defeito / Diagnóstico", min: 0, max: 0, note: "Sob Análise Técnica" } } },
            ps4: { name: "PlayStation 4 (Fat / Slim / Pro)", services: { cleaning: { name: "Limpeza + Pasta Térmica Prata", min: 150, max: 250, note: "Manutenção Preventiva" }, hdmi: { name: "Troca de HDMI", min: 200, max: 350, note: "Microsolda" }, drive: { name: "Reparo Leitor de Disco", min: 180, max: 300, note: "+ Peça se necessário" }, hd_upgrade: { name: "Troca de HD/SSD (Sistema)", min: 150, max: 250, note: "+ Valor da Peça" }, custom_issue: { name: "Outro Defeito / Diagnóstico", min: 0, max: 0, note: "Sob Análise Técnica" } } },
            xbox_one: { name: "Xbox One (Fat / S / X)", services: { cleaning: { name: "Limpeza Geral", min: 150, max: 250, note: "Preventiva" }, hdmi: { name: "Troca de HDMI (Retimer)", min: 250, max: 400, note: "Troca de CI frequente" }, drive: { name: "Reparo Drive", min: 180, max: 300, note: "Mecânica" }, custom_issue: { name: "Outro Defeito / Diagnóstico", min: 0, max: 0, note: "Sob Análise Técnica" } } }
        }
    },
    console_retro: {
        label: "Consoles Retrô / Legados",
        models: {
            ps3: { name: "PlayStation 3 (Fat / Slim / Super)", services: { hen_unlock: { name: "Desbloqueio HEN/CFW", min: 100, max: 150, note: "Instalação Lojas" }, cleaning: { name: "Limpeza + Pasta Térmica", min: 120, max: 180, note: "Essencial para Fat/Slim" }, nec_tokin: { name: "Reparo NEC Tokin (YLOD)", min: 300, max: 500, note: "Capacitores de Tântalo" }, custom_issue: { name: "Outro Defeito / Diagnóstico", min: 0, max: 0, note: "Sob Análise Técnica" } } },
            xbox_360: { name: "Xbox 360 (Fat / Slim / E)", services: { rgh: { name: "Desbloqueio RGH 3.0", min: 150, max: 250, note: "Serviço Legado" }, cleaning: { name: "Limpeza Geral", min: 100, max: 150, note: "Troca de pasta térmica" }, red_ring: { name: "Luz Vermelha (Reballing)", min: 250, max: 450, note: "Procedimento de Risco" }, custom_issue: { name: "Outro Defeito / Diagnóstico", min: 0, max: 0, note: "Sob Análise Técnica" } } },
            ps2: { name: "PlayStation 2 (Fat / Slim)", services: { opl: { name: "Instalação OPL (Jogos USB)", min: 80, max: 120, note: "Revitalização" }, laser: { name: "Troca de Leitor Óptico", min: 120, max: 180, note: "Peça Nova" }, custom_issue: { name: "Outro Defeito / Diagnóstico", min: 0, max: 0, note: "Sob Análise Técnica" } } },
            wii_u: { name: "Nintendo Wii / Wii U", services: { unlock: { name: "Desbloqueio Softmod", min: 100, max: 180, note: "Jogos no HD/SD" }, gamepad: { name: "Reparo Gamepad Wii U", min: 200, max: 400, note: "Tela/Conexão" }, custom_issue: { name: "Outro Defeito / Diagnóstico", min: 0, max: 0, note: "Sob Análise Técnica" } } }
        }
    },
    handheld: {
        label: "Portáteis (Switch / Steam / Retrô)",
        models: {
            switch_v1: { name: "Nintendo Switch V1 (Antigo)", services: { unlock_sw: { name: "Desbloqueio (Software)", min: 100, max: 180, note: "Sem abrir o console" }, cleaning: { name: "Limpeza Interna", min: 100, max: 150, note: "Preventiva" }, screen: { name: "Troca de Tela (Touch/LCD)", min: 250, max: 400, note: "Peça + Mão de obra" }, custom_issue: { name: "Outro Defeito / Diagnóstico", min: 0, max: 0, note: "Sob Análise Técnica" } } },
            switch_v2_lite: { name: "Switch V2 / Lite", services: { unlock_chip: { name: "Desbloqueio (ModChip)", min: 350, max: 550, note: "Microsolda (RP2040/Instinct)" }, screen_lite: { name: "Troca de Tela (Lite)", min: 350, max: 500, note: "Desmontagem Completa" }, usb_port: { name: "Troca Conector Carga (M92)", min: 250, max: 400, note: "Reparo de Carga" }, custom_issue: { name: "Outro Defeito / Diagnóstico", min: 0, max: 0, note: "Sob Análise Técnica" } } },
            switch_oled: { name: "Switch OLED", services: { unlock_chip: { name: "Desbloqueio (ModChip)", min: 500, max: 800, note: "Extrema Complexidade (Dat0)" }, cleaning: { name: "Limpeza Interna", min: 150, max: 250, note: "Preventiva" }, custom_issue: { name: "Outro Defeito / Diagnóstico", min: 0, max: 0, note: "Sob Análise Técnica" } } },
            steam_rog: { name: "Steam Deck / ROG Ally / Legion", services: { ssd_upgrade: { name: "Upgrade SSD (NVMe 2230)", min: 150, max: 250, note: "Clonagem Sistema + Mão de obra" }, stick_replace: { name: "Instalação Hall Effect", min: 250, max: 400, note: "Analógicos Magnéticos" }, cleaning: { name: "Limpeza Técnica", min: 150, max: 250, note: "Troca Pasta Térmica" }, custom_issue: { name: "Outro Defeito / Diagnóstico", min: 0, max: 0, note: "Sob Análise Técnica" } } },
            retro_sony: { name: "PSP / PS Vita", services: { unlock: { name: "Desbloqueio Definitivo", min: 80, max: 120, note: "Infinity / Henkaku" }, battery: { name: "Troca de Bateria", min: 100, max: 180, note: "Peça Nova" }, screen: { name: "Troca de Tela", min: 150, max: 300, note: "LCD/OLED" }, custom_issue: { name: "Outro Defeito / Diagnóstico", min: 0, max: 0, note: "Sob Análise Técnica" } } },
            retro_nintendo: { name: "3DS / 2DS / DS", services: { unlock: { name: "Desbloqueio Luma3DS", min: 100, max: 150, note: "Cartão SD Necessário" }, screen: { name: "Troca de Tela (Superior/Inf)", min: 200, max: 350, note: "Risco Alto (Cabo Flat)" }, custom_issue: { name: "Outro Defeito / Diagnóstico", min: 0, max: 0, note: "Sob Análise Técnica" } } },
            chinese_handhelds: { name: "Chineses (Anbernic/Miyoo/Retroid)", services: { system_config: { name: "Configuração Sistema (ArkOS/Onion)", min: 80, max: 150, note: "Otimização + Jogos" }, buttons: { name: "Reparo Botões/Tela", min: 100, max: 250, note: "Peças Específicas" }, custom_issue: { name: "Outro Defeito / Diagnóstico", min: 0, max: 0, note: "Sob Análise Técnica" } } }
        }
    },
    pc_notebook: {
        label: "Computador / Notebook",
        models: {
            desktop: { name: "Desktop Gamer / Office", services: { format_basic: { name: "Formatação (Sem Backup)", min: 80, max: 100, note: "Windows + Drivers" }, format_pro: { name: "Formatação Completa (C/ Backup)", min: 150, max: 250, note: "Salva arquivos + Programas" }, cleaning: { name: "Limpeza + Cable Management", min: 100, max: 200, note: "Organização Interna" }, upgrade: { name: "Instalação Hardware (GPU/Fonte)", min: 80, max: 150, note: "Mão de obra" }, custom_issue: { name: "Outro Defeito / Diagnóstico", min: 0, max: 0, note: "Sob Análise Técnica" } } },
            notebook: { name: "Notebook (Gamer / Comum)", services: { screen_replace: { name: "Troca de Tela", min: 150, max: 250, note: "+ Valor da Tela" }, keyboard: { name: "Troca de Teclado", min: 100, max: 200, note: "Soldado ou Parafusado" }, hinge: { name: "Reparo de Carcaça/Dobradiça", min: 200, max: 400, note: "Reconstrução com Resina" }, custom_issue: { name: "Outro Defeito / Diagnóstico", min: 0, max: 0, note: "Sob Análise Técnica" } } }
        }
    },
    accessory: {
        label: "Acessórios e Periféricos",
        models: {
            controllers_sony: { name: "Controle PlayStation (DualSense/DS4)", services: { drift_simple: { name: "Reparo Drift (Potenciômetro)", min: 80, max: 120, note: "Troca do Sensor" }, hall_effect: { name: "Upgrade Hall Effect", min: 160, max: 250, note: "Magnético (Nunca mais drift)" }, battery: { name: "Troca de Bateria / USB", min: 80, max: 120, note: "Não carrega" }, custom_issue: { name: "Outro Defeito / Diagnóstico", min: 0, max: 0, note: "Sob Análise Técnica" } } },
            controllers_ms: { name: "Controle Xbox (Series/One)", services: { drift_simple: { name: "Reparo Drift (Analógico)", min: 80, max: 120, note: "Troca peça" }, rb_lb: { name: "Troca Botão RB/LB", min: 60, max: 100, note: "Microswitch" }, custom_issue: { name: "Outro Defeito / Diagnóstico", min: 0, max: 0, note: "Sob Análise Técnica" } } },
            joycon: { name: "Nintendo Joy-Con", services: { drift: { name: "Troca Analógico (Par)", min: 100, max: 160, note: "Original ou Hall Effect" }, slider: { name: "Troca Trilho Lateral", min: 60, max: 100, note: "Não conecta no tablet" }, custom_issue: { name: "Outro Defeito / Diagnóstico", min: 0, max: 0, note: "Sob Análise Técnica" } } },
            peripherals: { name: "Mouse / Teclado / Headset", services: { mouse_switch: { name: "Troca Switch Mouse (Click)", min: 60, max: 120, note: "Omron/Kailh" }, headset_cable: { name: "Reparo Cabo/Arco", min: 80, max: 150, note: "Mau contato" }, custom_issue: { name: "Outro Defeito / Diagnóstico", min: 0, max: 0, note: "Sob Análise Técnica" } } }
        }
    }
};

export function initCalculator() {
    const form = document.getElementById('serviceForm');
    if(!form) return;

    // Elementos DOM
    const els = {
        step1: document.getElementById('step-1'),
        step2: document.getElementById('step-2'),
        step3: document.getElementById('step-3'),
        resultArea: document.getElementById('result-area'),
        customWrapper: document.getElementById('custom-issue-wrapper'),
        customInput: document.getElementById('calc-issue'),
        modelSelect: document.getElementById('calc-model'),
        serviceSelect: document.getElementById('calc-service'),
        serviceWrapper: document.getElementById('service-wrapper'),
        progressFill: document.getElementById('calc-progress-fill'),
        progressText: document.getElementById('calc-progress-text'),
        pMin: document.getElementById('price-min'),
        pMax: document.getElementById('price-max'),
        pSep: document.getElementById('price-separator'),
        note: document.getElementById('result-note'),
        clientName: document.getElementById('calc-name'),
        clientPhone: document.getElementById('calc-phone')
    };

    const updateProgress = (percent) => {
        if (els.progressFill) els.progressFill.style.width = `${percent}%`;
        if (els.progressText) els.progressText.textContent = `${percent}%`;
    };

    const state = { category: null, model: null, service: null, logistics: 'shop' };

    const updateCalc = () => {
        if (state.category && state.model && state.service) {
            const modelData = CALCULATOR_DATA[state.category].models[state.model];
            const svcData = modelData.services[state.service];
            const isCustom = state.service === 'custom_issue';
            const logCost = LOGISTICS_COST[state.logistics] || 0;

            let min = svcData.min + (isCustom ? 0 : logCost);
            let max = svcData.max + (isCustom ? 0 : logCost);

            if (isCustom) {
                els.pMin.textContent = "Sob Análise";
                els.pMax.textContent = "";
                if(els.pSep) els.pSep.textContent = "Técnica";
                els.note.textContent = "O valor será informado após avaliação.";
            } else {
                els.pMin.textContent = formatPrice(min);
                els.pMax.textContent = formatPrice(max);
                if(els.pSep) els.pSep.textContent = "a";
                els.note.textContent = svcData.note + (logCost > 0 ? " (Inclui frete)" : "");
            }
            
            els.resultArea.classList.add('active');
            updateProgress(100);
        } else {
            els.resultArea.classList.remove('active');
        }
    };

    // Eventos
    document.querySelectorAll('input[name="category"]').forEach(input => {
        input.addEventListener('change', (e) => {
            state.category = e.target.value;
            state.model = null;
            state.service = null;
            
            els.step2.classList.remove('active');
            els.step3.classList.remove('active');
            els.resultArea.classList.remove('active');
            els.serviceWrapper.classList.add('hidden');
            els.customWrapper.classList.add('hidden');
            
            els.modelSelect.innerHTML = '<option value="" disabled selected>Selecione...</option>';
            const models = CALCULATOR_DATA[state.category].models;
            for (const [key, val] of Object.entries(models)) {
                const opt = document.createElement('option');
                opt.value = key; opt.textContent = val.name;
                els.modelSelect.appendChild(opt);
            }
            els.step2.classList.add('active');
            updateProgress(35);
        });
    });

    els.modelSelect.addEventListener('change', (e) => {
        state.model = e.target.value;
        state.service = null;
        
        els.serviceSelect.innerHTML = '<option value="" disabled selected>Selecione...</option>';
        els.resultArea.classList.remove('active');
        els.step3.classList.remove('active');
        els.customWrapper.classList.add('hidden');
        
        const services = CALCULATOR_DATA[state.category].models[state.model].services;
        for (const [key, val] of Object.entries(services)) {
            const opt = document.createElement('option');
            opt.value = key; opt.textContent = val.name;
            els.serviceSelect.appendChild(opt);
        }
        els.serviceWrapper.classList.remove('hidden');
        updateProgress(65);
    });

    els.serviceSelect.addEventListener('change', (e) => {
        state.service = e.target.value;
        els.step3.classList.add('active');
        
        if (state.service === 'custom_issue') {
            els.customWrapper.classList.remove('hidden');
            els.customWrapper.classList.add('active');
            els.customInput.focus();
        } else {
            els.customWrapper.classList.add('hidden');
            els.customWrapper.classList.remove('active');
        }
        updateCalc();
    });

    document.querySelectorAll('input[name="logistics"]').forEach(input => {
        input.addEventListener('change', (e) => {
            state.logistics = e.target.value;
            updateCalc();
        });
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        trackAtomicEvent('whatsapp');
        
        const name = els.clientName.value || 'Cliente';
        const phone = els.clientPhone.value || '';
        
        if (!state.category || !state.model || !state.service) return;

        const modelName = CALCULATOR_DATA[state.category].models[state.model].name;
        const svcData = CALCULATOR_DATA[state.category].models[state.model].services[state.service];
        let svcName = svcData.name;
        let priceStr = `${els.pMin.textContent} a ${els.pMax.textContent}`;

        if (state.service === 'custom_issue') {
            svcName += `: ${els.customInput.value}`;
            priceStr = "Sob Análise";
        }

        const logLabels = { shop: 'Levar na Loja', local: 'Coleta Local', interzonal: 'Coleta Interzonal', remote: 'Baixada/Niterói' };
        const logLabel = logLabels[state.logistics];

        // Preparar Order Payload para API
        const orderData = {
            id: Date.now().toString(),
            customer: phone ? `${name} [${phone}]` : name,
            items: [{ name: `${modelName} - ${svcName}`, price: priceStr, quantity: 1 }],
            total: priceStr,
            source: 'Calculadora'
        };
        
        // Envio assíncrono (sem await para não bloquear UX)
        submitOrderToAPI(orderData);

        // Integração Chatbot (Se existir)
        if (window.AtomicChat && window.AtomicChat.processBudget) {
            window.AtomicChat.processBudget({
                device: { modelLabel: modelName },
                service: { name: svcName },
                financial: { totalMin: svcData.min, totalMax: svcData.max },
                logistics: { label: logLabel }
            });
            return;
        }

        // Fallback WhatsApp Link
        const text = `*ORÇAMENTO WEB*\n👤 ${name}\n📱 ${phone}\n🎮 ${modelName}\n🛠️ ${svcName}\n📍 ${logLabel}\n💰 ${priceStr}`;
        window.location.href = `https://wa.me/5521995969378?text=${encodeURIComponent(text)}`;
    });
}
