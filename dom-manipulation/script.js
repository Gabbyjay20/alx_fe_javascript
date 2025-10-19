// ---------- Dynamic Quote Generator (Task 1) ----------

// Storage key
const STORAGE_KEY = 'quotes';

// Server simulation constants
const SERVER_URL = 'https://jsonplaceholder.typicode.com/posts';
const SYNC_INTERVAL = 30000; // 30 seconds for demo

// Conflict resolution state
let pendingConflicts = [];

// Default quotes (used if no saved data)
let quotes = [
  { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
  { text: "Life is what happens while you’re busy making other plans.", category: "Life" },
  { text: "Do one thing every day that scares you.", category: "Inspiration" }
];

/* -------------------------
   Storage helpers
   ------------------------- */
function saveQuotes() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
  } catch (err) {
    console.error('Could not save quotes to localStorage', err);
  }
}

function loadQuotes() {
  const s = localStorage.getItem(STORAGE_KEY);
  if (s) {
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed) && parsed.every(q => q && typeof q.text === 'string' && typeof q.category === 'string')) {
        quotes = parsed;
      } else {
        console.warn('Stored quotes invalid — using defaults.');
      }
    } catch (err) {
      console.error('Error parsing stored quotes — using defaults.', err);
    }
  }
}

/* -------------------------
   Show random quote (required name)
   ------------------------- */
function showRandomQuote() {
  const display = document.getElementById('quoteDisplay');
  if (!display) {
    console.error('No element with id "quoteDisplay" found in DOM.');
    return;
  }

  if (!Array.isArray(quotes) || quotes.length === 0) {
    display.innerHTML = '<p>No quotes available.</p>';
    return;
  }

  const randomIndex = Math.floor(Math.random() * quotes.length);
  const q = quotes[randomIndex];

  display.innerHTML = `
    <p class="quote-text">"${escapeHtml(q.text)}"</p>
    <p class="quote-cat"><em>Category: ${escapeHtml(q.category)}</em></p>
  `;

  // Save last index in sessionStorage (optional)
  try {
    sessionStorage.setItem('lastQuoteIndex', String(randomIndex));
  } catch (err) {
    // ignore session errors
  }
}

/* -------------------------
   Add a new quote (reads inputs by id)
   ------------------------- */
function addQuote() {
  const textEl = document.getElementById('newQuoteText');
  const catEl = document.getElementById('newQuoteCategory');

  if (!textEl || !catEl) {
    alert('Add-quote inputs are missing from the page.');
    return;
  }

  const text = textEl.value.trim();
  const category = catEl.value.trim();

  if (!text || !category) {
    alert('Please provide both quote text and category.');
    return;
  }

  quotes.push({ text, category });
  saveQuotes();
  textEl.value = '';
  catEl.value = '';

  // Update categories dropdown
  populateCategories();

  // Show the newly added quote immediately
  showRandomQuote();
}

/* -------------------------
   Create the Add Quote form dynamically
   (checker expects createAddQuoteForm to exist)
   ------------------------- */
