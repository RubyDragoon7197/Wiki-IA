const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { verificarToken } = require('../middleware/auth');

// GET /api/medallas - Obtener todas las medallas disponibles
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('medallas')
            .select('*')
            .eq('activa', true)
            .order('costo_puntos', { ascending: true });

        if (error) throw error;

        res.json(data);

    } catch (error) {
        console.error('Error al obtener medallas:', error);
        res.status(500).json({ error: 'Error al obtener medallas' });
    }
});

// GET /api/medallas/mis-medallas - Obtener medallas del usuario
router.get('/mis-medallas', verificarToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('medallas_usuario')
            .select(`
                id,
                fecha_obtencion,
                medallas (*)
            `)
            .eq('usuario_id', req.usuario.user_id)
            .order('fecha_obtencion', { ascending: false });

        if (error) throw error;

        res.json(data);

    } catch (error) {
        console.error('Error al obtener mis medallas:', error);
        res.status(500).json({ error: 'Error al obtener medallas' });
    }
});

// POST /api/medallas/canjear/:medallaId - Canjear medalla
router.post('/canjear/:medallaId', verificarToken, async (req, res) => {
    try {
        const { medallaId } = req.params;

        // Llamar a la función de PostgreSQL
        const { data, error } = await supabase
            .rpc('canjear_medalla', {
                p_usuario_id: req.usuario.user_id,
                p_medalla_id: parseInt(medallaId)
            });

        if (error) throw error;

        // La función retorna un mensaje
        if (data === 'Medalla canjeada exitosamente') {
            // Obtener info de la medalla
            const { data: medalla } = await supabase
                .from('medallas')
                .select('nombre, imagen')
                .eq('medalla_id', medallaId)
                .single();

            res.json({
                mensaje: `¡Felicidades! Has obtenido la medalla "${medalla.nombre}"`,
                medalla
            });
        } else {
            res.status(400).json({ error: data });
        }

    } catch (error) {
        console.error('Error al canjear medalla:', error);
        res.status(500).json({ error: 'Error al canjear medalla' });
    }
});

// GET /api/medallas/niveles - Obtener todos los niveles
router.get('/niveles', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('niveles')
            .select('*')
            .order('nivel', { ascending: true });

        if (error) throw error;

        res.json(data);

    } catch (error) {
        console.error('Error al obtener niveles:', error);
        res.status(500).json({ error: 'Error al obtener niveles' });
    }
});

module.exports = router;
