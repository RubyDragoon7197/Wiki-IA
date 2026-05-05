// =============================================
// FAVORITOS - Cargar y mostrar IAs favoritas
// =============================================

// Cargar favoritos del usuario
async function cargarFavoritos() {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const loginRequired = document.getElementById('loginRequired');
    const aiGrid = document.getElementById('aiGrid');

    // Verificar si está logueado
    if (!estaAutenticado()) {
        loadingState.style.display = 'none';
        loginRequired.style.display = 'block';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/favoritos`, {
            headers: obtenerHeaders()
        });

        if (!response.ok) throw new Error('Error al cargar favoritos');

        const favoritos = await response.json();

        // Ocultar loading
        loadingState.style.display = 'none';

        // Actualizar contador
        document.getElementById('totalFavoritos').textContent = favoritos.length;

        // Mostrar favoritos o estado vacío
        if (favoritos.length > 0) {
            aiGrid.style.display = 'grid';
            renderizarFavoritos(favoritos);
        } else {
            emptyState.style.display = 'block';
        }

    } catch (error) {
        console.error('Error al cargar favoritos:', error);
        loadingState.innerHTML = `
            <div class="error-state">
                <div class="error-icon">❌</div>
                <h3>Error al cargar</h3>
                <p>No se pudieron cargar los favoritos.</p>
                <button class="btn btn-primary" onclick="cargarFavoritos()">Reintentar</button>
            </div>
        `;
    }
}

// Renderizar tarjetas de favoritos
function renderizarFavoritos(favoritos) {
    const aiGrid = document.getElementById('aiGrid');
    aiGrid.innerHTML = '';

    favoritos.forEach(fav => {
        const ia = fav.ias;
        if (!ia) return;

        const card = crearTarjetaFavorito(ia);
        aiGrid.appendChild(card);
    });
}

// Crear tarjeta de favorito
function crearTarjetaFavorito(ia) {
    const card = document.createElement('div');
    card.className = 'ai-card';
    card.id = `favorito-${ia.ia_id}`;

    const rating = parseFloat(ia.calificacion_promedio) || 0;

    card.innerHTML = `
        <div class="ai-card-clickable" onclick="abrirDetalleIA(${ia.ia_id})">
            <div class="ai-card-header">
                <div class="ai-logo-placeholder">
                    ${ia.imagen_logo 
                        ? `<img src="${ia.imagen_logo}" alt="${ia.nombre}" onerror="this.parentElement.innerHTML='🤖'">`
                        : '🤖'
                    }
                </div>
                <div class="ai-rating">
                    <span class="star-filled">★</span>
                    <span>${rating.toFixed(1)}</span>
                </div>
            </div>
            <h3 class="ai-name">${ia.nombre}</h3>
            <p class="ai-description">${truncarTexto(ia.descripcion, 80)}</p>
            <div class="ai-stats">
                <span>🎯 ${formatearNumero(ia.total_usos)} usos</span>
            </div>
        </div>
        <div class="ai-card-actions-fav">
            <a href="${ia.url}" target="_blank" class="btn btn-primary ai-link-btn" onclick="event.stopPropagation()">
                Visitar IA
            </a>
            <button class="btn btn-secondary btn-quitar-fav" onclick="quitarFavorito(${ia.ia_id}, event)">
                ❌
            </button>
        </div>
    `;

    return card;
}

// Quitar de favoritos
async function quitarFavorito(iaId, event) {
    event.stopPropagation();

    try {
        const response = await fetch(`${API_URL}/favoritos/${iaId}`, {
            method: 'DELETE',
            headers: obtenerHeaders()
        });

        if (!response.ok) throw new Error('Error al quitar favorito');

        // Remover tarjeta con animación
        const card = document.getElementById(`favorito-${iaId}`);
        if (card) {
            card.style.transition = 'all 0.3s';
            card.style.opacity = '0';
            card.style.transform = 'scale(0.8)';
            setTimeout(() => {
                card.remove();
                
                // Actualizar contador
                const total = document.querySelectorAll('.ai-card').length;
                document.getElementById('totalFavoritos').textContent = total;

                // Mostrar estado vacío si no quedan favoritos
                if (total === 0) {
                    document.getElementById('aiGrid').style.display = 'none';
                    document.getElementById('emptyState').style.display = 'block';
                }
            }, 300);
        }

        mostrarNotificacion('Eliminado de favoritos', 'info');

    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al quitar favorito', 'error');
    }
}

// Funciones auxiliares (por si no están definidas)
function truncarTexto(texto, max) {
    if (!texto) return '';
    return texto.length > max ? texto.substring(0, max) + '...' : texto;
}

function formatearNumero(num) {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    cargarFavoritos();
});