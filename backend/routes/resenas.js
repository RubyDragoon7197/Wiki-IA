const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { verificarToken } = require('../middleware/auth');

// GET /api/resenas/ia/:iaId - Obtener reseñas de una IA
router.get('/ia/:iaId', async (req, res) => {
    try {
        const { iaId } = req.params;

        const { data, error } = await supabase
            .from('resenas')
            .select(`
                *,
                usuarios (username, avatar, nivel)
            `)
            .eq('ia_id', iaId)
            .eq('activo', true)
            .order('fecha', { ascending: false });

        if (error) throw error;

        res.json(data);

    } catch (error) {
        console.error('Error al obtener reseñas:', error);
        res.status(500).json({ error: 'Error al obtener reseñas' });
    }
});

// POST /api/resenas - Crear reseña (requiere autenticación)
router.post('/', verificarToken, async (req, res) => {
    try {
        const { ia_id, puntuacion, comentario } = req.body;

        // Validaciones
        if (!ia_id || !puntuacion) {
            return res.status(400).json({ error: 'IA y puntuación son requeridos' });
        }

        if (puntuacion < 1 || puntuacion > 5) {
            return res.status(400).json({ error: 'La puntuación debe ser entre 1 y 5' });
        }

        // Verificar que la IA existe y está aprobada
        const { data: ia } = await supabase
            .from('ias')
            .select('ia_id, nombre')
            .eq('ia_id', ia_id)
            .eq('estado', 'aprobada')
            .single();

        if (!ia) {
            return res.status(404).json({ error: 'IA no encontrada' });
        }

        // Verificar si ya dejó una reseña
        const { data: existente } = await supabase
            .from('resenas')
            .select('resena_id')
            .eq('ia_id', ia_id)
            .eq('usuario_id', req.usuario.user_id)
            .single();

        if (existente) {
            return res.status(400).json({ error: 'Ya dejaste una reseña para esta IA' });
        }

        // Crear reseña
        const { data: nuevaResena, error } = await supabase
            .from('resenas')
            .insert([{
                ia_id,
                usuario_id: req.usuario.user_id,
                puntuacion,
                comentario: comentario || null
            }])
            .select()
            .single();

        if (error) throw error;

        // Dar puntos al usuario (10 puntos por reseña)
        await supabase.rpc('dar_puntos', {
            p_usuario_id: req.usuario.user_id,
            p_puntos: 10,
            p_tipo: 'resena',
            p_referencia_id: nuevaResena.resena_id,
            p_descripcion: `Reseña en: ${ia.nombre}`
        });

        // Actualizar calificación promedio de la IA
        await supabase.rpc('actualizar_calificacion_ia', { p_ia_id: ia_id });

        res.status(201).json({
            mensaje: '¡Reseña publicada! +10 puntos',
            resena: nuevaResena
        });

    } catch (error) {
        console.error('Error al crear reseña:', error);
        res.status(500).json({ error: 'Error al crear reseña' });
    }
});

// PUT /api/resenas/:id - Editar reseña propia
router.put('/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { puntuacion, comentario } = req.body;

        // Verificar que la reseña pertenece al usuario
        const { data: resena } = await supabase
            .from('resenas')
            .select('*')
            .eq('resena_id', id)
            .eq('usuario_id', req.usuario.user_id)
            .single();

        if (!resena) {
            return res.status(404).json({ error: 'Reseña no encontrada o no tienes permiso' });
        }

        // Actualizar
        const updates = { editado: true };
        if (puntuacion) updates.puntuacion = puntuacion;
        if (comentario !== undefined) updates.comentario = comentario;

        const { data, error } = await supabase
            .from('resenas')
            .update(updates)
            .eq('resena_id', id)
            .select()
            .single();

        if (error) throw error;

        // Actualizar calificación promedio
        await supabase.rpc('actualizar_calificacion_ia', { p_ia_id: resena.ia_id });

        res.json({ mensaje: 'Reseña actualizada', resena: data });

    } catch (error) {
        console.error('Error al actualizar reseña:', error);
        res.status(500).json({ error: 'Error al actualizar reseña' });
    }
});

// DELETE /api/resenas/:id - Eliminar reseña propia
router.delete('/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que la reseña pertenece al usuario
        const { data: resena } = await supabase
            .from('resenas')
            .select('*')
            .eq('resena_id', id)
            .eq('usuario_id', req.usuario.user_id)
            .single();

        if (!resena) {
            return res.status(404).json({ error: 'Reseña no encontrada o no tienes permiso' });
        }

        // Eliminar (soft delete)
        await supabase
            .from('resenas')
            .update({ activo: false })
            .eq('resena_id', id);

        // Actualizar calificación promedio
        await supabase.rpc('actualizar_calificacion_ia', { p_ia_id: resena.ia_id });

        res.json({ mensaje: 'Reseña eliminada' });

    } catch (error) {
        console.error('Error al eliminar reseña:', error);
        res.status(500).json({ error: 'Error al eliminar reseña' });
    }
});

module.exports = router;
