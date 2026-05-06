const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// POST /api/password/forgot - Solicitar recuperación
router.post('/forgot', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email es requerido' });
        }

        // Buscar usuario
        const { data: usuario } = await supabase
            .from('usuarios')
            .select('user_id, username, email')
            .eq('email', email.toLowerCase())
            .single();

        // Siempre responder igual (seguridad)
        if (!usuario) {
            return res.json({ mensaje: 'Si el email existe, recibirás un enlace de recuperación' });
        }

        // Generar token
        const token = crypto.randomBytes(32).toString('hex');
        const expira = new Date(Date.now() + 3600000); // 1 hora

        // Guardar token
        await supabase
            .from('usuarios')
            .update({ 
                reset_token: token, 
                reset_expira: expira.toISOString() 
            })
            .eq('user_id', usuario.user_id);

        // URL de recuperación (ajusta el dominio)
        const resetUrl = `${req.headers.origin || 'http://localhost:5500'}/pages/reset-password.html?token=${token}`;

        // Enviar email
        await resend.emails.send({
            from: 'Wiki IA <noreply@wiki-ia.xyz>',
            to: usuario.email,
            subject: 'Recupera tu contraseña - Wiki IA',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #667eea;">Hola ${usuario.username} 👋</h2>
                    <p>Recibimos una solicitud para restablecer tu contraseña en Wiki IA.</p>
                    <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
                    <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0;">
                        Restablecer Contraseña
                    </a>
                    <p style="color: #666; font-size: 14px;">Este enlace expira en 1 hora.</p>
                    <p style="color: #666; font-size: 14px;">Si no solicitaste esto, ignora este correo.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    <p style="color: #999; font-size: 12px;">Wiki IA - Tu directorio de herramientas de IA</p>
                </div>
            `
        });

        res.json({ mensaje: 'Si el email existe, recibirás un enlace de recuperación' });

    } catch (error) {
        console.error('Error en forgot password:', error);
        res.status(500).json({ error: 'Error al procesar solicitud' });
    }
});

// POST /api/password/reset - Cambiar contraseña
router.post('/reset', async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({ error: 'Token y contraseña son requeridos' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
        }

        // Buscar usuario con token válido
        const { data: usuario } = await supabase
            .from('usuarios')
            .select('user_id, reset_expira')
            .eq('reset_token', token)
            .single();

        if (!usuario) {
            return res.status(400).json({ error: 'Token inválido o expirado' });
        }

        // Verificar expiración
        if (new Date() > new Date(usuario.reset_expira)) {
            return res.status(400).json({ error: 'El enlace ha expirado. Solicita uno nuevo.' });
        }

        // Hashear nueva contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Actualizar contraseña y limpiar token
        await supabase
            .from('usuarios')
            .update({ 
                password_hash: hashedPassword,
                reset_token: null,
                reset_expira: null
            })
            .eq('user_id', usuario.user_id);

        res.json({ mensaje: 'Contraseña actualizada correctamente' });

    } catch (error) {
        console.error('Error en reset password:', error);
        res.status(500).json({ error: 'Error al cambiar contraseña' });
    }
});

module.exports = router;