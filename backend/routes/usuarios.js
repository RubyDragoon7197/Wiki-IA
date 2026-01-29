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

module.exports = router;
