// ===================================
// ADMIN DASHBOARD - Conectado con API
// ===================================

// Configuración de la API (misma lógica que auth.js)
let API_URL = 'http://localhost:3000/api';

if (window.location.hostname.includes('github.dev') || window.location.hostname.includes('app.github.dev')) {
    const currentUrl = window.location.origin;
    if (currentUrl.match(/-\d{4,5}\.app\.github\.dev/)) {
        API_URL = currentUrl.replace(/-\d{4,5}\.app\.github\.dev/, '-3000.app.github.dev') + '/api';
    } else {
        const hostname = window.location.hostname;
        const baseHostname = hostname.split('.')[0];
        API_URL = `https://${baseHostname}-3000.app.github.dev/api`;
    }
    console.log('🌐 Admin Panel - API URL:', API_URL);
}

// Obtener token y headers
function obtenerToken() {
    return localStorage.getItem('token');
}

function obtenerHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${obtenerToken()}`
    };
}

// Verificar que el usuario es admin
function verificarAdmin() {
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    if (!usuario || usuario.rol !== 'admin') {
        alert('Acceso denegado. Solo administradores.');
        window.location.href = '../index.html';
        return false;
    }
    return true;
}

// ===================================
// CARGAR ESTADÍSTICAS
// ===================================
async function loadStats() {
    try {
        const response = await fetch(`${API_URL}/admin/stats`, {
            headers: obtenerHeaders()
        });

        if (!response.ok) throw new Error('Error al cargar estadísticas');

        const stats = await response.json();

        document.getElementById('totalUsuarios').textContent = stats.totalUsuarios.toLocaleString();
        document.getElementById('totalAprobadas').textContent = stats.iasAprobadas;
        document.getElementById('totalPendientes').textContent = stats.iasPendientes;
        document.getElementById('totalVisitas').textContent = formatearNumero(stats.totalVisitas);
        
        // Actualizar contador en el menú
        const pendingCount = document.getElementById('pendingCount');
        if (pendingCount) {
            pendingCount.textContent = stats.iasPendientes;
        }

    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
    }
}

// ===================================
// CARGAR IAs PENDIENTES
// ===================================
let pendingIAs = [];
let currentIAId = null;

async function loadPendingIAs() {
    try {
        const response = await fetch(`${API_URL}/admin/ias/pendientes`, {
            headers: obtenerHeaders()
        });

        if (!response.ok) throw new Error('Error al cargar IAs pendientes');

        pendingIAs = await response.json();
        renderPendingIAs();

    } catch (error) {
        console.error('Error al cargar IAs pendientes:', error);
    }
}

function renderPendingIAs() {
    const container = document.getElementById('pendingIAsList');
    const noPendingMessage = document.getElementById('noPendingMessage');

    if (!container) return; // No estamos en la página de pendientes

    if (pendingIAs.length === 0) {
        container.style.display = 'none';
        if (noPendingMessage) noPendingMessage.style.display = 'block';
        return;
    }

    container.style.display = 'block';
    if (noPendingMessage) noPendingMessage.style.display = 'none';
    container.innerHTML = '';

    pendingIAs.forEach(ia => {
        const card = document.createElement('div');
        card.className = 'pending-ia-card';
        card.innerHTML = `
            <div class="pending-ia-header">
                <div class="pending-ia-info">
                    <h3 class="pending-ia-title">${ia.nombre}</h3>
                    <div class="pending-ia-meta">
                        <span>👤 ${ia.usuarios?.username || 'Usuario'}</span>
                        <span>📅 ${formatearFecha(ia.fecha_publicacion)}</span>
                    </div>
                    <span class="pending-ia-category">${ia.categorias?.nombre || 'Sin categoría'}</span>
                </div>
            </div>
            
            <p class="pending-ia-description">${ia.descripcion}</p>
            
            <a href="${ia.url}" target="_blank" class="pending-ia-url">
                <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                </svg>
                Visitar URL: ${ia.url}
            </a>
            
            <div class="pending-ia-actions">
                <button class="btn btn-success" onclick="approveIA(${ia.ia_id})">
                    <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Aprobar
                </button>
                
                <button class="btn btn-danger" onclick="openRejectModal(${ia.ia_id})">
                    <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                    Rechazar
                </button>
                
                <button class="btn btn-warning" onclick="openCategoryModal(${ia.ia_id}, ${ia.categoria_id})">
                    <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                    </svg>
                    Cambiar Categoría
                </button>
            </div>
        `;
        container.appendChild(card);
    });

    // Actualizar contador
    const pendingCount = document.getElementById('pendingCount');
    if (pendingCount) {
        pendingCount.textContent = pendingIAs.length;
    }
}

// ===================================
// APROBAR IA
// ===================================
async function approveIA(id) {
    if (!confirm('¿Estás seguro de aprobar esta IA?')) return;

    try {
        const response = await fetch(`${API_URL}/admin/ias/${id}/aprobar`, {
            method: 'PUT',
            headers: obtenerHeaders()
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.error || 'Error al aprobar');

        alert(data.mensaje);
        
        // Recargar lista
        await loadPendingIAs();
        await loadStats();

    } catch (error) {
        console.error('Error al aprobar IA:', error);
        alert('Error al aprobar la IA: ' + error.message);
    }
}

// ===================================
// RECHAZAR IA
// ===================================
function openRejectModal(id) {
    currentIAId = id;
    document.getElementById('rejectModal').classList.add('active');
    document.getElementById('rejectReason').value = '';
}

function closeRejectModal() {
    document.getElementById('rejectModal').classList.remove('active');
    currentIAId = null;
}

async function confirmReject() {
    const reason = document.getElementById('rejectReason').value.trim();

    if (!reason) {
        alert('Por favor, explica la razón del rechazo');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/admin/ias/${currentIAId}/rechazar`, {
            method: 'PUT',
            headers: obtenerHeaders(),
            body: JSON.stringify({ razon: reason })
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.error || 'Error al rechazar');

        alert(data.mensaje);
        closeRejectModal();
        
        // Recargar lista
        await loadPendingIAs();
        await loadStats();

    } catch (error) {
        console.error('Error al rechazar IA:', error);
        alert('Error al rechazar la IA: ' + error.message);
    }
}

