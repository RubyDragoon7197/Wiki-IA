// Función para mostrar/ocultar contraseña
function togglePassword(inputId, button) {
    const input = document.getElementById(inputId);
    const eyeOpen = `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>`;
    const eyeClosed = `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path></svg>`;
    
    if (input.type === 'password') {
        input.type = 'text';
        button.innerHTML = eyeClosed;
    } else {
        input.type = 'password';
        button.innerHTML = eyeOpen;
    }
}

// =============================================
// CONFIGURACIÓN DE LA API
// =============================================

let API_URL = 'http://localhost:3000/api';

// Detectar ambiente
if (window.location.hostname === 'wiki-ia.xyz') {
    API_URL = 'https://wiki-ia.xyz/api';
} else if (window.location.hostname.includes('github.dev') || window.location.hostname.includes('app.github.dev')) {
    const currentUrl = window.location.origin;
    
    if (currentUrl.match(/-\d{4,5}\.app\.github\.dev/)) {
        API_URL = currentUrl.replace(/-\d{4,5}\.app\.github\.dev/, '-3000.app.github.dev') + '/api';
    } else {
        const hostname = window.location.hostname;
        const baseHostname = hostname.split('.')[0];
        API_URL = `https://${baseHostname}-3000.app.github.dev/api`;
    }
}

// =============================================
// FUNCIONES DE MODAL
// =============================================

function abrirModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function cerrarModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        
        const form = modal.querySelector('form');
        if (form) form.reset();
        
        const error = modal.querySelector('.form-error');
        if (error) {
            error.textContent = '';
            error.classList.remove('active');
        }
    }
}

function cambiarModal(cerrar, abrir) {
    cerrarModal(cerrar);
    setTimeout(() => abrirModal(abrir), 200);
}

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        cerrarModal(e.target.id);
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modalActivo = document.querySelector('.modal-overlay.active');
        if (modalActivo) {
            cerrarModal(modalActivo.id);
        }
    }
});

// =============================================
// FUNCIONES DE AUTENTICACIÓN
// =============================================

async function handleLogin(event) {
    event.preventDefault();
    
    const form = event.target;
    const btn = form.querySelector('button[type="submit"]');
    const errorDiv = document.getElementById('loginError');
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    btn.classList.add('btn-loading');
    btn.disabled = true;
    errorDiv.classList.remove('active');
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Error al iniciar sesión');
        }
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('usuario', JSON.stringify(data.usuario));
        
        cerrarModal('loginModal');

        if (window.location.pathname.includes('perfil')) {
            mostrarNotificacion(`¡Bienvenido, ${data.usuario.username}!`, 'success');
            setTimeout(() => window.location.reload(), 500);
            return;
        }

        actualizarHeaderUsuario();
        mostrarBannerVerificacion();

        if (data.usuario.rol === 'admin') {
            mostrarNotificacion(`¡Bienvenido, Admin ${data.usuario.username}!`, 'success');
            setTimeout(() => {
                window.location.href = '/admin/dashboard.html';
            }, 1000);
        } else {
            mostrarNotificacion(`¡Bienvenido, ${data.usuario.username}!`, 'success');
        }
        
    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.classList.add('active');
    } finally {
        btn.classList.remove('btn-loading');
        btn.disabled = false;
    }
}

async function handleRegistro(event) {
    event.preventDefault();
    
    const form = event.target;
    const btn = form.querySelector('button[type="submit"]');
    const errorDiv = document.getElementById('registroError');
    
    const username = document.getElementById('registroUsername').value;
    const email = document.getElementById('registroEmail').value;
    const password = document.getElementById('registroPassword').value;
    const passwordConfirm = document.getElementById('registroPasswordConfirm').value;
    
    if (password !== passwordConfirm) {
        errorDiv.textContent = 'Las contraseñas no coinciden';
        errorDiv.classList.add('active');
        return;
    }
    
    btn.classList.add('btn-loading');
    btn.disabled = true;
    errorDiv.classList.remove('active');
    
    try {
        const response = await fetch(`${API_URL}/auth/registro`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Error al registrarse');
        }
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('usuario', JSON.stringify(data.usuario));
        
        cerrarModal('registroModal');

        if (window.location.pathname.includes('perfil')) {
            mostrarNotificacion(`¡Cuenta creada! Revisa tu email para verificar tu cuenta.`, 'success');
            setTimeout(() => window.location.reload(), 500);
            return;
        }

        actualizarHeaderUsuario();
        mostrarBannerVerificacion();

        mostrarNotificacion(`¡Cuenta creada! Revisa tu email para verificar tu cuenta.`, 'success');
        
    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.classList.add('active');
    } finally {
        btn.classList.remove('btn-loading');
        btn.disabled = false;
    }
}

function cerrarSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    mostrarNotificacion('Sesión cerrada', 'info');
    
    // Remover banner de verificación si existe
    const banner = document.getElementById('bannerVerificacion');
    if (banner) banner.remove();
    
    setTimeout(() => {
        window.location.href = '/index.html';
    }, 500);
}

// =============================================
// VERIFICACIÓN DE EMAIL
// =============================================

// Verificar si el email está verificado (desde localStorage)
function emailVerificado() {
    const usuario = obtenerUsuario();
    return usuario && usuario.email_verificado === true;
}

// Verificar estado de email desde la API y actualizar localStorage
async function verificarEstadoEmailDesdeAPI() {
    const token = obtenerToken();
    if (!token) return false;
    
    try {
        const response = await fetch(`${API_URL}/auth/perfil`, {
            headers: obtenerHeaders()
        });
        
        if (!response.ok) return false;
        
        const data = await response.json();
        
        // Actualizar localStorage con el estado real
        const usuarioLocal = obtenerUsuario();
        if (usuarioLocal && data.email_verificado !== usuarioLocal.email_verificado) {
            usuarioLocal.email_verificado = data.email_verificado;
            localStorage.setItem('usuario', JSON.stringify(usuarioLocal));
            console.log('📧 Estado de verificación actualizado:', data.email_verificado);
        }
        
        return data.email_verificado === true;
    } catch (error) {
        console.error('Error al verificar estado de email:', error);
        return false;
    }
}