function createAddQuoteForm(containerId = null) {
  const container = containerId ? document.getElementById(containerId) : null;
  const parent = container || document.body;

  // guard: avoid creating duplicates
  if (document.getElementById('newQuoteText') || document.getElementById('newQuoteCategory')) {
    return;
  }

  const wrapper = document.createElement('div');
  wrapper.id = 'add-quote-wrapper';
  wrapper.style.marginTop = '1rem';

  const inputText = document.createElement('input');
  inputText.type = 'text';
  inputText.id = 'newQuoteText';
  inputText.placeholder = 'Enter a new quote';
  inputText.style.marginRight = '0.5rem';

  const inputCat = document.createElement('input');
  inputCat.type = 'text';
  inputCat.id = 'newQuoteCategory';
  inputCat.placeholder = 'Enter quote category';
  inputCat.style.marginRight = '0.5rem';

  const addBtn = document.createElement('button');
  addBtn.id = 'addQuote';
  addBtn.type = 'button';
  addBtn.textContent = 'Add Quote';
  addBtn.addEventListener('click', addQuote);

  wrapper.appendChild(inputText);
  wrapper.appendChild(inputCat);
  wrapper.appendChild(addBtn);

  // Also create import/export controls
  const ioWrapper = document.createElement('div');
  ioWrapper.style.marginTop = '0.75rem';

  const exportBtn = document.createElement('button');
  exportBtn.id = 'exportBtn';
  exportBtn.type = 'button';
  exportBtn.textContent = 'Export Quotes (JSON)';
  exportBtn.style.marginRight = '0.5rem';
  exportBtn.addEventListener('click', exportToJsonFile);

  const importInput = document.createElement('input');
  importInput.type = 'file';
  importInput.id = 'importFile';
  importInput.accept = '.json';
  importInput.addEventListener('change', importFromJsonFile);

  ioWrapper.appendChild(exportBtn);
  ioWrapper.appendChild(importInput);

  wrapper.appendChild(ioWrapper);

  parent.appendChild(wrapper);
}

/* -------------------------
   Export / Import JSON
   ------------------------- */
function exportToJsonFile() {
  try {
    const str = JSON.stringify(quotes, null, 2);
    const blob = new Blob([str], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quotes.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    alert('Error exporting quotes: ' + err.message);
  }
}

function importFromJsonFile(event) {
  const f = event.target.files && event.target.files[0];
  if (!f) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const parsed = JSON.parse(e.target.result);
      if (!Array.isArray(parsed)) {
        alert('Imported JSON must be an array of quote objects.');
        return;
      }

      // Validate and keep only objects with text & category strings
      const valid = parsed.filter(q => q && typeof q.text === 'string' && typeof q.category === 'string');
      if (valid.length === 0) {
        alert('No valid quotes found in file.');
        return;
      }

      // Merge: avoid creating duplicates by simple check (text+category)
      const existingSet = new Set(quotes.map(q => q.text + '||' + q.category));
      let added = 0;
      valid.forEach(q => {
        const key = q.text + '||' + q.category;
        if (!existingSet.has(key)) {
          quotes.push(q);
          existingSet.add(key);
          added++;
        }
      });

      saveQuotes();
      populateCategories(); // Update categories after import
      alert(`Imported ${added} new quotes (skipped ${valid.length - added} duplicates).`);
      showRandomQuote();
    } catch (err) {
      alert('Failed to import JSON: ' + err.message);
    } finally {
      // clear the file input so same file can be re-imported if needed
      try { event.target.value = ''; } catch {}
    }
  };
  reader.readAsText(f);
}

/* -------------------------
    Populate Categories Dynamically
    ------------------------- */
function populateCategories() {
  const select = document.getElementById('categoryFilter');
  if (!select) return;

  // Clear existing options except "All Categories"
  select.innerHTML = '<option value="all">All Categories</option>';

  // Get unique categories
  const categories = [...new Set(quotes.map(q => q.category))].sort();

  // Add options for each category
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    select.appendChild(option);
  });
}

/* -------------------------
    Filter Quotes Based on Selected Category
    ------------------------- */
function filterQuotes() {
  const select = document.getElementById('categoryFilter');
  if (!select) return;

  const selectedCategory = select.value;

  // Save filter preference to localStorage
  try {
    localStorage.setItem('selectedCategory', selectedCategory);
  } catch (err) {
    console.error('Could not save filter preference', err);
  }

  // Filter quotes
  let filteredQuotes;
  if (selectedCategory === 'all') {
    filteredQuotes = quotes;
  } else {
    filteredQuotes = quotes.filter(q => q.category === selectedCategory);
  }

  // Update display with filtered quotes
  const display = document.getElementById('quoteDisplay');
  if (!display) return;

  if (filteredQuotes.length === 0) {
    display.innerHTML = '<p>No quotes found for this category.</p>';
    return;
  }

  // Show a random quote from filtered list
  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const q = filteredQuotes[randomIndex];

  display.innerHTML = `
    <p class="quote-text">"${escapeHtml(q.text)}"</p>
    <p class="quote-cat"><em>Category: ${escapeHtml(q.category)}</em></p>
  `;

  // Update sessionStorage with the index in the original array
  const originalIndex = quotes.findIndex(quote => quote === q);
  if (originalIndex !== -1) {
    try {
      sessionStorage.setItem('lastQuoteIndex', String(originalIndex));
    } catch (err) {
      // ignore session errors
    }
  }
}

