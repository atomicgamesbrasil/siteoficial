(function() {
    'use strict';

    console.log('Atomic Chatbot v5.8 (Gender Neutral & Adaptive Tone) Initializing...');

    // ==========================================================================
    // 0. DADOS DA CALCULADORA (ESPELHO DO SITE)
    // ==========================================================================
    const LOGISTICS_COST = { 
        shop: 0, 
        local: 15, 
        interzonal: 35, 
        remote: 50 
    };

    const CALCULATOR_DATA = {
        console_modern: {
            label: "Consoles Atuais (PS/Xbox)",
            models: {
                ps5: { 
                    name: "PlayStation 5 (Fat / Slim / Pro)", 
                    services: { 
                        cleaning: { name: "Limpeza Preventiva (Metal Líquido)", min: 250, max: 400, note: "Risco Alto (Curto-circuito)" }, 
                        hdmi: { name: "Troca de HDMI (2.1)", min: 350, max: 550, note: "Microsolda Avançada" },
                        drive: { name: "Reparo Leitor de Disco", min: 300, max: 500, note: "Mecânica/Laser" },
                        custom_issue: { name: "Outro Defeito / Diagnóstico", min: 0, max: 0, note: "Sob Análise Técnica" }
                    } 
                },
                xbox_series: {
                    name: "Xbox Series X / S",
                    services: {
                        cleaning: { name: "Limpeza Completa", min: 200, max: 350, note: "Troca pasta térmica premium" },
                        hdmi: { name: "Troca de HDMI", min: 300, max: 450, note: "Microsolda" },
                        ssd_repair: { name: "Reparo Circuito SSD", min: 400, max: 600, note: "Nível 3 (Placa)" },
                        custom_issue: { name: "Outro Defeito / Diagnóstico", min: 0, max: 0, note: "Sob Análise Técnica" }
                    }
                },
                ps4: { 
                    name: "PlayStation 4 (Fat / Slim / Pro)", 
                    services: { 
                        cleaning: { name: "Limpeza + Pasta Térmica Prata", min: 150, max: 250, note: "Manutenção Preventiva" }, 
                        hdmi: { name: "Troca de HDMI", min: 200, max: 350, note: "Microsolda" },
                        drive: { name: "Reparo Leitor de Disco", min: 180, max: 300, note: "+ Peça se necessário" },
                        hd_upgrade: { name: "Troca de HD/SSD (Sistema)", min: 150, max: 250, note: "+ Valor da Peça" },
                        custom_issue: { name: "Outro Defeito / Diagnóstico", min: 0, max: 0, note: "Sob Análise Técnica" }
                    } 
                },
                xbox_one: {
                    name: "Xbox One (Fat / S / X)",
                    services: {
                        cleaning: { name: "Limpeza Geral", min: 150, max: 250, note: "Preventiva" },
                        hdmi: { name: "Troca de HDMI (Retimer)", min: 250, max: 400, note: "Troca de CI frequente" },
                        drive: { name: "Reparo Drive", min: 180, max: 300, note: "Mecânica" },
                        custom_issue: { name: "Outro Defeito / Diagnóstico", min: 0, max: 0, note: "Sob Análise Técnica" }
                    }
                }
            }
        },
        console_retro: {
            label: "Consoles Retrô / Legados",
            models: {
                ps3: {
                    name: "PlayStation 3 (Fat / Slim / Super)",
                    services: {
                        hen_unlock: { name: "Desbloqueio HEN/CFW", min: 100, max: 150, note: "Instalação Lojas" },
                        cleaning: { name: "Limpeza + Pasta Térmica", min: 120, max: 180, note: "Essencial para Fat/Slim" },
                        nec_tokin: { name: "Reparo NEC Tokin (YLOD)", min: 300, max: 500, note: "Capacitores de Tântalo" },
                        custom_issue: { name: "Outro Defeito / Diagnóstico", min: 0, max: 0, note: "Sob Análise Técnica" }
                    }
                },
                xbox_360: { 
                    name: "Xbox 360 (Fat / Slim / E)", 
                    services: { 
                        rgh: { name: "Desbloqueio RGH 3.0", min: 150, max: 250, note: "Serviço Legado" },
                        cleaning: { name: "Limpeza Geral", min: 100, max: 150, note: "Troca de pasta térmica" },
                        red_ring: { name: "Luz Vermelha (Reballing)", min: 250, max: 450, note: "Procedimento de Risco" },
                        custom_issue: { name: "Outro Defeito / Diagnóstico", min: 0, max: 0, note: "Sob Análise Técnica" }
                    } 
                },
                ps2: {
                    name: "PlayStation 2 (Fat / Slim)",
                    services: {
                        opl: { name: "Instalação OPL (Jogos USB)", min: 80, max: 120, note: "Revitalização" },
                        laser: { name: "Troca de Leitor Óptico", min: 120, max: 180, note: "Peça Nova" },
                        custom_issue: { name: "Outro Defeito / Diagnóstico", min: 0, max: 0, note: "Sob Análise Técnica" }
                    }
                },
                wii_u: {
                    name: "Nintendo Wii / Wii U",
                    services: {
                        unlock: { name: "Desbloqueio Softmod", min: 100, max: 180, note: "Jogos no HD/SD" },
                        gamepad: { name: "Reparo Gamepad Wii U", min: 200, max: 400, note: "Tela/Conexão" },
                        custom_issue: { name: "Outro Defeito / Diagnóstico", min: 0, max: 0, note: "Sob Análise Técnica" }
                    }
                }
            }
        },
        handheld: {
            label: "Portáteis (Switch / Steam / Retrô)",
            models: {
                switch_v1: { 
                    name: "Nintendo Switch V1 (Antigo)", 
                    services: { 
                        unlock_sw: { name: "Desbloqueio (Software)", min: 100, max: 180, note: "Sem abrir o console" },
                        cleaning: { name: "Limpeza Interna", min: 100, max: 150, note: "Preventiva" },
                        screen: { name: "Troca de Tela (Touch/LCD)", min: 250, max: 400, note: "Peça + Mão de obra" },
                        custom_issue: { name: "Outro Defeito / Diagnóstico", min: 0, max: 0, note: "Sob Análise Técnica" }
                    } 
                },
                switch_v2_lite: { 
                    name: "Switch V2 / Lite", 
                    services: { 
                        unlock_chip: { name: "Desbloqueio (ModChip)", min: 350, max: 550, note: "Microsolda (RP2040/Instinct)" },
                        screen_lite: { name: "Troca de Tela (Lite)", min: 350, max: 500, note: "Desmontagem Completa" },
                        usb_port: { name: "Troca Conector Carga (M92)", min: 250, max: 400, note: "Reparo de Carga" },
                        custom_issue: { name: "Outro Defeito / Diagnóstico", min: 0, max: 0, note: "Sob Análise Técnica" }
                    } 
                },
                switch_oled: { 
                    name: "Switch OLED", 
                    services: { 
                        unlock_chip: { name: "Desbloqueio (ModChip)", min: 500, max: 800, note: "Extrema Complexidade (Dat0)" },
                        cleaning: { name: "Limpeza Interna", min: 150, max: 250, note: "Preventiva" },
                        custom_issue: { name: "Outro Defeito / Diagnóstico", min: 0, max: 0, note: "Sob Análise Técnica" }
                    } 
                },
                steam_rog: {
                    name: "Steam Deck / ROG Ally / Legion",
                    services: {
                        ssd_upgrade: { name: "Upgrade SSD (NVMe 2230)", min: 150, max: 250, note: "Clonagem Sistema + Mão de obra" },
                        stick_replace: { name: "Instalação Hall Effect", min: 250, max: 400, note: "Analógicos Magnéticos" },
                        cleaning: { name: "Limpeza Técnica", min: 150, max: 250, note: "Troca Pasta Térmica" },
                        custom_issue: { name: "Outro Defeito / Diagnóstico", min: 0, max: 0, note: "Sob Análise Técnica" }
                    }
                },
                retro_sony: {
                    name: "PSP / PS Vita",
                    services: {
                        unlock: { name: "Desbloqueio Definitivo", min: 80, max: 120, note: "Infinity / Henkaku" },
                        battery: { name: "Troca de Bateria", min: 100, max: 180, note: "Peça Nova" },
                        screen: { name: "Troca de Tela", min: 150, max: 300, note: "LCD/OLED" },
                        custom_issue: { name: "Outro Defeito / Diagnóstico", min: 0, max: 0, note: "Sob Análise Técnica" }
                    }
                },
                retro_nintendo: {
                    name: "3DS / 2DS / DS",
                    services: {
                        unlock: { name: "Desbloqueio Luma3DS", min: 100, max: 150, note: "Cartão SD Necessário" },
                        screen: { name: "Troca de Tela (Superior/Inf)", min: 200, max: 350, note: "Risco Alto (Cabo Flat)" },
                        custom_issue: { name: "Outro Defeito / Diagnóstico", min: 0, max: 0, note: "Sob Análise Técnica" }
                    }
                },
                chinese_handhelds: {
                    name: "Chineses (Anbernic/Miyoo/Retroid)",
                    services: {
                        system_config: { name: "Configuração Sistema (ArkOS/Onion)", min: 80, max: 150, note: "Otimização + Jogos" },
                        buttons: { name: "Reparo Botões/Tela", min: 100, max: 250, note: "Peças Específicas" },
                        custom_issue: { name: "Outro Defeito / Diagnóstico", min: 0, max: 0, note: "Sob Análise Técnica" }
                    }
                }
            }
        },
        pc_notebook: {
            label: "Computador / Notebook",
            models: {
                desktop: { 
                    name: "Desktop Gamer / Office", 
                    services: { 
                        format_basic: { name: "Formatação (Sem Backup)", min: 80, max: 100, note: "Windows + Drivers" }, 
                        format_pro: { name: "Formatação Completa (C/ Backup)", min: 150, max: 250, note: "Salva arquivos + Programas" },
                        cleaning: { name: "Limpeza + Cable Management", min: 100, max: 200, note: "Organização Interna" },
                        upgrade: { name: "Instalação Hardware (GPU/Fonte)", min: 80, max: 150, note: "Mão de obra" },
                        custom_issue: { name: "Outro Defeito / Diagnóstico", min: 0, max: 0, note: "Sob Análise Técnica" }
                    } 
                },
                notebook: {
                    name: "Notebook (Gamer / Comum)",
                    services: {
                        screen_replace: { name: "Troca de Tela", min: 150, max: 250, note: "+ Valor da Tela" },
                        keyboard: { name: "Troca de Teclado", min: 100, max: 200, note: "Soldado ou Parafusado" },
                        hinge: { name: "Reparo de Carcaça/Dobradiça", min: 200, max: 400, note: "Reconstrução com Resina" },
                        custom_issue: { name: "Outro Defeito / Diagnóstico", min: 0, max: 0, note: "Sob Análise Técnica" }
                    }
                }
            }
        },
        accessory: {
            label: "Acessórios e Periféricos",
            models: {
                controllers_sony: { 
                    name: "Controle PlayStation (DualSense/DS4)", 
                    services: { 
                        drift_simple: { name: "Reparo Drift (Potenciômetro)", min: 80, max: 120, note: "Troca do Sensor" }, 
                        hall_effect: { name: "Upgrade Hall Effect", min: 160, max: 250, note: "Magnético (Nunca mais drift)" },
                        battery: { name: "Troca de Bateria / USB", min: 80, max: 120, note: "Não carrega" },
                        custom_issue: { name: "Outro Defeito / Diagnóstico", min: 0, max: 0, note: "Sob Análise Técnica" }
                    } 
                },
                controllers_ms: { 
                    name: "Controle Xbox (Series/One)", 
                    services: { 
                        drift_simple: { name: "Reparo Drift (Analógico)", min: 80, max: 120, note: "Troca peça" }, 
                        rb_lb: { name: "Troca Botão RB/LB", min: 60, max: 100, note: "Microswitch" },
                        custom_issue: { name: "Outro Defeito / Diagnóstico", min: 0, max: 0, note: "Sob Análise Técnica" }
                    } 
                },
                joycon: {
                    name: "Nintendo Joy-Con",
                    services: {
                        drift: { name: "Troca Analógico (Par)", min: 100, max: 160, note: "Original ou Hall Effect" },
                        slider: { name: "Troca Trilho Lateral", min: 60, max: 100, note: "Não conecta no tablet" },
                        custom_issue: { name: "Outro Defeito / Diagnóstico", min: 0, max: 0, note: "Sob Análise Técnica" }
                    }
                },
                peripherals: {
                    name: "Mouse / Teclado / Headset",
                    services: {
                        mouse_switch: { name: "Troca Switch Mouse (Click)", min: 60, max: 120, note: "Omron/Kailh" },
                        headset_cable: { name: "Reparo Cabo/Arco", min: 80, max: 150, note: "Mau contato" },
                        custom_issue: { name: "Outro Defeito / Diagnóstico", min: 0, max: 0, note: "Sob Análise Técnica" }
                    }
                }
            }
        }
    };

    // ==========================================================================
    // 0. ATOMIC THEME INJECTION (CSS OVERRIDE)
    // ==========================================================================
    function injectAtomicStyles() {
        const styleId = 'atomic-chat-styles';
        if (document.getElementById(styleId)) return;

        const css = `
            :root {
                --at-bg: #ffffff;
                --at-surface: #f4f4f5;
                --at-border: #e4e4e7;
                --at-text: #18181b;
                --at-text-sec: #71717a;
                --at-accent: #ffc107;
                --at-accent-text: #000000;
                --at-shadow: rgba(0,0,0,0.15);
                --at-bubble-bg: #ffc107;
                --at-bubble-text: #000;
                --at-user-bg: #ffc107;
                --at-user-text: #000;
                --at-bot-bg: #f4f4f5;
                --at-bot-text: #18181b;
                --at-header-bg: #f4f4f5;
                --at-overlay: rgba(0,0,0,0.5);
                /* Transição suave para tema */
                --at-transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
            }

            /* GARANTIA DE MODO CLARO EXPLICITO */
            html.light {
                --at-bg: #ffffff;
                --at-surface: #f4f4f5;
                --at-border: #e4e4e7;
                --at-text: #18181b;
                --at-text-sec: #71717a;
                --at-accent: #ffc107;
                --at-accent-text: #000000;
                --at-shadow: rgba(0,0,0,0.15);
                --at-bubble-bg: #ffc107;
                --at-bubble-text: #000;
                --at-user-bg: #ffc107;
                --at-user-text: #000;
                --at-bot-bg: #f4f4f5;
                --at-bot-text: #18181b;
                --at-header-bg: #f4f4f5;
                --at-overlay: rgba(0,0,0,0.5);
            }

            html.dark {
                --at-bg: #09090b;
                --at-surface: #18181b;
                --at-border: #333;
                --at-text: #e4e4e7;
                --at-text-sec: #a1a1aa;
                --at-accent: #ffc107;
                --at-accent-text: #000000;
                --at-shadow: rgba(0,0,0,0.8);
                --at-bubble-bg: #ffc107;
                --at-bubble-text: #000;
                --at-user-bg: #ffc107;
                --at-user-text: #000;
                --at-bot-bg: #18181b;
                --at-bot-text: #e4e4e7;
                --at-header-bg: #18181b;
                --at-overlay: rgba(0,0,0,0.85);
            }

            /* --- JANELA PRINCIPAL --- */
            #chatWindow, #atomic-chat-window, .chat-window {
                background-color: var(--at-bg) !important;
                border: 1px solid var(--at-border) !important;
                box-shadow: 0 20px 50px var(--at-shadow) !important;
                font-family: 'Segoe UI', Roboto, sans-serif !important;
                border-radius: 16px !important;
                overflow: hidden !important;
                z-index: 9999 !important;
                color: var(--at-text) !important;
                transition: var(--at-transition);
            }

            /* --- HEADER --- */
            .chat-header, #chatWindow header {
                background: var(--at-header-bg) !important;
                border-bottom: 2px solid var(--at-accent) !important;
                color: var(--at-text) !important;
                padding: 16px 20px !important;
                display: flex;
                align-items: center;
                justify-content: space-between;
                transition: var(--at-transition);
            }
            .chat-header h3 {
                color: var(--at-text) !important; font-weight: 700 !important;
                font-size: 15px !important; margin: 0 !important;
                display: flex; align-items: center; gap: 10px; text-transform: uppercase;
            }
            .chat-header h3::before {
                content: ''; display: block; width: 10px; height: 10px;
                background-color: var(--at-accent); border-radius: 50%;
                box-shadow: 0 0 10px rgba(255, 193, 7, 0.5);
            }
            .chat-header button {
                color: var(--at-text-sec) !important; background: none !important; border: none !important;
                cursor: pointer; transition: color 0.2s; font-size: 18px;
            }
            .chat-header button:hover { color: var(--at-accent) !important; }

            /* --- MENSAGENS --- */
            #chatMessages, .chat-body {
                background-color: var(--at-bg) !important;
                padding: 20px !important;
                overflow-x: hidden !important;
            }
            .atomic-msg-bubble {
                padding: 12px 18px !important;
                font-size: 14px !important;
                line-height: 1.5 !important;
                max-width: 85% !important;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
                white-space: pre-wrap !important;
                word-wrap: break-word !important;
                overflow-wrap: break-word !important;
            }
            .atomic-msg-bubble.bot {
                background-color: var(--at-bot-bg) !important; color: var(--at-bot-text) !important;
                border: 1px solid var(--at-border) !important;
                border-radius: 16px 16px 16px 4px !important;
            }
            .atomic-msg-bubble.user {
                background-color: var(--at-user-bg) !important; color: var(--at-user-text) !important;
                border-radius: 16px 16px 4px 16px !important;
                font-weight: 600 !important;
                border: none !important;
            }

            /* --- FOOTER --- */
            .chat-footer {
                background-color: var(--at-bg) !important; border-top: 1px solid var(--at-border) !important;
                padding: 15px !important; position: relative;
            }
            #chatInput {
                background: var(--at-surface) !important; border: 1px solid var(--at-border) !important;
                color: var(--at-text) !important; border-radius: 8px !important;
                padding: 12px 15px !important; font-size: 14px !important;
                width: 100%; box-sizing: border-box;
                transition: var(--at-transition);
            }
            #chatInput:focus { border-color: var(--at-accent) !important; outline: none !important; }
            #sendBtn {
                position: absolute; right: 25px; top: 50%; transform: translateY(-50%);
                background: transparent !important; color: var(--at-accent) !important;
                font-weight: bold !important; border: none !important; cursor: pointer;
            }

            /* --- AÇÕES & PRODUTOS --- */
            .chat-product-card {
                background: var(--at-surface) !important; border: 1px solid var(--at-border) !important;
                border-radius: 8px !important; margin-top: 10px !important; padding: 12px !important;
                border-left: 3px solid var(--at-accent) !important;
            }
            .chat-product-title { color: var(--at-text) !important; font-weight: 600; font-size: 13px; }
            .chat-product-price { color: var(--at-accent) !important; font-weight: bold; font-size: 14px; }
            
            .chat-add-btn, .atomic-action-btn {
                background: transparent !important; color: var(--at-accent) !important;
                border: 1px solid var(--at-accent) !important; border-radius: 6px !important;
                padding: 8px 14px !important; font-size: 12px !important; cursor: pointer !important;
                margin-top: 6px; text-transform: uppercase; font-weight: 700;
                transition: all 0.2s;
            }
            .chat-add-btn:hover, .atomic-action-btn:hover {
                background: var(--at-accent) !important; color: var(--at-accent-text) !important;
            }

            /* --- MODAL GLOBAL (BASE) --- */
            .atomic-modal-overlay {
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                background: var(--at-overlay); z-index: 100000;
                display: none; justify-content: center; align-items: center;
                backdrop-filter: blur(8px);
                animation: atomicFadeIn 0.3s ease;
                transition: background-color 0.3s ease;
            }
            .atomic-modal-overlay.active { display: flex; }
            
            .atomic-modal-content {
                background: var(--at-bg); border: 1px solid var(--at-border); border-radius: 12px;
                width: 90%; max-width: 450px;
                display: flex; flex-direction: column; overflow: hidden;
                box-shadow: 0 0 40px var(--at-shadow);
                animation: atomicSlideUp 0.3s ease;
                transition: var(--at-transition);
            }

            /* --- CALCULATOR & BUDGET CHOICE --- */
            .atomic-calc-header {
                background: var(--at-header-bg); padding: 15px 20px; border-bottom: 2px solid var(--at-accent);
                display: flex; justify-content: space-between; align-items: center;
                transition: var(--at-transition);
            }
            .atomic-calc-header h2 { color: var(--at-text); font-size: 16px; margin: 0; text-transform: uppercase; display: flex; gap: 8px; align-items: center; }
            .atomic-calc-close { color: var(--at-text-sec); font-size: 24px; background: none; border: none; cursor: pointer; }
            .atomic-calc-close:hover { color: var(--at-text); }

            .atomic-calc-body { padding: 20px; color: var(--at-text); max-height: 80vh; overflow-y: auto; transition: var(--at-transition); }
            
            .atomic-field-group { margin-bottom: 15px; text-align: left; }
            .atomic-field-group label { display: block; font-size: 12px; color: var(--at-text-sec); margin-bottom: 5px; font-weight: 600; text-transform: uppercase; }
            
            .atomic-input, .atomic-select, .atomic-textarea {
                width: 100%; padding: 12px; border-radius: 8px;
                background: var(--at-surface); border: 1px solid var(--at-border);
                color: var(--at-text); font-family: inherit; font-size: 14px;
                box-sizing: border-box; outline: none; transition: border 0.3s, background-color 0.3s, color 0.3s;
            }
            .atomic-textarea { resize: vertical; min-height: 80px; }
            .atomic-input:focus, .atomic-select:focus, .atomic-textarea:focus { border-color: var(--at-accent); }

            .atomic-price-display {
                background: var(--at-surface); padding: 15px; border-radius: 8px;
                text-align: center; margin: 20px 0; border: 1px dashed var(--at-border);
                transition: var(--at-transition);
            }
            .atomic-price-label { font-size: 12px; color: var(--at-text-sec); text-transform: uppercase; }
            .atomic-price-value { font-size: 24px; color: var(--at-accent); font-weight: 800; margin-top: 5px; }

            .atomic-radio-group { display: flex; gap: 15px; margin-top: 5px; }
            .atomic-radio-label { display: flex; align-items: center; gap: 6px; font-size: 13px; cursor: pointer; color: var(--at-text); transition: color 0.3s; }
            .atomic-radio-label input { accent-color: var(--at-accent); }
            
            .atomic-note { font-size: 11px; color: var(--at-text-sec); margin-top: 5px; font-style: italic; }

            .atomic-calc-btn {
                width: 100%; background: var(--at-accent); color: var(--at-accent-text);
                padding: 14px; border: none; border-radius: 8px;
                font-weight: 800; text-transform: uppercase; font-size: 14px;
                cursor: pointer; transition: transform 0.2s;
            }
            .atomic-calc-btn.secondary {
                background: transparent; border: 2px solid var(--at-accent); color: var(--at-accent);
            }
            .atomic-calc-btn.secondary:hover { background: var(--at-accent); color: var(--at-accent-text); }
            .atomic-calc-btn:hover { transform: scale(1.02); box-shadow: 0 0 15px var(--at-accent); }
            .atomic-calc-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }

            /* --- BUBBLE --- */
            #chatBubble, #atomic-chat-trigger {
                background-color: var(--at-bubble-bg) !important; 
                color: var(--at-bubble-text) !important;
                box-shadow: 0 0 20px var(--at-accent) !important;
            }

            @keyframes atomicFadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes atomicSlideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            
            /* -- RENOMEADO PARA EVITAR CONFLITO COM O SITE -- */
            .at-hidden { display: none !important; }
        `;

        const styleEl = document.createElement('style');
        styleEl.id = styleId;
        styleEl.innerHTML = css;
        document.head.appendChild(styleEl);
    }

    injectAtomicStyles();

    // ==========================================================================
    // 0.1 MODAL GENERATORS
    // ==========================================================================
    
    // MAPA MODAL
    function createMapModal() {
        if (document.getElementById('atomic-map-modal')) return;
        const html = `
            <div id="atomic-map-modal" class="atomic-modal-overlay">
                <div class="atomic-modal-content" style="max-width:600px;">
                    <div class="atomic-calc-header">
                        <h2>📍 Localização Atomic</h2>
                        <button class="atomic-calc-close" onclick="document.getElementById('atomic-map-modal').classList.remove('active')">&times;</button>
                    </div>
                    <div style="height:350px;">
                        <iframe src="https://maps.google.com/maps?q=Atomic+Games+Madureira+Av+Ministro+Edgard+Romero+81&t=&z=15&ie=UTF8&iwloc=&output=embed" style="width:100%; height:100%; border:0;" allowfullscreen></iframe>
                    </div>
                    <div class="atomic-calc-body" style="padding: 15px; flex: 0 0 auto;">
                        <button id="btn-map-route" class="atomic-calc-btn">
                            🗺️ Traçar Rota (Google Maps)
                        </button>
                    </div>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', html);

        // Logic for Route Button
        document.getElementById('btn-map-route').onclick = () => {
             // Link universal para traçar rota
             window.open('https://www.google.com/maps/dir/?api=1&destination=Atomic+Games+Madureira', '_blank');
        };
    }

    // MODAL DE ESCOLHA
    function createBudgetChoiceModal() {
        if (document.getElementById('atomic-choice-modal')) return;
        
        const html = `
            <div id="atomic-choice-modal" class="atomic-modal-overlay">
                <div class="atomic-modal-content">
                    <div class="atomic-calc-header">
                        <h2>🤔 Como prefere?</h2>
                        <button class="atomic-calc-close" onclick="document.getElementById('atomic-choice-modal').classList.remove('active')">&times;</button>
                    </div>
                    <div class="atomic-calc-body" style="display: flex; flex-direction: column; gap: 15px; text-align: center;">
                        <p>Você pode falar direto com nosso técnico ou simular o valor na hora.</p>
                        
                        <button id="btn-choice-calc" class="atomic-calc-btn">
                            🧮 Usar Calculadora Rápida
                        </button>
                        
                        <button id="btn-choice-zap" class="atomic-calc-btn secondary">
                            💬 Falar com o Técnico no Zap
                        </button>
                    </div>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', html);

        // Lógica do Choice Modal
        document.getElementById('btn-choice-calc').onclick = () => {
            document.getElementById('atomic-choice-modal').classList.remove('active');
            showCalculatorModal(); // Abre a calculadora completa
        };

        document.getElementById('btn-choice-zap').onclick = () => {
            document.getElementById('atomic-choice-modal').classList.remove('active');
            window.open('https://wa.me/5521995969378?text=Ol%C3%A1%2C%20gostaria%20de%20falar%20com%20um%20t%C3%A9cnico%20sobre%20meu%20aparelho!', '_blank');
        };
        
        document.getElementById('atomic-choice-modal').addEventListener('click', (e) => { 
            if(e.target.id === 'atomic-choice-modal') e.target.classList.remove('active'); 
        });
    }

    // CALCULADORA INTEGRADA (ENTERPRISE EDITION)
    function createCalculatorModal() {
        if (document.getElementById('atomic-calc-modal')) return;

        const html = `
            <div id="atomic-calc-modal" class="atomic-modal-overlay">
                <div class="atomic-modal-content">
                    <div class="atomic-calc-header">
                        <h2>🧮 Orçamento Rápido</h2>
                        <button class="atomic-calc-close" id="btn-close-calc">&times;</button>
                    </div>
                    <div class="atomic-calc-body">
                        
                        <div class="atomic-field-group">
                            <label>Seu Nome</label>
                            <input type="text" id="at-calc-name" class="atomic-input" placeholder="Como te chamamos?">
                        </div>

                        <!-- NOVO CAMPO: TELEFONE -->
                        <div class="atomic-field-group">
                            <label>Seu WhatsApp (Obrigatório)</label>
                            <input type="tel" id="at-calc-phone" class="atomic-input" placeholder="(21) 9....">
                        </div>

                        <!-- ETAPA 1: CATEGORIA -->
                        <div class="atomic-field-group">
                            <label>Tipo de Aparelho</label>
                            <select id="at-calc-cat" class="atomic-select">
                                <option value="" disabled selected>Selecione a categoria...</option>
                                <!-- Populated by JS -->
                            </select>
                        </div>

                        <!-- ETAPA 2: MODELO (Depende da Categoria) -->
                        <div class="atomic-field-group at-hidden" id="at-group-model">
                            <label>Modelo</label>
                            <select id="at-calc-model" class="atomic-select">
                                <option value="" disabled selected>Selecione...</option>
                            </select>
                        </div>

                        <!-- ETAPA 3: SERVIÇO (Depende do Modelo) -->
                        <div class="atomic-field-group at-hidden" id="at-group-service">
                            <label>Defeito / Serviço</label>
                            <select id="at-calc-service" class="atomic-select">
                                <option value="" disabled selected>Selecione...</option>
                            </select>
                        </div>

                        <!-- CAMPO EXTRA: DESCRIÇÃO (Se for 'custom_issue') -->
                        <div class="atomic-field-group at-hidden" id="at-group-desc">
                            <label>Descreva o Problema</label>
                            <textarea id="at-calc-desc" class="atomic-textarea" placeholder="Ex: Caiu no chão e não liga mais..."></textarea>
                        </div>

                        <div class="atomic-price-display at-hidden" id="at-price-box">
                            <div class="atomic-price-label">Estimativa de Preço</div>
                            <div class="atomic-price-value" id="at-calc-result">R$ 0,00</div>
                            <div class="atomic-note" id="at-calc-note"></div>
                        </div>

                        <div class="atomic-field-group">
                            <label>Logística</label>
                            <div class="atomic-radio-group">
                                <label class="atomic-radio-label">
                                    <input type="radio" name="at_logistics" value="shop" checked>
                                    Levo na Loja
                                </label>
                                <label class="atomic-radio-label">
                                    <input type="radio" name="at_logistics" value="local">
                                    Motoboy
                                </label>
                            </div>
                        </div>

                        <button id="at-btn-finish" class="atomic-calc-btn" disabled>
                            Preencha para Continuar
                        </button>

                    </div>
                </div>
            </div>`;
        
        document.body.insertAdjacentHTML('beforeend', html);
        initCalculatorLogic();
    }

    function initCalculatorLogic() {
        const els = {
            modal: document.getElementById('atomic-calc-modal'),
            close: document.getElementById('btn-close-calc'),
            name: document.getElementById('at-calc-name'),
            phone: document.getElementById('at-calc-phone'),
            cat: document.getElementById('at-calc-cat'),
            model: document.getElementById('at-calc-model'),
            service: document.getElementById('at-calc-service'),
            desc: document.getElementById('at-calc-desc'),
            result: document.getElementById('at-calc-result'),
            note: document.getElementById('at-calc-note'),
            submit: document.getElementById('at-btn-finish'),
            
            groupModel: document.getElementById('at-group-model'),
            groupService: document.getElementById('at-group-service'),
            groupDesc: document.getElementById('at-group-desc'),
            priceBox: document.getElementById('at-price-box')
        };

        let currentSelection = { cat: null, model: null, service: null };

        // 0. Máscara de Telefone Simples
        els.phone.addEventListener('input', (e) => {
            let v = e.target.value.replace(/\D/g, "");
            if (v.length > 11) v = v.slice(0, 11);
            if (v.length > 2) v = `(${v.slice(0,2)}) ${v.slice(2)}`;
            if (v.length > 10) v = `${v.slice(0,10)}-${v.slice(10)}`;
            e.target.value = v;
        });

        // 1. Popular Categorias (Garante que drop não está vazio)
        els.cat.innerHTML = '<option value="" disabled selected>Selecione a categoria...</option>';
        Object.keys(CALCULATOR_DATA).forEach(key => {
            const opt = document.createElement('option');
            opt.value = key;
            opt.text = CALCULATOR_DATA[key].label;
            els.cat.appendChild(opt);
        });

        // Event: Categoria Mudou
        els.cat.addEventListener('change', () => {
            const catKey = els.cat.value;
            currentSelection.cat = catKey;
            
            // Reset Downstream
            els.model.innerHTML = '<option value="" disabled selected>Selecione...</option>';
            els.service.innerHTML = '<option value="" disabled selected>Selecione...</option>';
            els.groupModel.classList.add('at-hidden');
            els.groupService.classList.add('at-hidden');
            els.groupDesc.classList.add('at-hidden');
            els.priceBox.classList.add('at-hidden');
            els.submit.disabled = true;
            els.submit.innerText = "Selecione o Modelo";

            if (catKey && CALCULATOR_DATA[catKey]) {
                const models = CALCULATOR_DATA[catKey].models;
                Object.keys(models).forEach(mKey => {
                    const opt = document.createElement('option');
                    opt.value = mKey;
                    opt.text = models[mKey].name;
                    els.model.appendChild(opt);
                });
                els.groupModel.classList.remove('at-hidden');
            }
        });

        // Event: Modelo Mudou
        els.model.addEventListener('change', () => {
            const mKey = els.model.value;
            currentSelection.model = mKey;

            // Reset Downstream
            els.service.innerHTML = '<option value="" disabled selected>Selecione...</option>';
            els.groupService.classList.add('at-hidden');
            els.groupDesc.classList.add('at-hidden');
            els.priceBox.classList.add('at-hidden');
            els.submit.disabled = true;
            els.submit.innerText = "Selecione o Serviço";

            if (mKey && CALCULATOR_DATA[currentSelection.cat]) {
                const services = CALCULATOR_DATA[currentSelection.cat].models[mKey].services;
                Object.keys(services).forEach(sKey => {
                    const opt = document.createElement('option');
                    opt.value = sKey;
                    opt.text = services[sKey].name;
                    els.service.appendChild(opt);
                });
                els.groupService.classList.remove('at-hidden');
            }
        });

        // Event: Serviço Mudou
        els.service.addEventListener('change', updateCalculation);
        
        // Event: Logística Mudou
        document.querySelectorAll('input[name="at_logistics"]').forEach(r => {
            r.addEventListener('change', updateCalculation);
        });

        function updateCalculation() {
            const sKey = els.service.value;
            if (!sKey) return;
            currentSelection.service = sKey;

            const logKey = document.querySelector('input[name="at_logistics"]:checked').value;
            const logCost = LOGISTICS_COST[logKey] || 0;

            const svcData = CALCULATOR_DATA[currentSelection.cat].models[currentSelection.model].services[sKey];

            if (sKey === 'custom_issue') {
                els.groupDesc.classList.remove('at-hidden');
                els.priceBox.classList.add('at-hidden'); // Oculta preço em 'Outro Defeito'
                els.submit.innerText = "Solicitar Análise";
            } else {
                els.groupDesc.classList.add('at-hidden');
                els.priceBox.classList.remove('at-hidden');
                
                const min = svcData.min + logCost;
                const max = svcData.max + logCost;
                
                els.result.innerText = `R$ ${min} - R$ ${max}`;
                els.note.innerText = svcData.note || "";
                
                if (logCost > 0) els.note.innerText += " (Inclui taxa de busca)";
                
                els.submit.innerText = "✅ Agendar Agora";
            }
            els.submit.disabled = false;
        }

        // Close Logic
        els.close.addEventListener('click', () => els.modal.classList.remove('active'));
        els.modal.addEventListener('click', (e) => { if(e.target === els.modal) els.modal.classList.remove('active'); });

        // Submit Logic
        els.submit.addEventListener('click', async () => {
            const name = els.name.value.trim() || "Cliente Amigo";
            const phone = els.phone.value.trim();
            
            if (!phone || phone.length < 10) {
                alert('Por favor, informe um WhatsApp válido para entrarmos em contato!');
                els.phone.focus();
                return;
            }

            const cat = CALCULATOR_DATA[currentSelection.cat].label;
            const model = CALCULATOR_DATA[currentSelection.cat].models[currentSelection.model].name;
            const svcData = CALCULATOR_DATA[currentSelection.cat].models[currentSelection.model].services[currentSelection.service];
            const serviceName = svcData.name;
            
            const logKey = document.querySelector('input[name="at_logistics"]:checked').value;
            
            let priceMin = "A Combinar";
            let priceMax = "";
            let customDesc = "";

            if (currentSelection.service === 'custom_issue') {
                customDesc = els.desc.value;
            } else {
                priceMin = (svcData.min + (LOGISTICS_COST[logKey]||0)).toString();
                priceMax = (svcData.max + (LOGISTICS_COST[logKey]||0)).toString();
            }

            // UI Feedback
            els.modal.classList.remove('active');
            updateChatUI(true);
            renderMessage('bot', `Só um instante, ${name}! Calculando e gerando seu agendamento...`);

            try {
                const payload = { 
                    name,
                    phone,
                    model, 
                    service: currentSelection.service === 'custom_issue' ? `${serviceName}: ${customDesc}` : serviceName,
                    priceMin, 
                    priceMax, 
                    logistics: logKey === 'shop' ? 'Levar na Loja' : 'Buscar de Motoboy'
                };
                
                const res = await fetch(CONFIG.ORDER_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                const data = await res.json();
                
                if(data.success) {
                    renderMessage('bot', data.reply, [], data.actions);
                } else {
                    renderMessage('bot', "Gerado! Me chama no Zap para confirmar.");
                }
            } catch (err) {
                renderMessage('bot', "Tive um erro de conexão, mas vamos fechar no WhatsApp!");
            }
        });
    }

    function showMapModal() { createMapModal(); document.getElementById('atomic-map-modal').classList.add('active'); }
    
    // Função MODIFICADA: Agora abre a ESCOLHA, não a calculadora direto
    function showBudgetChoiceModal() {
        createBudgetChoiceModal();
        createCalculatorModal(); // Pre-load
        document.getElementById('atomic-choice-modal').classList.add('active');
    }

    // Função interna para quando o usuário escolhe "Calculadora" no menu
    function showCalculatorModal() { 
        createCalculatorModal(); 
        document.getElementById('atomic-calc-modal').classList.add('active'); 
    }

    // ==========================================================================
    // 0.2 TEST ENVIRONMENT MOCKS
    // ==========================================================================
    function setupTestEnvironment() {
        if (typeof window.showProductDetail !== 'function') {
            window.showProductDetail = (id) => console.log(`[Atomic Mock] Open Product: ${id}`);
        }
    }
    setupTestEnvironment();

    // ==========================================================================
    // 1. SELECTORS & CONFIG
    // ==========================================================================
    
    const getEl = (id) => document.getElementById(id);
    
    const els = {
        bubble: getEl('chatBubble') || getEl('atomic-chat-trigger'),
        win: getEl('chatWindow') || getEl('atomic-chat-window'),
        msgs: getEl('chatMessages') || getEl('atomic-chat-body'),
        input: getEl('chatInput') || getEl('atomic-chat-input'),
        badge: getEl('chatBadge'), 
        sendBtn: getEl('sendBtn') || getEl('atomic-chat-send'),
        
        header: document.querySelector('.chat-header') || document.querySelector('.header') || document.querySelector('#chatWindow header'),
        
        closeBtn: getEl('closeChatBtn'),
        resetBtn: getEl('resetChatBtn')
    };

    const CONFIG = {
        API_ENDPOINT: 'https://atomic-thiago-backend.onrender.com/api/chat-brain',
        ORDER_ENDPOINT: 'https://atomic-thiago-backend.onrender.com/api/orders',
        TIMEOUT_MS: 60000,
        STORAGE_KEYS: {
            SESSION: 'atomic_sess_id_v2',
            HISTORY: 'atomic_chat_history_v2' 
        }
    };

    if (!els.bubble || !els.win) {
        console.error('AtomicChat: Critical elements missing. Widget disabled.');
        return;
    }

    // ==========================================================================
    // 2. UI BINDING & EVENTS
    // ==========================================================================
    
    function bindUIEvents() {
        const handleClose = (e) => { e.preventDefault(); e.stopPropagation(); closeChat(); };
        const handleReset = (e) => { e.preventDefault(); e.stopPropagation(); resetChat(); };

        if (els.closeBtn) els.closeBtn.addEventListener('click', handleClose);
        if (els.resetBtn) els.resetBtn.addEventListener('click', handleReset);

        if (els.header) {
            els.header.addEventListener('click', (e) => {
                const t = e.target;
                if (t.id === 'closeChatBtn' || t.closest('#closeChatBtn') || t.innerText.includes('✕')) handleClose(e);
                if (t.id === 'resetChatBtn' || t.closest('#resetChatBtn') || t.innerText.includes('🗑')) handleReset(e);
            });
            els.header.style.cursor = 'default';
        }
    }

    bindUIEvents();

    // ==========================================================================
    // 3. CORE STATE
    // ==========================================================================

    let state = {
        isOpen: false,
        isDragging: false,
        startX: 0, startY: 0,
        sessionId: sessionStorage.getItem(CONFIG.STORAGE_KEYS.SESSION)
    };

    function updateChatUI(open) {
        state.isOpen = open;
        if (open) {
            els.win.classList.add('open');
            els.win.style.display = 'flex';
            
            if(window.innerWidth <= 480) {
                const rect = els.bubble.getBoundingClientRect();
                els.win.style.transformOrigin = `${rect.left+rect.width/2}px ${rect.top+rect.height/2}px`;
            }

            els.bubble.style.opacity = '0';
            els.bubble.style.pointerEvents = 'none';
            if(els.badge) els.badge.style.display = 'none';
            
            scrollToBottom();
            if(window.innerWidth > 768 && els.input) setTimeout(() => els.input.focus(), 100);
            checkEmptyState();

        } else {
            els.win.classList.remove('open');
            els.win.style.display = 'none';
            els.bubble.style.opacity = '1';
            els.bubble.style.pointerEvents = 'auto';
            if(els.badge) els.badge.style.display = 'flex';
            if(els.input) els.input.blur();
        }
        document.body.classList.toggle('chat-open', open);
    }

    function openChat() { if(!state.isOpen) { history.pushState({chat: true}, '', '#chat'); updateChatUI(true); } }
    function closeChat() { if(state.isOpen) { if(history.state?.chat) history.back(); else updateChatUI(false); } }

    function resetChat() {
        if(confirm('Apagar histórico da conversa?')) {
            localStorage.removeItem(CONFIG.STORAGE_KEYS.HISTORY);
            sessionStorage.removeItem(CONFIG.STORAGE_KEYS.SESSION);
            state.sessionId = null;
            els.msgs.innerHTML = '';
            checkEmptyState();
        }
    }

    window.addEventListener('popstate', (e) => { updateChatUI(false); });
    function scrollToBottom() { if(els.msgs) els.msgs.scrollTop = els.msgs.scrollHeight; }

    // ==========================================================================
    // 4. RENDERING & MESSAGING
    // ==========================================================================

    function renderMessage(role, text, prods, actions, isHistory) {
        if(!els.msgs) return;

        const row = document.createElement('div');
        row.className = `atomic-msg-row ${role}`;
        row.style.display = 'flex';
        row.style.justifyContent = role === 'user' ? 'flex-end' : 'flex-start';
        row.style.marginBottom = '8px';

        const bubble = document.createElement('div');
        bubble.className = `atomic-msg-bubble ${role}`;
        bubble.innerHTML = text.replace(/\n/g, '<br>');

        if (prods && prods.length) {
            const prodCont = document.createElement('div');
            prods.forEach(p => {
                const card = document.createElement('div');
                card.className = 'chat-product-card';
                card.innerHTML = `<div class="chat-product-title">${p.name}</div><div class="chat-product-price">${p.price}</div>`;
                const btn = document.createElement('button');
                btn.className = 'chat-add-btn';
                btn.innerText = 'VER DETALHES';
                btn.onclick = (e) => { e.stopPropagation(); window.showProductDetail(p.id); };
                card.appendChild(btn);
                prodCont.appendChild(card);
            });
            bubble.appendChild(prodCont);
        }

        if (actions && actions.length) {
            const actCont = document.createElement('div');
            actCont.className = 'atomic-actions-row';
            actions.forEach(act => {
                const btn = document.createElement('button');
                btn.className = 'atomic-action-btn';
                btn.innerText = act.label;
                
                // --- LÓGICA DE ACTIONS ATUALIZADA ---
                btn.onclick = () => {
                    // Ação 1: Abrir Mapa
                    if (act.type === 'OPEN_MAP') {
                        showMapModal();
                    } 
                    // Ação 2: Calculadora -> AGORA ABRE A ESCOLHA PRIMEIRO
                    else if (act.type === 'OPEN_BUDGET') {
                        showBudgetChoiceModal();
                    }
                    else if (act.type === 'OPEN_PRODUCT') window.showProductDetail(act.payload);
                    else if (act.url) window.open(act.url, '_blank');
                    else if (act.targetId) {
                        const el = document.getElementById(act.targetId);
                        if(el) el.scrollIntoView({behavior:'smooth'});
                    }
                };
                actCont.appendChild(btn);
            });
            bubble.appendChild(actCont);
        }

        row.appendChild(bubble);
        els.msgs.appendChild(row);
        if(!isHistory) scrollToBottom();
    }

    async function handleSend() {
        const txt = els.input.value.trim();
        if(!txt) return;
        els.input.value = '';
        
        renderMessage('user', txt);
        saveHistory('user', txt);

        const loadingId = 'loading-' + Date.now();
        const loadRow = document.createElement('div');
        loadRow.id = loadingId;
        loadRow.innerHTML = '<div class="atomic-msg-bubble bot">...</div>';
        els.msgs.appendChild(loadRow);
        scrollToBottom();

        try {
            const res = await fetch(CONFIG.API_ENDPOINT, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ message: txt, session_id: state.sessionId })
            });
            
            if (!res.ok) throw new Error(`Server Error: ${res.status}`);
            
            const data = await res.json();
            document.getElementById(loadingId)?.remove();
            
            if (data.session_id) {
                state.sessionId = data.session_id;
                sessionStorage.setItem(CONFIG.STORAGE_KEYS.SESSION, state.sessionId);
            }
            
            const replyText = data.reply || data.response || "Sem resposta.";
            renderMessage('bot', replyText, data.produtos_sugeridos, data.actions);
            saveHistory('bot', replyText, data.produtos_sugeridos, data.actions);

        } catch (err) {
            console.error('Atomic Chat Error:', err);
            document.getElementById(loadingId)?.remove();
            renderMessage('bot', 'Ops! Tive um problema de conexão com o QG. Tenta de novo?');
        }
    }

    if(els.sendBtn) els.sendBtn.onclick = handleSend;
    if(els.input) els.input.onkeydown = (e) => { if(e.key === 'Enter') handleSend(); };

    function saveHistory(role, text, prods, acts) {
        const h = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.HISTORY) || '[]');
        h.push({role, text, prods, acts});
        localStorage.setItem(CONFIG.STORAGE_KEYS.HISTORY, JSON.stringify(h.slice(-20)));
    }

    function loadHistory() {
        const h = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.HISTORY) || '[]');
        h.forEach(m => renderMessage(m.role, m.text, m.prods, m.acts, true));
        return h.length > 0;
    }

    function checkEmptyState() {
        if(els.msgs.children.length === 0) {
            const msg = "Olá! Sou o Thiago da Atomic. Estou aqui para falar de Games, Consoles e PC. Como posso ajudar você hoje?";
            renderMessage('bot', msg, [], []);
        }
    }

    if(!loadHistory()) checkEmptyState();

    els.bubble.addEventListener('touchstart', e => {
        state.startX = e.touches[0].clientX; state.startY = e.touches[0].clientY; state.isDragging = false;
    }, {passive:true});

    els.bubble.addEventListener('touchmove', e => {
        if(Math.hypot(e.touches[0].clientX - state.startX, e.touches[0].clientY - state.startY) > 10) {
            state.isDragging = true;
            els.bubble.style.left = e.touches[0].clientX + 'px'; els.bubble.style.top = e.touches[0].clientY + 'px';
            e.preventDefault();
        }
    }, {passive:false});

    els.bubble.addEventListener('touchend', e => { if(!state.isDragging) openChat(); state.isDragging = false; });
    els.bubble.addEventListener('click', e => { if(!state.isDragging) state.isOpen ? closeChat() : openChat(); });

})();