// ===================================
// CAMBIAR CATEGORÍA
// ===================================
let categorias = [];

async function loadCategorias() {
    try {
        const response = await fetch(`${API_URL}/categorias`);
        categorias = await response.json();
    } catch (error) {
        console.error('Error al cargar categorías:', error);
    }
}

function openCategoryModal(id, currentCategoryId) {
    currentIAId = id;

    const select = document.getElementById('newCategory');
    select.innerHTML = '';

    categorias.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.categoria_id;
        option.textContent = `${cat.icono} ${cat.nombre}`;
        if (cat.categoria_id === currentCategoryId) {
            option.selected = true;
        }
        select.appendChild(option);
    });

    document.getElementById('categoryModal').classList.add('active');
}

function closeCategoryModal() {
    document.getElementById('categoryModal').classList.remove('active');
    currentIAId = null;
}

async function confirmChangeCategory() {
    const newCategoryId = parseInt(document.getElementById('newCategory').value);

    try {
        const response = await fetch(`${API_URL}/admin/ias/${currentIAId}/categoria`, {
            method: 'PUT',
            headers: obtenerHeaders(),
            body: JSON.stringify({ categoria_id: newCategoryId })
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.error || 'Error al cambiar categoría');

        alert(data.mensaje);
        closeCategoryModal();
        
        // Recargar lista
        await loadPendingIAs();

    } catch (error) {
        console.error('Error al cambiar categoría:', error);
        alert('Error al cambiar la categoría: ' + error.message);
    }
}

// ===================================
// CARGAR ACTIVIDAD RECIENTE
// ===================================
async function loadActivity() {
    const container = document.getElementById('activityList');
    if (!container) return;

    try {
        const response = await fetch(`${API_URL}/admin/actividad-reciente`, {
            headers: obtenerHeaders()
        });

        if (!response.ok) throw new Error('Error al cargar actividad');

        const activities = await response.json();

        container.innerHTML = '';

        if (activities.length === 0) {
            container.innerHTML = '<p class="no-activity">No hay actividad reciente</p>';
            return;
        }

        activities.forEach(activity => {
            const item = document.createElement('div');
            item.className = 'activity-item';
            item.innerHTML = `
                <div class="activity-dot"></div>
                <div class="activity-content">
                    <div class="activity-text">
                        <strong>${activity.usuarios?.username || 'Usuario'}</strong>: ${activity.descripcion}
                    </div>
                    <div class="activity-time">${formatearTiempoRelativo(activity.fecha)}</div>
                </div>
            `;
            container.appendChild(item);
        });

    } catch (error) {
        console.error('Error al cargar actividad:', error);
        container.innerHTML = '<p class="no-activity">Error al cargar actividad</p>';
    }
}

// ===================================
// CARGAR TOP USUARIOS
// ===================================
async function loadTopUsers() {
    const tbody = document.getElementById('topUsersTable');
    if (!tbody) return;

    try {
        const response = await fetch(`${API_URL}/usuarios/ranking?limite=10`);

        if (!response.ok) throw new Error('Error al cargar ranking');

        const users = await response.json();

        tbody.innerHTML = '';

        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">No hay usuarios registrados</td></tr>';
            return;
        }

        users.forEach((user, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <span class="rank-badge rank-${index + 1}">#${index + 1}</span>
                    <strong>${user.username}</strong>
                </td>
                <td>${user.nivel_info?.nombre || 'Novato'}</td>
                <td><strong>${user.puntos_totales}</strong> pts</td>
                <td>Nivel ${user.nivel}</td>
                <td>${user.nivel_info?.insignia || '🌱'}</td>
            `;
            tbody.appendChild(row);
        });

    } catch (error) {
        console.error('Error al cargar top usuarios:', error);
    }
}

// ===================================
// CARGAR IAs RECIENTES (aprobadas)
// ===================================
async function loadRecentIAs() {
    const container = document.getElementById('recentIAs');
    if (!container) return;

    try {
        const response = await fetch(`${API_URL}/ias?orden=recientes&limite=5`);

        if (!response.ok) throw new Error('Error al cargar IAs recientes');

        const ias = await response.json();

        container.innerHTML = '';

        if (ias.length === 0) {
            container.innerHTML = '<p class="no-data">No hay IAs aprobadas aún</p>';
            return;
        }

        ias.forEach(ia => {
            const item = document.createElement('div');
            item.className = 'recent-item';
            item.innerHTML = `
                <div class="recent-icon">${ia.categorias?.icono || '🤖'}</div>
                <div class="recent-info">
                    <div class="recent-name">${ia.nombre}</div>
                    <div class="recent-category">${ia.categorias?.nombre || 'General'}</div>
                </div>
                <div class="recent-date">${formatearFecha(ia.fecha_publicacion)}</div>
            `;
            container.appendChild(item);
        });

    } catch (error) {
        console.error('Error al cargar IAs recientes:', error);
    }
}

// ===================================
// UTILIDADES
// ===================================
function formatearNumero(num) {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

function formatearFecha(fecha) {
    if (!fecha) return '';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatearTiempoRelativo(fecha) {
    if (!fecha) return '';
    const ahora = new Date();
    const date = new Date(fecha);
    const diff = ahora - date;

    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(diff / 3600000);
    const dias = Math.floor(diff / 86400000);

    if (minutos < 1) return 'Hace un momento';
    if (minutos < 60) return `Hace ${minutos} minuto${minutos > 1 ? 's' : ''}`;
    if (horas < 24) return `Hace ${horas} hora${horas > 1 ? 's' : ''}`;
    if (dias < 7) return `Hace ${dias} día${dias > 1 ? 's' : ''}`;
    return formatearFecha(fecha);
}

// ===================================
// CERRAR SESIÓN
// ===================================
function cerrarSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '../index.html';
}

// ===================================
// INICIALIZACIÓN
// ===================================
document.addEventListener('DOMContentLoaded', async () => {
    // Verificar que es admin
    if (!verificarAdmin()) return;

    // Mostrar nombre del admin
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    const adminName = document.getElementById('adminName');
    if (adminName && usuario) {
        adminName.textContent = usuario.username;
    }

    // Cargar categorías primero (necesarias para el modal)
    await loadCategorias();

    // Cargar todos los datos EN PARALELO para mayor velocidad
    await Promise.all([
        loadStats(),
        loadPendingIAs(),
        loadRecentIAs(),
        loadActivity(),
        loadTopUsers()
    ]);
});