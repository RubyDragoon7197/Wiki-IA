const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Inicializar el cliente de Gemini
if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY no está definida en las variables de entorno');
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

        // Construir el historial de conversación
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
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const result = await model.generateContent(fullPrompt);

        const respuesta = result.response.text();

        res.json({ respuesta });

    } catch (error) {
        console.error('Error en chatbot:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).json({ 
            error: 'Error al procesar tu mensaje',
            detalles: error.message,
            respuesta: 'Lo siento, hubo un problema. ¿Puedes intentar de nuevo?'
        });
    }
});

module.exports = router;