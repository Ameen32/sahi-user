// script.js
// Complete functional JS with transitions, typing bubbles, spinner, caching, and Firebase usage

// ---------- Firebase config (keep yours) ----------
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

// ---------- Elements ----------
const initialScreen = document.getElementById('initial-screen');
const getResultsBtn = document.getElementById('get-results-btn');
const chatbotScreen = document.getElementById('chatbot-screen');
const chatArea = document.getElementById('chat-area');
const startButton = document.getElementById('start-button');
const backToCategoryBtn = document.getElementById('back-to-category-btn');

let cachedResults = null;
let currentCategory = null;

// ---------- UI helpers ----------
function showInitial() {
  initialScreen.classList.add('active');
  chatbotScreen.classList.remove('active');
}
function showChatbot() {
  initialScreen.classList.remove('active');
  chatbotScreen.classList.add('active');
}
function scrollChat() { chatArea.scrollTop = chatArea.scrollHeight; }

// create a message bubble, returns bubble element
function addMessage(text = '', sender = 'bot', isHtml = false) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${sender}`;
  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';
  if (isHtml) bubble.innerHTML = text;
  else bubble.textContent = text;
  messageDiv.appendChild(bubble);
  chatArea.appendChild(messageDiv);
  scrollChat();
  return bubble;
}

// typing bubble with 3-dot animation (returns element)
function addTypingBubble() {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message bot typing-bubble';
  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';
  bubble.innerHTML = `<span class="typing-text">...</span><span class="dots"><span></span><span></span><span></span></span>`;
  messageDiv.appendChild(bubble);
  chatArea.appendChild(messageDiv);
  scrollChat();
  return messageDiv;
}

// ---------- Data helpers (caching) ----------
async function getAllResults() {
  if (cachedResults !== null) return cachedResults;
  const snap = await database.ref('results').once('value');
  cachedResults = snap.exists() ? snap.val() : {};
  return cachedResults;
}

// ---------- Category & program UI ----------
async function showCategoryButtons() {
  backToCategoryBtn.style.display = 'none';
  const typing = addTypingBubble();

  try {
    const allResults = await getAllResults();
    // small delay to mimic typing UX
    await new Promise(r => setTimeout(r, 700));
    typing.remove();

    const uniqueCategories = new Set();
    for (const key in allResults) {
      if (allResults[key] && allResults[key].category) uniqueCategories.add(allResults[key].category);
    }
    const categories = Array.from(uniqueCategories).sort();
    if (!categories.length) {
      addMessage('No categories found at the moment.', 'bot');
      return;
    }
    const container = document.createElement('div');
    container.className = 'category-buttons message bot';
    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.textContent = cat;
      btn.addEventListener('click', () => handleCategorySelection(cat));
      container.appendChild(btn);
    });
    chatArea.appendChild(container);
    scrollChat();
  } catch (err) {
    typing.remove();
    console.error(err);
    addMessage('There was an error loading categories. Try again later.', 'bot');
  }
}

function handleCategorySelection(category) {
  addMessage(category, 'user');
  currentCategory = category;
  addMessage(`Please select a program for ${category}:`, 'bot');
  showProgramButtons(category);
}

async function showProgramButtons(category) {
  const typing = addTypingBubble();
  try {
    const allResults = await getAllResults();
    await new Promise(r => setTimeout(r, 400));
    typing.remove();

    const uniquePrograms = new Set();
    for (const key in allResults) {
      const row = allResults[key];
      if (row && row.category === category && row.program) uniquePrograms.add(row.program);
    }
    const programs = Array.from(uniquePrograms).sort();
    if (!programs.length) {
      addMessage(`No programs found for ${category}.`, 'bot');
      backToCategoryBtn.style.display = 'block';
      return;
    }
    const container = document.createElement('div');
    container.className = 'program-buttons message bot';
    programs.forEach(prog => {
      const btn = document.createElement('button');
      btn.textContent = prog;
      btn.addEventListener('click', () => handleProgramSelection(category, prog));
      container.appendChild(btn);
    });
    chatArea.appendChild(container);
    scrollChat();
  } catch (err) {
    typing.remove();
    console.error(err);
    addMessage('There was an error loading programs. Try again later.', 'bot');
    backToCategoryBtn.style.display = 'block';
  }
}

// ---------- Display image for selected program ----------
async function handleProgramSelection(category, program) {
  addMessage(program, 'user');

  // show a loading card
  const loadingCardWrap = document.createElement('div');
  loadingCardWrap.className = 'message bot';
  const loadingCard = document.createElement('div');
  loadingCard.className = 'message-bubble';
  loadingCard.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;gap:10px;">
    <div class="loading-spinner" aria-hidden="true"></div>
    <div>Loading image...</div>
  </div>`;
  loadingCardWrap.appendChild(loadingCard);
  chatArea.appendChild(loadingCardWrap);
  scrollChat();

  try {
    const allResults = await getAllResults();
    // find first matching entry (you can change to collect all matches)
    let imageUrl = null;
    for (const key in allResults) {
      const row = allResults[key];
      if (row && row.category === category && row.program === program && row.imageUrl) {
        imageUrl = row.imageUrl;
        break;
      }
    }

    // remove loading content and show actual image block
    loadingCardWrap.remove();

    if (!imageUrl) {
      addMessage('Image not found for this program.', 'bot');
      backToCategoryBtn.style.display = 'block';
      return;
    }

    const imageWrap = document.createElement('div');
    imageWrap.className = 'image-result message bot';
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = program;
    imageWrap.appendChild(img);

    // download button
    const dl = document.createElement('button');
    dl.className = 'download-icon';
    dl.title = 'Download Image';
    dl.addEventListener('click', () => downloadImage(imageUrl, sanitizeFilename(`${category}_${program}`)));
    imageWrap.appendChild(dl);

    // when image loads show back button
    img.onload = () => {
      chatArea.appendChild(imageWrap);
      scrollChat();
      backToCategoryBtn.style.display = 'block';
    };
    img.onerror = () => {
      addMessage('Failed to load image (CORS or broken URL).', 'bot');
      backToCategoryBtn.style.display = 'block';
    };
  } catch (err) {
    console.error(err);
    addMessage('There was an error fetching the image. Try again later.', 'bot');
    backToCategoryBtn.style.display = 'block';
  }
}

