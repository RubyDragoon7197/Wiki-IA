const jwt = require('jsonwebtoken');
require('dotenv').config();

// Verificar token JWT
const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Token inválido o expirado.' });
    }
};

// Verificar si es admin
const verificarAdmin = (req, res, next) => {
    if (req.usuario.rol !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador.' });
    }
    next();
};

// Generar token JWT
const generarToken = (usuario) => {
    return jwt.sign(
        { 
            user_id: usuario.user_id, 
            username: usuario.username,
            email: usuario.email,
            rol: usuario.rol 
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
};

module.exports = { verificarToken, verificarAdmin, generarToken };
