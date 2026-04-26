// =============================================================================
// CHATBOT - Funcionalidad con historial persistente entre páginas
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

    function loadChatHistory() {
        const history = sessionStorage.getItem('chatbot_history');
        if (history) {
            const messages = JSON.parse(history);
            chatbotBody.innerHTML = '';
            messages.forEach(msg => {
                const messageDiv = document.createElement('div');
                messageDiv.className = `chat-message ${msg.isUser ? 'user-message' : ''}`;
                messageDiv.innerHTML = msg.isUser 
                    ? `<p><strong>Tú:</strong> ${msg.text}</p>`
                    : `<p>${msg.text}</p>`; 
                chatbotBody.appendChild(messageDiv);
            });
            chatbotBody.scrollTop = chatbotBody.scrollHeight;
        }
    }

    function saveMessage(text, isUser = true) {
        const history = sessionStorage.getItem('chatbot_history');
        const messages = history ? JSON.parse(history) : [{text: '¡Hola! Soy el asistente de Wiki-IA. ¿En qué puedo ayudarte?', isUser: false}];
        messages.push({text, isUser});
        sessionStorage.setItem('chatbot_history', JSON.stringify(messages));
    }

    async function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;

        // Mostrar mensaje usuario
        const userMessageDiv = document.createElement('div');
        userMessageDiv.className = 'chat-message user-message';
        userMessageDiv.innerHTML = `<p><strong>Tú:</strong> ${message}</p>`;
        chatbotBody.appendChild(userMessageDiv);
        chatInput.value = '';
        chatbotBody.scrollTop = chatbotBody.scrollHeight;
        saveMessage(message, true);

        // Indicador de carga
        const typingDiv = document.createElement('div');
        typingDiv.className = 'chat-message';
        typingDiv.innerHTML = '<p><em>Escribiendo...</em></p>';
        chatbotBody.appendChild(typingDiv);
        chatbotBody.scrollTop = chatbotBody.scrollHeight;

        try {
            const response = await fetch(`${API_URL}/chatbot`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mensaje: message })
            });

            const data = await response.json();
            typingDiv.remove();

            const botMessageDiv = document.createElement('div');
            botMessageDiv.className = 'chat-message';

            // TRADUCTOR DE MARKDOWN A HTML
            let textoFormateado = data.respuesta
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\[([^\]]+)\]\s*\(javascript:abrirDetalleIA\(([^)]+)\)\)/g, 
                    '<a href="#" class="link-modal-bot" data-id="$2" style="color: #007bff; text-decoration: underline; font-weight: bold; cursor: pointer;">$1</a>')
                .replace(/\n/g, '<br>');

            botMessageDiv.innerHTML = `<p>${textoFormateado}</p>`;
            chatbotBody.appendChild(botMessageDiv);
            chatbotBody.scrollTop = chatbotBody.scrollHeight;
            saveMessage(textoFormateado, false);

        } catch (error) {
            console.error('Error:', error);
            typingDiv.remove();
        }
    }

    chatbotBtn.addEventListener('click', () => {
        chatbotWindow.classList.add('active');
        chatbotBtn.style.display = 'none';
        sessionStorage.setItem('chatbot_state', 'open');
    });

    chatbotClose.addEventListener('click', () => {
        chatbotWindow.classList.remove('active');
        chatbotBtn.style.display = 'flex';
        sessionStorage.setItem('chatbot_state', 'closed');
    });

    chatSend.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });

    loadChatHistory();
    if (sessionStorage.getItem('chatbot_state') === 'open') {
        chatbotWindow.classList.add('active');
        chatbotBtn.style.display = 'none';
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
        if (this.btnPrevious) {
            this.btnPrevious.addEventListener('click', () => this.previousPage());
        }
        
        if (this.btnNext) {
            this.btnNext.addEventListener('click', () => this.nextPage());
        }
        
        // Cargar IAs desde la API
        await this.loadAIsFromAPI();
        this.loadPage(1);
    }
    
    async loadAIsFromAPI() {
        try {
            // Mostrar loading
            if (this.aiGrid) {
                this.aiGrid.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>Cargando IAs...</p></div>';
            }

            const response = await fetch(`${API_URL}/ias`);
            if (!response.ok) throw new Error('Error al cargar IAs');
            
            const ias = await response.json();
            this.allAIs = ias;
            
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
            case 'latest':
                sorted.sort((a, b) => new Date(b.fecha_publicacion) - new Date(a.fecha_publicacion));
                break;
            case 'top-rated':
                sorted.sort((a, b) => (parseFloat(b.calificacion_promedio) || 0) - (parseFloat(a.calificacion_promedio) || 0));
                break;
            case 'most-used':
                sorted.sort((a, b) => (b.total_usos || 0) - (a.total_usos || 0));
                break;
        }
        
        return sorted;
    }
    
    loadPage(page) {
        this.currentPage = page;
        
        const filteredAIs = this.filterAndSort(this.currentFilter);
        this.totalItems = filteredAIs.length;
        
        const startIndex = (page - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageItems = filteredAIs.slice(startIndex, endIndex);
        
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
        
        ias.forEach(ia => {
            const card = this.createAICard(ia);
            this.aiGrid.appendChild(card);
        });
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
                    <span>🎯 ${this.formatearNumero(ia.total_usos)} usos</span>
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
        
        if (this.btnPrevious) {
            this.btnPrevious.disabled = this.currentPage === 1;
        }
        
        if (this.btnNext) {
            this.btnNext.disabled = this.currentPage === totalPages || totalPages === 0;
        }
        
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
        
        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }
        
        if (startPage > 1) {
            this.addPageButton(1);
            if (startPage > 2) {
                this.addDots();
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            this.addPageButton(i);
        }
        
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                this.addDots();
            }
            this.addPageButton(totalPages);
        }
    }
    
    addPageButton(page) {
        const button = document.createElement('button');
        button.className = 'pagination-number';
        if (page === this.currentPage) {
            button.classList.add('active');
        }
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
    
    previousPage() {
        if (this.currentPage > 1) {
            this.loadPage(this.currentPage - 1);
        }
    }
    
    nextPage() {
        const totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
        if (this.currentPage < totalPages) {
            this.loadPage(this.currentPage + 1);
        }
    }
    
    changeFilter(filter) {
        this.currentFilter = filter;
        this.loadPage(1);
    }
}

