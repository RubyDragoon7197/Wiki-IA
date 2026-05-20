// =============================================================================
// CHATBOT - Historial persistente por usuario en base de datos
// =============================================================================

const chatbotBtn = document.getElementById('chatbotBtn');
const chatbotWindow = document.getElementById('chatbotWindow');
const chatbotClose = document.getElementById('chatbotClose');
const chatSend = document.getElementById('chatSend');
const chatInput = document.getElementById('chatInput');
const chatbotBody = document.getElementById('chatbotBody');

if (chatbotBtn && chatbotWindow && chatbotClose && chatSend && chatInput && chatbotBody) {

    // Escuchar clics en los enlaces generados por el bot
    chatbotBody.addEventListener('click', (e) => {
        const botLink = e.target.closest('.link-modal-bot');
        if (botLink) {
            e.preventDefault();
            const idIA = botLink.getAttribute('data-id');
            if (typeof abrirDetalleIA === 'function') {
                abrirDetalleIA(idIA);
            }
        }
    });

    // ── Renderizar un mensaje en el chat ──────────────────────────────────
    function agregarMensaje(texto, esUsuario) {
        const div = document.createElement('div');
        div.className = `chat-message ${esUsuario ? 'user-message' : ''}`;

        if (esUsuario) {
            div.innerHTML = `<p><strong>Tú:</strong> ${texto}</p>`;
        } else {
            // Formatear markdown del bot
            const formateado = texto
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\[([^\]]+)\]\s*\(javascript:abrirDetalleIA\(([^)]+)\)\)/g,
                    '<a href="#" class="link-modal-bot" data-id="$2" style="color:#007bff;text-decoration:underline;font-weight:bold;cursor:pointer;">$1</a>')
                .replace(/\n/g, '<br>');
            div.innerHTML = `<p>${formateado}</p>`;
        }

        chatbotBody.appendChild(div);
        chatbotBody.scrollTop = chatbotBody.scrollHeight;
        return div;
    }

    // ── Cargar historial desde BD (si está logueado) o sessionStorage ─────
    async function cargarHistorial() {
        const usuario = typeof obtenerUsuario === 'function' ? obtenerUsuario() : null;

        if (usuario) {
            // Usuario autenticado → cargar desde BD
            try {
                const headers = typeof obtenerHeaders === 'function' ? obtenerHeaders() : {};
                const response = await fetch(`${API_URL}/chatbot/historial`, { headers });

                if (response.ok) {
                    const historial = await response.json();

                    if (historial.length === 0) {
                        // Mostrar mensaje de bienvenida si no hay historial
                        chatbotBody.innerHTML = '<div class="chat-message"><p>¡Hola! ¿En qué puedo ayudarte hoy?</p></div>';
                        return;
                    }

                    chatbotBody.innerHTML = '';
                    historial.forEach(item => {
                        agregarMensaje(item.mensaje, true);
                        agregarMensaje(item.respuesta, false);
                    });
                    return;
                }
            } catch (e) {
                console.error('Error al cargar historial:', e);
            }
        }

        // Sin sesión → usar sessionStorage como antes
        const history = sessionStorage.getItem('chatbot_history');
        if (history) {
            chatbotBody.innerHTML = '';
            const messages = JSON.parse(history);
            messages.forEach(msg => {
                agregarMensaje(msg.text, msg.isUser);
            });
        }
    }

    // ── Guardar en sessionStorage (usuarios sin sesión) ───────────────────
    function guardarEnSession(texto, esUsuario) {
        const usuario = typeof obtenerUsuario === 'function' ? obtenerUsuario() : null;
        if (usuario) return; // si está logueado, la BD lo guarda

        const history = sessionStorage.getItem('chatbot_history');
        const messages = history ? JSON.parse(history) : [{ text: '¡Hola! Soy el asistente de Wiki-IA.', isUser: false }];
        messages.push({ text: texto, isUser: esUsuario });
        sessionStorage.setItem('chatbot_history', JSON.stringify(messages));
    }

    // ── Enviar mensaje ────────────────────────────────────────────────────
    async function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;

        agregarMensaje(message, true);
        guardarEnSession(message, true);
        chatInput.value = '';

        // Indicador de escritura
        const typingDiv = document.createElement('div');
        typingDiv.className = 'chat-message';
        typingDiv.innerHTML = '<p><em>Escribiendo...</em></p>';
        chatbotBody.appendChild(typingDiv);
        chatbotBody.scrollTop = chatbotBody.scrollHeight;

        try {
            // Enviar token si está logueado para que el backend guarde en BD
            const headers = { 'Content-Type': 'application/json' };
            const token = localStorage.getItem('token');
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(`${API_URL}/chatbot`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ mensaje: message })
            });

            const data = await response.json();
            typingDiv.remove();

            agregarMensaje(data.respuesta, false);
            guardarEnSession(data.respuesta, false);

        } catch (error) {
            console.error('Error:', error);
            typingDiv.remove();
        }
    }

    // ── Abrir / cerrar chatbot ────────────────────────────────────────────
    chatbotBtn.addEventListener('click', async () => {
        chatbotWindow.classList.add('active');
        chatbotBtn.style.display = 'none';
        sessionStorage.setItem('chatbot_state', 'open');
        await cargarHistorial();
    });

    chatbotClose.addEventListener('click', () => {
        chatbotWindow.classList.remove('active');
        chatbotBtn.style.display = 'flex';
        sessionStorage.setItem('chatbot_state', 'closed');
    });

    chatSend.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });

    // Restaurar estado abierto si venía abierto
    if (sessionStorage.getItem('chatbot_state') === 'open') {
        chatbotWindow.classList.add('active');
        chatbotBtn.style.display = 'none';
        cargarHistorial();
    }
}