// Mostrar banner de verificación si no está verificado
async function mostrarBannerVerificacion() {
    // Remover banner existente si hay
    const bannerExistente = document.getElementById('bannerVerificacion');
    if (bannerExistente) bannerExistente.remove();
    
    const usuario = obtenerUsuario();
    
    // Solo continuar si está logueado
    if (!usuario) return;
    
    // Si localStorage dice que está verificado, no mostrar banner
    if (usuario.email_verificado) return;
    
    // Consultar API para verificar estado real
    const verificadoEnAPI = await verificarEstadoEmailDesdeAPI();
    
    // Si ya está verificado en la API, no mostrar banner
    if (verificadoEnAPI) {
        console.log('✅ Email ya verificado, no se muestra banner');
        return;
    }
    
    // Crear y mostrar el banner
    const banner = document.createElement('div');
    banner.id = 'bannerVerificacion';
    banner.className = 'banner-verificacion';
    banner.innerHTML = `
        <div class="banner-contenido">
            <span class="banner-icono">✉️</span>
            <span class="banner-texto">
                <strong>Verifica tu email</strong> para publicar IAs, dejar reseñas y guardar favoritos.
            </span>
            <button class="banner-btn" onclick="reenviarVerificacion()">Reenviar email</button>
            <button class="banner-cerrar" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    // Insertar después del header
    const header = document.querySelector('header');
    if (header) {
        header.insertAdjacentElement('afterend', banner);
    } else {
        document.body.insertAdjacentElement('afterbegin', banner);
    }
}

// Reenviar email de verificación
async function reenviarVerificacion() {
    const btn = document.querySelector('.banner-btn');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Enviando...';
    }
    
    try {
        const response = await fetch(`${API_URL}/auth/reenviar-verificacion`, {
            method: 'POST',
            headers: obtenerHeaders()
        });
        
        const data = await response.json();
        
        if (response.ok) {
            mostrarNotificacion('📧 Email de verificación enviado. Revisa tu bandeja de entrada.', 'success');
        } else {
            mostrarNotificacion(data.error || 'Error al enviar email', 'error');
        }
    } catch (error) {
        mostrarNotificacion('Error de conexión', 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Reenviar email';
        }
    }
}

// Mostrar modal cuando se intenta una acción sin verificar
function mostrarModalEmailNoVerificado(accion) {
    // Crear modal si no existe
    let modal = document.getElementById('emailNoVerificadoModal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'emailNoVerificadoModal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-container">
                <div class="modal-header">
                    <h2>✉️ Verifica tu email</h2>
                    <button class="modal-close-btn" onclick="cerrarModal('emailNoVerificadoModal')">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                <div class="modal-body" style="text-align: center; padding: 2rem;">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">📧</div>
                    <h3 style="margin-bottom: 1rem; color: var(--text-primary);">Verificación requerida</h3>
                    <p id="emailNoVerificadoMensaje" style="color: var(--text-secondary); margin-bottom: 1.5rem;"></p>
                    <button class="btn btn-primary" onclick="reenviarVerificacion(); cerrarModal('emailNoVerificadoModal');">
                        Reenviar email de verificación
                    </button>
                    <p style="margin-top: 1rem; font-size: 0.9rem; color: var(--text-secondary);">
                        Revisa tu bandeja de entrada y spam.
                    </p>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    // Personalizar mensaje según la acción
    const mensajes = {
        'publicar': 'Para publicar IAs necesitas verificar tu email primero.',
        'resena': 'Para dejar reseñas necesitas verificar tu email primero.',
        'favorito': 'Para guardar favoritos necesitas verificar tu email primero.'
    };
    
    document.getElementById('emailNoVerificadoMensaje').textContent = 
        mensajes[accion] || 'Para realizar esta acción necesitas verificar tu email.';
    
    abrirModal('emailNoVerificadoModal');
}

// Manejar errores de email no verificado en respuestas del servidor
function manejarErrorEmailNoVerificado(data, accion) {
    if (data.codigo === 'EMAIL_NO_VERIFICADO') {
        mostrarModalEmailNoVerificado(accion);
        return true;
    }
    return false;
}

// =============================================
// ACTUALIZAR UI SEGÚN ESTADO DE SESIÓN
// =============================================

function actualizarHeaderUsuario() {
    const headerButtons = document.getElementById('headerButtons');
    const headerUser = document.getElementById('headerUser');
    const adminPanelBtn = document.getElementById('adminPanelBtn');
    const usuario = obtenerUsuario();
    
    if (usuario && headerButtons && headerUser) {
        headerButtons.style.display = 'none';
        headerUser.style.display = 'flex';
        
        document.getElementById('userName').textContent = usuario.username;
        document.getElementById('userPoints').textContent = `${usuario.puntos_totales || 0} pts`;
        
        if (adminPanelBtn) {
            adminPanelBtn.style.display = usuario.rol === 'admin' ? 'inline-block' : 'none';
        }
    } else if (headerButtons && headerUser) {
        headerButtons.style.display = 'flex';
        headerUser.style.display = 'none';
        if (adminPanelBtn) {
            adminPanelBtn.style.display = 'none';
        }
    }
    
    document.body.classList.add('auth-loaded');
}

// =============================================
// UTILIDADES
// =============================================

function obtenerToken() {
    return localStorage.getItem('token');
}

function obtenerUsuario() {
    const usuario = localStorage.getItem('usuario');
    return usuario ? JSON.parse(usuario) : null;
}

function estaAutenticado() {
    return !!obtenerToken();
}

function esAdmin() {
    const usuario = obtenerUsuario();
    return usuario && usuario.rol === 'admin';
}

function obtenerHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const token = obtenerToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

function mostrarNotificacion(mensaje, tipo = 'info') {
    const notificacion = document.createElement('div');
    notificacion.className = `notificacion notificacion-${tipo}`;
    notificacion.innerHTML = `
        <span>${mensaje}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;
    
    document.body.appendChild(notificacion);
    setTimeout(() => notificacion.classList.add('active'), 10);
    
    setTimeout(() => {
        notificacion.classList.remove('active');
        setTimeout(() => notificacion.remove(), 300);
    }, 3000);
}

// =============================================
// INICIALIZACIÓN
// =============================================

document.addEventListener('DOMContentLoaded', () => {
    actualizarHeaderUsuario();
    mostrarBannerVerificacion();
});

// =============================================
// NAVEGACIÓN CON AUTENTICACIÓN
// =============================================

function navegarConAuth(url, seccion) {
    if (estaAutenticado()) {
        window.location.href = url;
    } else {
        mostrarModalAuthRequerida(seccion);
    }
}

