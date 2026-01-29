const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
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
