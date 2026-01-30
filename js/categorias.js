// =============================================
// CATEGORÍAS - Cargar IAs dinámicamente
// =============================================

// Obtener el slug de la categoría desde el nombre del archivo
function obtenerSlugCategoria() {
    const path = window.location.pathname;
    const filename = path.split('/').pop().replace('.html', '');
    return filename;
}

// Variables globales
let iasOriginales = [];
let categoriaActual = null;

// Cargar datos de la categoría
async function cargarCategoria() {
    const slug = obtenerSlugCategoria();
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const aiGrid = document.getElementById('aiGrid');

    try {
        // Obtener categoría con sus IAs
        const response = await fetch(`${API_URL}/categorias/${slug}`);
        
        if (!response.ok) {
            throw new Error('Categoría no encontrada');
        }

        const data = await response.json();
        categoriaActual = data.categoria;
        iasOriginales = data.ias;

        // Actualizar información de la categoría en el header
        actualizarInfoCategoria(data.categoria);

        // Ocultar loading
        loadingState.style.display = 'none';

        // Mostrar IAs o estado vacío
        if (data.ias && data.ias.length > 0) {
            document.getElementById('totalIAs').textContent = data.ias.length;
            renderizarIAs(data.ias);
        } else {
            emptyState.style.display = 'block';
            aiGrid.style.display = 'none';
        }

    } catch (error) {
        console.error('Error al cargar categoría:', error);
        loadingState.innerHTML = `
            <div class="error-state">
                <div class="error-icon">❌</div>
                <h3>Error al cargar</h3>
                <p>No se pudo cargar la categoría. Intenta de nuevo.</p>
                <button class="btn btn-primary" onclick="cargarCategoria()">Reintentar</button>
            </div>
        `;
    }
}

// Actualizar información de la categoría en la página
function actualizarInfoCategoria(categoria) {
    document.title = `${categoria.nombre} - Wiki IA`;
    document.getElementById('categoriaNombre').textContent = categoria.nombre;
    document.getElementById('categoriaTitulo').innerHTML = `
        <span class="categoria-icono">${categoria.icono}</span>
        ${categoria.nombre}
    `;
    document.getElementById('categoriaDescripcion').textContent = categoria.descripcion || '';
}

// Renderizar tarjetas de IAs
function renderizarIAs(ias) {
    const aiGrid = document.getElementById('aiGrid');
    aiGrid.innerHTML = '';
    aiGrid.style.display = 'grid';

    ias.forEach(ia => {
        const card = crearTarjetaIA(ia);
        aiGrid.appendChild(card);
    });
}

// Crear tarjeta individual de IA
function crearTarjetaIA(ia) {
    const card = document.createElement('div');
    card.className = 'ai-card';
    card.dataset.rating = ia.calificacion_promedio || 0;
    card.dataset.uses = ia.total_usos || 0;
    card.dataset.date = ia.fecha_publicacion;

    // Generar estrellas
    const rating = parseFloat(ia.calificacion_promedio) || 0;
    const estrellas = '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));

    card.innerHTML = `
        <div class="ai-card-header">
            <div class="ai-logo-placeholder">
                ${ia.imagen_logo 
                    ? `<img src="${ia.imagen_logo}" alt="${ia.nombre}" onerror="this.parentElement.innerHTML='🤖'">`
                    : '🤖'
                }
            </div>
            <div class="ai-rating">
                <span class="stars">${estrellas}</span>
                <span>${rating.toFixed(1)}</span>
            </div>
        </div>
        <h3 class="ai-name">${ia.nombre}</h3>
        <p class="ai-description">${truncarTexto(ia.descripcion, 100)}</p>
        <div class="ai-meta">
            <span class="ai-category">${categoriaActual?.icono || '📁'} ${categoriaActual?.nombre || 'General'}</span>
        </div>
        <div class="ai-stats">
            <span>👁 ${formatearNumero(ia.total_usos)} usos</span>
            <span>📝 ${ia.total_resenas || 0} reseñas</span>
        </div>
        <div class="ai-card-actions">
            <a href="${ia.url}" target="_blank" rel="noopener noreferrer" class="ai-link-btn">
                Visitar IA
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                </svg>
            </a>
            <button class="btn-icon-only" onclick="toggleFavorito(${ia.ia_id})" title="Agregar a favoritos">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                </svg>
            </button>
        </div>
    `;

    return card;
}

// Truncar texto
function truncarTexto(texto, maxLength) {
    if (!texto) return '';
    if (texto.length <= maxLength) return texto;
    return texto.substring(0, maxLength).trim() + '...';
}

// Formatear números grandes
function formatearNumero(num) {
    if (!num) return '0';
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// Filtrar IAs
function filtrarIAs(filtro) {
    let iasOrdenadas = [...iasOriginales];

    switch (filtro) {
        case 'most-used':
            iasOrdenadas.sort((a, b) => (b.total_usos || 0) - (a.total_usos || 0));
            break;
        case 'top-rated':
            iasOrdenadas.sort((a, b) => (parseFloat(b.calificacion_promedio) || 0) - (parseFloat(a.calificacion_promedio) || 0));
            break;
        case 'latest':
            iasOrdenadas.sort((a, b) => new Date(b.fecha_publicacion) - new Date(a.fecha_publicacion));
            break;
    }

    renderizarIAs(iasOrdenadas);
}

// Toggle favorito
async function toggleFavorito(iaId) {
    if (!estaAutenticado()) {
        mostrarNotificacion('Inicia sesión para guardar favoritos', 'warning');
        abrirModal('loginModal');
        return;
    }

    try {
        // Verificar si ya es favorito
        const checkResponse = await fetch(`${API_URL}/favoritos/check/${iaId}`, {
            headers: obtenerHeaders()
        });
        const { esFavorito } = await checkResponse.json();

        if (esFavorito) {
            // Quitar de favoritos
            await fetch(`${API_URL}/favoritos/${iaId}`, {
                method: 'DELETE',
                headers: obtenerHeaders()
            });
            mostrarNotificacion('Eliminado de favoritos', 'info');
        } else {
            // Agregar a favoritos
            await fetch(`${API_URL}/favoritos`, {
                method: 'POST',
                headers: obtenerHeaders(),
                body: JSON.stringify({ ia_id: iaId })
            });
            mostrarNotificacion('Agregado a favoritos ❤️', 'success');
        }
    } catch (error) {
        console.error('Error con favoritos:', error);
        mostrarNotificacion('Error al actualizar favoritos', 'error');
    }
}

// Búsqueda en tiempo real
function configurarBusqueda() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    let timeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(timeout);
        const termino = e.target.value.trim().toLowerCase();

        timeout = setTimeout(() => {
            if (termino === '') {
                renderizarIAs(iasOriginales);
            } else {
                const iasFiltradas = iasOriginales.filter(ia => 
                    ia.nombre.toLowerCase().includes(termino) ||
                    ia.descripcion.toLowerCase().includes(termino)
                );
                renderizarIAs(iasFiltradas);
            }
        }, 300);
    });
}

// Configurar filtros
function configurarFiltros() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Actualizar estado activo
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Aplicar filtro
            const filtro = btn.dataset.filter;
            filtrarIAs(filtro);
        });
    });
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    cargarCategoria();
    configurarFiltros();
    configurarBusqueda();
});