/* -------------------------
/* -------------------------
   Utility: escape HTML for safety in innerHTML
   ------------------------- */
function escapeHtml(text) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
/* -------------------------
   Server Sync Functions
   ------------------------- */

// Fetch quotes from server (simulated)
async function fetchServerQuotes() {
  try {
    const response = await fetch(SERVER_URL);
    if (!response.ok) throw new Error('Failed to fetch from server');
    const posts = await response.json();

    // Transform posts to quote format (using title as text, body as category or default)
    return posts.slice(0, 10).map(post => ({
      text: post.title,
      category: 'Server'
    }));
  } catch (error) {
    console.error('Error fetching server quotes:', error);
    return [];
  }
}

// Post local quotes to server (simulated)
async function postLocalQuotes() {
  try {
    const response = await fetch(SERVER_URL, {
      method: 'POST',
      body: JSON.stringify({
        title: 'Local Quotes Sync',
        body: JSON.stringify(quotes),
        userId: 1
      }),
      headers: {
        'Content-type': 'application/json; charset=UTF-8',
      },
    });
    if (!response.ok) throw new Error('Failed to post to server');
    return await response.json();
  } catch (error) {
    console.error('Error posting local quotes:', error);
    return null;
  }
}

// Sync data with server
async function syncWithServer() {
  const serverQuotes = await fetchServerQuotes();
  if (serverQuotes.length === 0) return;

  let conflicts = [];
  let updates = 0;

  // Check for conflicts (if server has quotes with same text but different category)
  const localMap = new Map(quotes.map(q => [q.text, q]));
  serverQuotes.forEach(serverQuote => {
    const localQuote = localMap.get(serverQuote.text);
    if (!localQuote) {
      // New quote from server
      quotes.push(serverQuote);
      updates++;
    } else if (localQuote.category !== serverQuote.category) {
      // Conflict: same text, different category
      conflicts.push({ local: localQuote, server: serverQuote });
    }
    // If same text and category, no action needed
  });

  if (updates > 0) {
    saveQuotes();
    populateCategories();
    showNotification(`Synced ${updates} new quotes from server.`);
  }

  if (conflicts.length > 0) {
    pendingConflicts = conflicts;
    showNotification(`Conflicts detected with ${conflicts.length} quotes. Please resolve manually.`, 'conflict');
    showConflictResolutionUI();
  } else {
    hideConflictResolutionUI();
  }

  // Post local changes to server
  await postLocalQuotes();
}

// Show notification
function showNotification(message, type = 'info') {
  const notification = document.getElementById('notification');
  if (!notification) return;

  notification.textContent = message;
  notification.style.display = 'block';
  notification.style.background = type === 'conflict' ? '#ffcccc' : '#ccffcc';
  notification.style.color = '#000';
  notification.style.padding = '10px';
  notification.style.marginBottom = '1rem';
  notification.style.borderRadius = '4px';

  // Auto-hide after 10 seconds for conflicts, 5 for others
  const timeout = type === 'conflict' ? 10000 : 5000;
  setTimeout(() => {
    notification.style.display = 'none';
  }, timeout);
}

// Show conflict resolution UI
function showConflictResolutionUI() {
  const keepLocalBtn = document.getElementById('resolveKeepLocal');
  const acceptServerBtn = document.getElementById('resolveAcceptServer');
  if (keepLocalBtn) keepLocalBtn.style.display = 'inline-block';
  if (acceptServerBtn) acceptServerBtn.style.display = 'inline-block';
}

