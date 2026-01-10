// Este arquivo substitui o seu Back-end do Render
export default async function handler(req, res) {
  // Configurações de Segurança Básica
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Apenas chamadas POST são permitidas' });
  }

  const { message } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;
  const catalogUrl = process.env.CATALOG_URL;

  try {
    // 1. Busca o catálogo de produtos no seu GitHub
    const catalogResponse = await fetch(catalogUrl);
    const catalogData = await catalogResponse.text();

    // 2. Prepara a chamada para o Google Gemini
    const googleUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

    const prompt = {
      contents: [{
        parts: [{
          text: `Você é um assistente de vendas da Atomic Games Brasil. 
          Use o seguinte catálogo para responder: ${catalogData}. 
          O número de WhatsApp para fechamento é ${process.env.WHATSAPP_NUMBER}.
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
    const botReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Desculpe, tive um problema ao processar sua resposta.";

    // 3. Retorna a resposta para o seu site
    return res.status(200).json({ reply: botReply });

  } catch (error) {
    console.error('Erro no Chatbot:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
}
