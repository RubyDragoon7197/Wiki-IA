const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { verificarToken } = require('../middleware/auth');

// GET /api/ias - Obtener todas las IAs aprobadas
router.get('/', async (req, res) => {
    try {
        const { categoria, orden, limite = 50 } = req.query;

        let query = supabase
            .from('ias')
            .select(`
                *,
                categorias (nombre, slug, icono, color),
                usuarios (username, avatar)
            `)
            .eq('estado', 'aprobada')
            .eq('activa', true)
            .limit(limite);

        // Filtrar por categoría
        if (categoria) {
            const { data: cat } = await supabase
                .from('categorias')
                .select('categoria_id')
                .eq('slug', categoria)
                .single();
            
            if (cat) {
                query = query.eq('categoria_id', cat.categoria_id);
            }
        }

        // Ordenar
        switch (orden) {
            case 'recientes':
                query = query.order('fecha_publicacion', { ascending: false });
                break;
            case 'mejor-calificadas':
                query = query.order('calificacion_promedio', { ascending: false });
                break;
            case 'mas-usadas':
            default:
                query = query.order('total_usos', { ascending: false });
                break;
        }

        const { data, error } = await query;

        if (error) throw error;

        res.json(data);

    } catch (error) {
        console.error('Error al obtener IAs:', error);
        res.status(500).json({ error: 'Error al obtener IAs' });
    }
});

// GET /api/ias/:id - Obtener una IA específica
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('ias')
            .select(`
                *,
                categorias (nombre, slug, icono, color),
                usuarios (username, avatar)
            `)
            .eq('ia_id', id)
            .eq('estado', 'aprobada')
            .single();

        if (error || !data) {
            return res.status(404).json({ error: 'IA no encontrada' });
        }

        // Incrementar contador de usos
        await supabase
            .from('ias')
            .update({ total_usos: data.total_usos + 1 })
            .eq('ia_id', id);

        res.json(data);

    } catch (error) {
        console.error('Error al obtener IA:', error);
        res.status(500).json({ error: 'Error al obtener IA' });
    }
});

// POST /api/ias - Publicar nueva IA (requiere autenticación)
router.post('/', verificarToken, async (req, res) => {
    try {
        const { nombre, descripcion, url, categoria_id, imagen_logo } = req.body;

        // Validaciones
        if (!nombre || !descripcion || !url || !categoria_id) {
            return res.status(400).json({ error: 'Nombre, descripción, URL y categoría son requeridos' });
        }

        // Verificar que la categoría existe
        const { data: categoria } = await supabase
            .from('categorias')
            .select('categoria_id')
            .eq('categoria_id', categoria_id)
            .single();

        if (!categoria) {
            return res.status(400).json({ error: 'Categoría no válida' });
        }

        // Crear la IA (estado pendiente por defecto)
        const { data: nuevaIA, error } = await supabase
            .from('ias')
            .insert([{
                nombre,
                descripcion,
                url,
                categoria_id,
                usuario_id: req.usuario.user_id,
                imagen_logo: imagen_logo || null,
                estado: 'pendiente'
            }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            mensaje: 'IA enviada para revisión. Recibirás puntos cuando sea aprobada.',
            ia: nuevaIA
        });

    } catch (error) {
        console.error('Error al publicar IA:', error);
        res.status(500).json({ error: 'Error al publicar IA' });
    }
});

// GET /api/ias/usuario/mis-ias - Obtener IAs del usuario autenticado
router.get('/usuario/mis-ias', verificarToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('ias')
            .select(`
                *,
                categorias (nombre, slug, icono)
            `)
            .eq('usuario_id', req.usuario.user_id)
            .order('fecha_publicacion', { ascending: false });

        if (error) throw error;

        res.json(data);

    } catch (error) {
        console.error('Error al obtener mis IAs:', error);
        res.status(500).json({ error: 'Error al obtener tus IAs' });
    }
});

// GET /api/ias/buscar/:termino - Buscar IAs
router.get('/buscar/:termino', async (req, res) => {
    try {
        const { termino } = req.params;

        const { data, error } = await supabase
            .from('ias')
            .select(`
                *,
                categorias (nombre, slug, icono, color)
            `)
            .eq('estado', 'aprobada')
            .eq('activa', true)
            .or(`nombre.ilike.%${termino}%,descripcion.ilike.%${termino}%`)
            .limit(20);

        if (error) throw error;

        res.json(data);

    } catch (error) {
        console.error('Error en búsqueda:', error);
        res.status(500).json({ error: 'Error en la búsqueda' });
    }
});

module.exports = router;