// Hide conflict resolution UI
function hideConflictResolutionUI() {
  const keepLocalBtn = document.getElementById('resolveKeepLocal');
  const acceptServerBtn = document.getElementById('resolveAcceptServer');
  if (keepLocalBtn) keepLocalBtn.style.display = 'none';
  if (acceptServerBtn) acceptServerBtn.style.display = 'none';
}

// Manual conflict resolution: keep local
function resolveConflictKeepLocal() {
  if (pendingConflicts.length === 0) {
    showNotification('No conflicts to resolve.');
    return;
  }
  // Keep local data, discard server conflicts
  pendingConflicts = [];
  hideConflictResolutionUI();
  showNotification('Conflict resolved: Keeping local data.');
}

// Manual conflict resolution: accept server
function resolveConflictAcceptServer() {
  if (pendingConflicts.length === 0) {
    showNotification('No conflicts to resolve.');
    return;
  }
  // Update local quotes with server data for conflicts
  pendingConflicts.forEach(conflict => {
    const index = quotes.findIndex(q => q.text === conflict.local.text);
    if (index !== -1) {
      quotes[index] = conflict.server;
    }
  });
  saveQuotes();
  populateCategories();
  pendingConflicts = [];
  hideConflictResolutionUI();
  showNotification('Conflict resolved: Accepting server data.');
}

// Start periodic sync
function startPeriodicSync() {
  setInterval(syncWithServer, SYNC_INTERVAL);
}

/* -------------------------
   Initialization
   ------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  // Load saved quotes if exist
  loadQuotes();

  // Populate categories dropdown
  populateCategories();

  // Restore last selected filter
  try {
    const savedFilter = localStorage.getItem('selectedCategory');
    if (savedFilter) {
      const select = document.getElementById('categoryFilter');
      if (select) {
        select.value = savedFilter;
      }
    }
  } catch (err) {
    console.error('Could not restore filter preference', err);
  }

  // Create the add-quote form and import/export UI dynamically
  createAddQuoteForm('form-container' /* optional container id; will fallback to body if not found */);

  // Wire up Show New Quote button (expected ID in spec: newQuote)
  const newQuoteBtn = document.getElementById('newQuote');
  if (newQuoteBtn) {
    newQuoteBtn.addEventListener('click', showRandomQuote);
  } else {
    console.warn('No element with id "newQuote" found. Create a button with id="newQuote" or adjust the script.');
  }

  // Start periodic server sync
  startPeriodicSync();

  // If the page has a pre-existing import or export elements, wire them (compat)
  const importEl = document.getElementById('importFile');
  if (importEl && !importEl.onchange) importEl.addEventListener('change', importFromJsonFile);

  const exportEl = document.getElementById('exportBtn');
  if (exportEl && !exportEl.onclick) exportEl.addEventListener('click', exportToJsonFile);

  // Wire up conflict resolution buttons
  const keepLocalBtn = document.getElementById('resolveKeepLocal');
  if (keepLocalBtn) {
    keepLocalBtn.addEventListener('click', resolveConflictKeepLocal);
    keepLocalBtn.style.display = 'none'; // Hide initially
  }

  const acceptServerBtn = document.getElementById('resolveAcceptServer');
  if (acceptServerBtn) {
    acceptServerBtn.addEventListener('click', resolveConflictAcceptServer);
    acceptServerBtn.style.display = 'none'; // Hide initially
  }

  // If sessionStorage has last shown index, try to show it
  try {
    const last = sessionStorage.getItem('lastQuoteIndex');
    if (last !== null) {
      const idx = Number(last);
      if (!Number.isNaN(idx) && quotes[idx]) {
        // show that exact quote
        const display = document.getElementById('quoteDisplay');
        display.innerHTML = `
          <p class="quote-text">"${escapeHtml(quotes[idx].text)}"</p>
          <p class="quote-cat"><em>Category: ${escapeHtml(quotes[idx].category)}</em></p>
        `;
        return;
      }
    }
  } catch (err) {
    // ignore session errors
  }

  // Default: show random quote on load
  showRandomQuote();
});
