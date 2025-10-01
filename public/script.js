// === Configuration ===
const API_KEY = "ec537a689075b39d72c48f0ebb2445a1";
const BASE_URL = "https://gnews.io/api/v4";

// === DOM Elements ===
const articlesEl = document.getElementById("articles");
const loadingEl = document.getElementById("loading");
const errorEl = document.getElementById("error");
const queryInput = document.getElementById("query");
const searchBtn = document.getElementById("searchBtn");
const refreshBtn = document.getElementById("refreshBtn");

const notesEl = document.getElementById("notes");
const noteInput = document.getElementById("noteInput");
const addNoteBtn = document.getElementById("addNoteBtn");
const addNewsBtn = document.getElementById("addNewsBtn");
const savedNewsBox = document.getElementById("savedNewsBox");
const closeNotesBtn = document.getElementById("closeNotesBtn");

const chatbotBtn = document.getElementById("chatbot-btn");
const chatbotWindow = document.getElementById("chatbot-window");
const chatMessages = document.getElementById("chat-messages");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

// === Utility Functions ===
function showLoading(isVisible) {
  loadingEl.style.display = isVisible ? "block" : "none";
}

function showError(message) {
  errorEl.style.display = message ? "block" : "none";
  errorEl.textContent = message || "";
}

function clearArticles() {
  articlesEl.innerHTML = "";
}

function escapeText(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

// === News Rendering ===
function renderArticles(articles) {
  clearArticles();
  if (!articles || articles.length === 0) {
    articlesEl.innerHTML = "<div class='small-muted'>No articles found for this query.</div>";
    return;
  }

  const fragment = document.createDocumentFragment();

  articles.forEach(article => {
    const wrap = document.createElement("article");
    wrap.className = "article";

    const img = document.createElement("img");
    img.alt = "article image";
    img.src = article.image || "https://via.placeholder.com/160x100?text=No+Image";

    const info = document.createElement("div");
    info.className = "info";

    const title = document.createElement("h3");
    title.textContent = article.title || "(No title)";

    const desc = document.createElement("p");
    desc.innerHTML = `<strong>Description:</strong> ${article.description ? escapeText(article.description) : "No description available."}`;

    const content = document.createElement("p");
    content.innerHTML = `<strong>Content:</strong> ${article.content ? escapeText(article.content) : "No content available."}`;

    const readLink = document.createElement("a");
    readLink.href = article.url || "#";
    readLink.target = "_blank";
    readLink.rel = "noopener noreferrer";
    readLink.textContent = "Read full article";

    const meta = document.createElement("div");
    meta.className = "meta2 small-muted";
    const published = article.publishedAt ? new Date(article.publishedAt).toLocaleString() : "";
    meta.textContent = article.source?.name ? `${article.source.name} • ${published}` : published || article.source?.name || "";

    info.append(title, desc, content, readLink, meta);
    wrap.append(img, info);
    fragment.appendChild(wrap);
  });

  articlesEl.appendChild(fragment);
}

// === API Calls ===
async function fetchGNews(endpoint) {
  showError(null);
  showLoading(true);
  try {
    const response = await fetch(endpoint);
    if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
    const data = await response.json();
    showLoading(false);
    return data;
  } catch (error) {
    showLoading(false);
    showError("Error fetching news: " + error.message);
    console.error("fetchGNews error:", error);
    return null;
  }
}

async function loadDefaultNews() {
  const url = `${BASE_URL}/top-headlines?lang=en&token=${API_KEY}`;
  const data = await fetchGNews(url);
  if (data?.articles) renderArticles(data.articles);
}

async function searchNews() {
  const query = queryInput.value.trim() || "technology";
  const url = `${BASE_URL}/search?q=${encodeURIComponent(query)}&lang=en&token=${API_KEY}`;
  const data = await fetchGNews(url);
  if (data?.articles) renderArticles(data.articles);
}

// === Event Listeners ===
searchBtn?.addEventListener("click", searchNews);
refreshBtn?.addEventListener("click", loadDefaultNews);
queryInput?.addEventListener("keyup", e => {
  if (e.key === "Enter") searchNews();
});

// === Notes Feature ===
function loadNotes() {
  const savedNotes = JSON.parse(localStorage.getItem("notes") || "[]");
  renderNotes(savedNotes);
}

function renderNotes(notes) {
  notesEl.innerHTML = "";
  notes.forEach((note, index) => {
    const noteDiv = document.createElement("div");
    noteDiv.className = "note";

    const span = document.createElement("span");
    span.textContent = note;

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "❌";
    deleteBtn.onclick = () => {
      const updatedNotes = notes.filter((_, i) => i !== index);
      localStorage.setItem("notes", JSON.stringify(updatedNotes));
      renderNotes(updatedNotes);
    };

    noteDiv.append(span, deleteBtn);
    notesEl.appendChild(noteDiv);
  });
}

addNoteBtn?.addEventListener("click", () => {
  const note = noteInput.value.trim();
  if (!note) return;
  const notes = JSON.parse(localStorage.getItem("notes") || "[]");
  notes.push(note);
  localStorage.setItem("notes", JSON.stringify(notes));
  noteInput.value = "";
  renderNotes(notes);
});

addNewsBtn?.addEventListener("click", () => {
  savedNewsBox.style.display = "block";
  addNewsBtn.disabled = true;
});

closeNotesBtn?.addEventListener("click", () => {
  savedNewsBox.style.display = "none";
  addNewsBtn.disabled = false;
});

// === Chatbot Feature ===
chatbotBtn.addEventListener("click", () => {
  chatbotWindow.style.display = chatbotWindow.style.display === "flex" ? "none" : "flex";
});

function addMessage(text, sender) {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("msg", sender);
  msgDiv.textContent = text;
  chatMessages.appendChild(msgDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

sendBtn.addEventListener("click", handleMessage);
userInput.addEventListener("keypress", e => {
  if (e.key === "Enter") handleMessage();
});

async function handleMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  addMessage(text, "user");
  userInput.value = "";

  let reply = "";

  if (text.toLowerCase().startsWith("translate")) {
    const content = text.replace("translate", "").trim();
    reply = await translateToHindi(content);
  } else if (text.toLowerCase().startsWith("meaning")) {
    const word = text.replace("meaning", "").trim();
    reply = await getMeaning(word);
  } else {
    reply = "I can help with:\n- translate <text>\n- meaning <word>";
  }

  addMessage(reply, "bot");
}

// === Backend Integration ===
async function translateToHindi(text) {
  try {
    const response = await fetch("http://localhost:5000/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    const data = await response.json();
    return data.translatedText || "Translation failed.";
  } catch {
    return "Error connecting to server.";
  }
}

async function getMeaning(word) {
  try {
    const response = await fetch(`http://localhost:5000/meaning/${word}`);
    const data = await response.json();
    return data[0]?.meanings[0]?.definitions[0]?.definition || "Meaning not found.";
  } catch {
    return "Error connecting to server.";
  }
}

// === Initialization ===
window.addEventListener("load", () => {
  loadDefaultNews();
  loadNotes();
});
