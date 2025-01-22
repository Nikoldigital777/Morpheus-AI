
document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const typingIndicator = document.getElementById('typing-indicator');
    const messageSound = document.getElementById('message-sound');
    const voiceToggle = document.getElementById('voice-toggle');
    let userId = localStorage.getItem('userId') || generateUserId();

    function generateUserId() {
        const id = Math.random().toString(36).substring(2) + Date.now().toString(36);
        localStorage.setItem('userId', id);
        return id;
    }

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = userInput.value.trim();
        if (message) {
            await sendMessage(message);
            userInput.value = '';
        }
    });

    async function sendMessage(message) {
        appendMessage('user', message);
        showTypingIndicator();

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, message: message }),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            hideTypingIndicator();

            if (messageSound && messageSound.play && voiceToggle.checked) {
                messageSound.play().catch(e => console.log('Error playing sound:', e));
            }

            appendMessage('morpheus', data.text_response, data.audio_response);
        } catch (error) {
            console.error('Error:', error);
            hideTypingIndicator();
            appendMessage('system', 'An error occurred. Please try again.');
        }
    }

    function appendMessage(sender, message, audioSrc = null) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', `${sender}-message`);
        messageElement.style.opacity = '0';
        messageElement.style.transform = 'translateY(20px)';
        
        const avatar = document.createElement('img');
        avatar.src = sender === 'user' ? '/static/images/user-avatar.png' : '/static/images/morpheus-avatar.png';
        avatar.alt = `${sender} avatar`;
        avatar.classList.add('avatar');

        const contentDiv = document.createElement('div');
        contentDiv.classList.add('message-content');

        const textP = document.createElement('p');
        textP.textContent = message;
        contentDiv.appendChild(textP);

        if (audioSrc && sender === 'morpheus') {
            const playButton = document.createElement('button');
            playButton.innerHTML = '<i class="fas fa-play"></i>';
            playButton.classList.add('play-audio');
            playButton.addEventListener('click', () => playAudioResponse(audioSrc, playButton));
            contentDiv.appendChild(playButton);
        }

        messageElement.appendChild(avatar);
        messageElement.appendChild(contentDiv);
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Fade in animation
        setTimeout(() => {
            messageElement.style.opacity = '1';
            messageElement.style.transform = 'translateY(0)';
        }, 50);

        if (sender === 'morpheus') {
            animateMorpheusAvatar(avatar);
        }
    }

    function showTypingIndicator() {
        typingIndicator.classList.remove('hidden');
    }

    function hideTypingIndicator() {
        typingIndicator.classList.add('hidden');
    }

    function animateMorpheusAvatar(avatar) {
        avatar.classList.add('talking');
        setTimeout(() => {
            avatar.classList.remove('talking');
        }, 2000);
    }
});
