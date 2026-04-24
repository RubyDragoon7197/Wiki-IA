const express = require('express');
const router = express.Router();

// POST /api/chatbot - Enviar mensaje al chatbot
router.post('/', async (req, res) => {
    try {
        const { mensaje, historial } = req.body;

        if (!mensaje) {
            return res.status(400).json({ error: 'El mensaje es requerido' });
        }

        // Construir el contexto del sistema
        const systemPrompt = `Eres el asistente de Wiki IA, una plataforma para descubrir y compartir herramientas de Inteligencia Artificial.

Tu rol es ayudar a los usuarios a:
- Encontrar la IA adecuada según sus necesidades
- Explicar qué hacen diferentes herramientas de IA
- Dar recomendaciones sobre qué IA usar para tareas específicas
- Responder preguntas sobre la plataforma Wiki IA

Sé amable, conciso y útil. Responde en español.
Si no sabes algo, admítelo honestamente.
Mantén las respuestas cortas (2-3 oraciones máximo) a menos que el usuario pida más detalle.`;

        // Construir el historial de conversación para Gemini
        let conversationHistory = '';
        if (historial && Array.isArray(historial)) {
            const historialReciente = historial.slice(-10);
            historialReciente.forEach(msg => {
                conversationHistory += msg.isUser 
                    ? `Usuario: ${msg.text}\n` 
                    : `Asistente: ${msg.text}\n`;
            });
        }

        // Construir el prompt completo
        const fullPrompt = `${systemPrompt}

${conversationHistory ? 'Historial de conversación:\n' + conversationHistory : ''}

Usuario: ${mensaje}
Asistente:`;

        // Llamar a la API de Gemini
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: fullPrompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 500
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error de Gemini:', errorData);
            throw new Error('Error al comunicarse con el asistente');
        }

        const data = await response.json();
        const respuesta = data.candidates[0].content.parts[0].text;

        res.json({ respuesta });

    } catch (error) {
        console.error('Error en chatbot:', error);
        res.status(500).json({ 
            error: 'Error al procesar tu mensaje',
            respuesta: 'Lo siento, hubo un problema. ¿Puedes intentar de nuevo?'
        });
    }
});

module.exports = router;