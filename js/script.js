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
    // Cargar historial de mensajes desde localStorage
    function loadChatHistory() {
        const history = localStorage.getItem('chatbot_history');
        if (history) {
            const messages = JSON.parse(history);
            chatbotBody.innerHTML = '';
            messages.forEach(msg => {
                const messageDiv = document.createElement('div');
                messageDiv.className = 'chat-message';
                messageDiv.innerHTML = msg.isUser 
                    ? `<p><strong>Tú:</strong> ${msg.text}</p>`
                    : `<p>${msg.text}</p>`;
                chatbotBody.appendChild(messageDiv);
            });
            chatbotBody.scrollTop = chatbotBody.scrollHeight;
        }
    }

    // Guardar mensaje en localStorage
    function saveMessage(text, isUser = true) {
        const history = localStorage.getItem('chatbot_history');
        const messages = history ? JSON.parse(history) : [{text: '¡Hola! ¿En qué puedo ayudarte hoy?', isUser: false}];
        messages.push({text, isUser});
        localStorage.setItem('chatbot_history', JSON.stringify(messages));
    }

    // Cargar estado del chatbot (abierto/cerrado)
    function loadChatState() {
        const state = localStorage.getItem('chatbot_state');
        if (state === 'open') {
            chatbotWindow.classList.add('active');
            chatbotBtn.style.display = 'none';
        }
    }

    // Enviar mensaje
    function sendMessage() {
        const message = chatInput.value.trim();
        if (message) {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'chat-message';
            messageDiv.innerHTML = `<p><strong>Tú:</strong> ${message}</p>`;
            chatbotBody.appendChild(messageDiv);
            chatInput.value = '';
            chatbotBody.scrollTop = chatbotBody.scrollHeight;
            saveMessage(message, true);
        }
    }

    // Inicialización
    loadChatHistory();
    loadChatState();

    // Event listeners
    chatbotBtn.addEventListener('click', () => {
        chatbotWindow.classList.add('active');
        chatbotBtn.style.display = 'none';
        localStorage.setItem('chatbot_state', 'open');
    });

    chatbotClose.addEventListener('click', () => {
        chatbotWindow.classList.remove('active');
        chatbotBtn.style.display = 'flex';
        localStorage.setItem('chatbot_state', 'closed');
    });

    chatSend.addEventListener('click', sendMessage);

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
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
// FILTROS DE IAs - Con cambio de título
// =============================================================================

const filterBtns = document.querySelectorAll('.filter-btn');
const aiGrid = document.getElementById('aiGrid');
const mainTitle = document.getElementById('mainTitle');

if (filterBtns.length > 0 && aiGrid) {
    // Títulos para cada filtro
    const filterTitles = {
        'latest': 'Últimas IAs Publicadas',
        'top-rated': 'IAs Mejor Calificadas',
        'most-used': 'IAs Más Usadas'
    };

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Quitar 'active' de todos los botones
            filterBtns.forEach(b => b.classList.remove('active'));
            
            // Agregar 'active' al botón clickeado
            btn.classList.add('active');
            
            // Obtener el filtro seleccionado
            const filter = btn.getAttribute('data-filter');
            
            // Cambiar el título principal
            if (mainTitle) {
                mainTitle.textContent = filterTitles[filter];
            }
            
            // Obtener todas las tarjetas de IA
            const cards = Array.from(aiGrid.querySelectorAll('.ai-card'));
            
            // Ordenar tarjetas según el filtro
            cards.sort((a, b) => {
                if (filter === 'latest') {
                    return new Date(b.dataset.date) - new Date(a.dataset.date);
                } else if (filter === 'top-rated') {
                    return parseFloat(b.dataset.rating) - parseFloat(a.dataset.rating);
                } else if (filter === 'most-used') {
                    return parseInt(b.dataset.uses) - parseInt(a.dataset.uses);
                }
            });
            
            // Limpiar y volver a agregar las tarjetas ordenadas
            aiGrid.innerHTML = '';
            cards.forEach(card => aiGrid.appendChild(card));
            
            console.log('Filtro aplicado:', filter);
        });
    });

    // Aplicar filtro "Más Usadas" por defecto al cargar la página
    const mostUsedBtn = document.querySelector('[data-filter="most-used"]');
    if (mostUsedBtn) {
        mostUsedBtn.click();
    }
}
// ===================================
// SISTEMA DE PAGINACIÓN
// ===================================

class Pagination {
    constructor(itemsPerPage = 12) {
        this.itemsPerPage = itemsPerPage;
        this.currentPage = 1;
        this.totalItems = 0;
        this.currentFilter = 'most-used';
        
        // Elementos del DOM
        this.aiGrid = document.getElementById('aiGrid');
        this.paginationContainer = document.getElementById('paginationContainer');
        this.paginationNumbers = document.getElementById('paginationNumbers');
        this.paginationInfo = document.getElementById('paginationInfo');
        this.btnPrevious = document.getElementById('btnPrevious');
        this.btnNext = document.getElementById('btnNext');
        this.mainTitle = document.getElementById('mainTitle');
        
        // Datos de ejemplo (esto vendrá de tu base de datos)
        this.allAIs = this.generateSampleData(50); // 50 IAs de ejemplo
        
        this.init();
    }
    
    init() {
        // Event listeners
        if (this.btnPrevious) {
            this.btnPrevious.addEventListener('click', () => this.previousPage());
        }
        
        if (this.btnNext) {
            this.btnNext.addEventListener('click', () => this.nextPage());
        }
        
        // Cargar página inicial
        this.loadPage(1);
    }
    
