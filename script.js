// ---------------- Firebase Configuration (your provided config) ----------------
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
const db = firebase.database();

// ---------------- Element refs ----------------
const initialScreen = document.getElementById("initial-screen");
const chatbotScreen = document.getElementById("chatbot-screen");
const getBtn = document.getElementById("get-results-btn");
const startBtn = document.getElementById("start-button");
const backBtn = document.getElementById("back-to-category-btn");
const chatArea = document.getElementById("chat-area");

// ---------------- simple cache ----------------
let cache = null;
async function fetchAllResults() {
  if (cache) return cache;
  try {
    const snap = await db.ref("results").once("value");
    cache = snap.exists() ? snap.val() : {};
    return cache;
  } catch (err) {
    console.error("Error fetching results:", err);
    return {};
  }
}

// ---------------- UI helpers ----------------
function addMessage(text, sender = "bot") {
  const wrapper = document.createElement("div");
  wrapper.className = `message ${sender}`;
  const bubble = document.createElement("div");
  bubble.className = "message-bubble";
  bubble.textContent = text;
  wrapper.appendChild(bubble);
  chatArea.appendChild(wrapper);
  chatArea.scrollTop = chatArea.scrollHeight;
  return wrapper;
}
function addTyping() {
  const wrapper = document.createElement("div");
  wrapper.className = "message bot";
  const bubble = document.createElement("div");
  bubble.className = "message-bubble typing-dots";
  wrapper.appendChild(bubble);
  chatArea.appendChild(wrapper);
  chatArea.scrollTop = chatArea.scrollHeight;
  return wrapper;
}

// ---------------- Flow functions ----------------
async function showCategories() {
  backBtn.style.display = "none";
  const t = addTyping();
  const all = await fetchAllResults();
  t.remove();

  const categories = [...new Set(Object.values(all || {}).map(x => x.category).filter(Boolean))];
  if (!categories.length) {
    addMessage("No categories found.");
    return;
  }

  const container = document.createElement("div");
  container.className = "category-buttons message bot";
  categories.forEach(cat => {
    const btn = document.createElement("button");
    btn.textContent = cat;
    btn.onclick = () => handleCategorySelect(cat);
    container.appendChild(btn);
  });
  chatArea.appendChild(container);
  chatArea.scrollTop = chatArea.scrollHeight;
}

function handleCategorySelect(cat) {
  addMessage(cat, "user");
  addMessage(`Please select a program for ${cat}:`);
  showPrograms(cat);
}

async function showPrograms(category) {
  const t = addTyping();
  const all = await fetchAllResults();
  t.remove();

  const programs = [...new Set(Object.values(all || {})
    .filter(e => e.category === category && e.program)
    .map(e => e.program))];

  if (!programs.length) {
    addMessage(`No programs found for ${category}.`);
    backBtn.style.display = "block";
    return;
  }

  const container = document.createElement("div");
  container.className = "program-buttons message bot";
  programs.forEach(p => {
    const btn = document.createElement("button");
    btn.textContent = p;
    btn.onclick = () => handleProgramSelect(category, p);
    container.appendChild(btn);
  });
  chatArea.appendChild(container);
  chatArea.scrollTop = chatArea.scrollHeight;
}

async function handleProgramSelect(category, program) {
  addMessage(program, "user");
  const t = addTyping();
  const all = await fetchAllResults();
  t.remove();

  const found = Object.values(all || {}).find(e => e.category === category && e.program === program && e.imageUrl);
  if (!found) {
    addMessage("Image not found for this program.");
    backBtn.style.display = "block";
    return;
  }

  const wrap = document.createElement("div");
  wrap.className = "image-result";
  const img = document.createElement("img");
  img.src = found.imageUrl;
  img.alt = program;
  img.onload = () => { chatArea.scrollTop = chatArea.scrollHeight; backBtn.style.display = "block"; };
  img.onerror = () => { addMessage("Error loading image."); backBtn.style.display = "block"; };
  wrap.appendChild(img);

  const dl = document.createElement("button");
  dl.className = "download-icon";
  dl.textContent = "Download";
  dl.onclick = () => downloadImage(found.imageUrl, program);
  wrap.appendChild(dl);

  chatArea.appendChild(wrap);
  chatArea.scrollTop = chatArea.scrollHeight;
}

// ---------------- download helper ----------------
async function downloadImage(url, name) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Network response not ok");
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${name}.jpg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  } catch (err) {
    console.error("Download error:", err);
    addMessage("Failed to download image. Try opening the image in a new tab.", "bot");
  }
}

// ---------------- Event listeners ----------------
getBtn.addEventListener("click", () => {
  // Ensure DOM ids exist
  if (!initialScreen || !chatbotScreen) {
    console.error("Screens not found in DOM");
    return;
  }
  initialScreen.classList.remove("active");
  chatbotScreen.classList.add("active");
  chatArea.innerHTML = "";
  addMessage("Welcome to the Sahithyotsav Results Bot!");
  startBtn.style.display = "block";
});

startBtn.addEventListener("click", () => {
  startBtn.style.display = "none";
  chatArea.innerHTML = "";
  showCategories();
});

backBtn.addEventListener("click", () => {
  chatArea.innerHTML = "";
  addMessage("Welcome back! Press Start to choose a category.");
  startBtn.style.display = "block";
  backBtn.style.display = "none";
});
