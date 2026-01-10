// === VERCEL API HANDLER (DIAGNOSTIC VERSION) ===
export default async function handler(req, res) {
  // Configuração de Permissões (CORS)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // 1. Verificação das "Chaves" no Painel da Vercel
  const apiKey = process.env.GEMINI_API_KEY;
  const catalogUrl = process.env.CATALOG_URL;
  const whatsapp = process.env.WHATSAPP_NUMBER || '5521995969378';

  if (!apiKey) {
    return res.status(500).json({ reply: "Erro: A GEMINI_API_KEY não foi configurada na Vercel." });
  }
  if (!catalogUrl) {
    return res.status(500).json({ reply: "Erro: A CATALOG_URL não foi configurada na Vercel." });
  }

  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ reply: "Envie uma mensagem válida." });

    // 2. Busca o Catálogo
    const catalogRes = await fetch(catalogUrl);
    if (!catalogRes.ok) {
      return res.status(500).json({ reply: "Erro: Não consegui ler o arquivo de produtos no GitHub." });
    }
    const catalogData = await catalogRes.text();

    // 3. Fala com o Google Gemini
    const googleUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
    
    const prompt = {
      contents: [{
        parts: [{
          text: `Você é o Thiago da Atomic Games Brasil. Use este catálogo: ${catalogData}. 
          WhatsApp para vendas: ${whatsapp}. Seja direto e amigável.
          Pergunta do cliente: ${message}`
        }]
      }]
    };

    const response = await fetch(googleUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prompt)
    });

    const data = await response.json();
    
    if (data.error) {
      return res.status(500).json({ reply: `Erro do Google: ${data.error.message}` });
    }

    const botReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Não consegui processar sua resposta agora.";
    return res.status(200).json({ reply: botReply });

  } catch (error) {
    return res.status(500).json({ reply: "Erro interno: Verifique os Logs na Vercel." });
  }
}
