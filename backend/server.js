const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors({
    origin: '*', // Permitir todos los orígenes (para desarrollo)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.static('public')); // Para servir archivos estáticos del frontend

// Importar rutas
const authRoutes = require('./routes/auth');
const iasRoutes = require('./routes/ias');
const categoriasRoutes = require('./routes/categorias');
const resenasRoutes = require('./routes/resenas');
const favoritosRoutes = require('./routes/favoritos');
const usuariosRoutes = require('./routes/usuarios');
const adminRoutes = require('./routes/admin');
const medallasRoutes = require('./routes/medallas');

// Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/ias', iasRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/resenas', resenasRoutes);
app.use('/api/favoritos', favoritosRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/medallas', medallasRoutes);

// Ruta raíz - información de la API
app.get('/', (req, res) => {
    res.json({
        nombre: 'Wiki IA - API Backend',
        version: '1.0.0',
        mensaje: '⚠️  Esta es la API del backend. Para acceder al frontend, usa el puerto 5500',
        endpoints: {
            health: '/api/health',
            auth: '/api/auth',
            ias: '/api/ias',
            categorias: '/api/categorias',
            resenas: '/api/resenas',
            favoritos: '/api/favoritos',
            usuarios: '/api/usuarios',
            admin: '/api/admin',
            medallas: '/api/medallas'
        },
        instrucciones: 'Abre index.html en el puerto 5500 para ver la aplicación web'
    });
});

// Ruta de prueba
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Wiki IA API funcionando correctamente',
        timestamp: new Date().toISOString()
    });
});

// Manejo de errores
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📚 API disponible en http://localhost:${PORT}/api`);
});
