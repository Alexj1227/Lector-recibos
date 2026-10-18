export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Método ${req.method} no permitido` });
  }

  try {
    const { image, mimeType } = req.body || {};
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'API Key no configurada en el servidor de Vercel.' });
    }

    if (!image || !mimeType) {
      return res.status(400).json({ error: 'Faltan datos de la imagen o el tipo MIME.' });
    }

    const promptText = "Analiza este recibo o factura. Extrae y organiza la información estrictamente en el siguiente formato:\n- Fecha del comprobante:\n- Proveedor / Establecimiento:\n- Texto completo extraído:\n- Montos y Totales detectados:\nMantenlo limpio y ordenado cronológicamente.";

    const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: promptText },
            {
              inline_data: {
                mime_type: mimeType,
                data: image
              }
            }
          ]
        }]
      })
    });

    const data = await apiResponse.json();

    if (data.candidates && data.candidates[0].content) {
      const output = data.candidates[0].content.parts[0].text;
      return res.status(200).json({ result: output });
    } else {
      return res.status(500).json({ error: 'Error de la IA: ' + JSON.stringify(data) });
    }

  } catch (error) {
    return res.status(500).json({ error: 'Error interno del servidor: ' + error.message });
  }
}
