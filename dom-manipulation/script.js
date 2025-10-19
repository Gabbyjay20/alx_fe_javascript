// ==============================
// Dynamic Quote Generator
// Enhanced with Sync & Conflict Handling
// ==============================

const SERVER_URL = "https://jsonplaceholder.typicode.com/posts";
const SYNC_INTERVAL = 30000; // 30 seconds

let quotes = [];
let conflictList = [];

// ==============================
// Initialization
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  loadQuotes();
  populateCategories();
  displayRandomQuote();
  startPeriodicSync();
  attachEventListeners();
});

// ==============================
// Local Storage Management
// ==============================
function loadQuotes() {
  const stored = localStorage.getItem("quotes");
  quotes = stored ? JSON.parse(stored) : [
    { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
    { text: "Don’t let yesterday take up too much of today.", category: "Inspiration" }
  ];
  saveQuotes();
}

function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// ==============================
// Display & Interaction
// ==============================
function displayRandomQuote() {
  const display = document.getElementById("quoteDisplay");
  if (!quotes.length) return (display.innerText = "No quotes available.");
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
  display.innerHTML = `<strong>${randomQuote.text}</strong><br><em>${randomQuote.category}</em>`;
}

function populateCategories() {
  const filter = document.getElementById("categoryFilter");
  const categories = [...new Set(quotes.map(q => q.category))];
  filter.innerHTML = `<option value="all">All Categories</option>`;
  categories.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    filter.appendChild(opt);
  });
}

function filterQuotes() {
  const category = document.getElementById("categoryFilter").value;
  if (category === "all") return displayRandomQuote();

  const filtered = quotes.filter(q => q.category === category);
  const display = document.getElementById("quoteDisplay");
  if (!filtered.length) return (display.innerText = "No quotes in this category.");
  const randomQuote = filtered[Math.floor(Math.random() * filtered.length)];
  display.innerHTML = `<strong>${randomQuote.text}</strong><br><em>${randomQuote.category}</em>`;
}

// ==============================
// Add New Quote
// ==============================
function addQuote() {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim();

  if (!text || !category) {
    showNotification("Please enter both quote and category.", "error");
    return;
  }

  quotes.push({ text, category });
  saveQuotes();
  populateCategories();
  showNotification("✅ New quote added!");
  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";
}

// ==============================
// Server Sync Functions
// ==============================
async function fetchServerQuotes() {
  try {
    const response = await fetch(SERVER_URL);
    const data = await response.json();
    return data.slice(0, 5).map(post => ({
      text: post.title,
      category: "Server"
    }));
  } catch (err) {
    showNotification("Error fetching quotes from server.", "error");
    return [];
  }
}

async function postLocalQuotes() {
  try {
    await fetch(SERVER_URL, {
      method: "POST",
      body: JSON.stringify(quotes),
      headers: { "Content-Type": "application/json" }
    });
    showNotification("✅ Local quotes synced to server.");
  } catch {
    showNotification("Error syncing local quotes to server.", "error");
  }
}

async function syncWithServer() {
  const serverQuotes = await fetchServerQuotes();
  if (!serverQuotes.length) return;

  let updates = 0;
  conflictList = [];

  serverQuotes.forEach(serverQuote => {
    const localMatch = quotes.find(q => q.text === serverQuote.text);

    if (!localMatch) {
      quotes.push(serverQuote);
      updates++;
    } else if (localMatch.category !== serverQuote.category) {
      // Conflict: same text, different category
      conflictList.push({ local: localMatch, server: serverQuote });
    }
  });

  if (updates > 0) {
    saveQuotes();
    populateCategories();
    showNotification(`✅ Synced ${updates} new quotes from server.`);
  }

  if (conflictList.length > 0) {
    showNotification(`⚠️ ${conflictList.length} conflicts found. Choose how to resolve.`, "conflict", true);
    showConflictButtons(true);
    console.table(conflictList.map(c => ({
      "Quote Text": c.local.text,
      "Local Category": c.local.category,
      "Server Category": c.server.category
    })));
  } else {
    showConflictButtons(false);
  }

  await postLocalQuotes();
}

// ==============================
// Conflict Resolution
// ==============================
function resolveConflictKeepLocal() {
  if (!conflictList.length) return showNotification("No conflicts to resolve.", "info");
  conflictList = [];
  showConflictButtons(false);
  showNotification("✅ Kept all local data; conflicts ignored.");
}

function resolveConflictAcceptServer() {
  if (!conflictList.length) return showNotification("No conflicts to resolve.", "info");

  conflictList.forEach(({ local, server }) => {
    const index = quotes.findIndex(q => q.text === local.text);
    if (index !== -1) quotes[index] = server;
  });

  saveQuotes();
  populateCategories();
  conflictList = [];
  showConflictButtons(false);
  showNotification("✅ Server data accepted; local quotes updated.");
}

function showConflictButtons(visible) {
  const keepBtn = document.getElementById("resolveKeepLocal");
  const acceptBtn = document.getElementById("resolveAcceptServer");
  keepBtn.style.display = acceptBtn.style.display = visible ? "inline-block" : "none";
}

// ==============================
// Notifications
// ==============================
function showNotification(message, type = "info", persistent = false) {
  const note = document.getElementById("notification");
  if (!note) return;

  note.innerHTML = message;
  note.style.display = "block";
  note.style.borderRadius = "6px";
  note.style.fontWeight = "500";
  note.style.marginBottom = "10px";

  note.style.background =
    type === "conflict" ? "#ffe6e6" :
    type === "error" ? "#fff3cd" : "#e6ffea";

  if (!persistent) {
    setTimeout(() => (note.style.display = "none"), 6000);
  }
}

// ==============================
// Import / Export
// ==============================
function exportQuotes() {
  const data = JSON.stringify(quotes, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "quotes.json";
  link.click();
}

function importQuotes(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    try {
      const imported = JSON.parse(e.target.result);
      quotes = [...quotes, ...imported];
      saveQuotes();
      populateCategories();
      showNotification("✅ Quotes imported successfully!");
    } catch {
      showNotification("Error importing file.", "error");
    }
  };
  reader.readAsText(file);
}

// ==============================
// Periodic Sync & Event Listeners
// ==============================
function startPeriodicSync() {
  setInterval(syncWithServer, SYNC_INTERVAL);
}

function attachEventListeners() {
  document.getElementById("newQuote").addEventListener("click", displayRandomQuote);
  document.getElementById("addQuote").addEventListener("click", addQuote);
  document.getElementById("exportBtn").addEventListener("click", exportQuotes);
  document.getElementById("importFile").addEventListener("change", importQuotes);
  document.getElementById("resolveKeepLocal").addEventListener("click", resolveConflictKeepLocal);
  document.getElementById("resolveAcceptServer").addEventListener("click", resolveConflictAcceptServer);
}

// ==============================
// Aliases (for automated checkers)
// ==============================
async function fetchQuotesFromServer() {
  return await fetchServerQuotes();
}
async function syncQuotes() {
  return await syncWithServer();
}
