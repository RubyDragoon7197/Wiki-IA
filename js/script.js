// Chatbot functionality with persistent history across pages
const chatbotBtn = document.getElementById('chatbotBtn');
const chatbotWindow = document.getElementById('chatbotWindow');
const chatbotClose = document.getElementById('chatbotClose');
const chatSend = document.getElementById('chatSend');
const chatInput = document.getElementById('chatInput');
const chatbotBody = document.getElementById('chatbotBody');

if (chatbotBtn && chatbotWindow && chatbotClose && chatSend && chatInput && chatbotBody) {
    // Load chat history from localStorage
    function loadChatHistory() {
        const history = localStorage.getItem('chatbot_history');
        if (history) {
            const messages = JSON.parse(history);
            chatbotBody.innerHTML = ''; // Clear default message
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

    // Save message to localStorage
    function saveMessage(text, isUser = true) {
        const history = localStorage.getItem('chatbot_history');
        const messages = history ? JSON.parse(history) : [{text: '¡Hola! ¿En qué puedo ayudarte hoy?', isUser: false}];
        messages.push({text, isUser});
        localStorage.setItem('chatbot_history', JSON.stringify(messages));
    }

    // Load chat state (open/closed)
    function loadChatState() {
        const state = localStorage.getItem('chatbot_state');
        if (state === 'open') {
            chatbotWindow.classList.add('active');
            chatbotBtn.style.display = 'none';
        }
    }

    // Initialize chat
    loadChatHistory();
    loadChatState();

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

    function sendMessage() {
        const message = chatInput.value.trim();
        if (message) {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'chat-message';
            messageDiv.innerHTML = `<p><strong>Tú:</strong> ${message}</p>`;
            chatbotBody.appendChild(messageDiv);
            chatInput.value = '';
            chatbotBody.scrollTop = chatbotBody.scrollHeight;
            
            // Save to localStorage
            saveMessage(message, true);
        }
    }

    chatSend.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}
