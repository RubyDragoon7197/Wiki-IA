// ===================================
// ADMIN DASHBOARD
// ===================================

// Datos de ejemplo (reemplazar con API real)
const mockData = {
    stats: {
        totalUsuarios: 1234,
        totalAprobadas: 87,
        totalPendientes: 5,
        totalVisitas: 45200
    },
    recentIAs: [
        { id: 1, name: 'IA Ejemplo 1', category: 'Programación', date: '2024-01-20', emoji: '💻' },
        { id: 2, name: 'IA Ejemplo 2', category: 'Diseño', date: '2024-01-19', emoji: '🎨' },
        { id: 3, name: 'IA Ejemplo 3', category: 'Educación', date: '2024-01-18', emoji: '📚' }
    ],
    activities: [
        { text: 'Usuario juan123 publicó una nueva IA', time: 'Hace 5 minutos' },
        { text: 'IA "ChatGPT Clone" fue aprobada', time: 'Hace 1 hora' },
        { text: 'Usuario maria456 dejó un comentario', time: 'Hace 2 horas' },
        { text: 'Nueva calificación de 5 estrellas', time: 'Hace 3 horas' }
    ],
    topUsers: [
        { username: 'juan123', email: 'juan@example.com', puntos: 2500, nivel: 6, ias: 15 },
        { username: 'maria456', email: 'maria@example.com', puntos: 1800, nivel: 5, ias: 12 },
        { username: 'carlos789', email: 'carlos@example.com', puntos: 1200, nivel: 4, ias: 8 }
    ]
};

// Cargar estadísticas
function loadStats() {
    document.getElementById('totalUsuarios').textContent = mockData.stats.totalUsuarios.toLocaleString();
    document.getElementById('totalAprobadas').textContent = mockData.stats.totalAprobadas;
    document.getElementById('totalPendientes').textContent = mockData.stats.totalPendientes;
    document.getElementById('totalVisitas').textContent = (mockData.stats.totalVisitas / 1000).toFixed(1) + 'K';
    document.getElementById('pendingCount').textContent = mockData.stats.totalPendientes;
}

// Cargar IAs recientes
function loadRecentIAs() {
    const container = document.getElementById('recentIAs');
    container.innerHTML = '';
    
    mockData.recentIAs.forEach(ia => {
        const item = document.createElement('div');
        item.className = 'recent-item';
        item.innerHTML = `
            <div class="recent-icon">${ia.emoji}</div>
            <div class="recent-info">
                <div class="recent-name">${ia.name}</div>
                <div class="recent-category">${ia.category}</div>
            </div>
            <div class="recent-date">${ia.date}</div>
        `;
        container.appendChild(item);
    });
}

// Cargar actividad reciente
function loadActivity() {
    const container = document.getElementById('activityList');
    container.innerHTML = '';
    
    mockData.activities.forEach(activity => {
        const item = document.createElement('div');
        item.className = 'activity-item';
        item.innerHTML = `
            <div class="activity-dot"></div>
            <div class="activity-content">
                <div class="activity-text">${activity.text}</div>
                <div class="activity-time">${activity.time}</div>
            </div>
        `;
        container.appendChild(item);
    });
}

