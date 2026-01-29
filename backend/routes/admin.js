const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { verificarToken, verificarAdmin } = require('../middleware/auth');

// Todas las rutas de admin requieren autenticación y rol admin
router.use(verificarToken);
router.use(verificarAdmin);

// GET /api/admin/stats - Estadísticas del dashboard
router.get('/stats', async (req, res) => {
    try {
        // Total usuarios
        const { count: totalUsuarios } = await supabase
            .from('usuarios')
            .select('*', { count: 'exact', head: true })
            .eq('activo', true);

        // IAs pendientes
        const { count: iasPendientes } = await supabase
            .from('ias')
            .select('*', { count: 'exact', head: true })
            .eq('estado', 'pendiente');

        // IAs aprobadas
        const { count: iasAprobadas } = await supabase
            .from('ias')
            .select('*', { count: 'exact', head: true })
            .eq('estado', 'aprobada');

        // IAs rechazadas
        const { count: iasRechazadas } = await supabase
            .from('ias')
            .select('*', { count: 'exact', head: true })
            .eq('estado', 'rechazada');

        // Total visitas (suma de total_usos)
        const { data: visitasData } = await supabase
            .from('ias')
            .select('total_usos')
            .eq('estado', 'aprobada');
        
        const totalVisitas = visitasData?.reduce((acc, ia) => acc + ia.total_usos, 0) || 0;

        // Total reseñas
        const { count: totalResenas } = await supabase
            .from('resenas')
            .select('*', { count: 'exact', head: true })
            .eq('activo', true);

        res.json({
            totalUsuarios: totalUsuarios || 0,
            iasPendientes: iasPendientes || 0,
            iasAprobadas: iasAprobadas || 0,
            iasRechazadas: iasRechazadas || 0,
            totalVisitas,
            totalResenas: totalResenas || 0
        });

    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
});

// GET /api/admin/ias/pendientes - Obtener IAs pendientes
router.get('/ias/pendientes', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('ias')
            .select(`
                *,
                categorias (nombre, slug),
                usuarios (username, email, puntos_totales)
            `)
            .eq('estado', 'pendiente')
            .order('fecha_publicacion', { ascending: true });

        if (error) throw error;

        res.json(data);

    } catch (error) {
        console.error('Error al obtener IAs pendientes:', error);
        res.status(500).json({ error: 'Error al obtener IAs pendientes' });
    }
});

// PUT /api/admin/ias/:id/aprobar - Aprobar una IA
router.put('/ias/:id/aprobar', async (req, res) => {
    try {
        const { id } = req.params;

        // Obtener la IA
        const { data: ia } = await supabase
            .from('ias')
            .select('*, usuarios(username)')
            .eq('ia_id', id)
            .single();

        if (!ia) {
            return res.status(404).json({ error: 'IA no encontrada' });
        }

        if (ia.estado !== 'pendiente') {
            return res.status(400).json({ error: 'Esta IA ya fue procesada' });
        }

        // Aprobar
        const { error } = await supabase
            .from('ias')
            .update({
                estado: 'aprobada',
                moderada_por: req.usuario.user_id,
                fecha_moderacion: new Date().toISOString()
            })
            .eq('ia_id', id);

        if (error) throw error;

        // Dar puntos al usuario (50 puntos por IA aprobada)
        await supabase.rpc('dar_puntos', {
            p_usuario_id: ia.usuario_id,
            p_puntos: 50,
            p_tipo: 'publicar_ia',
            p_referencia_id: parseInt(id),
            p_descripcion: `IA aprobada: ${ia.nombre}`
        });

        // Registrar en historial
        await supabase
            .from('historial_moderacion')
            .insert([{
                ia_id: parseInt(id),
                admin_id: req.usuario.user_id,
                accion: 'aprobar',
                estado_anterior: 'pendiente',
                estado_nuevo: 'aprobada'
            }]);

        res.json({ 
            mensaje: `IA "${ia.nombre}" aprobada. El usuario ${ia.usuarios.username} recibió 50 puntos.` 
        });

    } catch (error) {
        console.error('Error al aprobar IA:', error);
        res.status(500).json({ error: 'Error al aprobar IA' });
    }
});

// PUT /api/admin/ias/:id/rechazar - Rechazar una IA
router.put('/ias/:id/rechazar', async (req, res) => {
    try {
        const { id } = req.params;
        const { razon } = req.body;

        if (!razon) {
            return res.status(400).json({ error: 'Debes proporcionar una razón del rechazo' });
        }

        // Obtener la IA
        const { data: ia } = await supabase
            .from('ias')
            .select('*')
            .eq('ia_id', id)
            .single();

        if (!ia) {
            return res.status(404).json({ error: 'IA no encontrada' });
        }

        if (ia.estado !== 'pendiente') {
            return res.status(400).json({ error: 'Esta IA ya fue procesada' });
        }

        // Rechazar
        const { error } = await supabase
            .from('ias')
            .update({
                estado: 'rechazada',
                moderada_por: req.usuario.user_id,
                fecha_moderacion: new Date().toISOString(),
                razon_rechazo: razon
            })
            .eq('ia_id', id);

        if (error) throw error;

        // Registrar en historial
        await supabase
            .from('historial_moderacion')
            .insert([{
                ia_id: parseInt(id),
                admin_id: req.usuario.user_id,
                accion: 'rechazar',
                estado_anterior: 'pendiente',
                estado_nuevo: 'rechazada',
                comentario: razon
            }]);

        res.json({ mensaje: `IA "${ia.nombre}" rechazada.` });

    } catch (error) {
        console.error('Error al rechazar IA:', error);
        res.status(500).json({ error: 'Error al rechazar IA' });
    }
});

