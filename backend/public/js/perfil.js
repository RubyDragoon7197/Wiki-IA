// =============================================
// PERFIL DE USUARIO
// =============================================

// Variable global para guardar los datos completos del servidor
let datosPerfilActual = {};

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

    actualizarAvatarPerfil(usuario.avatar, usuario.username);
    document.getElementById('perfilNombre').textContent = usuario.username;
    document.getElementById('perfilEmail').textContent = usuario.email;
    document.getElementById('perfilPuntos').textContent = usuario.puntos_totales || 0;
    document.getElementById('perfilNivel').textContent = usuario.nivel || 1;

    await cargarDatosCompletos(usuario.username);
}

// Cargar datos completos desde el servidor
async function cargarDatosCompletos(username) {
    try {
        const response = await fetch(`${API_URL}/usuarios/${username}`);
        if (!response.ok) throw new Error('Error al cargar perfil');

        const data = await response.json();

        // Guardar en variable global para usarla al abrir el modal de edición
        datosPerfilActual = data;

        if (data.nivel_info) {
            document.getElementById('perfilNivelBadge').textContent = data.nivel_info.insignia || '🌱';
            document.getElementById('perfilNivelNombre').textContent = data.nivel_info.nombre || 'Novato';
        }

        const biografiaEl = document.getElementById('perfilBiografia');
        if (biografiaEl && data.biografia) {
            biografiaEl.textContent = `"${data.biografia}"`;
            biografiaEl.style.display = 'block';
        } else if (biografiaEl) {
            biografiaEl.style.display = 'none';
        }

        actualizarAvatarPerfil(data.avatar, data.username);

        document.getElementById('perfilPuntos').textContent = data.puntos_totales || 0;
        document.getElementById('perfilNivel').textContent = data.nivel || 1;

        await cargarMisIAs();
        await cargarMisResenas();
        await cargarMedallas();

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
    document.querySelectorAll('.perfil-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    document.querySelectorAll('.perfil-tab-content').forEach(content => content.style.display = 'none');
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
        day: 'numeric', month: 'short', year: 'numeric'
    });
}

// =============================================
// AVATAR
// =============================================

function actualizarAvatarPerfil(url, username) {
    const avatarEl = document.getElementById('perfilAvatar');
    if (!avatarEl) return;

    if (url && url.startsWith('http')) {
        avatarEl.innerHTML = `<img src="${url}" alt="${username}" onerror="this.parentElement.innerHTML='${username.substring(0, 2).toUpperCase()}'">`;
    } else {
        avatarEl.innerHTML = '';
        avatarEl.textContent = username.substring(0, 2).toUpperCase();
    }
}

function actualizarAvatarPreview(url, username) {
    const previewText = document.getElementById('avatarPreviewText');
    const previewImg = document.getElementById('avatarPreviewImg');
    if (!previewText || !previewImg) return;

    if (url && url.startsWith('http')) {
        previewImg.src = url;
        previewImg.style.display = 'block';
        previewText.style.display = 'none';
        previewImg.onerror = () => {
            previewImg.style.display = 'none';
            previewText.style.display = 'block';
            previewText.textContent = username.substring(0, 2).toUpperCase();
        };
    } else {
        previewImg.style.display = 'none';
        previewText.style.display = 'block';
        previewText.textContent = username.substring(0, 2).toUpperCase();
    }
}

// =============================================
// MODAL EDITAR PERFIL
// =============================================

function abrirModalEditarPerfil() {
    const usuario = obtenerUsuario();
    if (!usuario) return;

    // Usar datos del servidor (datosPerfilActual) que incluyen la biografía real
    // Si aún no cargaron, caer en localStorage como fallback
    const username = datosPerfilActual.username || usuario.username;
    const biografia = datosPerfilActual.biografia || usuario.biografia || '';
    const avatar = datosPerfilActual.avatar || usuario.avatar || '';

    document.getElementById('editUsername').value = username;
    document.getElementById('editBiografia').value = biografia;
    document.getElementById('editAvatar').value = avatar;
    document.getElementById('editarPerfilError').textContent = '';

    actualizarAvatarPreview(avatar, username);

    abrirModal('editarPerfilModal');
}