// Cargar top usuarios
function loadTopUsers() {
    const tbody = document.getElementById('topUsersTable');
    tbody.innerHTML = '';
    
    mockData.topUsers.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${user.username}</strong></td>
            <td>${user.email}</td>
            <td><strong>${user.puntos}</strong> pts</td>
            <td>Nivel ${user.nivel}</td>
            <td>${user.ias} IAs</td>
        `;
        tbody.appendChild(row);
    });
}

// Inicializar dashboard
document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    loadRecentIAs();
    loadActivity();
    loadTopUsers();
});

// ===================================
// ADMIN - IAS PENDIENTES
// ===================================

// Datos de ejemplo (reemplazar con API real)
const pendingIAs = [
    {
        id: 1,
        name: 'Nueva IA de Diseño',
        description: 'Una herramienta increíble para generar logos automáticamente usando IA',
        url: 'https://ejemplo.com/ia1',
        category: 'Diseño',
        categoryId: 1,
        user: 'juan123',
        date: '2024-01-20 10:30'
    },
    {
        id: 2,
        name: 'Asistente de Código',
        description: 'IA que ayuda a escribir código más rápido y sin errores',
        url: 'https://ejemplo.com/ia2',
        category: 'Programación',
        categoryId: 2,
        user: 'maria456',
        date: '2024-01-19 15:45'
    },
    {
        id: 3,
        name: 'Tutor Virtual',
        description: 'IA educativa que adapta el contenido al nivel del estudiante',
        url: 'https://ejemplo.com/ia3',
        category: 'Educación',
        categoryId: 3,
        user: 'carlos789',
        date: '2024-01-18 09:15'
    }
];

const categories = [
    { id: 1, name: 'Diseño' },
    { id: 2, name: 'Programación' },
    { id: 3, name: 'Educación' },
    { id: 4, name: 'Negocios y Gestión' },
    { id: 5, name: 'Salud' },
    { id: 6, name: 'Seguridad' },
    { id: 7, name: 'Ciencia' },
    { id: 8, name: 'Arte' },
    { id: 9, name: 'Tecnología' }
];

let currentIAId = null;

// Renderizar IAs pendientes
function renderPendingIAs() {
    const container = document.getElementById('pendingIAsList');
    const noPendingMessage = document.getElementById('noPendingMessage');
    
    if (pendingIAs.length === 0) {
        container.style.display = 'none';
        noPendingMessage.style.display = 'block';
        return;
    }
    
    container.style.display = 'block';
    noPendingMessage.style.display = 'none';
    container.innerHTML = '';
    
    pendingIAs.forEach(ia => {
        const card = document.createElement('div');
        card.className = 'pending-ia-card';
        card.innerHTML = `
            <div class="pending-ia-header">
                <div class="pending-ia-info">
                    <h3 class="pending-ia-title">${ia.name}</h3>
                    <div class="pending-ia-meta">
                        <span>👤 ${ia.user}</span>
                        <span>📅 ${ia.date}</span>
                    </div>
                    <span class="pending-ia-category">${ia.category}</span>
                </div>
            </div>
            
            <p class="pending-ia-description">${ia.description}</p>
            
            <a href="${ia.url}" target="_blank" class="pending-ia-url">
                <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                </svg>
                Visitar URL: ${ia.url}
            </a>
            
            <div class="pending-ia-actions">
                <button class="btn btn-success" onclick="approveIA(${ia.id})">
                    <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Aprobar
                </button>
                
                <button class="btn btn-danger" onclick="openRejectModal(${ia.id})">
                    <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                    Rechazar
                </button>
                
                <button class="btn btn-warning" onclick="openCategoryModal(${ia.id})">
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
    document.getElementById('pendingCount').textContent = pendingIAs.length;
}

// Aprobar IA
function approveIA(id) {
    if (confirm('¿Estás seguro de aprobar esta IA?')) {
        // Aquí harías la llamada a la API
        console.log('Aprobando IA:', id);
        
        // Simular aprobación
        const index = pendingIAs.findIndex(ia => ia.id === id);
        if (index !== -1) {
            pendingIAs.splice(index, 1);
            renderPendingIAs();
            
            // Mostrar notificación de éxito
            alert('¡IA aprobada exitosamente! El usuario recibirá 50 puntos.');
        }
    }
}

// Abrir modal de rechazo
function openRejectModal(id) {
    currentIAId = id;
    document.getElementById('rejectModal').classList.add('active');
    document.getElementById('rejectReason').value = '';
}

// Cerrar modal de rechazo
function closeRejectModal() {
    document.getElementById('rejectModal').classList.remove('active');
    currentIAId = null;
}

// Confirmar rechazo
function confirmReject() {
    const reason = document.getElementById('rejectReason').value.trim();
    
    if (!reason) {
        alert('Por favor, explica la razón del rechazo');
        return;
    }
    
    // Aquí harías la llamada a la API
    console.log('Rechazando IA:', currentIAId, 'Razón:', reason);
    
    // Simular rechazo
    const index = pendingIAs.findIndex(ia => ia.id === currentIAId);
    if (index !== -1) {
        pendingIAs.splice(index, 1);
        renderPendingIAs();
        closeRejectModal();
        
        // Mostrar notificación
        alert('IA rechazada. El usuario recibirá una notificación con la razón.');
    }
}

// Abrir modal de cambiar categoría
function openCategoryModal(id) {
    currentIAId = id;
    const ia = pendingIAs.find(ia => ia.id === id);
    
    // Llenar select de categorías
    const select = document.getElementById('newCategory');
    select.innerHTML = '';
    
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.name;
        if (cat.id === ia.categoryId) {
            option.selected = true;
        }
        select.appendChild(option);
    });
    
    document.getElementById('categoryModal').classList.add('active');
}

// Cerrar modal de categoría
function closeCategoryModal() {
    document.getElementById('categoryModal').classList.remove('active');
    currentIAId = null;
}

// Confirmar cambio de categoría
function confirmChangeCategory() {
    const newCategoryId = parseInt(document.getElementById('newCategory').value);
    const ia = pendingIAs.find(ia => ia.id === currentIAId);
    const newCategory = categories.find(cat => cat.id === newCategoryId);
    
    if (ia && newCategory) {
        // Aquí harías la llamada a la API
        console.log('Cambiando categoría de IA:', currentIAId, 'a:', newCategoryId);
        
        // Actualizar
        ia.categoryId = newCategoryId;
        ia.category = newCategory.name;
        
        renderPendingIAs();
        closeCategoryModal();
        
        alert(`Categoría cambiada a "${newCategory.name}"`);
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    renderPendingIAs();
    
    // Cargar categorías en el select
    const select = document.getElementById('newCategory');
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.name;
        select.appendChild(option);
    });
});