// =============================================
// PERFIL DE USUARIO
// =============================================

// Cargar perfil
async function cargarPerfil() {
    const loginRequired = document.getElementById('loginRequired');
    const perfilContent = document.getElementById('perfilContent');

    if (!estaAutenticado()) {
        loginRequired.style.display = 'block';
        perfilContent.style.display = 'none';
        return;
    }

    loginRequired.style.display = 'none';
    perfilContent.style.display = 'block';

    const usuario = obtenerUsuario();

    // Llenar datos básicos
    document.getElementById('perfilAvatar').textContent = usuario.username.substring(0, 2).toUpperCase();
    document.getElementById('perfilNombre').textContent = usuario.username;
    document.getElementById('perfilEmail').textContent = usuario.email;
    document.getElementById('perfilPuntos').textContent = usuario.puntos_totales || 0;
    document.getElementById('perfilNivel').textContent = usuario.nivel || 1;

    // Cargar datos del servidor
    await cargarDatosCompletos(usuario.username);
}

// Cargar datos completos desde el servidor
async function cargarDatosCompletos(username) {
    try {
        const response = await fetch(`${API_URL}/usuarios/${username}`);
        if (!response.ok) throw new Error('Error al cargar perfil');

        const data = await response.json();

        // Actualizar nivel
        if (data.nivel_info) {
            document.getElementById('perfilNivelBadge').textContent = data.nivel_info.insignia || '🌱';
            document.getElementById('perfilNivelNombre').textContent = data.nivel_info.nombre || 'Novato';
        }

        // Actualizar puntos desde servidor
        document.getElementById('perfilPuntos').textContent = data.puntos_totales || 0;
        document.getElementById('perfilNivel').textContent = data.nivel || 1;

        // Cargar IAs y reseñas
        await cargarMisIAs();
        await cargarMisResenas();

    } catch (error) {
        console.error('Error al cargar datos:', error);
    }
}

// Cargar mis IAs publicadas
async function cargarMisIAs() {
    const loading = document.getElementById('iasLoading');
    const empty = document.getElementById('iasEmpty');
    const lista = document.getElementById('misIAsLista');

    try {
        const response = await fetch(`${API_URL}/ias/usuario/mis-ias`, {
            headers: obtenerHeaders()
        });

        if (!response.ok) throw new Error('Error al cargar IAs');

        const ias = await response.json();

        loading.style.display = 'none';
        document.getElementById('perfilIAs').textContent = ias.length;

        if (ias.length === 0) {
            empty.style.display = 'block';
            return;
        }

        lista.style.display = 'block';
        lista.innerHTML = ias.map(ia => `
            <div class="ia-item">
                <div class="ia-item-info">
                    <h4>${ia.nombre}</h4>
                    <p>${truncarTexto(ia.descripcion, 60)}</p>
                    <span class="ia-item-estado estado-${ia.estado}">${ia.estado}</span>
                </div>
                <div class="ia-item-stats">
                    <span>⭐ ${parseFloat(ia.calificacion_promedio || 0).toFixed(1)}</span>
                    <span>👁 ${ia.total_usos || 0}</span>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error:', error);
        loading.innerHTML = '<p>Error al cargar IAs</p>';
    }
}

// Cargar mis reseñas
async function cargarMisResenas() {
    const loading = document.getElementById('resenasLoading');
    const empty = document.getElementById('resenasEmpty');
    const lista = document.getElementById('misResenasLista');

    try {
        const usuario = obtenerUsuario();
        const response = await fetch(`${API_URL}/usuarios/${usuario.username}/resenas`);

        if (!response.ok) throw new Error('Error al cargar reseñas');

        const resenas = await response.json();

        loading.style.display = 'none';
        document.getElementById('perfilResenas').textContent = resenas.length;

        if (resenas.length === 0) {
            empty.style.display = 'block';
            return;
        }

        lista.style.display = 'block';
        lista.innerHTML = resenas.map(resena => `
            <div class="resena-item">
                <div class="resena-item-header">
                    <h4>${resena.ias?.nombre || 'IA'}</h4>
                    <span class="resena-estrellas">${'★'.repeat(resena.puntuacion)}${'☆'.repeat(5 - resena.puntuacion)}</span>
                </div>
                <p>${resena.comentario || 'Sin comentario'}</p>
                <span class="resena-fecha">${formatearFecha(resena.fecha)}</span>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error:', error);
        loading.innerHTML = '<p>Error al cargar reseñas</p>';
    }
}

// Cambiar tab
function cambiarTab(tabId) {
    // Actualizar botones
    document.querySelectorAll('.perfil-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

    // Mostrar contenido
    document.querySelectorAll('.perfil-tab-content').forEach(content => {
        content.style.display = 'none';
    });
    document.getElementById(`tab-${tabId}`).style.display = 'block';
}

// Utilidades
function truncarTexto(texto, max) {
    if (!texto) return '';
    return texto.length > max ? texto.substring(0, max) + '...' : texto;
}

function formatearFecha(fecha) {
    if (!fecha) return '';
    return new Date(fecha).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    cargarPerfil();
});

// Abrir modal de editar perfil
function abrirModalEditarPerfil() {
    const usuario = obtenerUsuario();
    if (!usuario) return;

    document.getElementById('editUsername').value = usuario.username;
    document.getElementById('editBiografia').value = usuario.biografia || '';
    document.getElementById('editarPerfilError').textContent = '';

    abrirModal('editarPerfilModal');
}

// Guardar perfil
async function guardarPerfil(event) {
    event.preventDefault();

    const username = document.getElementById('editUsername').value.trim();
    const biografia = document.getElementById('editBiografia').value.trim();
    const btn = document.getElementById('guardarPerfilBtn');
    const errorDiv = document.getElementById('editarPerfilError');

    btn.disabled = true;
    btn.textContent = 'Guardando...';
    errorDiv.textContent = '';

    try {
        const response = await fetch(`${API_URL}/usuarios/perfil`, {
            method: 'PUT',
            headers: obtenerHeaders(),
            body: JSON.stringify({ username, biografia })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Error al guardar');
        }

        // Actualizar localStorage
        const usuario = obtenerUsuario();
        usuario.username = data.usuario.username;
        usuario.biografia = data.usuario.biografia;
        localStorage.setItem('usuario', JSON.stringify(usuario));

        // Actualizar UI
        document.getElementById('perfilNombre').textContent = usuario.username;
        document.getElementById('perfilAvatar').textContent = usuario.username.substring(0, 2).toUpperCase();
        actualizarHeaderUsuario();

        mostrarNotificacion('Perfil actualizado', 'success');
        cerrarModal('editarPerfilModal');

    } catch (error) {
        errorDiv.textContent = error.message;
    } finally {
        btn.disabled = false;
        btn.textContent = 'Guardar Cambios';
    }
}