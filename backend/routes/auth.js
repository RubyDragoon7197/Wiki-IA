const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const supabase = require('../config/supabase');
const { generarToken, verificarToken } = require('../middleware/auth');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

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

        // Generar token de verificación
        const tokenVerificacion = crypto.randomBytes(32).toString('hex');
        const tokenExpira = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

        // Crear usuario
        const { data: nuevoUsuario, error } = await supabase
            .from('usuarios')
            .insert([{ 
                username, 
                email, 
                password_hash,
                email_verificado: false,
                token_verificacion: tokenVerificacion,
                token_verificacion_expira: tokenExpira.toISOString()
            }])
            .select()
            .single();

        if (error) throw error;

        // Enviar email de verificación
        const urlVerificacion = `${req.headers.origin || 'http://localhost:5500'}/pages/verificar-email.html?token=${tokenVerificacion}`;
        
        await resend.emails.send({
            from: 'Wiki IA <noreply@wiki-ia.xyz>',
            to: email,
            subject: '✉️ Verifica tu cuenta en Wiki IA',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #667eea; text-align: center;">¡Bienvenido a Wiki IA!</h1>
                    <p>Hola <strong>${username}</strong>,</p>
                    <p>Gracias por registrarte en Wiki IA. Para completar tu registro y activar tu cuenta, por favor verifica tu email haciendo clic en el siguiente botón:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${urlVerificacion}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block;">
                            Verificar mi cuenta
                        </a>
                    </div>
                    <p style="color: #666; font-size: 14px;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
                    <p style="color: #667eea; word-break: break-all; font-size: 14px;">${urlVerificacion}</p>
                    <p style="color: #666; font-size: 14px;">Este enlace expira en 24 horas.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    <p style="color: #999; font-size: 12px; text-align: center;">Si no creaste esta cuenta, puedes ignorar este mensaje.</p>
                </div>
            `
        });

        // Generar token de sesión
        const token = generarToken(nuevoUsuario);

        res.status(201).json({
            mensaje: 'Usuario registrado. Revisa tu email para verificar tu cuenta.',
            token,
            usuario: {
                user_id: nuevoUsuario.user_id,
                username: nuevoUsuario.username,
                email: nuevoUsuario.email,
                rol: nuevoUsuario.rol,
                puntos_totales: nuevoUsuario.puntos_totales,
                nivel: nuevoUsuario.nivel,
                email_verificado: false
            }
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error al registrar usuario' });
    }
});

// GET /api/auth/verificar-email/:token - Verificar email
router.get('/verificar-email/:token', async (req, res) => {
    try {
        const { token } = req.params;

        // Buscar usuario con ese token
        const { data: usuario, error } = await supabase
            .from('usuarios')
            .select('user_id, username, email, token_verificacion_expira, email_verificado')
            .eq('token_verificacion', token)
            .single();

        if (error || !usuario) {
            return res.status(400).json({ error: 'Token inválido o expirado' });
        }

        // Verificar si ya está verificado
        if (usuario.email_verificado) {
            return res.json({ mensaje: 'Tu email ya está verificado', ya_verificado: true });
        }

        // Verificar si el token expiró
        if (new Date() > new Date(usuario.token_verificacion_expira)) {
            return res.status(400).json({ error: 'El token ha expirado. Solicita un nuevo enlace de verificación.' });
        }

        // Marcar como verificado
        await supabase
            .from('usuarios')
            .update({ 
                email_verificado: true,
                token_verificacion: null,
                token_verificacion_expira: null
            })
            .eq('user_id', usuario.user_id);

        res.json({ 
            mensaje: '¡Email verificado correctamente!',
            verificado: true 
        });

    } catch (error) {
        console.error('Error al verificar email:', error);
        res.status(500).json({ error: 'Error al verificar email' });
    }
});

// POST /api/auth/reenviar-verificacion - Reenviar email de verificación
router.post('/reenviar-verificacion', verificarToken, async (req, res) => {
    try {
        // Obtener usuario
        const { data: usuario, error } = await supabase
            .from('usuarios')
            .select('user_id, username, email, email_verificado')
            .eq('user_id', req.usuario.user_id)
            .single();

        if (error || !usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        if (usuario.email_verificado) {
            return res.json({ mensaje: 'Tu email ya está verificado' });
        }

        // Generar nuevo token
        const tokenVerificacion = crypto.randomBytes(32).toString('hex');
        const tokenExpira = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await supabase
            .from('usuarios')
            .update({ 
                token_verificacion: tokenVerificacion,
                token_verificacion_expira: tokenExpira.toISOString()
            })
            .eq('user_id', usuario.user_id);

        // Enviar email
        const urlVerificacion = `${req.headers.origin || 'http://localhost:5500'}/pages/verificar-email.html?token=${tokenVerificacion}`;
        
        await resend.emails.send({
            from: 'Wiki IA <onboarding@resend.dev>',
            to: usuario.email,
            subject: '✉️ Verifica tu cuenta en Wiki IA',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #667eea; text-align: center;">Verifica tu cuenta</h1>
                    <p>Hola <strong>${usuario.username}</strong>,</p>
                    <p>Solicitaste un nuevo enlace de verificación. Haz clic en el siguiente botón para verificar tu email:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${urlVerificacion}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block;">
                            Verificar mi cuenta
                        </a>
                    </div>
                    <p style="color: #666; font-size: 14px;">Este enlace expira en 24 horas.</p>
                </div>
            `
        });

        res.json({ mensaje: 'Email de verificación enviado' });

    } catch (error) {
        console.error('Error al reenviar verificación:', error);
        res.status(500).json({ error: 'Error al reenviar verificación' });
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
                avatar: usuario.avatar,
                email_verificado: usuario.email_verificado
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
                ultima_actividad,
                email_verificado
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