// ---------- download helper ----------
async function downloadImage(imageUrl, filename) {
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) throw new Error('Network response not OK');
    const blob = await res.blob();
    const ext = determineExtensionFromBlobOrUrl(blob, imageUrl);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Download failed', err);
    addMessage('Failed to download image. You can open the image in a new tab and save it.', 'bot');
  }
}
function determineExtensionFromBlobOrUrl(blob, url){
  try{
    const t = blob.type || '';
    if(t.includes('png')) return 'png';
    if(t.includes('gif')) return 'gif';
    if(t.includes('webp')) return 'webp';
    if(t.includes('svg')) return 'svg';
    if(t.includes('jpeg') || t.includes('jpg')) return 'jpg';
  }catch(e){}
  const parts = url.split('?')[0].split('.');
  const last = parts[parts.length-1].toLowerCase();
  if(['jpg','jpeg','png','gif','webp','svg'].includes(last)) return last;
  return 'jpg';
}
function sanitizeFilename(name){
  return name.replace(/[<>:"/\\|?*\u0000-\u001F]/g,'_').slice(0,120);
}

// ---------- Events ----------
getResultsBtn.addEventListener('click', () => {
  // nice fade/transition (CSS handles since screen classes toggle)
  showChatbot();
  // small entrance message + show start button after a short delay
  addMessage('Welcome to the Sahithyotsav Results Bot!', 'bot');
  setTimeout(()=> startButton.style.display = 'block', 600);
});

startButton.addEventListener('click', async () => {
  startButton.style.display = 'none';
  chatArea.innerHTML = '';
  await showCategoryButtons();
});

backToCategoryBtn.addEventListener('click', () => {
  chatArea.innerHTML = '';
  addMessage('Welcome to the Sahithyotsav Results Bot!', 'bot');
  startButton.style.display = 'block';
  backToCategoryBtn.style.display = 'none';
});

// show initial screen at load
showInitial();