// =============================================================================
// INICIALIZACIÓN
// =============================================================================

let pagination;

document.addEventListener('DOMContentLoaded', () => {
    // Solo inicializar paginación si estamos en la página principal (index.html)
    if (document.getElementById('aiGrid') && document.getElementById('paginationContainer')) {
        pagination = new Pagination(12);
    }
    
    // Conectar con los filtros
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
            if (mainTitle) {
                mainTitle.textContent = titles[filter];
            }
            
            if (pagination) {
                pagination.changeFilter(filter);
            }
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
            if (termino.length < 2) {
                // Restaurar vista normal
                restaurarVistaNormal();
                return;
            }

            await buscarIAs(termino);
        }, 300);
    });

    // Buscar al presionar Enter
    searchInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            const termino = e.target.value.trim();
            if (termino.length >= 2) {
                await buscarIAs(termino);
            } else {
                restaurarVistaNormal();
            }
        }
    });
}

function restaurarVistaNormal() {
    // Restaurar título
    const mainTitle = document.getElementById('mainTitle');
    if (mainTitle) {
        mainTitle.textContent = 'IAs Más Usadas';
    }

    // Mostrar paginación
    const paginationContainer = document.getElementById('paginationContainer');
    if (paginationContainer) {
        paginationContainer.style.display = 'flex';
    }

    // Recargar IAs
    if (pagination) {
        pagination.loadPage(1);
    }
}

async function buscarIAs(termino) {
    const aiGrid = document.getElementById('aiGrid');
    if (!aiGrid) return;

    // Mostrar loading
    aiGrid.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>Buscando...</p></div>';

    try {
        const response = await fetch(`${API_URL}/ias/buscar/${encodeURIComponent(termino)}`);
        if (!response.ok) throw new Error('Error en búsqueda');

        const ias = await response.json();

        // Actualizar título
        const mainTitle = document.getElementById('mainTitle');
        if (mainTitle) {
            mainTitle.textContent = `Resultados para "${termino}"`;
        }

        // Ocultar paginación durante búsqueda
        const paginationContainer = document.getElementById('paginationContainer');
        const paginationInfo = document.getElementById('paginationInfo');
        if (paginationContainer) paginationContainer.style.display = 'none';
        if (paginationInfo) paginationInfo.textContent = `${ias.length} resultado(s) encontrado(s)`;

        // Mostrar resultados
        if (ias.length === 0) {
            aiGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <h3>Sin resultados</h3>
                    <p>No se encontraron IAs para "${termino}"</p>
                </div>
            `;
            return;
        }

        aiGrid.innerHTML = '';
        ias.forEach(ia => {
            const card = crearTarjetaBusqueda(ia);
            aiGrid.appendChild(card);
        });

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

// Agregar al DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    configurarBusquedaGlobal();
});