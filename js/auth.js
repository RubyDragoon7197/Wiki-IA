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

// Detectar si estamos en Codespaces y ajustar la URL
if (window.location.hostname.includes('github.dev') || window.location.hostname.includes('app.github.dev')) {
    // Extraer la base URL de Codespaces y cambiar al puerto 3000
    const currentUrl = window.location.origin;
    
    // Si la URL contiene un puerto específico (5500, 5501, etc), reemplazarlo por 3000
    if (currentUrl.match(/-\d{4,5}\.app\.github\.dev/)) {
        API_URL = currentUrl.replace(/-\d{4,5}\.app\.github\.dev/, '-3000.app.github.dev') + '/api';
    } else {
        // Si no tiene puerto en la URL, agregar -3000
        const hostname = window.location.hostname;
        const baseHostname = hostname.split('.')[0]; // obtener la parte antes del primer punto
        API_URL = `https://${baseHostname}-3000.app.github.dev/api`;
    }
    console.log('🌐 Detectado ambiente Codespaces. API URL:', API_URL);
}

// =============================================
// FUNCIONES DE MODAL
// =============================================

// Abrir modal
function abrirModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Evitar scroll del body
    }
}

// Cerrar modal
function cerrarModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = ''; // Restaurar scroll
        
        // Limpiar formularios y errores
        const form = modal.querySelector('form');
        if (form) form.reset();
        
        const error = modal.querySelector('.form-error');
        if (error) {
            error.textContent = '';
            error.classList.remove('active');
        }
    }
}

// Cambiar de un modal a otro
function cambiarModal(cerrar, abrir) {
    cerrarModal(cerrar);
    setTimeout(() => abrirModal(abrir), 200);
}

// Cerrar modal al hacer clic fuera
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        cerrarModal(e.target.id);
    }
});

// Cerrar modal con tecla Escape
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

// Manejar Login
async function handleLogin(event) {
    event.preventDefault();
    
    const form = event.target;
    const btn = form.querySelector('button[type="submit"]');
    const errorDiv = document.getElementById('loginError');
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // Mostrar loading
    btn.classList.add('btn-loading');
    btn.disabled = true;
    errorDiv.classList.remove('active');
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Error al iniciar sesión');
        }
        
        // Guardar token y datos del usuario
        localStorage.setItem('token', data.token);
        localStorage.setItem('usuario', JSON.stringify(data.usuario));
        
        // Cerrar modal y actualizar UI
        cerrarModal('loginModal');

        // Si estamos en la página de perfil, recargar para mostrar el nuevo usuario
        if (window.location.pathname.includes('perfil')) {
            mostrarNotificacion(`¡Bienvenido, ${data.usuario.username}!`, 'success');
            setTimeout(() => {
                window.location.reload();
            }, 500);
            return;
        }

        actualizarHeaderUsuario();

        // Si es admin, redirigir al panel de administración
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

// Manejar Registro
async function handleRegistro(event) {
    event.preventDefault();
    
    const form = event.target;
    const btn = form.querySelector('button[type="submit"]');
    const errorDiv = document.getElementById('registroError');
    
    const username = document.getElementById('registroUsername').value;
    const email = document.getElementById('registroEmail').value;
    const password = document.getElementById('registroPassword').value;
    const passwordConfirm = document.getElementById('registroPasswordConfirm').value;
    
    // Validar contraseñas
    if (password !== passwordConfirm) {
        errorDiv.textContent = 'Las contraseñas no coinciden';
        errorDiv.classList.add('active');
        return;
    }
    
    // Mostrar loading
    btn.classList.add('btn-loading');
    btn.disabled = true;
    errorDiv.classList.remove('active');
    
    try {
        const response = await fetch(`${API_URL}/auth/registro`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Error al registrarse');
        }
        
        // Guardar token y datos del usuario
        localStorage.setItem('token', data.token);
        localStorage.setItem('usuario', JSON.stringify(data.usuario));
        
        // Cerrar modal y actualizar UI
        cerrarModal('registroModal');

        // Si estamos en la página de perfil, recargar
        if (window.location.pathname.includes('perfil')) {
            mostrarNotificacion(`¡Cuenta creada! Bienvenido, ${data.usuario.username}`, 'success');
            setTimeout(() => {
                window.location.reload();
            }, 500);
            return;
        }

        actualizarHeaderUsuario();

        // Mostrar mensaje de bienvenida
        mostrarNotificacion(`¡Cuenta creada! Bienvenido, ${data.usuario.username}`, 'success');
        
    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.classList.add('active');
    } finally {
        btn.classList.remove('btn-loading');
        btn.disabled = false;
    }
}

