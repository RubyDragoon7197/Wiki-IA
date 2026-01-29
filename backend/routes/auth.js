const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const supabase = require('../config/supabase');
const { generarToken, verificarToken } = require('../middleware/auth');

// POST /api/auth/registro - Registrar nuevo usuario
router.post('/registro', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validaciones
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Todos los campos son requeridos' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
        }

        // Verificar si el usuario ya existe
        const { data: existente } = await supabase
            .from('usuarios')
            .select('user_id')
            .or(`email.eq.${email},username.eq.${username}`)
            .single();

        if (existente) {
            return res.status(400).json({ error: 'El email o nombre de usuario ya está registrado' });
        }

        // Encriptar contraseña
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Crear usuario
        const { data: nuevoUsuario, error } = await supabase
            .from('usuarios')
            .insert([{ username, email, password_hash }])
            .select()
            .single();

        if (error) throw error;

        // Generar token
        const token = generarToken(nuevoUsuario);

        res.status(201).json({
            mensaje: 'Usuario registrado exitosamente',
            token,
            usuario: {
                user_id: nuevoUsuario.user_id,
                username: nuevoUsuario.username,
                email: nuevoUsuario.email,
                rol: nuevoUsuario.rol,
                puntos_totales: nuevoUsuario.puntos_totales,
                nivel: nuevoUsuario.nivel
            }
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error al registrar usuario' });
    }
});

// POST /api/auth/login - Iniciar sesión
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validaciones
        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son requeridos' });
        }

        // Buscar usuario
        const { data: usuario, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !usuario) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Verificar si está baneado
        if (usuario.baneado) {
            return res.status(403).json({ error: 'Tu cuenta ha sido suspendida', razon: usuario.razon_baneo });
        }

        // Verificar contraseña
        const passwordValida = await bcrypt.compare(password, usuario.password_hash);
        if (!passwordValida) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Actualizar última actividad
        await supabase
            .from('usuarios')
            .update({ ultima_actividad: new Date().toISOString() })
            .eq('user_id', usuario.user_id);

        // Generar token
        const token = generarToken(usuario);

        res.json({
            mensaje: 'Inicio de sesión exitoso',
            token,
            usuario: {
                user_id: usuario.user_id,
                username: usuario.username,
                email: usuario.email,
                rol: usuario.rol,
                puntos_totales: usuario.puntos_totales,
                nivel: usuario.nivel,
                avatar: usuario.avatar
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
});

// GET /api/auth/perfil - Obtener perfil del usuario autenticado
router.get('/perfil', verificarToken, async (req, res) => {
    try {
        const { data: usuario, error } = await supabase
            .from('usuarios')
            .select(`
                user_id,
                username,
                email,
                rol,
                puntos_totales,
                nivel,
                avatar,
                biografia,
                fecha_registro,
                ultima_actividad
            `)
            .eq('user_id', req.usuario.user_id)
            .single();

        if (error) throw error;

        // Obtener nivel info
        const { data: nivelInfo } = await supabase
            .from('niveles')
            .select('nombre, insignia')
            .eq('nivel', usuario.nivel)
            .single();

        // Obtener medallas del usuario
        const { data: medallas } = await supabase
            .from('medallas_usuario')
            .select(`
                fecha_obtencion,
                medallas (nombre, descripcion, imagen)
            `)
            .eq('usuario_id', req.usuario.user_id);

        res.json({
            ...usuario,
            nivel_info: nivelInfo,
            medallas: medallas || []
        });

    } catch (error) {
        console.error('Error al obtener perfil:', error);
        res.status(500).json({ error: 'Error al obtener perfil' });
    }
});

// PUT /api/auth/perfil - Actualizar perfil
router.put('/perfil', verificarToken, async (req, res) => {
    try {
        const { username, biografia, avatar } = req.body;
        const updates = {};

        if (username) updates.username = username;
        if (biografia !== undefined) updates.biografia = biografia;
        if (avatar) updates.avatar = avatar;

        const { data, error } = await supabase
            .from('usuarios')
            .update(updates)
            .eq('user_id', req.usuario.user_id)
            .select()
            .single();

        if (error) throw error;

        res.json({ mensaje: 'Perfil actualizado', usuario: data });

    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        res.status(500).json({ error: 'Error al actualizar perfil' });
    }
});

module.exports = router;
