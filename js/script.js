// Chatbot functionality
const chatbotBtn = document.getElementById('chatbotBtn');
const chatbotWindow = document.getElementById('chatbotWindow');
const chatbotClose = document.getElementById('chatbotClose');
const chatSend = document.getElementById('chatSend');
const chatInput = document.getElementById('chatInput');
const chatbotBody = document.getElementById('chatbotBody');

chatbotBtn.addEventListener('click', () => {
    chatbotWindow.classList.add('active');
    chatbotBtn.style.display = 'none';
});

chatbotClose.addEventListener('click', () => {
    chatbotWindow.classList.remove('active');
    chatbotBtn.style.display = 'flex';
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
    }
}

chatSend.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});
