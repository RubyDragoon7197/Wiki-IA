// Variables globales para el detalle
let iaActual = null;
let calificacionSeleccionada = 0;

console.log('resenas.js cargado correctamente');

// Abrir modal de detalle de IA
// Abrir modal de detalle de IA
async function abrirDetalleIA(iaId) {
    const modal = document.getElementById('iaDetalleModal');
    if (!modal) {
        console.error('Modal iaDetalleModal no encontrado');
        return;
    }

    abrirModal('iaDetalleModal');

    try {
        // Obtener datos de la IA
        const response = await fetch(`${API_URL}/ias/${iaId}`);
        if (!response.ok) throw new Error('IA no encontrada');

        iaActual = await response.json();

        // Llenar datos en el modal
        llenarDetalleIA(iaActual);
        // Cargar reseñas
cargarResenas(iaId);
// Verificar formulario de reseña
verificarEstadoFormularioResena(iaId);
// Verificar si es favorito
verificarSiEsFavorito(iaId);

// Resetear calificación
calificacionSeleccionada = 0;

    } catch (error) {
        console.error('Error al cargar detalle:', error);
        cerrarModal('iaDetalleModal');
        mostrarNotificacion('Error al cargar la IA', 'error');
    }
}

// Llenar datos de la IA en el modal
// Llenar datos de la IA en el modal
function llenarDetalleIA(ia) {
    // Logo
    const logoContainer = document.getElementById('iaDetalleLogo');
    if (ia.imagen_logo) {
        logoContainer.innerHTML = `<img src="${ia.imagen_logo}" alt="${ia.nombre}" onerror="this.parentElement.innerHTML='🤖'">`;
    } else {
        logoContainer.innerHTML = ia.categorias?.icono || '🤖';
    }

    // Info básica
    document.getElementById('iaDetalleNombre').textContent = ia.nombre;
    document.getElementById('iaDetalleCategoria').textContent = `${ia.categorias?.icono || '📁'} ${ia.categorias?.nombre || 'General'}`;

    // Rating
    const rating = parseFloat(ia.calificacion_promedio) || 0;
    document.getElementById('iaDetalleRating').innerHTML = `
        <span class="star-filled">★</span> ${rating.toFixed(1)}
    `;

    // Descripción
    document.getElementById('iaDetalleDescripcion').textContent = ia.descripcion;

    // Stats
    document.getElementById('iaDetalleUsos').textContent = formatearNumeroCorto(ia.total_usos || 0);
    document.getElementById('iaDetalleNumResenas').textContent = ia.total_resenas || 0;

    // URL del botón
    document.getElementById('iaDetalleUrl').href = ia.url;
    // Limpiar formulario
    calificacionSeleccionada = 0;
    actualizarEstrellasVisuales(0);
    document.getElementById('calificacionTexto').textContent = 'Selecciona';
    document.getElementById('resenaComentario').value = '';
}

// Utilidad para formatear números
function formatearNumeroCorto(num) {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}
// Cargar reseñas de la IA
async function cargarResenas(iaId) {
    const container = document.getElementById('resenasLista');
    container.innerHTML = '<div class="resenas-loading">Cargando reseñas...</div>';

    try {
        const response = await fetch(`${API_URL}/resenas/ia/${iaId}`);
        if (!response.ok) throw new Error('Error al cargar reseñas');

        const resenas = await response.json();

        // Actualizar contador
        document.getElementById('resenasCount').textContent = `(${resenas.length})`;
        document.getElementById('iaDetalleNumResenas').textContent = resenas.length;

        if (resenas.length === 0) {
            container.innerHTML = `
                <div class="resenas-empty">
                    <p>Aún no hay reseñas. ¡Sé el primero en opinar!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = resenas.map(resena => {
            const usuario = resena.usuarios || {};
            const iniciales = (usuario.username || 'U').substring(0, 2).toUpperCase();
            const estrellas = '★'.repeat(resena.puntuacion) + '☆'.repeat(5 - resena.puntuacion);

            return `
                <div class="resena-card">
                    <div class="resena-header">
                        <div class="resena-usuario">
                            <div class="resena-avatar">${iniciales}</div>
                            <div class="resena-usuario-info">
                                <span class="resena-username">${usuario.username || 'Usuario'}</span>
                                <span class="resena-fecha">${formatearFechaCorta(resena.fecha)}</span>
                            </div>
                        </div>
                        <div class="resena-estrellas">${estrellas}</div>
                    </div>
                    ${resena.comentario 
                        ? `<p class="resena-comentario">${resena.comentario}</p>`
                        : `<p class="resena-comentario resena-sin-comentario">Sin comentario</p>`
                    }
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error al cargar reseñas:', error);
        container.innerHTML = '<div class="resenas-empty">Error al cargar reseñas</div>';
    }
}

// Formatear fecha corta
function formatearFechaCorta(fecha) {
    if (!fecha) return '-';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
        month: 'short',
        year: 'numeric'
    });
}

