document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const messageInput = document.getElementById('message-input');
    const chatForm = document.getElementById('chat-form');
    const chatMessages = document.getElementById('chat-messages');
    const newChatBtn = document.getElementById('new-chat-btn');
    const conversationList = document.getElementById('conversation-list');
    const themeToggle = document.getElementById('theme-toggle');

    // Current conversation ID
    let currentConversationId = null;

    // Theme Toggle
    themeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
        document.body.classList.toggle('light-mode');
        
        const icon = themeToggle.querySelector('i');
        if (document.body.classList.contains('dark-mode')) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
        
        // Save theme preference
        const theme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
        localStorage.setItem('theme', theme);
    });

    // Load saved theme
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.remove('light-mode');
        document.body.classList.add('dark-mode');
        const icon = themeToggle.querySelector('i');
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    }

    // Auto-resize textarea
    messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });

    // Load conversations
    function loadConversations() {
        fetch('/api/conversations')
            .then(response => response.json())
            .then(data => {
                conversationList.innerHTML = '';
                data.forEach(conversation => {
                    const conversationItem = document.createElement('div');
                    conversationItem.className = 'conversation-item';
                    conversationItem.dataset.id = conversation.id;
                    if (conversation.id === currentConversationId) {
                        conversationItem.classList.add('active');
                    }
                    
                    conversationItem.innerHTML = `
                        <i class="fas fa-comment"></i>
                        <span>${conversation.title || 'New Conversation'}</span>
                    `;
                    
                    conversationItem.addEventListener('click', () => {
                        loadConversation(conversation.id);
                    });
                    
                    conversationList.appendChild(conversationItem);
                });
            })
            .catch(error => console.error('Error loading conversations:', error));
    }

    // Load a specific conversation
    function loadConversation(conversationId) {
        currentConversationId = conversationId;
        
        // Update active conversation in UI
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.id === conversationId) {
                item.classList.add('active');
            }
        });
        
        // Clear messages
        chatMessages.innerHTML = '';
        
        // Load messages for this conversation
        fetch(`/api/conversations/${conversationId}/messages`)
            .then(response => response.json())
            .then(data => {
                data.forEach(message => {
                    addMessageToUI(message.content, message.sender === 'user');
                });
                scrollToBottom();
            })
            .catch(error => console.error('Error loading messages:', error));
    }

    // Create a new conversation
    newChatBtn.addEventListener('click', function() {
        fetch('/api/conversations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => response.json())
        .then(data => {
            currentConversationId = data.id;
            loadConversations();
            chatMessages.innerHTML = '';
        })
        .catch(error => console.error('Error creating conversation:', error));
    });

    // Send message
    chatForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const messageText = messageInput.value.trim();
        
        if (!messageText) return;
        
        // If no conversation exists, create one
        if (!currentConversationId) {
            fetch('/api/conversations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            })
            .then(response => response.json())
            .then(data => {
                currentConversationId = data.id;
                loadConversations();
                sendMessage(messageText);
            })
            .catch(error => console.error('Error creating conversation:', error));
        } else {
            sendMessage(messageText);
        }
    });

    function sendMessage(text) {
        // Add user message to UI
        addMessageToUI(text, true);
        
        // Clear input
        messageInput.value = '';
        messageInput.style.height = 'auto';
        
        // Scroll to bottom
        scrollToBottom();
        
        // Send to server
        fetch(`/api/conversations/${currentConversationId}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content: text })
        })
        .then(response => response.json())
        .then(data => {
            // Add bot response to UI
            addMessageToUI(data.reply, false);
            scrollToBottom();
            
            // Refresh conversation list to update titles
            loadConversations();
        })
        .catch(error => {
            console.error('Error sending message:', error);
            addMessageToUI('Error: Unable to connect to the server. Please try again.', false);
        });
    }

    function addMessageToUI(text, isUser) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
        messageDiv.textContent = text;
        chatMessages.appendChild(messageDiv);
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Initial load
    loadConversations();
    
    // Add welcome message if no conversation is active
    if (!currentConversationId) {
        addMessageToUI('Hello! How can I assist you today?', false);
    }
});