// PUT /api/admin/ias/:id/categoria - Cambiar categoría de una IA
router.put('/ias/:id/categoria', async (req, res) => {
    try {
        const { id } = req.params;
        const { categoria_id } = req.body;

        if (!categoria_id) {
            return res.status(400).json({ error: 'Categoría requerida' });
        }

        // Verificar que la categoría existe
        const { data: categoria } = await supabase
            .from('categorias')
            .select('nombre')
            .eq('categoria_id', categoria_id)
            .single();

        if (!categoria) {
            return res.status(400).json({ error: 'Categoría no válida' });
        }

        // Obtener categoría anterior
        const { data: ia } = await supabase
            .from('ias')
            .select('categoria_id, nombre')
            .eq('ia_id', id)
            .single();

        // Actualizar
        const { error } = await supabase
            .from('ias')
            .update({ 
                categoria_id,
                fecha_actualizacion: new Date().toISOString()
            })
            .eq('ia_id', id);

        if (error) throw error;

        res.json({ mensaje: `Categoría de "${ia.nombre}" cambiada a "${categoria.nombre}"` });

    } catch (error) {
        console.error('Error al cambiar categoría:', error);
        res.status(500).json({ error: 'Error al cambiar categoría' });
    }
});

// GET /api/admin/ias - Obtener todas las IAs (para admin)
router.get('/ias', async (req, res) => {
    try {
        const { estado, limite = 50 } = req.query;

        let query = supabase
            .from('ias')
            .select(`
                *,
                categorias (nombre, slug),
                usuarios (username, email)
            `)
            .order('fecha_publicacion', { ascending: false })
            .limit(limite);

        if (estado) {
            query = query.eq('estado', estado);
        }

        const { data, error } = await query;

        if (error) throw error;

        res.json(data);

    } catch (error) {
        console.error('Error al obtener IAs:', error);
        res.status(500).json({ error: 'Error al obtener IAs' });
    }
});

// GET /api/admin/usuarios - Obtener todos los usuarios
router.get('/usuarios', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('usuarios')
            .select(`
                user_id,
                username,
                email,
                rol,
                puntos_totales,
                nivel,
                fecha_registro,
                ultima_actividad,
                activo,
                baneado
            `)
            .order('puntos_totales', { ascending: false });

        if (error) throw error;

        res.json(data);

    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
});

// PUT /api/admin/usuarios/:id/banear - Banear usuario
router.put('/usuarios/:id/banear', async (req, res) => {
    try {
        const { id } = req.params;
        const { razon } = req.body;

        const { error } = await supabase
            .from('usuarios')
            .update({
                baneado: true,
                razon_baneo: razon || 'Violación de términos de uso'
            })
            .eq('user_id', id);

        if (error) throw error;

        res.json({ mensaje: 'Usuario baneado' });

    } catch (error) {
        console.error('Error al banear usuario:', error);
        res.status(500).json({ error: 'Error al banear usuario' });
    }
});

// PUT /api/admin/usuarios/:id/desbanear - Desbanear usuario
router.put('/usuarios/:id/desbanear', async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('usuarios')
            .update({
                baneado: false,
                razon_baneo: null
            })
            .eq('user_id', id);

        if (error) throw error;

        res.json({ mensaje: 'Usuario desbaneado' });

    } catch (error) {
        console.error('Error al desbanear usuario:', error);
        res.status(500).json({ error: 'Error al desbanear usuario' });
    }
});

// GET /api/admin/historial - Obtener historial de moderación
router.get('/historial', async (req, res) => {
    try {
        const { limite = 50 } = req.query;

        const { data, error } = await supabase
            .from('historial_moderacion')
            .select(`
                *,
                ias (nombre),
                usuarios:admin_id (username)
            `)
            .order('fecha', { ascending: false })
            .limit(limite);

        if (error) throw error;

        res.json(data);

    } catch (error) {
        console.error('Error al obtener historial:', error);
        res.status(500).json({ error: 'Error al obtener historial' });
    }
});

// GET /api/admin/actividad-reciente - Actividad reciente del sistema
router.get('/actividad-reciente', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('actividades')
            .select(`
                *,
                usuarios (username)
            `)
            .order('fecha', { ascending: false })
            .limit(20);

        if (error) throw error;

        res.json(data);

    } catch (error) {
        console.error('Error al obtener actividad:', error);
        res.status(500).json({ error: 'Error al obtener actividad' });
    }
});

module.exports = router;
