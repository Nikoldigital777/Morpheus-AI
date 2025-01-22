document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const voiceInputButton = document.getElementById('voice-input-button');
    const memoryButton = document.getElementById('memory-button');
    const wakeUpButton = document.getElementById('wake-up-button');
    const settingsButton = document.getElementById('settings-button');
    const settingsPanel = document.getElementById('settings-panel');
    const soundToggle = document.getElementById('sound-toggle');
    const voiceToggle = document.getElementById('voice-toggle');
    const messageSound = document.getElementById('message-sound');
    const typingIndicator = document.getElementById('typing-indicator');

    let isListening = false;
    let recognition;
    let userId = localStorage.getItem('userId') || generateUserId();

    // Speech recognition setup (unchanged)

    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const message = userInput.value.trim();
        if (message) {
            sendMessage(message);
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
            appendMessage('morpheus', data.text_response, data.audio_response);
            playMessageSound();
        } catch (error) {
            console.error('Error:', error);
            hideTypingIndicator();
            appendMessage('system', 'An error occurred. Please try again.');
        }
    }

    function appendMessage(sender, message, audioSrc = null) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', `${sender}-message`);

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

        if (sender === 'morpheus') {
            animateMorpheusAvatar(avatar);
        }
    }

    function playAudioResponse(base64Audio, playButton) {
        if (voiceToggle.checked) {
            playButton.disabled = true;
            playButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

            const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
            audio.onended = () => {
                playButton.disabled = false;
                playButton.innerHTML = '<i class="fas fa-play"></i>';
            };
            audio.play().catch(e => {
                console.error('Error playing audio:', e);
                playButton.disabled = false;
                playButton.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
            });
        }
    }

    // Other functions (animateMorpheusAvatar, playMessageSound, etc.) remain unchanged

    function showTypingIndicator() {
        typingIndicator.classList.remove('hidden');
    }

    function hideTypingIndicator() {
        typingIndicator.classList.add('hidden');
    }
});