// =============================================================================
// TOGGLE DE CATEGORÍAS - Sidebar derecho
// =============================================================================

const categoriesToggle = document.getElementById('categoriesToggle');
const categoriesList = document.getElementById('categoriesList');

if (categoriesToggle) {
    categoriesToggle.addEventListener('click', () => {
        categoriesToggle.classList.toggle('active');
        categoriesList.classList.toggle('active');
    });
}

// =============================================================================
// SISTEMA DE PAGINACIÓN CON API REAL
// =============================================================================

class Pagination {
    constructor(itemsPerPage = 12) {
        this.itemsPerPage = itemsPerPage;
        this.currentPage = 1;
        this.totalItems = 0;
        this.currentFilter = 'most-used';
        this.allAIs = [];
        
        this.aiGrid = document.getElementById('aiGrid');
        this.paginationContainer = document.getElementById('paginationContainer');
        this.paginationNumbers = document.getElementById('paginationNumbers');
        this.paginationInfo = document.getElementById('paginationInfo');
        this.btnPrevious = document.getElementById('btnPrevious');
        this.btnNext = document.getElementById('btnNext');
        this.mainTitle = document.getElementById('mainTitle');
        
        this.init();
    }
    
    async init() {
        if (this.btnPrevious) this.btnPrevious.addEventListener('click', () => this.previousPage());
        if (this.btnNext) this.btnNext.addEventListener('click', () => this.nextPage());
        await this.loadAIsFromAPI();
        this.loadPage(1);
    }
    
    async loadAIsFromAPI() {
        try {
            if (this.aiGrid) {
                this.aiGrid.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>Cargando IAs...</p></div>';
            }
            const response = await fetch(`${API_URL}/ias`);
            if (!response.ok) throw new Error('Error al cargar IAs');
            this.allAIs = await response.json();
        } catch (error) {
            console.error('Error al cargar IAs:', error);
            if (this.aiGrid) {
                this.aiGrid.innerHTML = '<div class="empty-state"><div class="empty-icon">❌</div><h3>Error al cargar</h3><p>No se pudieron cargar las IAs</p></div>';
            }
        }
    }
    
    filterAndSort(filter) {
        this.currentFilter = filter;
        let sorted = [...this.allAIs];
        switch(filter) {
            case 'latest':    sorted.sort((a, b) => new Date(b.fecha_publicacion) - new Date(a.fecha_publicacion)); break;
            case 'top-rated': sorted.sort((a, b) => (parseFloat(b.calificacion_promedio) || 0) - (parseFloat(a.calificacion_promedio) || 0)); break;
            case 'most-used': sorted.sort((a, b) => (b.total_usos || 0) - (a.total_usos || 0)); break;
        }
        return sorted;
    }
    