async function guardarPerfil(event) {
    event.preventDefault();

    const username = document.getElementById('editUsername').value.trim();
    const biografia = document.getElementById('editBiografia').value.trim();
    const avatarInput = document.getElementById('editAvatar').value.trim();
    const btn = document.getElementById('guardarPerfilBtn');
    const errorDiv = document.getElementById('editarPerfilError');

    btn.disabled = true;
    btn.textContent = 'Guardando...';
    errorDiv.textContent = '';

    if (avatarInput && !avatarInput.startsWith('http')) {
        errorDiv.textContent = 'La URL de la foto debe comenzar con http:// o https://';
        btn.disabled = false;
        btn.textContent = 'Guardar Cambios';
        return;
    }

    const avatar = avatarInput || '';

    try {
        const response = await fetch(`${API_URL}/usuarios/perfil`, {
            method: 'PUT',
            headers: obtenerHeaders(),
            body: JSON.stringify({ username, biografia, avatar })
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.error || 'Error al guardar');

        // Actualizar localStorage
        const usuario = obtenerUsuario();
        usuario.username = data.usuario.username;
        usuario.biografia = data.usuario.biografia;
        usuario.avatar = data.usuario.avatar;
        localStorage.setItem('usuario', JSON.stringify(usuario));

        // Actualizar variable global también
        datosPerfilActual.username = data.usuario.username;
        datosPerfilActual.biografia = data.usuario.biografia;
        datosPerfilActual.avatar = data.usuario.avatar;

        // Actualizar UI
        document.getElementById('perfilNombre').textContent = usuario.username;
        actualizarAvatarPerfil(usuario.avatar, usuario.username);

        const biografiaEl = document.getElementById('perfilBiografia');
        if (biografiaEl && usuario.biografia) {
            biografiaEl.textContent = `"${usuario.biografia}"`;
            biografiaEl.style.display = 'block';
        } else if (biografiaEl) {
            biografiaEl.style.display = 'none';
        }

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

// =============================================
// MEDALLAS
// =============================================

async function cargarMedallas() {
    const container = document.getElementById('medallasLista');
    if (!container) return;

    try {
        const response = await fetch(`${API_URL}/medallas/mis-medallas`, { headers: obtenerHeaders() });
        if (!response.ok) throw new Error('Error al cargar medallas');
        const misMedallas = await response.json();

        const todasResponse = await fetch(`${API_URL}/medallas`);
        const todasMedallas = await todasResponse.json();

        const medallasObtenidas = new Set(misMedallas.map(m => m.medallas?.medalla_id));
        const iconos = { 1: '🌟', 2: '🤝', 3: '📝', 4: '🔍', 5: '🧠', 6: '👑' };

        if (todasMedallas.length === 0) {
            container.innerHTML = '<p class="medallas-empty">No hay medallas disponibles</p>';
            return;
        }

        container.innerHTML = todasMedallas.map(medalla => {
            const obtenida = medallasObtenidas.has(medalla.medalla_id);
            const miMedalla = misMedallas.find(m => m.medallas?.medalla_id === medalla.medalla_id);
            const fecha = miMedalla ? new Date(miMedalla.fecha_obtencion).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }) : '';
            return `
                <div class="medalla-item ${obtenida ? '' : 'medalla-bloqueada'}" title="${medalla.descripcion}">
                    <span class="medalla-icono">${iconos[medalla.medalla_id] || '🏅'}</span>
                    <span class="medalla-nombre">${medalla.nombre}</span>
                    ${obtenida ? `<span class="medalla-fecha">${fecha}</span>` : '<span class="medalla-fecha">🔒 Bloqueada</span>'}
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error al cargar medallas:', error);
        container.innerHTML = '<p class="medallas-empty">Error al cargar medallas</p>';
    }
}

// =============================================
// INICIALIZAR
// =============================================

document.addEventListener('DOMContentLoaded', () => {
    cargarPerfil();

    const avatarInput = document.getElementById('editAvatar');
    if (avatarInput) {
        avatarInput.addEventListener('input', (e) => {
            const usuario = obtenerUsuario();
            actualizarAvatarPreview(e.target.value, usuario?.username || 'US');
        });
    }
});