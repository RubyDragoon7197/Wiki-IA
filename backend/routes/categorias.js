const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// GET /api/categorias - Obtener todas las categorías
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('categorias')
            .select('*')
            .eq('activa', true)
            .order('orden', { ascending: true });

        if (error) throw error;

        res.json(data);

    } catch (error) {
        console.error('Error al obtener categorías:', error);
        res.status(500).json({ error: 'Error al obtener categorías' });
    }
});

// GET /api/categorias/:slug - Obtener una categoría por slug
router.get('/:slug', async (req, res) => {
    try {
        const { slug } = req.params;

        const { data: categoria, error } = await supabase
            .from('categorias')
            .select('*')
            .eq('slug', slug)
            .eq('activa', true)
            .single();

        if (error || !categoria) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }

        // Obtener IAs de esta categoría
        const { data: ias } = await supabase
            .from('ias')
            .select(`
                *,
                usuarios (username, avatar)
            `)
            .eq('categoria_id', categoria.categoria_id)
            .eq('estado', 'aprobada')
            .eq('activa', true)
            .order('total_usos', { ascending: false });

        res.json({
            categoria,
            ias: ias || []
        });

    } catch (error) {
        console.error('Error al obtener categoría:', error);
        res.status(500).json({ error: 'Error al obtener categoría' });
    }
});

// GET /api/categorias/:slug/stats - Estadísticas de una categoría
router.get('/:slug/stats', async (req, res) => {
    try {
        const { slug } = req.params;

        const { data: categoria } = await supabase
            .from('categorias')
            .select('categoria_id')
            .eq('slug', slug)
            .single();

        if (!categoria) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }

        // Contar IAs en esta categoría
        const { count: totalIAs } = await supabase
            .from('ias')
            .select('*', { count: 'exact', head: true })
            .eq('categoria_id', categoria.categoria_id)
            .eq('estado', 'aprobada');

        // Obtener promedio de calificación
        const { data: stats } = await supabase
            .from('ias')
            .select('calificacion_promedio')
            .eq('categoria_id', categoria.categoria_id)
            .eq('estado', 'aprobada');

        const promedioCategoria = stats && stats.length > 0
            ? (stats.reduce((acc, ia) => acc + parseFloat(ia.calificacion_promedio), 0) / stats.length).toFixed(2)
            : 0;

        res.json({
            total_ias: totalIAs || 0,
            promedio_calificacion: promedioCategoria
        });

    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
});

module.exports = router;