// Verificar estado del formulario de reseña
async function verificarEstadoFormularioResena(iaId) {
    const form = document.getElementById('resenaForm');
    const loginRequired = document.getElementById('resenaLoginRequired');
    const yaEnviada = document.getElementById('resenaYaEnviada');

    // Ocultar todo primero
    form.style.display = 'none';
    loginRequired.style.display = 'none';
    yaEnviada.style.display = 'none';

    if (!estaAutenticado()) {
        loginRequired.style.display = 'block';
        return;
    }

    // Verificar si ya dejó reseña
    try {
        const response = await fetch(`${API_URL}/resenas/ia/${iaId}`);
        const resenas = await response.json();
        const usuario = obtenerUsuario();

        const yaReseno = resenas.some(r => r.usuario_id === usuario.user_id);

        if (yaReseno) {
            yaEnviada.style.display = 'block';
        } else {
            form.style.display = 'block';
            configurarEstrellasInteractivas();
        }
    } catch (error) {
        form.style.display = 'block';
        configurarEstrellasInteractivas();
    }
}

// Configurar estrellas interactivas
function configurarEstrellasInteractivas() {
    const estrellas = document.querySelectorAll('#estrellasInput .estrella');

    estrellas.forEach(estrella => {
        estrella.addEventListener('mouseenter', () => {
            const valor = parseInt(estrella.dataset.value);
            actualizarEstrellasVisuales(valor, true);
        });

        estrella.addEventListener('mouseleave', () => {
            actualizarEstrellasVisuales(calificacionSeleccionada);
        });

        estrella.addEventListener('click', () => {
            calificacionSeleccionada = parseInt(estrella.dataset.value);
            actualizarEstrellasVisuales(calificacionSeleccionada);
            actualizarTextoCalificacion(calificacionSeleccionada);
        });
    });
}

// Actualizar visualización de estrellas
function actualizarEstrellasVisuales(valor, esHover = false) {
    const estrellas = document.querySelectorAll('#estrellasInput .estrella');

    estrellas.forEach(estrella => {
        const v = parseInt(estrella.dataset.value);
        estrella.classList.remove('active', 'hover');

        if (v <= valor) {
            estrella.classList.add(esHover ? 'hover' : 'active');
        }
    });
}

// Actualizar texto de calificación
function actualizarTextoCalificacion(valor) {
    const textos = {
        1: 'Muy malo',
        2: 'Malo',
        3: 'Regular',
        4: 'Bueno',
        5: 'Excelente'
    };
    document.getElementById('calificacionTexto').textContent = textos[valor] || 'Selecciona';
}

// Enviar reseña
async function enviarResena() {
    if (!iaActual) return;

    if (calificacionSeleccionada === 0) {
        mostrarNotificacion('Selecciona una calificación', 'warning');
        return;
    }

    const comentario = document.getElementById('resenaComentario').value.trim();
    const btn = document.getElementById('btnEnviarResena');

    btn.disabled = true;
    btn.textContent = 'Enviando...';

    try {
        const response = await fetch(`${API_URL}/resenas`, {
            method: 'POST',
            headers: obtenerHeaders(),
            body: JSON.stringify({
                ia_id: iaActual.ia_id,
                puntuacion: calificacionSeleccionada,
                comentario: comentario || null
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Error al enviar reseña');
        }

        mostrarNotificacion('¡Reseña publicada! +10 puntos', 'success');

        // Actualizar puntos del usuario en localStorage
        const usuario = obtenerUsuario();
        if (usuario) {
            usuario.puntos_totales = (usuario.puntos_totales || 0) + 10;
            localStorage.setItem('usuario', JSON.stringify(usuario));
            actualizarHeaderUsuario();
        }

        // Recargar reseñas y formulario
        await cargarResenas(iaActual.ia_id);
        verificarEstadoFormularioResena(iaActual.ia_id);

    } catch (error) {
        mostrarNotificacion(error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Publicar Reseña';
    }
}

// Verificar si es favorito
async function verificarSiEsFavorito(iaId) {
    const btn = document.getElementById('btnFavoritoDetalle');
    const icon = document.getElementById('favoritoIcon');

    if (!estaAutenticado()) {
        icon.textContent = '🤍';
        btn.classList.remove('favorito-activo');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/favoritos/check/${iaId}`, {
            headers: obtenerHeaders()
        });
        const { esFavorito } = await response.json();

        if (esFavorito) {
            icon.textContent = '❤️';
            btn.classList.add('favorito-activo');
        } else {
            icon.textContent = '🤍';
            btn.classList.remove('favorito-activo');
        }
    } catch (error) {
        console.error('Error al verificar favorito:', error);
    }
}

// Toggle favorito desde el detalle
async function toggleFavoritoDetalle() {
    if (!iaActual) return;

    if (!estaAutenticado()) {
        mostrarNotificacion('Inicia sesión para guardar favoritos', 'warning');
        cambiarModal('iaDetalleModal', 'loginModal');
        return;
    }

    const btn = document.getElementById('btnFavoritoDetalle');
    const icon = document.getElementById('favoritoIcon');
    const esFavorito = btn.classList.contains('favorito-activo');

    try {
        if (esFavorito) {
            await fetch(`${API_URL}/favoritos/${iaActual.ia_id}`, {
                method: 'DELETE',
                headers: obtenerHeaders()
            });
            icon.textContent = '🤍';
            btn.classList.remove('favorito-activo');
            mostrarNotificacion('Eliminado de favoritos', 'info');
        } else {
            await fetch(`${API_URL}/favoritos`, {
                method: 'POST',
                headers: obtenerHeaders(),
                body: JSON.stringify({ ia_id: iaActual.ia_id })
            });
            icon.textContent = '❤️';
            btn.classList.add('favorito-activo');
            mostrarNotificacion('Agregado a favoritos ❤️', 'success');
        }
    } catch (error) {
        mostrarNotificacion('Error al actualizar favoritos', 'error');
    }
}