
(function() {
    'use strict';

    console.log('Atomic Chatbot v5.9.5 (Unified, Symptom Based & Hidden Price) Initializing...');

    // ==========================================================================
    // 0. DADOS DA CALCULADORA (ESPELHO DO SITE)
    // ==========================================================================
    const LOGISTICS_COST = { 
        shop: 0, 
        local: 15, 
        interzonal: 35, 
        remote: 50 
    };

    // UPDATE 2025: Fusão de Categorias e Wording por Sintoma (ESPELHADO DO MAIN.JS)
    const CALCULATOR_DATA = {
        console_modern: {
            label: "Consoles",
            models: {
                ps5: { 
                    name: "PlayStation 5 (Fat / Slim / Pro)", 
                    services: { 
                        overheating: { name: "Está esquentando muito / Desliga sozinho", min: 250, max: 400, note: "Risco Alto (Curto-circuito)" },
                        noise: { name: "Faz barulho muito alto durante o uso", min: 200, max: 350, note: "Preventiva" }, 
                        no_image: { name: "Não aparece imagem na TV / Tela preta", min: 350, max: 550, note: "Microsolda Avançada" },
                        glitch: { name: "Imagem falhando ou sumindo", min: 350, max: 550, note: "Microsolda" },
                        disc_read: { name: "Não lê disco / Não puxa disco", min: 300, max: 500, note: "Mecânica/Laser" },
                        crash: { name: "Jogo ou aplicativo trava com frequência", min: 0, max: 0, note: "Sob Análise" },
                        custom_issue: { name: "Outro problema (descrever abaixo)", min: 0, max: 0, note: "Sob Análise Técnica" }
                    } 
                },
                xbox_series: {
                    name: "Xbox Series X / S",
                    services: {
                        overheating: { name: "Está esquentando muito / Desliga durante o jogo", min: 200, max: 350, note: "Troca pasta térmica premium" },
                        no_image: { name: "Não aparece imagem na TV / Tela preta", min: 300, max: 450, note: "Microsolda" },
                        startup_error: { name: "Console não liga ou trava na inicialização", min: 400, max: 600, note: "Reparo de Placa/SSD" },
                        game_crash: { name: "Jogos fecham sozinhos ou travam", min: 0, max: 0, note: "Sob Análise" },
                        custom_issue: { name: "Outro problema (descrever abaixo)", min: 0, max: 0, note: "Sob Análise Técnica" }
                    }
                },
                ps4: { 
                    name: "PlayStation 4 (Fat / Slim / Pro)", 
                    services: { 
                        jet_noise: { name: "Faz barulho muito alto / Parece um jato", min: 150, max: 250, note: "Manutenção Preventiva" }, 
                        overheating: { name: "Esquenta muito / Desliga sozinho", min: 150, max: 250, note: "Manutenção Preventiva" },
                        no_video_on: { name: "Liga mas não aparece imagem", min: 200, max: 350, note: "Microsolda HDMI" },
                        white_light: { name: "Luz branca acesa sem vídeo", min: 200, max: 350, note: "Microsolda HDMI/Encoder" },
                        disc_issues: { name: "Não lê disco / Ejeta disco sozinho", min: 180, max: 300, note: "+ Peça se necessário" },
                        slow_system: { name: "Sistema lento / Travando / Erro ao atualizar", min: 150, max: 250, note: "Possível troca de HD" },
                        custom_issue: { name: "Outro problema (descrever abaixo)", min: 0, max: 0, note: "Sob Análise Técnica" }
                    } 
                },
                xbox_one: {
                    name: "Xbox One (Fat / S / X)",
                    services: {
                        overheating: { name: "Esquenta muito / Desliga sozinho", min: 150, max: 250, note: "Preventiva" },
                        no_image: { name: "Não aparece imagem na TV", min: 250, max: 400, note: "Troca de CI/HDMI" },
                        glitch: { name: "Imagem piscando ou falhando", min: 250, max: 400, note: "Troca de CI/HDMI" },
                        disc_noise: { name: "Faz barulho ao tentar ler o disco", min: 180, max: 300, note: "Mecânica" },
                        disc_read: { name: "Não reconhece jogos em disco", min: 180, max: 300, note: "Leitor Óptico" },
                        custom_issue: { name: "Outro problema (descrever abaixo)", min: 0, max: 0, note: "Sob Análise Técnica" }
                    }
                },
                ps3: {
                    name: "PlayStation 3 (Fat / Slim / Super Slim)",
                    services: {
                        digital_games: { name: "Quero rodar jogos sem usar disco", min: 100, max: 150, note: "Instalação Lojas" },
                        noise: { name: "Faz muito barulho / Ventoinha acelera", min: 120, max: 180, note: "Essencial para Fat/Slim" },
                        shutdown: { name: "Desliga sozinho após alguns minutos", min: 120, max: 180, note: "Superaquecimento" },
                        ylod: { name: "Luz amarela / Liga e desliga em seguida", min: 300, max: 500, note: "Reparo de Placa (NEC Tokin)" },
                        custom_issue: { name: "Outro problema (descrever abaixo)", min: 0, max: 0, note: "Sob Análise Técnica" }
                    }
                },
                xbox_360: { 
                    name: "Xbox 360 (Fat / Slim / E)", 
                    services: { 
                        digital_games: { name: "Quero rodar jogos sem usar disco", min: 150, max: 250, note: "Desbloqueio RGH" },
                        red_ring: { name: "Luz vermelha acesa / Superaquece", min: 250, max: 450, note: "Reballing/Erro Secundário" },
                        noise: { name: "Faz muito barulho", min: 100, max: 150, note: "Limpeza Geral" },
                        no_image: { name: "Não aparece imagem na TV", min: 250, max: 450, note: "Reballing/GPU" },
                        custom_issue: { name: "Outro problema (descrever abaixo)", min: 0, max: 0, note: "Sob Análise Técnica" }
                    } 
                },
                ps2: {
                    name: "PlayStation 2 (Fat / Slim)",
                    services: {
                        disc_read: { name: "Não lê CD ou DVD", min: 120, max: 180, note: "Troca de Leitor" },
                        freeze: { name: "Trava durante jogos ou vídeos", min: 120, max: 180, note: "Troca de Leitor/Flat" },
                        usb_games: { name: "Quero jogar sem usar disco", min: 80, max: 120, note: "Instalação OPL" },
                        custom_issue: { name: "Outro problema (descrever abaixo)", min: 0, max: 0, note: "Sob Análise Técnica" }
                    }
                },
                wii_u: {
                    name: "Nintendo Wii / Wii U",
                    services: {
                        install_games: { name: "Quero instalar jogos no console", min: 100, max: 180, note: "Desbloqueio" },
                        controller_sync: { name: "Controle não conecta corretamente", min: 150, max: 250, note: "Módulo Bluetooth" },
                        screen_gamepad: { name: "Tela do controle quebrada ou sem imagem", min: 200, max: 400, note: "Reparo Gamepad" },
                        custom_issue: { name: "Outro problema (descrever abaixo)", min: 0, max: 0, note: "Sob Análise Técnica" }
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
                        install_games: { name: "Quero instalar jogos no console", min: 100, max: 180, note: "Desbloqueio Software" },
                        overheating: { name: "Esquenta muito", min: 100, max: 150, note: "Limpeza Interna" },
                        fan_noise: { name: "Faz barulho na ventoinha", min: 100, max: 150, note: "Limpeza/Troca Cooler" },
                        screen_touch: { name: "Tela quebrada ou sem toque", min: 250, max: 400, note: "Troca de Tela" },
                        custom_issue: { name: "Outro problema (descrever abaixo)", min: 0, max: 0, note: "Sob Análise Técnica" }
                    } 
                },
                switch_v2_lite: { 
                    name: "Switch V2 / Lite", 
                    services: { 
                        unlock: { name: "Quero desbloquear o console", min: 350, max: 550, note: "Instalação ModChip" },
                        screen_issue: { name: "Vidro quebrado / Imagem falhando", min: 350, max: 500, note: "Troca de Tela" },
                        no_charge: { name: "Não carrega a bateria", min: 250, max: 400, note: "Reparo de Carga" },
                        dock_issue: { name: "Não conecta na TV (Dock)", min: 250, max: 400, note: "Reparo de Imagem" },
                        custom_issue: { name: "Outro problema (descrever abaixo)", min: 0, max: 0, note: "Sob Análise Técnica" }
                    } 
                },
                switch_oled: { 
                    name: "Switch OLED", 
                    services: { 
                        unlock: { name: "Quero desbloquear o console", min: 500, max: 800, note: "Instalação ModChip (Complexo)" },
                        overheating: { name: "Esquenta muito", min: 150, max: 250, note: "Limpeza Interna" },
                        fan_noise: { name: "Faz barulho na ventoinha", min: 150, max: 250, note: "Limpeza/Troca Cooler" },
                        custom_issue: { name: "Outro problema (descrever abaixo)", min: 0, max: 0, note: "Sob Análise Técnica" }
                    } 
                },
                steam_rog: {
                    name: "Steam Deck / ROG Ally / Legion",
                    services: {
                        storage: { name: "Falta espaço para jogos", min: 150, max: 250, note: "Upgrade SSD (Mão de Obra)" },
                        drift: { name: "Analógico puxando sozinho (personagem anda sozinho)", min: 250, max: 400, note: "Instalação Hall Effect" },
                        overheating: { name: "Esquenta muito", min: 150, max: 250, note: "Limpeza Técnica" },
                        fan_noise: { name: "Ventoinha faz muito barulho", min: 150, max: 250, note: "Limpeza Técnica" },
                        custom_issue: { name: "Outro problema (descrever abaixo)", min: 0, max: 0, note: "Sob Análise Técnica" }
                    }
                },
                retro_sony: {
                    name: "PSP / PS Vita",
                    services: {
                        install_games: { name: "Quero instalar jogos no console", min: 80, max: 120, note: "Desbloqueio" },
                        battery: { name: "Bateria descarrega rápido", min: 100, max: 180, note: "Troca de Bateria" },
                        shutdown: { name: "Desliga sozinho", min: 100, max: 180, note: "Bateria/Placa" },
                        screen: { name: "Tela quebrada ou com manchas", min: 150, max: 300, note: "Troca de Tela" },
                        custom_issue: { name: "Outro problema (descrever abaixo)", min: 0, max: 0, note: "Sob Análise Técnica" }
                    }
                },
                retro_nintendo: {
                    name: "3DS / 2DS / DS",
                    services: {
                        install_games: { name: "Quero instalar jogos no console", min: 100, max: 150, note: "Desbloqueio" },
                        screen_broken: { name: "Tela quebrada", min: 200, max: 350, note: "Risco Alto (Flat)" },
                        touch_issue: { name: "Toque não funciona corretamente", min: 200, max: 350, note: "Troca Touch" },
                        custom_issue: { name: "Outro problema (descrever abaixo)", min: 0, max: 0, note: "Sob Análise Técnica" }
                    }
                },
                chinese_handhelds: {
                    name: "Portáteis Chineses (Anbernic/Miyoo/Retroid)",
                    services: {
                        no_power: { name: "Console não liga", min: 0, max: 0, note: "Sob Análise" },
                        black_screen: { name: "Tela preta", min: 0, max: 0, note: "Sob Análise" },
                        config: { name: "Sistema confuso / Precisa configurar", min: 80, max: 150, note: "Otimização" },
                        buttons: { name: "Botões afundados ou não respondem", min: 100, max: 250, note: "Reparo" },
                        custom_issue: { name: "Outro problema (descrever abaixo)", min: 0, max: 0, note: "Sob Análise Técnica" }
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
                        slow_pc: { name: "Computador muito lento", min: 80, max: 100, note: "Otimização/Formatação" },
                        crash_virus: { name: "Travando ou com vírus", min: 150, max: 250, note: "Formatação Completa" }, 
                        format: { name: "Quero formatar o sistema", min: 150, max: 250, note: "Formatação Completa" },
                        backup: { name: "Preciso salvar meus arquivos (backup)", min: 150, max: 250, note: "Formatação c/ Backup" },
                        overheating: { name: "Esquentando muito", min: 100, max: 200, note: "Limpeza Interna" },
                        performance: { name: "Quero melhorar o desempenho do PC", min: 80, max: 150, note: "Upgrade Hardware (Mão de Obra)" },
                        custom_issue: { name: "Outro problema (descrever abaixo)", min: 0, max: 0, note: "Sob Análise Técnica" }
                    } 
                },
                notebook: {
                    name: "Notebook (Gamer / Comum)",
                    services: {
                        screen_broken: { name: "Tela quebrada ou com listras", min: 150, max: 250, note: "+ Valor da Tela" },
                        screen_dark: { name: "Tela muito escura ou sem imagem", min: 150, max: 250, note: "+ Valor da Tela" },
                        keys_fail: { name: "Teclas falhando", min: 100, max: 200, note: "Troca Teclado" },
                        liquid: { name: "Molhou o teclado", min: 100, max: 200, note: "Troca Teclado" },
                        hinge: { name: "Dobradiça quebrada / Tampa abrindo", min: 200, max: 400, note: "Reconstrução" },
                        custom_issue: { name: "Outro problema (descrever abaixo)", min: 0, max: 0, note: "Sob Análise Técnica" }
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
                        drift: { name: "Personagem anda sozinho", min: 80, max: 120, note: "Troca Sensor" }, 
                        analog_fail: { name: "Analógico não responde corretamente", min: 80, max: 120, note: "Troca Sensor" },
                        no_charge: { name: "Não carrega", min: 80, max: 120, note: "Reparo Carga/Bateria" },
                        battery_drain: { name: "Bateria acaba muito rápido", min: 80, max: 120, note: "Troca Bateria" },
                        custom_issue: { name: "Outro problema (descrever abaixo)", min: 0, max: 0, note: "Sob Análise Técnica" }
                    } 
                },
                controllers_ms: { 
                    name: "Controle Xbox (Series/One)", 
                    services: { 
                        drift: { name: "Personagem anda sozinho", min: 80, max: 120, note: "Troca Sensor" }, 
                        buttons_fail: { name: "Botões não respondem (RB/LB)", min: 60, max: 100, note: "Troca Switch" },
                        custom_issue: { name: "Outro problema (descrever abaixo)", min: 0, max: 0, note: "Sob Análise Técnica" }
                    } 
                },
                joycon: {
                    name: "Nintendo Joy-Con",
                    services: {
                        drift: { name: "Personagem anda sozinho", min: 100, max: 160, note: "Troca Analógico (Par)" },
                        loose: { name: "Joy-Con solta do console", min: 60, max: 100, note: "Troca Trilho" },
                        no_charge: { name: "Não carrega quando encaixado", min: 60, max: 100, note: "Troca Trilho" },
                        custom_issue: { name: "Outro problema (descrever abaixo)", min: 0, max: 0, note: "Sob Análise Técnica" }
                    }
                },
                peripherals: {
                    name: "Mouse / Teclado / Headset",
                    services: {
                        click_issue: { name: "Clique falhando ou clicando sozinho", min: 60, max: 120, note: "Troca Switch" },
                        audio_fail: { name: "Um lado do fone não funciona", min: 80, max: 150, note: "Reparo Cabo/Jack" },
                        connection_fail: { name: "Falha de conexão ou mau contato", min: 80, max: 150, note: "Reparo Cabo" },
                        custom_issue: { name: "Outro problema (descrever abaixo)", min: 0, max: 0, note: "Sob Análise Técnica" }
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
                /* Z-INDEX EXTREMO PARA EVITAR SOBREPOSIÇÃO */
                z-index: 2147483647 !important;
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
                /* Melhoria de scroll mobile */
                overscroll-behavior: contain;
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
                
                /* TEXTAREA SPECIFIC FIXES */
                resize: none;
                overflow-y: hidden;
                min-height: 44px; 
                max-height: 120px;
                line-height: 1.4;
                font-family: inherit;
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
                background: var(--at-overlay); z-index: 2147483647;
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

            /* --- BUBBLE & FIXES --- */
            #chatBubble, #atomic-chat-trigger {
                position: fixed !important;
                bottom: 20px !important;
                right: 20px !important;
                background-color: var(--at-bubble-bg) !important; 
                color: var(--at-bubble-text) !important;
                box-shadow: 0 0 20px var(--at-accent) !important;
                z-index: 2147483646 !important; /* Logo abaixo do modal, acima do BackToTop */
            }

            @keyframes atomicFadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes atomicSlideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            
            .at-hidden { display: none !important; }

            /* --- XIAOMI / REDMI BROWSER FIXES --- */
            @media (max-width: 768px) {
                #chatWindow, #atomic-chat-window, .chat-window {
                    width: 100% !important;
                    /* 'dvh' resolve o problema da barra de navegação flutuante nos browsers chineses */
                    height: 90dvh !important; 
                    max-height: 90dvh !important;
                    bottom: 0 !important;
                    right: 0 !important;
                    border-radius: 16px 16px 0 0 !important;
                    /* Garante que fique acima de tudo no mobile */
                    z-index: 2147483647 !important;
                }
            }
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

                        <!-- HIDDEN PRICE IN UI (Update 2025) -->
                        <div class="atomic-price-display at-hidden" id="at-price-box">
                            <div class="atomic-price-label">Diagnóstico</div>
                            <div class="atomic-price-value" id="at-calc-result">Pronto para Análise</div>
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
            // const logCost = LOGISTICS_COST[logKey] || 0; // Unused here in UI

            if (sKey === 'custom_issue') {
                els.groupDesc.classList.remove('at-hidden');
                els.priceBox.classList.add('at-hidden');
                els.submit.innerText = "Solicitar Análise";
            } else {
                els.groupDesc.classList.add('at-hidden');
                // Don't show price in UI anymore, just show readiness
                els.priceBox.classList.remove('at-hidden');
                els.result.innerText = "Pronto para Análise";
                els.note.innerText = "Valor será informado no Chat";
                
                els.submit.innerText = "✅ Ver Diagnóstico";
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
            const logCost = LOGISTICS_COST[logKey] || 0;
            
            let minPrice = svcData.min;
            let maxPrice = svcData.max;
            let customDesc = "";

            if (currentSelection.service === 'custom_issue') {
                customDesc = els.desc.value;
            } else {
                minPrice += logCost;
                maxPrice += logCost;
            }

            // Close Modal & Trigger Chat Logic
            els.modal.classList.remove('active');
            
            // Build Context for ProcessBudget
            const ctx = {
                customer: { name, phone },
                device: { category: cat, modelLabel: model },
                service: { id: currentSelection.service, name: serviceName, customDescription: customDesc },
                financial: { totalMin: minPrice, totalMax: maxPrice },
                logistics: { label: logKey === 'shop' ? 'Levar na Loja' : 'Buscar de Motoboy' }
            };

            window.AtomicChat.processBudget(ctx);
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
        const backToTop = document.getElementById('backToTop');
        const installBtnMobile = document.getElementById('installAppBtnMobile');

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
            
            // --- XIAOMI FIX: ESCONDER BACKTOTOP ---
            if(backToTop) backToTop.style.display = 'none';
            // -------------------------------------
            
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

            // --- RESTORE BACKTOTOP ---
            if(backToTop) backToTop.style.display = '';
            // -------------------------
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
        
        // SECURITY UPDATE: Sanitização via textContent para User, innerHTML controlado para Bot
        if (role === 'user') {
            bubble.textContent = text;
        } else {
            bubble.innerHTML = text.replace(/\n/g, '<br>');
        }

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
        els.input.style.height = 'auto'; // Reset textarea height
        
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
    
    // --- TEXTAREA LOGIC: Auto-Grow & Enter Send ---
    if(els.input) {
        // Auto-Grow
        els.input.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });

        // Enter to Send, Shift+Enter for Newline
        els.input.addEventListener('keydown', (e) => {
            if(e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        });
    }

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

    // BUBBLE DRAG FIX: ADDED THRESHOLD FOR CLICK
    els.bubble.addEventListener('touchstart', e => {
        state.startX = e.touches[0].clientX; 
        state.startY = e.touches[0].clientY; 
        state.isDragging = false;
    }, {passive:true});

    els.bubble.addEventListener('touchmove', e => {
        // Only consider dragging if moved more than 10px (DEADZONE)
        if(Math.hypot(e.touches[0].clientX - state.startX, e.touches[0].clientY - state.startY) > 10) {
            state.isDragging = true;
            els.bubble.style.left = e.touches[0].clientX + 'px'; els.bubble.style.top = e.touches[0].clientY + 'px';
            e.preventDefault();
        }
    }, {passive:false});

    els.bubble.addEventListener('touchend', e => { 
        if(!state.isDragging) openChat(); 
        state.isDragging = false; 
    });
    
    // Click fallback for desktop mouse
    els.bubble.addEventListener('click', e => { 
        if(!state.isDragging) state.isOpen ? closeChat() : openChat(); 
    });

    // ==========================================================================
    // 5. DIAGNOSIS LOGIC (NEW 2025)
    // ==========================================================================
    
    function getDiagnosisText(symptomText) {
        const s = symptomText.toLowerCase();
        
        if (s.match(/esquentando|aquecendo|desliga sozinho|superaquece/)) {
            return {
                expl: "Quando esse problema acontece, normalmente está ligado a acúmulo de poeira interna, pasta térmica ressecada ou falha no sistema de refrigeração, o que faz o aparelho se proteger desligando sozinho.",
                sol: "Geralmente é necessário realizar limpeza interna completa, troca de pasta térmica e revisão do sistema de ventilação."
            };
        }
        if (s.match(/barulho|jato|ventoinha/)) {
            return {
                expl: "Esse barulho excessivo costuma indicar que o sistema de refrigeração está trabalhando no limite, geralmente por poeira acumulada ou superaquecimento constante.",
                sol: "O procedimento normalmente envolve limpeza técnica interna e manutenção preventiva, evitando danos maiores no futuro."
            };
        }
        if (s.match(/imagem|tela preta|glitch|hdmi|luz branca/)) {
            return {
                expl: "Esse tipo de problema geralmente está relacionado a falha no circuito de vídeo, conector HDMI ou componente gráfico, impedindo a transmissão correta da imagem.",
                sol: "A solução pode envolver reparo no HDMI, análise da GPU ou correção de solda, conforme o diagnóstico."
            };
        }
        if (s.match(/disco|leitor|ejeta/)) {
            return {
                expl: "Quando o console não reconhece ou ejeta discos, normalmente o defeito está no leitor óptico, motor do drive ou lente desgastada.",
                sol: "O reparo envolve manutenção ou substituição do conjunto do leitor, dependendo da condição encontrada."
            };
        }
        if (s.match(/lento|travando|fecham sozinhos/)) {
            return {
                expl: "Travamentos frequentes costumam estar ligados a falhas de software, aquecimento excessivo ou problemas no armazenamento interno.",
                sol: "A solução pode incluir manutenção interna, correção de sistema ou substituição de componentes, após análise."
            };
        }
        if (s.match(/não liga|luz amarela|luz vermelha|desliga após/)) {
            return {
                expl: "Quando o aparelho não liga ou desliga rapidamente, geralmente há falha na alimentação elétrica, superaquecimento crítico ou defeito em componentes internos.",
                sol: "O reparo exige diagnóstico técnico completo e correção do circuito afetado."
            };
        }
        if (s.match(/drift|anda sozinho|analógico/)) {
            return {
                expl: "Esse problema é conhecido como drift, causado pelo desgaste interno do analógico, fazendo o controle enviar comandos sem toque.",
                sol: "A solução envolve troca ou reparo do analógico, garantindo funcionamento correto novamente."
            };
        }
        if (s.match(/carrega|bateria/)) {
            return {
                expl: "Esse sintoma geralmente indica bateria desgastada ou falha no circuito de carga, reduzindo a autonomia do aparelho.",
                sol: "O procedimento costuma ser substituição da bateria ou reparo no sistema de carga."
            };
        }
        if (s.match(/instalar jogos|desbloqueio|rodar sem disco/)) {
            return {
                expl: "Esse tipo de solicitação envolve configuração de sistema ou instalação personalizada, permitindo executar jogos sem mídia física.",
                sol: "O processo varia conforme o modelo e estado do aparelho, podendo exigir ajustes adicionais."
            };
        }
        if (s.match(/computador|lento|vírus|formatar/)) {
            return {
                expl: "Quando o computador apresenta lentidão ou vírus, normalmente é necessário limpeza de sistema, formatação ou otimização de software.",
                sol: "O serviço pode incluir backup de arquivos e reinstalação do sistema operacional."
            };
        }
        
        // Default
        return {
            expl: "Vou analisar a descrição que você enviou para entender melhor o problema.",
            sol: "Após essa análise, consigo te explicar exatamente o que pode estar acontecendo e informar o valor estimado do serviço."
        };
    }

    // === API PUBLICA DE INTEGRAÇÃO (FIX) ===
    window.AtomicChat = {
        open: () => updateChatUI(true),
        close: () => updateChatUI(false),
        processBudget: (ctx) => {
            updateChatUI(true); // Garante que abre o chat

            const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            const range = `${fmt(ctx.financial.totalMin)} a ${fmt(ctx.financial.totalMax)}`;
            const isCustom = ctx.service.id === 'custom_issue';
            const displayPrice = isCustom ? "Sob Análise Técnica" : range;

            // GET EXPLANATION TEMPLATE
            const diag = getDiagnosisText(ctx.service.name);

            // MESSAGE STRUCTURE:
            // 1. Confirmação
            // 2. Explicação (Part 2)
            // 3. Solução (Part 2)
            // 4. Preço
            
            const botMsg = `Recebi seu pedido e vou te explicar rapidinho 👇\n\n` +
                           `🛠️ **Sobre o problema:**\n${diag.expl}\n\n` +
                           `✅ **Solução:**\n${diag.sol}\n\n` +
                           `💰 **Valor Estimado:**\nPara esse tipo de situação, o valor normalmente fica entre **${displayPrice}**, dependendo do diagnóstico final.`;

            const zapText = `*ORÇAMENTO TÉCNICO (WEB)*\n\n` +
                           `👤 *${ctx.customer.name}*\n` +
                           `📱 ${ctx.customer.phone}\n` +
                           `--------------------------------\n` +
                           `🎮 *Aparelho:* ${ctx.device.modelLabel}\n` +
                           `🛠️ *Serviço:* ${ctx.service.name}\n` +
                           `📍 *Logística:* ${ctx.logistics.label}\n` +
                           `💰 *Estimativa:* ${displayPrice}\n` +
                           `--------------------------------\n` +
                           `*Obs:* Aceito a taxa de diagnóstico caso recuse o reparo.`;
            
            const waUrl = `https://wa.me/5521995969378?text=${encodeURIComponent(zapText)}`;

            renderMessage('bot', botMsg, [], [{
                label: "✅ Falar com Especialista Agora",
                type: "LINK",
                url: waUrl
            }]);
        }
    };

})();
