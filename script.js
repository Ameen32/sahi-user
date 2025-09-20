// Firebase configuration and initialization
const firebaseConfig = {
  apiKey: "AIzaSyAzb3jbndemY5w3nkwk-sdIxLmYV0Qj9WQ",
  authDomain: "sahithyotsav-results-288f2.firebaseapp.com",
  databaseURL: "https://sahithyotsav-results-288f2-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "sahithyotsav-results-288f2",
  storageBucket: "sahithyotsav-results-288f2.firebasestorage.app",
  messagingSenderId: "601783689113",
  appId: "1:601783689113:web:cba8bff9cdc4a1aac43d08"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Elements
const initialScreen = document.getElementById('initial-screen');
const getResultsBtn = document.getElementById('get-results-btn');
const chatbotScreen = document.getElementById('chatbot-screen');
const chatArea = document.getElementById('chat-area');
const startButton = document.getElementById('start-button');
const backToCategoryBtn = document.getElementById('back-to-category-btn');

// Typing bubble function
function showTypingBubble() {
  const typingBubble = document.createElement('div');
  typingBubble.className = 'message bot typing-bubble';
  chatArea.appendChild(typingBubble);

  // Replace with actual message after delay
  setTimeout(() => {
    typingBubble.remove();
    addMessage("Please select your category...", 'bot');
  }, 2000);
}

// Add message function
function addMessage(text, sender) {
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message', sender);
  const bubble = document.createElement('div');
  bubble.classList.add('message-bubble');
  bubble.textContent = text;
  messageDiv.appendChild(bubble);
  chatArea.appendChild(messageDiv);
  chatArea.scrollTop = chatArea.scrollHeight;
}

// Show initial or chatbot screens
function showInitial() {
  initialScreen.classList.add('active');
  chatbotScreen.classList.remove('active');
}

function showChatbot() {
  initialScreen.classList.remove('active');
  chatbotScreen.classList.add('active');
}

// Event listeners
getResultsBtn.addEventListener('click', () => {
  showChatbot();
  addMessage("Welcome to Maslak Student Results!", 'bot');
  startButton.style.display = 'block';
});

startButton.addEventListener('click', () => {
  startButton.style.display =
