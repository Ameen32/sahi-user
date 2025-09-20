// Firebase config
const firebaseConfig = { /* ...നിന്റെ config 그대로... */ };
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Elements
const initialScreen = document.getElementById("initial-screen");
const chatbotScreen = document.getElementById("chatbot-screen");
const getBtn = document.getElementById("get-results-btn");
const startBtn = document.getElementById("start-button");
const backBtn = document.getElementById("back-to-category-btn");
const chatArea = document.getElementById("chat-area");

let cache = null;

// Helpers
function addMessage(text, sender="bot") {
  const div = document.createElement("div");
  div.className = `message ${sender}`;
  const bubble = document.createElement("div");
  bubble.className = "message-bubble";
  bubble.textContent = text;
  div.appendChild(bubble);
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
}
function typingBubble() {
  const div = document.createElement("div");
  div.className = "message bot";
  const bubble = document.createElement("div");
  bubble.className = "message-bubble typing-dots";
  div.appendChild(bubble);
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
  return div;
}
async function fetchResults() {
  if (cache) return cache;
  const snap = await db.ref("results").once("value");
  cache = snap.exists() ? snap.val() : {};
  return cache;
}

// Flow
async function showCategories() {
  backBtn.style.display = "none";
  const typing = typingBubble();
  const all = await fetchResults();
  typing.remove();
  const cats = [...new Set(Object.values(all).map(x=>x.category).filter(Boolean))];
  if (!cats.length) return addMessage("No categories found.");
  const box = document.createElement("div");
  box.className = "category-buttons message bot";
  cats.forEach(cat=>{
    const btn = document.createElement("button");
    btn.textContent = cat;
    btn.onclick = ()=>selectCategory(cat);
    box.appendChild(btn);
  });
  chatArea.appendChild(box);
}
function selectCategory(cat) {
  addMessage(cat,"user");
  addMessage(`Programs under ${cat}:`);
  showPrograms(cat);
}
async function showPrograms(cat) {
  const typing = typingBubble();
  const all = await fetchResults();
  typing.remove();
  const progs = [...new Set(Object.values(all).filter(x=>x.category===cat).map(x=>x.program))];
  if (!progs.length) return addMessage("No programs found.");
  const box = document.createElement("div");
  box.className = "program-buttons message bot";
  progs.forEach(p=>{
    const btn = document.createElement("button");
    btn.textContent = p;
    btn.onclick = ()=>selectProgram(cat,p);
    box.appendChild(btn);
  });
  chatArea.appendChild(box);
}
async function selectProgram(cat,prog) {
  addMessage(prog,"user");
  const typing = typingBubble();
  const all = await fetchResults();
  typing.remove();
  const match = Object.values(all).find(x=>x.category===cat && x.program===prog);
  if (!match?.imageUrl) return addMessage("Image not found.");
  const wrap = document.createElement("div");
  wrap.className = "image-result";
  const img = document.createElement("img");
  img.src = match.imageUrl;
  wrap.appendChild(img);
  const dl = document.createElement("button");
  dl.className = "download-icon";
  dl.textContent = "Download";
  dl.onclick = ()=>downloadImage(match.imageUrl,prog);
  wrap.appendChild(dl);
  chatArea.appendChild(wrap);
  backBtn.style.display="block";
}
async function downloadImage(url, name) {
  const res = await fetch(url);
  const blob = await res.blob();
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${name}.jpg`;
  link.click();
}

// Event listeners
getBtn.onclick = ()=>{
  initialScreen.classList.remove("active");
  chatbotScreen.classList.add("active");
  chatArea.innerHTML="";
  addMessage("Welcome to Maslak Results Bot!");
  startBtn.style.display="block";
};
startBtn.onclick = ()=>{
  startBtn.style.display="none";
  chatArea.innerHTML="";
  showCategories();
};
backBtn.onclick = ()=>{
  chatArea.innerHTML="";
  addMessage("Welcome back! Please start again.");
  startBtn.style.display="block";
  backBtn.style.display="none";
};
