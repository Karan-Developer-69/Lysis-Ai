import './style.css';
import { io } from "socket.io-client";

// Access environment variables
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

// Connect to the backend using Socket.io
const socket = io(SOCKET_URL);

let input = document.getElementById('user-input');
let sendBtn = document.getElementById('send-btn');
let chatContainer = document.querySelector('.chat-container');

sendBtn.addEventListener('click', () => {
    const userMsg = input.value.trim();
    if (!userMsg) return;
    input.value = "";

    // Display the user's message in the chat
    let userMsgDiv = document.createElement('div');
    userMsgDiv.classList.add('user-msg');
    userMsgDiv.innerText = userMsg;
    chatContainer.appendChild(userMsgDiv);

    // Send the message to the server
    socket.emit('userMessage', userMsg);

    // Disable input while waiting for a response
    input.disabled = true;
    displayThinking();
});

socket.on('lysisResponse', (lysis) => {
    // Display AI's response
    chatContainer.removeChild(chatContainer.lastChild)
    let aiMsgDiv = document.createElement('div');
    aiMsgDiv.classList.add('ai-msg');
    animateText(aiMsgDiv, lysis);
    chatContainer.appendChild(aiMsgDiv);

    // Re-enable the input field
    input.disabled = false;
});

socket.on('errorMessage', (error) => {
    console.error('Error:', error);
    input.disabled = false;
});

function displayThinking() {
    let thinkingDiv = document.createElement('div');
    thinkingDiv.classList.add('ai-msg', 'thinking');
    thinkingDiv.innerText = "Thinking...";
    chatContainer.appendChild(thinkingDiv);
}

function animateText(div, text) {
    div.innerText = '';
    let i = 0;
    let intervalID = setInterval(() => {
        if (i < text.length) {
            div.textContent += text[i];
            i++;
        } else {
            clearInterval(intervalID);
        }
    }, 20);
}
