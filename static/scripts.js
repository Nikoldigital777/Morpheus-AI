document.addEventListener('DOMContentLoaded', () => {
    const redPillBtn = document.getElementById('red-pill');
    const bluePillBtn = document.getElementById('blue-pill');
    const chatUI = document.getElementById('chat-ui');
    const sendButton = document.getElementById('send-button');
    const chatInput = document.getElementById('chat-input');
    const chatWindow = document.querySelector('.chat-window');

    redPillBtn.addEventListener('click', () => {
        document.body.style.opacity = 0;
        setTimeout(() => {
            showChatUI();
            document.body.style.opacity = 1;
        }, 1000);
    });

    bluePillBtn.addEventListener('click', () => {
        const confirmExit = confirm('Are you sure you want to stay asleep?');
        if (confirmExit) {
            document.body.style.opacity = 0;
            setTimeout(() => {
                window.location.href = 'https://www.google.com';
            }, 1000);
        } else {
            document.body.style.opacity = 0;
            setTimeout(() => {
                showChatUI();
                document.body.style.opacity = 1;
            }, 1000);
        }
    });

    sendButton.addEventListener('click', () => {
        const userMessage = chatInput.value;
        if (userMessage.trim()) {
            addMessage(userMessage, 'user-message');
            chatInput.value = '';
            sendMessageToBackend(userMessage);
        }
    });

    function showChatUI() {
        document.querySelector('.container').classList.add('hidden');
        chatUI.classList.remove('hidden');
    }

    function addMessage(message, className) {
        const messageElement = document.createElement('div');
        messageElement.textContent = message;
        messageElement.className = `message ${className}`;
        chatWindow.appendChild(messageElement);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    function sendMessageToBackend(message) {
        fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: 'unique_user_id', // replace with actual user ID logic
                message: message
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                addMessage(data.error, 'bot-message');
            } else {
                addMessage(data.text_response, 'bot-message');
                // Optionally handle audio response
                if (data.audio_response) {
                    const audio = new Audio(`data:audio/wav;base64,${data.audio_response}`);
                    audio.play();
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
            addMessage('Error communicating with server.', 'bot-message');
        });
    }
});
body {
    margin: 0;
    font-family: Arial, sans-serif;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background-color: black;
    color: limegreen;
    transition: opacity 1s ease-in-out;
}

.container {
    text-align: center;
}

h1 {
    font-size: 3em;
    margin-bottom: 20px;
    text-shadow: 0 0 10px limegreen;
}

.buttons {
    display: flex;
    justify-content: center;
    gap: 20px;
}

.pill-button {
    padding: 10px 20px;
    border: 2px solid limegreen;
    border-radius: 20px;
    background-color: black;
    color: limegreen;
    cursor: pointer;
    font-size: 1.2em;
    transition: background-color 0.3s, color 0.3s;
}

.pill-button.red:hover {
    background-color: red;
    color: white;
}

.pill-button.blue:hover {
    background-color: blue;
    color: white;
}

.hidden {
    display: none;
}

.chat-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    max-width: 500px;
    background-color: #222;
    border: 1px solid limegreen;
    border-radius: 10px;
    padding: 20px;
    box-shadow: 0 0 10px limegreen;
}

.chat-window {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
    border-bottom: 1px solid limegreen;
    margin-bottom: 10px;
}

.message {
    padding: 10px;
    margin: 10px 0;
    border-radius: 10px;
}

.bot-message {
    background-color: limegreen;
    color: black;
    align-self: flex-start;
}

.user-message {
    background-color: #444;
    color: limegreen;
    align-self: flex-end;
}

.input-container {
    display: flex;
    gap: 10px;
}

#chat-input {
    flex: 1;
    padding: 10px;
    border: 1px solid limegreen;
    border-radius: 10px;
    background-color: black;
    color: limegreen;
}

#send-button {
    padding: 10px 20px;
    border: 1px solid limegreen;
    border-radius: 10px;
    background-color: limegreen;
    color: black;
    cursor: pointer;
    transition: background-color 0.3s, color 0.3s;
}

#send-button:hover {
    background-color: black;
    color: limegreen;
}
