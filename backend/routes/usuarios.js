const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { verificarToken } = require('../middleware/auth');

// GET /api/usuarios/ranking - Obtener ranking de usuarios
router.get('/ranking', async (req, res) => {
    try {
        const { limite = 10 } = req.query;

        const { data, error } = await supabase
            .from('usuarios')
            .select(`
                user_id,
                username,
                avatar,
                puntos_totales,
                nivel
            `)
            .eq('activo', true)
            .eq('baneado', false)
            .order('puntos_totales', { ascending: false })
            .limit(limite);

        if (error) throw error;

        // Agregar info de nivel
        const ranking = await Promise.all(data.map(async (usuario, index) => {
            const { data: nivelInfo } = await supabase
                .from('niveles')
                .select('nombre, insignia')
                .eq('nivel', usuario.nivel)
                .single();

            return {
                posicion: index + 1,
                ...usuario,
                nivel_info: nivelInfo
            };
        }));

        res.json(ranking);

    } catch (error) {
        console.error('Error al obtener ranking:', error);
        res.status(500).json({ error: 'Error al obtener ranking' });
    }
});

// GET /api/usuarios/:username - Obtener perfil publico de un usuario
router.get('/:username', async (req, res) => {
    try {
        const { username } = req.params;

        const { data: usuario, error } = await supabase
            .from('usuarios')
            .select(`
                user_id,
                username,
                avatar,
                biografia,
                puntos_totales,
                nivel,
                fecha_registro
            `)
            .eq('username', username)
            .eq('activo', true)
            .eq('baneado', false)
            .single();

        if (error || !usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Obtener info del nivel
        const { data: nivelInfo } = await supabase
            .from('niveles')
            .select('nombre, insignia, beneficios')
            .eq('nivel', usuario.nivel)
            .single();

        // Obtener medallas del usuario
        const { data: medallas } = await supabase
            .from('medallas_usuario')
            .select(`
                fecha_obtencion,
                medallas (nombre, descripcion, imagen)
            `)
            .eq('usuario_id', usuario.user_id);

        // Contar IAs publicadas (aprobadas)
        const { count: iasPublicadas } = await supabase
            .from('ias')
            .select('*', { count: 'exact', head: true })
            .eq('usuario_id', usuario.user_id)
            .eq('estado', 'aprobada');

        // Contar resenas
        const { count: totalResenas } = await supabase
            .from('resenas')
            .select('*', { count: 'exact', head: true })
            .eq('usuario_id', usuario.user_id)
            .eq('activo', true);

        res.json({
            ...usuario,
            nivel_info: nivelInfo,
            medallas: medallas || [],
            estadisticas: {
                ias_publicadas: iasPublicadas || 0,
                resenas_escritas: totalResenas || 0
            }
        });

    } catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({ error: 'Error al obtener usuario' });
    }
});

// GET /api/usuarios/:username/ias - Obtener IAs de un usuario
router.get('/:username/ias', async (req, res) => {
    try {
        const { username } = req.params;

        // Obtener usuario
        const { data: usuario } = await supabase
            .from('usuarios')
            .select('user_id')
            .eq('username', username)
            .single();

        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Obtener IAs aprobadas del usuario
        const { data, error } = await supabase
            .from('ias')
            .select(`
                *,
                categorias (nombre, slug, icono, color)
            `)
            .eq('usuario_id', usuario.user_id)
            .eq('estado', 'aprobada')
            .order('fecha_publicacion', { ascending: false });

        if (error) throw error;

        res.json(data);

    } catch (error) {
        console.error('Error al obtener IAs del usuario:', error);
        res.status(500).json({ error: 'Error al obtener IAs' });
    }
});

// GET /api/usuarios/:username/actividad - Obtener actividad reciente
router.get('/:username/actividad', async (req, res) => {
    try {
        const { username } = req.params;
        const { limite = 20 } = req.query;

        // Obtener usuario
        const { data: usuario } = await supabase
            .from('usuarios')
            .select('user_id')
            .eq('username', username)
            .single();

        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Obtener actividades
        const { data, error } = await supabase
            .from('actividades')
            .select('*')
            .eq('usuario_id', usuario.user_id)
            .order('fecha', { ascending: false })
            .limit(limite);

        if (error) throw error;

        res.json(data);

    } catch (error) {
        console.error('Error al obtener actividad:', error);
        res.status(500).json({ error: 'Error al obtener actividad' });
    }
});

// GET /api/usuarios/:username/resenas - Obtener reseñas de un usuario
router.get('/:username/resenas', async (req, res) => {
    try {
        const { username } = req.params;

        // Obtener usuario
        const { data: usuario } = await supabase
            .from('usuarios')
            .select('user_id')
            .eq('username', username)
            .single();

        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Obtener reseñas del usuario
        const { data, error } = await supabase
            .from('resenas')
            .select(`
                *,
                ias (ia_id, nombre, imagen_logo)
            `)
            .eq('usuario_id', usuario.user_id)
            .eq('activo', true)
            .order('fecha', { ascending: false });

        if (error) throw error;

        res.json(data || []);

    } catch (error) {
        console.error('Error al obtener reseñas del usuario:', error);
        res.status(500).json({ error: 'Error al obtener reseñas' });
    }
});

// PUT /api/usuarios/perfil - Actualizar perfil del usuario
router.put('/perfil', verificarToken, async (req, res) => {
    try {
        const { username, biografia, avatar } = req.body;
        const userId = req.usuario.user_id;

        // Validar username
        if (username) {
            if (username.length < 3) {
                return res.status(400).json({ error: 'El nombre debe tener al menos 3 caracteres' });
            }

            // Verificar que no exista otro usuario con ese nombre
            const { data: existente } = await supabase
                .from('usuarios')
                .select('user_id')
                .eq('username', username)
                .neq('user_id', userId)
                .single();

            if (existente) {
                return res.status(400).json({ error: 'Ese nombre de usuario ya está en uso' });
            }
        }

        // Construir objeto de actualización
        const updateData = {};
        if (username) updateData.username = username;
        if (biografia !== undefined) updateData.biografia = biografia;
        if (avatar !== undefined) updateData.avatar = avatar;

        // Actualizar
        const { data, error } = await supabase
            .from('usuarios')
            .update(updateData)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;

        res.json({
            mensaje: 'Perfil actualizado',
            usuario: data
        });

    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        res.status(500).json({ error: 'Error al actualizar perfil' });
    }
});

module.exports = router;