// Cerrar Sesión
function cerrarSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    mostrarNotificacion('Sesión cerrada', 'info');
    
    // Redirigir a la página principal
    setTimeout(() => {
        window.location.href = '/index.html';
    }, 500);
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
        // Usuario logueado
        headerButtons.style.display = 'none';
        headerUser.style.display = 'flex';
        
        document.getElementById('userName').textContent = usuario.username;
        document.getElementById('userPoints').textContent = `${usuario.puntos_totales || 0} pts`;
        
        // Mostrar botón de Panel Admin solo si es admin
        if (adminPanelBtn) {
            adminPanelBtn.style.display = usuario.rol === 'admin' ? 'inline-block' : 'none';
        }
    } else if (headerButtons && headerUser) {
        // Usuario no logueado
        headerButtons.style.display = 'flex';
        headerUser.style.display = 'none';
        if (adminPanelBtn) {
            adminPanelBtn.style.display = 'none';
        }
    }
    
    // Marcar que la autenticación ya fue procesada para mostrar el header
    document.body.classList.add('auth-loaded');
}

// =============================================
// UTILIDADES
// =============================================

// Obtener token guardado
function obtenerToken() {
    return localStorage.getItem('token');
}

// Obtener usuario guardado
function obtenerUsuario() {
    const usuario = localStorage.getItem('usuario');
    return usuario ? JSON.parse(usuario) : null;
}

// Verificar si está autenticado
function estaAutenticado() {
    return !!obtenerToken();
}

// Verificar si es admin
function esAdmin() {
    const usuario = obtenerUsuario();
    return usuario && usuario.rol === 'admin';
}

// Headers para peticiones autenticadas
function obtenerHeaders() {
    const headers = {
        'Content-Type': 'application/json'
    };
    
    const token = obtenerToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
}

// Mostrar notificación
function mostrarNotificacion(mensaje, tipo = 'info') {
    // Crear elemento de notificación
    const notificacion = document.createElement('div');
    notificacion.className = `notificacion notificacion-${tipo}`;
    notificacion.innerHTML = `
        <span>${mensaje}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;
    
    // Agregar al body
    document.body.appendChild(notificacion);
    
    // Mostrar con animación
    setTimeout(() => notificacion.classList.add('active'), 10);
    
    // Remover después de 3 segundos
    setTimeout(() => {
        notificacion.classList.remove('active');
        setTimeout(() => notificacion.remove(), 300);
    }, 3000);
}

// =============================================
// INICIALIZACIÓN
// =============================================

document.addEventListener('DOMContentLoaded', () => {
    // Verificar estado de sesión al cargar la página
    actualizarHeaderUsuario();
});

// =============================================
// PUBLICAR IA - Agregar esto al final de auth.js
// =============================================

// NAVEGACI\u00d3N CON AUTENTICACI\u00d3N - Verificar antes de navegar
// =============================================
function navegarConAuth(url, seccion) {
    if (estaAutenticado()) {
        // Usuario logueado - navegar normalmente
        window.location.href = url;
    } else {
        // Usuario no logueado - mostrar modal de autenticaci\u00f3n
        mostrarModalAuthRequerida(seccion);
    }
}

// Mostrar modal gen\u00e9rico de autenticaci\u00f3n requerida
function mostrarModalAuthRequerida(seccion) {
    const modal = document.getElementById('authRequiredModal');
    const title = document.getElementById('authModalTitle');
    const message = document.getElementById('authModalMessage');
    
    // Personalizar mensaje seg\u00fan la secci\u00f3n
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
        titulo: 'Autenticaci\u00f3n Requerida',
        mensaje: 'Necesitas una cuenta para acceder a esta secci\u00f3n.'
    };
    
    title.textContent = info.titulo;
    message.textContent = info.mensaje;
    
    abrirModal('authRequiredModal');
}

// Abrir modal de publicar IA
function abrirModalPublicarIA() {
    const modal = document.getElementById('publicarIAModal');
    const authMessage = document.getElementById('authRequiredMessage');
    const form = document.getElementById('publicarIAForm');
    
    if (estaAutenticado()) {
        // Usuario logueado - mostrar formulario
        authMessage.style.display = 'none';
        form.style.display = 'block';
        cargarCategoriasSelect();
    } else {
        // Usuario no logueado - mostrar mensaje
        authMessage.style.display = 'block';
        form.style.display = 'none';
    }
    
    abrirModal('publicarIAModal');
}

// Cargar categorías en el select
async function cargarCategoriasSelect() {
    const select = document.getElementById('iaCategoria');
    
    // Evitar cargar si ya tiene opciones
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

// Manejar publicación de IA
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
    
    // Validaciones
    if (descripcion.length < 50) {
        errorDiv.textContent = 'La descripción debe tener al menos 50 caracteres';
        errorDiv.classList.add('active');
        return;
    }
    
    // Mostrar loading
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
            throw new Error(data.error || 'Error al publicar IA');
        }
        
        // Cerrar modal y limpiar formulario
        cerrarModal('publicarIAModal');
        form.reset();
        
        // Mostrar mensaje de éxito
        mostrarNotificacion('¡IA enviada para revisión! Recibirás 50 puntos cuando sea aprobada.', 'success');
        
    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.classList.add('active');
    } finally {
        btn.classList.remove('btn-loading');
        btn.disabled = false;
    }
}

// Abrir modal olvidé contraseña
function abrirModalOlvidePassword(event) {
    event.preventDefault();
    cerrarModal('loginModal');
    abrirModal('forgotPasswordModal');
}

// Manejar solicitud de recuperación
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