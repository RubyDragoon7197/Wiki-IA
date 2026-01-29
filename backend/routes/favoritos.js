const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { verificarToken } = require('../middleware/auth');

// GET /api/favoritos - Obtener favoritos del usuario
router.get('/', verificarToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('favoritos')
            .select(`
                favorito_id,
                fecha_agregado,
                ias (
                    ia_id,
                    nombre,
                    descripcion,
                    url,
                    imagen_logo,
                    calificacion_promedio,
                    total_usos,
                    categorias (nombre, slug, icono, color)
                )
            `)
            .eq('usuario_id', req.usuario.user_id)
            .order('fecha_agregado', { ascending: false });

        if (error) throw error;

        res.json(data);

    } catch (error) {
        console.error('Error al obtener favoritos:', error);
        res.status(500).json({ error: 'Error al obtener favoritos' });
    }
});

// POST /api/favoritos - Agregar a favoritos
router.post('/', verificarToken, async (req, res) => {
    try {
        const { ia_id } = req.body;

        if (!ia_id) {
            return res.status(400).json({ error: 'ID de IA requerido' });
        }

        // Verificar que la IA existe
        const { data: ia } = await supabase
            .from('ias')
            .select('ia_id, nombre')
            .eq('ia_id', ia_id)
            .eq('estado', 'aprobada')
            .single();

        if (!ia) {
            return res.status(404).json({ error: 'IA no encontrada' });
        }

        // Verificar si ya está en favoritos
        const { data: existente } = await supabase
            .from('favoritos')
            .select('favorito_id')
            .eq('ia_id', ia_id)
            .eq('usuario_id', req.usuario.user_id)
            .single();

        if (existente) {
            return res.status(400).json({ error: 'Esta IA ya está en tus favoritos' });
        }

        // Agregar a favoritos
        const { data, error } = await supabase
            .from('favoritos')
            .insert([{
                ia_id,
                usuario_id: req.usuario.user_id
            }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            mensaje: `${ia.nombre} agregada a favoritos`,
            favorito: data
        });

    } catch (error) {
        console.error('Error al agregar favorito:', error);
        res.status(500).json({ error: 'Error al agregar a favoritos' });
    }
});

// DELETE /api/favoritos/:iaId - Quitar de favoritos
router.delete('/:iaId', verificarToken, async (req, res) => {
    try {
        const { iaId } = req.params;

        const { error } = await supabase
            .from('favoritos')
            .delete()
            .eq('ia_id', iaId)
            .eq('usuario_id', req.usuario.user_id);

        if (error) throw error;

        res.json({ mensaje: 'Eliminado de favoritos' });

    } catch (error) {
        console.error('Error al eliminar favorito:', error);
        res.status(500).json({ error: 'Error al eliminar de favoritos' });
    }
});

// GET /api/favoritos/check/:iaId - Verificar si una IA está en favoritos
router.get('/check/:iaId', verificarToken, async (req, res) => {
    try {
        const { iaId } = req.params;

        const { data } = await supabase
            .from('favoritos')
            .select('favorito_id')
            .eq('ia_id', iaId)
            .eq('usuario_id', req.usuario.user_id)
            .single();

        res.json({ esFavorito: !!data });

    } catch (error) {
        res.json({ esFavorito: false });
    }
});

module.exports = router;