function mostrarModalAuthRequerida(seccion) {
    const modal = document.getElementById('authRequiredModal');
    const title = document.getElementById('authModalTitle');
    const message = document.getElementById('authModalMessage');
    
    const mensajes = {
        'Favoritos': {
            titulo: 'Accede a tus Favoritos',
            mensaje: 'Necesitas una cuenta para guardar y ver tus IAs favoritas.'
        },
        'Perfil': {
            titulo: 'Accede a tu Perfil',
            mensaje: 'Necesitas una cuenta para ver tu perfil, puntos y medallas.'
        }
    };
    
    const info = mensajes[seccion] || {
        titulo: 'Autenticación Requerida',
        mensaje: 'Necesitas una cuenta para acceder a esta sección.'
    };
    
    title.textContent = info.titulo;
    message.textContent = info.mensaje;
    
    abrirModal('authRequiredModal');
}

// =============================================
// PUBLICAR IA
// =============================================

function abrirModalPublicarIA() {
    const modal = document.getElementById('publicarIAModal');
    const authMessage = document.getElementById('authRequiredMessage');
    const form = document.getElementById('publicarIAForm');
    
    if (estaAutenticado()) {
        authMessage.style.display = 'none';
        form.style.display = 'block';
        cargarCategoriasSelect();
    } else {
        authMessage.style.display = 'block';
        form.style.display = 'none';
    }
    
    abrirModal('publicarIAModal');
}

async function cargarCategoriasSelect() {
    const select = document.getElementById('iaCategoria');
    if (select.options.length > 1) return;
    
    try {
        const response = await fetch(`${API_URL}/categorias`);
        const categorias = await response.json();
        
        categorias.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.categoria_id;
            option.textContent = `${cat.icono} ${cat.nombre}`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar categorías:', error);
    }
}

async function handlePublicarIA(event) {
    event.preventDefault();
    
    const form = event.target;
    const btn = document.getElementById('publicarIABtn');
    const errorDiv = document.getElementById('publicarIAError');
    
    const nombre = document.getElementById('iaNombre').value.trim();
    const categoria_id = document.getElementById('iaCategoria').value;
    const url = document.getElementById('iaUrl').value.trim();
    const descripcion = document.getElementById('iaDescripcion').value.trim();
    const imagen_logo = document.getElementById('iaImagen').value.trim();
    
    if (descripcion.length < 50) {
        errorDiv.textContent = 'La descripción debe tener al menos 50 caracteres';
        errorDiv.classList.add('active');
        return;
    }
    
    btn.classList.add('btn-loading');
    btn.disabled = true;
    errorDiv.classList.remove('active');
    
    try {
        const response = await fetch(`${API_URL}/ias`, {
            method: 'POST',
            headers: obtenerHeaders(),
            body: JSON.stringify({
                nombre,
                categoria_id: parseInt(categoria_id),
                url,
                descripcion,
                imagen_logo: imagen_logo || null
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            // Verificar si es error de email no verificado
            if (manejarErrorEmailNoVerificado(data, 'publicar')) {
                cerrarModal('publicarIAModal');
                return;
            }
            throw new Error(data.error || 'Error al publicar IA');
        }
        
        cerrarModal('publicarIAModal');
        form.reset();
        mostrarNotificacion('¡IA enviada para revisión! Recibirás 50 puntos cuando sea aprobada.', 'success');
        
    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.classList.add('active');
    } finally {
        btn.classList.remove('btn-loading');
        btn.disabled = false;
    }
}

// =============================================
// RECUPERAR CONTRASEÑA
// =============================================

function abrirModalOlvidePassword(event) {
    event.preventDefault();
    cerrarModal('loginModal');
    abrirModal('forgotPasswordModal');
}

async function handleForgotPassword(event) {
    event.preventDefault();

    const email = document.getElementById('forgotEmail').value.trim();
    const btn = document.getElementById('forgotBtn');
    const errorDiv = document.getElementById('forgotError');
    const successDiv = document.getElementById('forgotSuccess');

    errorDiv.classList.remove('active');
    successDiv.classList.remove('active');

    btn.disabled = true;
    btn.textContent = 'Enviando...';

    try {
        const response = await fetch(`${API_URL}/password/forgot`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error);
        }

        successDiv.textContent = '¡Revisa tu correo! Te enviamos un enlace de recuperación.';
        successDiv.classList.add('active');
        document.getElementById('forgotPasswordForm').style.display = 'none';

    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.classList.add('active');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Enviar Enlace';
    }
}