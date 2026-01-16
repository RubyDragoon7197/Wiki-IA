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