const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const supabase = require('./config/supabase');

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// MIDDLEWARES
// ==========================================
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.static('public'));

// ==========================================
// RUTAS ORIGINALES DE WIKI-IA
// ==========================================
const authRoutes = require('./routes/auth');
const iasRoutes = require('./routes/ias');
const categoriasRoutes = require('./routes/categorias');
const resenasRoutes = require('./routes/resenas');
const favoritosRoutes = require('./routes/favoritos');
const usuariosRoutes = require('./routes/usuarios');
const adminRoutes = require('./routes/admin');
const medallasRoutes = require('./routes/medallas');
const passwordRoutes = require('./routes/password');

app.use('/api/auth', authRoutes);
app.use('/api/ias', iasRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/resenas', resenasRoutes);
app.use('/api/favoritos', favoritosRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/medallas', medallasRoutes);
app.use('/api/password', passwordRoutes);

// Ruta de prueba de salud de la API
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Wiki IA API funcionando correctamente' });
});

// ==========================================
// RUTA DINÁMICA DEL CHATBOT - WIKI-IA
// ==========================================
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/chatbot', async (req, res) => {
    const { mensaje } = req.body;

    try {
        const { data: iasEnBaseDeDatos, error } = await supabase
            .from('ias')
            .select('ia_id, nombre, descripcion')
            .eq('estado', 'aprobada')
            .eq('activa', true);

        if (error) {
            console.error('Error al obtener IAs:', error);
            throw error;
        }

        let catalogoActualizado = "";
        if (Array.isArray(iasEnBaseDeDatos)) {
            iasEnBaseDeDatos.forEach(ia => {
                catalogoActualizado += `- IA: ${ia.nombre} | Función: ${ia.descripcion} | Enlace: javascript:abrirDetalleIA(${ia.ia_id})\n`;
            });
        }

        const systemInstruction = `
            Eres el asistente de 'Wiki-IA'. Tu misión es recomendar IAs de nuestro catálogo.
            
            REGLAS DE ORO:
            - Solo hablas de Inteligencia Artificial. Si te preguntan otra cosa, di que no estás programado para eso.
            - Usa ÚNICAMENTE el catálogo que te proporciono abajo.
            - Al recomendar una IA, pon el enlace en formato Markdown EXACTAMENTE como aparece en el catálogo. Ejemplo: [Nombre de la IA](javascript:abrirDetalleIA(1)).
            - Sé amable pero muy conciso.
            
            ESTE ES NUESTRO CATÁLOGO REAL HOY:
            ${catalogoActualizado}
        `;

        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            systemInstruction: systemInstruction 
        });

        const result = await model.generateContent(mensaje);
        const respuestaIA = result.response.text();

        res.json({ respuesta: respuestaIA });

    } catch (error) {
        console.error('Error en el Chatbot Dinámico:', error);
        res.status(500).json({ 
            respuesta: 'Lo siento, no pude consultar nuestro catálogo en este momento. Inténtalo de nuevo.' 
        });
    }
});

// ==========================================
// MANEJO DE ERRORES GENERALES
// ==========================================
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
});

// ==========================================
// INICIAR SERVIDOR
// ==========================================
app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en puerto ${PORT}`);
    console.log(`📚 API disponible en /api`);
});