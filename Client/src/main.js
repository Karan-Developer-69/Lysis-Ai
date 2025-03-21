import './style.css';
import { io } from "socket.io-client";

// Access environment variables
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

// Connect to the backend using Socket.io
const socket = io(SOCKET_URL);

let input = document.getElementById('user-input');
let sendBtn = document.getElementById('send-btn');
let chatContainer = document.querySelector('.chat-container');
let micBtn = document.getElementById('mic-btn');
let selectedVoice = null;

input.addEventListener('keydown', (e) => {
    if (e.code === "Enter") {
        sendMessage();
    }
});

sendBtn.addEventListener('click', sendMessage);

socket.on('lysisResponse', (lysis) => {
    // Display AI's response
    chatContainer.removeChild(chatContainer.lastChild);
    let aiMsgDiv = document.createElement('div');
    aiMsgDiv.classList.add('ai-msg');
    animateText(aiMsgDiv, lysis);
    chatContainer.appendChild(aiMsgDiv);

    // Speak the AI's response
    speak(lysis);

    // Re-enable the input field
    input.disabled = false;
});

socket.on('errorMessage', (error) => {
    chatContainer.removeChild(chatContainer.lastChild);
    let aiMsgDiv = document.createElement('div');
    aiMsgDiv.classList.add('ai-msg');
    animateText(aiMsgDiv, "Network error");
    chatContainer.appendChild(aiMsgDiv);

    // Re-enable the input field
    input.disabled = false;
});

function sendMessage() {
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
}

function displayThinking() {
    let thinkingDiv = document.createElement('div');
    thinkingDiv.classList.add('ai-msg', 'thinking');
    thinkingDiv.innerText = "Thinking...";
    chatContainer.appendChild(thinkingDiv);
    let thinkdiv = document.querySelector('.thinking');
    setInterval(() => {
        if (thinkdiv.textContent === "Thinking") {
            thinkdiv.textContent = "Thinking.";
        } else if (thinkdiv.textContent === "Thinking.") {
            thinkdiv.textContent = "Thinking..";
        } else if (thinkdiv.textContent === "Thinking..") {
            thinkdiv.textContent = "Thinking...";
        } else if (thinkdiv.textContent === "Thinking...") {
            thinkdiv.textContent = "Thinking";
        }
    }, 250);
}

function animateText(div, text) {
    div.innerText = '';
    let i = 0;
    let chunk = text.split(" ");
    let intervalID = setInterval(() => {
        if (i < chunk.length) {
            div.textContent += chunk[i] + " ";
            i++;
        } else {
            clearInterval(intervalID);
        }
    }, 20);
}

function speak(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }
        utterance.rate = 1; // Adjust the rate as needed (1 is the default rate)
        speechSynthesis.speak(utterance);
    }
}

// Load voices and set the selected female voice
function loadVoices() {
    const voices = speechSynthesis.getVoices();
    const femaleVoices = voices.filter(voice => /female/i.test(voice.name) || /female/i.test(voice.lang));
    selectedVoice = femaleVoices[0] || voices[0];
}

// Load voices when they are changed
speechSynthesis.onvoiceschanged = loadVoices;
loadVoices();

// Speech recognition for voice input
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = function (event) {
        const transcript = event.results[0][0].transcript;
        input.value = transcript;
        sendMessage();
    };

    recognition.onerror = function (event) {
        console.error('Speech recognition error:', event.error);
    };

    micBtn.addEventListener('click', () => {
        recognition.start();
    });
} else {
    micBtn.style.display = 'none';
    console.log("Speech recognition not supported in this browser.");
}
