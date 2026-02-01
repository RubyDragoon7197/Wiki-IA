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
// Crear tarjeta individual de IA
function crearTarjetaIA(ia) {
    const card = document.createElement('div');
    card.className = 'ai-card';
    card.dataset.rating = ia.calificacion_promedio || 0;
    card.dataset.uses = ia.total_usos || 0;
    card.dataset.date = ia.fecha_publicacion;

    const rating = parseFloat(ia.calificacion_promedio) || 0;

    card.innerHTML = `
        <div class="ai-card-clickable" onclick="abrirDetalleIA(${ia.ia_id})">
            <div class="ai-card-header">
                <div class="ai-logo-placeholder">
                    ${ia.imagen_logo 
                        ? `<img src="${ia.imagen_logo}" alt="${ia.nombre}" onerror="this.parentElement.innerHTML='🤖'">`
                        : (ia.categorias?.icono || '🤖')
                    }
                </div>
                <div class="ai-rating">
                    <span class="star-filled">★</span>
                    <span>${rating.toFixed(1)}</span>
                </div>
            </div>
            <h3 class="ai-name">${ia.nombre}</h3>
            <p class="ai-description">${truncarTexto(ia.descripcion, 80)}</p>
            <div class="ai-meta">
                <span class="ai-category">${ia.categorias?.icono || '📁'} ${ia.categorias?.nombre || 'General'}</span>
            </div>
            <div class="ai-stats">
                <span>🎯 ${formatearNumero(ia.total_usos)} usos</span>
                <span>📅 ${formatearFechaMes(ia.fecha_publicacion)}</span>
            </div>
        </div>
        <a href="${ia.url}" target="_blank" rel="noopener noreferrer" class="btn btn-primary ai-link-btn" onclick="event.stopPropagation()">
            Visitar IA
        </a>
    `;

    return card;
}

// Agregar esta función si no existe
function formatearFechaMes(fecha) {
    if (!fecha) return '';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
        month: 'short',
        year: 'numeric'
    });
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
