// ---------------- Firebase Configuration (kept as you provided) ----------------
const firebaseConfig = {
  apiKey: "AIzaSyAzb3jbndemY5w3nkwk-sdIxLmYV0Qj9WQ",
  authDomain: "sahithyotsav-results-288f2.firebaseapp.com",
  databaseURL: "https://sahithyotsav-results-288f2-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "sahithyotsav-results-288f2",
  storageBucket: "sahithyotsav-results-288f2.firebasestorage.app",
  messagingSenderId: "601783689113",
  appId: "1:601783689113:web:cba8bff9cdc4a1aac43d08"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// ---------------- Element references ----------------
const initialScreen = document.getElementById('initial-screen');
const getResultsBtn = document.getElementById('get-results-btn');
const chatbotScreen = document.getElementById('chatbot-screen');
const chatArea = document.getElementById('chat-area');
const startButton = document.getElementById('start-button');
const backToCategoryBtn = document.getElementById('back-to-category-btn');

let cachedResults = null;
let currentCategory = null;

// ---------------- Utility: fetch & cache all results once ----------------
async function getAllResults() {
  if (cachedResults) return cachedResults;
  try {
    const snap = await database.ref('results').once('value');
    cachedResults = snap.exists() ? snap.val() : {};
    return cachedResults;
  } catch (err) {
    console.error('Error fetching results:', err);
    throw err;
  }
}

// ---------------- UI helper: addMessage with typing simulation ----------------
function addMessage(text, sender = 'bot', isHtml = false) {
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message', sender);
  const bubble = document.createElement('div');
  bubble.classList.add('message-bubble');
  if (isHtml) bubble.innerHTML = text;
  else bubble.textContent = text;
  messageDiv.appendChild(bubble);
  chatArea.appendChild(messageDiv);
  chatArea.scrollTop = chatArea.scrollHeight;
  return bubble;
}

function addTypingBubble() {
  const typingDiv = document.createElement('div');
  typingDiv.className = 'message bot typing-bubble';
  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';
  bubble.innerHTML = '<span class="typing-dots">...</span>';
  typingDiv.appendChild(bubble);
  chatArea.appendChild(typingDiv);
  chatArea.scrollTop = chatArea.scrollHeight;
  return typingDiv;
}

// ---------------- Show categories (build buttons dynamically) ----------------
async function showCategoryButtons() {
  backToCategoryBtn.style.display = 'none';
  const typing = addTypingBubble();

  try {
    const all = await getAllResults();
    typing.remove();

    // Collect unique categories (assumes each entry has .category)
    const categories = new Set();
    for (let key in all) {
      if (all[key] && all[key].category) categories.add(all[key].category);
    }
    const categoryList = Array.from(categories);

    if (categoryList.length === 0) {
      addMessage('Sorry, no categories found at the moment.', 'bot');
      return;
    }

    const container = document.createElement('div');
    container.classList.add('category-buttons', 'message', 'bot');

    categoryList.forEach(cat => {
      const btn = document.createElement('button');
      btn.textContent = cat;
      btn.addEventListener('click', () => handleCategorySelection(cat));
      container.appendChild(btn);
    });

    chatArea.appendChild(container);
    chatArea.scrollTop = chatArea.scrollHeight;
  } catch (err) {
    typing.remove();
    addMessage('There was an error loading categories. Please try again later.', 'bot');
    console.error(err);
  }
}

// ---------------- Category selected ----------------
function handleCategorySelection(category) {
  addMessage(category, 'user');
  currentCategory = category;
  addMessage(`Please select a program for ${category}:`, 'bot');
  showProgramButtons(category);
}

// ---------------- Show program buttons for a category ----------------
async function showProgramButtons(category) {
  const typing = addTypingBubble();
  try {
    const all = await getAllResults();
    typing.remove();

    const programs = new Set();
    for (let key in all) {
      const entry = all[key];
      if (entry && entry.category === category && entry.program) programs.add(entry.program);
    }
    const programList = Array.from(programs);

    if (programList.length === 0) {
      addMessage(`No programs found for ${category} at the moment.`, 'bot');
      backToCategoryBtn.style.display = 'block';
      return;
    }

    const container = document.createElement('div');
    container.classList.add('program-buttons', 'message', 'bot');

    programList.forEach(program => {
      const btn = document.createElement('button');
      btn.textContent = program;
      btn.addEventListener('click', () => handleProgramSelection(category, program));
      container.appendChild(btn);
    });

    chatArea.appendChild(container);
    chatArea.scrollTop = chatArea.scrollHeight;
  } catch (err) {
    typing.remove();
    addMessage('There was an error loading programs. Please try again later.', 'bot');
    console.error(err);
  }
}

// ---------------- Handle program selection: find image and show ----------------
async function handleProgramSelection(category, program) {
  addMessage(program, 'user');

  // show loading bubble
  const loadingBubble = addMessage('Loading image...', 'bot');
  const spinner = document.createElement('div');
  spinner.className = 'loading-spinner';
  loadingBubble.appendChild(spinner);

  try {
    const all = await getAllResults();

    // find first matching imageUrl
    let imageUrl = null;
    for (let key in all) {
      const e = all[key];
      if (e && e.category === category && e.program === program && e.imageUrl) {
        imageUrl = e.imageUrl;
        break;
      }
    }

    spinner.remove();
    loadingBubble.textContent = ''; // clear text

    if (!imageUrl) {
      loadingBubble.textContent = 'Image not found for this program.';
      backToCategoryBtn.style.display = 'block';
      return;
    }

    const imageResultDiv = document.createElement('div');
    imageResultDiv.className = 'image-result';

    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = program;
    img.onload = () => {
      chatArea.scrollTop = chatArea.scrollHeight;
      backToCategoryBtn.style.display = 'block';
    };
    img.onerror = () => {
      loadingBubble.textContent = 'Error loading image.';
      backToCategoryBtn.style.display = 'block';
    };
    imageResultDiv.appendChild(img);

    const dlButton = document.createElement('button');
    dlButton.className = 'download-icon';
    dlButton.title = 'Download Image';
    dlButton.addEventListener('click', () => downloadImage(imageUrl, program));
    imageResultDiv.appendChild(dlButton);

    loadingBubble.appendChild(imageResultDiv);
    chatArea.scrollTop = chatArea.scrollHeight;
  } catch (err) {
    spinner.remove();
    loadingBubble.textContent = 'There was an error loading the image. Please try again later.';
    backToCategoryBtn.style.display = 'block';
    console.error(err);
  }
}

// ---------------- Image download helper ----------------
async function downloadImage(imageUrl, filename) {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error('Failed to fetch image');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    // guess extension
    let ext = 'jpg';
    if (blob.type.includes('png')) ext = 'png';
    if (blob.type.includes('gif')) ext = 'gif';
    if (blob.type.includes('webp')) ext = 'webp';

    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Error downloading image:', err);
    addMessage('Failed to download image. Please try in a new tab or check permissions.', 'bot');
  }
}

// ---------------- Screen show/hide helpers ----------------
function showInitial() {
  initialScreen.classList.add('active');
  chatbotScreen.classList.remove('active');
}

function showChatbot() {
  initialScreen.classList.remove('active');
  chatbotScreen.classList.add('active');
}

// ---------------- Event listeners ----------------
getResultsBtn.addEventListener('click', () => {
  showChatbot();
  chatArea.innerHTML = '';
  addMessage('Welcome to the Sahithyotsav Results Bot!', 'bot');
  // show start button after welcome
  startButton.style.display = 'block';
});

startButton.addEventListener('click', () => {
  startButton.style.display = 'none';
  chatArea.innerHTML = '';
  addMessage('Please select a category to view results.', 'bot');
  showCategoryButtons();
});

backToCategoryBtn.addEventListener('click', () => {
  chatArea.innerHTML = '';
  addMessage('Welcome to the Sahithyotsav Results Bot!', 'bot');
  startButton.style.display = 'block';
  backToCategoryBtn.style.display = 'none';
});