    generateSampleData(count) {
        // Datos de ejemplo - REEMPLAZAR con datos de tu BD
        const categories = ['Programación', 'Diseño', 'Educación', 'Tecnología', 'Salud', 'Ciencia'];
        const ais = [];
        
        for (let i = 1; i <= count; i++) {
            ais.push({
                id: i,
                name: `IA Ejemplo ${i}`,
                description: `Descripción de la IA número ${i}`,
                category: categories[Math.floor(Math.random() * categories.length)],
                rating: (Math.random() * 2 + 3).toFixed(1), // 3.0 - 5.0
                uses: Math.floor(Math.random() * 25000) + 1000,
                date: new Date(2024, 0, Math.floor(Math.random() * 20) + 1),
                url: `https://ejemplo${i}.com`,
                emoji: ['🤖', '🎨', '💻', '🔬', '📊', '🎯'][Math.floor(Math.random() * 6)]
            });
        }
        
        return ais;
    }
    
    filterAndSort(filter) {
        this.currentFilter = filter;
        let sorted = [...this.allAIs];
        
        switch(filter) {
            case 'latest':
                sorted.sort((a, b) => b.date - a.date);
                break;
            case 'top-rated':
                sorted.sort((a, b) => b.rating - a.rating);
                break;
            case 'most-used':
                sorted.sort((a, b) => b.uses - a.uses);
                break;
        }
        
        return sorted;
    }
    
    loadPage(page) {
        this.currentPage = page;
        
        // Filtrar y ordenar
        const filteredAIs = this.filterAndSort(this.currentFilter);
        this.totalItems = filteredAIs.length;
        
        // Calcular rango
        const startIndex = (page - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageItems = filteredAIs.slice(startIndex, endIndex);
        
        // Renderizar IAs
        this.renderAIs(pageItems);
        
        // Actualizar controles de paginación
        this.updatePaginationControls();
        
        // Scroll al inicio del contenido
        if (this.aiGrid) {
            window.scrollTo({
                top: this.aiGrid.offsetTop - 100,
                behavior: 'smooth'
            });
        }
    }
    
    renderAIs(ais) {
        if (!this.aiGrid) return;
        
        this.aiGrid.innerHTML = '';
        
        ais.forEach(ai => {
            const card = this.createAICard(ai);
            this.aiGrid.appendChild(card);
        });
    }
    
    createAICard(ai) {
        const card = document.createElement('div');
        card.className = 'ai-card';
        card.setAttribute('data-date', ai.date.toISOString().split('T')[0]);
        card.setAttribute('data-rating', ai.rating);
        card.setAttribute('data-uses', ai.uses);
        
        card.innerHTML = `
            <div class="ai-card-header">
                <div class="ai-logo-placeholder">${ai.emoji}</div>
                <div class="ai-rating">
                    <svg class="star-icon" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                    </svg>
                    <span>${ai.rating}</span>
                </div>
            </div>
            <h3 class="ai-name">${ai.name}</h3>
            <p class="ai-description">${ai.description}</p>
            <div class="ai-meta">
                <span class="ai-category">${ai.category}</span>
            </div>
            <div class="ai-stats">
                <span>👁️ ${(ai.uses / 1000).toFixed(1)}K usos</span>
                <span>📅 ${ai.date.toLocaleDateString('es', {month: 'short', year: 'numeric'})}</span>
            </div>
            <a href="${ai.url}" target="_blank" class="ai-link-btn">Visitar IA</a>
        `;
        
        return card;
    }
    
    updatePaginationControls() {
        const totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
        
        // Actualizar botones prev/next
        if (this.btnPrevious) {
            this.btnPrevious.disabled = this.currentPage === 1;
        }
        
        if (this.btnNext) {
            this.btnNext.disabled = this.currentPage === totalPages;
        }
        
        // Renderizar números de página
        this.renderPageNumbers(totalPages);
        
        // Actualizar info
        if (this.paginationInfo) {
            const start = (this.currentPage - 1) * this.itemsPerPage + 1;
            const end = Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
            this.paginationInfo.textContent = `Mostrando ${start}-${end} de ${this.totalItems} IAs`;
        }
    }
    
    renderPageNumbers(totalPages) {
        if (!this.paginationNumbers) return;
        
        this.paginationNumbers.innerHTML = '';
        
        // Lógica de paginación inteligente
        const maxVisible = 5;
        let startPage = Math.max(1, this.currentPage - 2);
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);
        
        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }
        
        // Botón primera página
        if (startPage > 1) {
            this.addPageButton(1);
            if (startPage > 2) {
                this.addDots();
            }
        }
        
        // Páginas visibles
        for (let i = startPage; i <= endPage; i++) {
            this.addPageButton(i);
        }
        
        // Botón última página
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
        this.loadPage(1); // Volver a página 1 al cambiar filtro
    }
}

// ===================================
// INICIALIZAR PAGINACIÓN
// ===================================

let pagination;

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar paginación (12 IAs por página)
    pagination = new Pagination(12);
    
    // Conectar con los filtros
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Quitar active de todos
            filterBtns.forEach(b => b.classList.remove('active'));
            
            // Agregar active al clickeado
            btn.classList.add('active');
            
            // Obtener filtro
            const filter = btn.getAttribute('data-filter');
            
            // Cambiar título
            const titles = {
                'latest': 'Últimas IAs Publicadas',
                'top-rated': 'IAs Mejor Calificadas',
                'most-used': 'IAs Más Usadas'
            };
            
            const mainTitle = document.getElementById('mainTitle');
            if (mainTitle) {
                mainTitle.textContent = titles[filter];
            }
            
            // Aplicar filtro y recargar
            if (pagination) {
                pagination.changeFilter(filter);
            }
        });
    });
    
    // Aplicar filtro por defecto (más usadas)
    const defaultBtn = document.querySelector('[data-filter="most-used"]');
    if (defaultBtn) {
        defaultBtn.click();
    }
});