    loadPage(page) {
        this.currentPage = page;
        const filteredAIs = this.filterAndSort(this.currentFilter);
        this.totalItems = filteredAIs.length;
        const startIndex = (page - 1) * this.itemsPerPage;
        const pageItems = filteredAIs.slice(startIndex, startIndex + this.itemsPerPage);
        this.renderAIs(pageItems);
        this.updatePaginationControls();
    }
    
    renderAIs(ias) {
        if (!this.aiGrid) return;
        if (ias.length === 0) {
            this.aiGrid.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><h3>No hay IAs</h3><p>Aún no hay IAs publicadas</p></div>';
            return;
        }
        this.aiGrid.innerHTML = '';
        ias.forEach(ia => this.aiGrid.appendChild(this.createAICard(ia)));
    }
    
    createAICard(ia) {
        const card = document.createElement('div');
        card.className = 'ai-card';
        const rating = parseFloat(ia.calificacion_promedio) || 0;
        const fecha = ia.fecha_publicacion ? new Date(ia.fecha_publicacion) : new Date();
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
                <p class="ai-description">${this.truncarTexto(ia.descripcion, 80)}</p>
                <div class="ai-meta">
                    <span class="ai-category">${ia.categorias?.icono || '📁'} ${ia.categorias?.nombre || 'General'}</span>
                </div>
                <div class="ai-stats">
                    <span>${this.formatearNumero(ia.total_usos)} usos</span>
                    <span>📅 ${fecha.toLocaleDateString('es', {month: 'short', year: 'numeric'})}</span>
                </div>
            </div>
            <button class="btn btn-primary ai-link-btn" onclick="event.stopPropagation(); visitarIA('${ia.url}', ${ia.ia_id})">Visitar IA</button>
        `;
        return card;
    }
    
    truncarTexto(texto, max) {
        if (!texto) return '';
        return texto.length > max ? texto.substring(0, max) + '...' : texto;
    }
    
    formatearNumero(num) {
        if (!num) return '0';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }
    
    updatePaginationControls() {
        const totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
        if (this.btnPrevious) this.btnPrevious.disabled = this.currentPage === 1;
        if (this.btnNext) this.btnNext.disabled = this.currentPage === totalPages || totalPages === 0;
        this.renderPageNumbers(totalPages);
        if (this.paginationInfo) {
            if (this.totalItems === 0) {
                this.paginationInfo.textContent = 'No hay IAs para mostrar';
            } else {
                const start = (this.currentPage - 1) * this.itemsPerPage + 1;
                const end = Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
                this.paginationInfo.textContent = `Mostrando ${start}-${end} de ${this.totalItems} IAs`;
            }
        }
    }
    
    renderPageNumbers(totalPages) {
        if (!this.paginationNumbers) return;
        this.paginationNumbers.innerHTML = '';
        if (totalPages === 0) return;
        const maxVisible = 5;
        let startPage = Math.max(1, this.currentPage - 2);
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);
        if (endPage - startPage < maxVisible - 1) startPage = Math.max(1, endPage - maxVisible + 1);
        if (startPage > 1) { this.addPageButton(1); if (startPage > 2) this.addDots(); }
        for (let i = startPage; i <= endPage; i++) this.addPageButton(i);
        if (endPage < totalPages) { if (endPage < totalPages - 1) this.addDots(); this.addPageButton(totalPages); }
    }
    
    addPageButton(page) {
        const button = document.createElement('button');
        button.className = `pagination-number${page === this.currentPage ? ' active' : ''}`;
        button.textContent = page;
        button.addEventListener('click', () => this.loadPage(page));
        this.paginationNumbers.appendChild(button);
    }
    
    addDots() {
        const dots = document.createElement('span');
        dots.className = 'pagination-dots';
        dots.textContent = '...';
        this.paginationNumbers.appendChild(dots);
    }
    
    previousPage() { if (this.currentPage > 1) this.loadPage(this.currentPage - 1); }
    nextPage() { const t = Math.ceil(this.totalItems / this.itemsPerPage); if (this.currentPage < t) this.loadPage(this.currentPage + 1); }
    changeFilter(filter) { this.currentFilter = filter; this.loadPage(1); }
}

// =============================================================================
// INICIALIZACIÓN
// =============================================================================

let pagination;

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('aiGrid') && document.getElementById('paginationContainer')) {
        pagination = new Pagination(12);
    }

    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.getAttribute('data-filter');
            const titles = {
                'latest': 'Últimas IAs Publicadas',
                'top-rated': 'IAs Mejor Calificadas',
                'most-used': 'IAs Más Usadas'
            };
            const mainTitle = document.getElementById('mainTitle');
            if (mainTitle) mainTitle.textContent = titles[filter];
            if (pagination) pagination.changeFilter(filter);
        });
    });
});

// =============================================================================
// BÚSQUEDA GLOBAL
// =============================================================================

function configurarBusquedaGlobal() {
    const searchInput = document.querySelector('.search-input');
    if (!searchInput) return;

    let timeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(timeout);
        const termino = e.target.value.trim();
        timeout = setTimeout(async () => {
            if (termino.length < 2) { restaurarVistaNormal(); return; }
            await buscarIAs(termino);
        }, 300);
    });

    searchInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            const termino = e.target.value.trim();
            if (termino.length >= 2) await buscarIAs(termino);
            else restaurarVistaNormal();
        }
    });
}

function restaurarVistaNormal() {
    const mainTitle = document.getElementById('mainTitle');
    if (mainTitle) mainTitle.textContent = 'IAs Más Usadas';
    const paginationContainer = document.getElementById('paginationContainer');
    if (paginationContainer) paginationContainer.style.display = 'flex';
    if (pagination) pagination.loadPage(1);
}

async function buscarIAs(termino) {
    const aiGrid = document.getElementById('aiGrid');
    if (!aiGrid) return;
    aiGrid.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>Buscando...</p></div>';
    try {
        const response = await fetch(`${API_URL}/ias/buscar/${encodeURIComponent(termino)}`);
        if (!response.ok) throw new Error('Error en búsqueda');
        const ias = await response.json();
        const mainTitle = document.getElementById('mainTitle');
        if (mainTitle) mainTitle.textContent = `Resultados para "${termino}"`;
        const paginationContainer = document.getElementById('paginationContainer');
        const paginationInfo = document.getElementById('paginationInfo');
        if (paginationContainer) paginationContainer.style.display = 'none';
        if (paginationInfo) paginationInfo.textContent = `${ias.length} resultado(s) encontrado(s)`;
        if (ias.length === 0) {
            aiGrid.innerHTML = `<div class="empty-state"><div class="empty-icon">🔍</div><h3>Sin resultados</h3><p>No se encontraron IAs para "${termino}"</p></div>`;
            return;
        }
        aiGrid.innerHTML = '';
        ias.forEach(ia => aiGrid.appendChild(crearTarjetaBusqueda(ia)));
    } catch (error) {
        console.error('Error en búsqueda:', error);
        aiGrid.innerHTML = '<div class="empty-state"><div class="empty-icon">❌</div><h3>Error</h3><p>No se pudo realizar la búsqueda</p></div>';
    }
}

function crearTarjetaBusqueda(ia) {
    const card = document.createElement('div');
    card.className = 'ai-card';
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
            <p class="ai-description">${ia.descripcion ? ia.descripcion.substring(0, 80) + '...' : ''}</p>
            <div class="ai-meta">
                <span class="ai-category">${ia.categorias?.icono || '📁'} ${ia.categorias?.nombre || 'General'}</span>
            </div>
        </div>
        <button class="btn btn-primary ai-link-btn" onclick="event.stopPropagation(); visitarIA('${ia.url}', ${ia.ia_id})">Visitar IA</button>
    `;
    return card;
}

document.addEventListener('DOMContentLoaded', () => { configurarBusquedaGlobal(); });

// =============================================================================
// MENÚ MÓVIL
// =============================================================================

function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    const overlay = document.getElementById('mobileMenuOverlay');
    if (menu && overlay) {
        menu.classList.toggle('active');
        overlay.classList.toggle('active');
        document.body.style.overflow = menu.classList.contains('active') ? 'hidden' : '';
    }
    const usuario = obtenerUsuario();
    const mobileMenuUser = document.getElementById('mobileMenuUser');
    if (usuario && mobileMenuUser) {
        mobileMenuUser.style.display = 'flex';
        document.getElementById('mobileUserName').textContent = usuario.username;
        document.getElementById('mobileUserPoints').textContent = `${usuario.puntos_totales || 0} pts`;
    } else if (mobileMenuUser) {
        mobileMenuUser.style.display = 'none';
    }
}