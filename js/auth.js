// =============================================
// CONFIGURACIÓN DE LA API
// =============================================

const API_URL = 'http://localhost:3000/api';

// Detectar si estamos en Codespaces y ajustar la URL
if (window.location.hostname.includes('github.dev')) {
    // Extraer la base URL de Codespaces y cambiar al puerto 3000
    const baseUrl = window.location.origin.replace('-5500', '-3000').replace('-5501', '-3000');
    // Si no hay puerto en la URL original, construir la URL de la API
    if (!window.location.origin.includes('-3000')) {
        const parts = window.location.hostname.split('-');
        parts[parts.length - 1] = '3000.app.github.dev';
        window.API_URL = `https://${parts.join('-')}`;
    }
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
        actualizarHeaderUsuario();
        
        // Mostrar mensaje de bienvenida (opcional)
        mostrarNotificacion(`¡Bienvenido, ${data.usuario.username}!`, 'success');
        
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
    actualizarHeaderUsuario();
    mostrarNotificacion('Sesión cerrada', 'info');
    
    // Si estamos en una página que requiere autenticación, redirigir
    // window.location.href = '/index.html';
}

// =============================================
// ACTUALIZAR UI SEGÚN ESTADO DE SESIÓN
// =============================================

function actualizarHeaderUsuario() {
    const headerButtons = document.getElementById('headerButtons');
    const headerUser = document.getElementById('headerUser');
    const usuario = obtenerUsuario();
    
    if (usuario && headerButtons && headerUser) {
        // Usuario logueado
        headerButtons.style.display = 'none';
        headerUser.style.display = 'flex';
        
        document.getElementById('userName').textContent = usuario.username;
        document.getElementById('userPoints').textContent = `${usuario.puntos_totales || 0} pts`;
    } else if (headerButtons && headerUser) {
        // Usuario no logueado
        headerButtons.style.display = 'flex';
        headerUser.style.display = 'none';
    }
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
