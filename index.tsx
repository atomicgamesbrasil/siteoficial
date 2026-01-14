import { GoogleGenAI, Type } from "@google/genai";

// === ATOMIC GAMES "BRAIN" - BACKEND LOGIC ===
// This code runs on the SERVER (conceptually) or Client side in this demo.

// 1. Initialize AI with environment key (Secure)
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// 2. Model Selection: Gemini 3 Flash is fast and intelligent for commerce.
const modelName = 'gemini-3-flash-preview'; 

// 3. RESPONSE SCHEMA
// This enforces the AI to reply in a specific JSON format that the frontend understands.
const responseSchema = {
    type: Type.OBJECT,
    properties: {
        response: {
            type: Type.STRING,
            description: "The text response from Thiago. Use Markdown for formatting (bold, lists).",
        },
        produtos_sugeridos: {
            type: Type.ARRAY,
            description: "List of products to show in the chat carousel, if applicable.",
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    price: { type: Type.STRING },
                    image: { type: Type.STRING }
                }
            }
        },
        // Smart Actions: The AI decides if the user needs to scroll to a specific section
        local_actions: {
            type: Type.ARRAY,
            description: "Navigation actions. If user talks about repair, add action to scroll to 'services'. If location, 'location'.",
            items: {
                type: Type.OBJECT,
                properties: {
                    label: { type: Type.STRING },
                    targetId: { type: Type.STRING, description: "HTML ID to scroll to (e.g., 'services', 'location')" },
                    icon: { type: Type.STRING, description: "FontAwesome class (e.g., 'fas fa-wrench')" }
                }
            }
        },
        action_link: {
            type: Type.STRING,
            description: "External link (e.g., WhatsApp). Use only if the user explicitly wants to close a deal.",
        }
    },
    required: ["response"]
};

// 4. SYSTEM INSTRUCTIONS (THE PERSONALITY & RULES)
const systemInstruction = `
You are **THIAGO**, the Technical Specialist and Salesman at **ATOMIC GAMES** (Madureira - RJ).
Your tone: Carioca slang (light), Gamer, Technical, Friendly, and "Straight to the point".

### 🚨 CRITICAL BUSINESS RULES (OVERRIDE ALL OTHERS):

**RULE 1: MAINTENANCE & REPAIR IS PRIORITY**
- Atomic Games **HAS** its own technical laboratory.
- WE REPAIR: PCs, Consoles, Video Cards, Notebooks. WE DO CLEANING AND THERMAL PASTE REPLACEMENT.
- **TRIGGER:** If the user mentions words like: "broken", "won't turn on", "blue screen", "freezing", "overheating", "noise", "fps drop", "cleaning", "format".
- **ACTION:** IMMEDIATE Technical Mode. Briefly diagnose the issue and **INVITE** the user to bring the device to the store for a **FREE QUOTE**.
- **FORBIDDEN:** NEVER say "we only sell parts". NEVER refer the user elsewhere for repairs.

**RULE 2: HARDWARE SALES**
- If the user wants to buy/upgrade, suggest high-performance parts.
- Select products from the CATALOG below to fill the 'produtos_sugeridos' JSON field.

**RULE 3: PERSONALITY**
- Use emojis (🎮, 🚀, 💡, 🔧).
- Be helpful. If you don't know something, ask for more details.

### 📦 MOCK CATALOG (For 'produtos_sugeridos'):
- "Pasta Térmica Arctic MX-4" (R$ 25,00) - ID: pastamx4 - Img: https://m.media-amazon.com/images/I/610Cg6wQWHL._AC_SL1000_.jpg
- "Water Cooler Lian Li Galahad 360" (R$ 920,00) - ID: wc-lianli - Img: https://m.media-amazon.com/images/I/51wXkM+jL5L._AC_SL1000_.jpg
- "Kit Fans RGB com Controladora" (R$ 159,00) - ID: fans-rgb - Img: https://m.media-amazon.com/images/I/71Y+K9uWbBL._AC_SL1500_.jpg
- "Fonte Corsair RM850x Gold" (R$ 799,00) - ID: fonte850 - Img: https://m.media-amazon.com/images/I/71R2c8-XyLL._AC_SL1500_.jpg
- "PC Gamer Atomic Starter (i5, 16GB, RTX 3060)" (R$ 4.500,00) - ID: pc-starter

### 🗺️ SITE NAVIGATION RULES (For 'local_actions'):
- Context: Maintenance/Repair -> { label: "Ver Tabela de Serviços", targetId: "services", icon: "fas fa-wrench" }
- Context: Location/Address -> { label: "Ver Mapa da Loja", targetId: "location", icon: "fas fa-map-marker-alt" }
`;

// 5. MAIN HANDLER FUNCTION
export async function handleChatRequest(userMessage: string, sessionId: string) {
    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: [
                // In a real app, you would load history from a database using sessionId here.
                { role: "user", parts: [{ text: userMessage }] }
            ],
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.6, // Balanced creativity
            },
        });

        // Parse and return the structured data
        const jsonResponse = JSON.parse(response.text);
        
        return { 
            ...jsonResponse, 
            session_id: sessionId, 
            success: true 
        };

    } catch (error) {
        console.error("Brain Error:", error);
        return {
            response: "Mermão, deu um glitch no sistema aqui. Tenta mandar de novo?",
            produtos_sugeridos: [],
            local_actions: [],
            success: false
        };
    }
}

// 6. EXPOSE TO WINDOW (Binding Logic)
// This allows the vanilla JS chatbot.js to call this TypeScript module function.
(window as any).AtomicBrain = {
    ask: handleChatRequest
};