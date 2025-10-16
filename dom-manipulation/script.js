// ---------- Dynamic Quote Generator (Task 1) ----------

// Storage key
const STORAGE_KEY = 'quotes';

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
   Initialization
   ------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  // Load saved quotes if exist
  loadQuotes();

  // Create the add-quote form and import/export UI dynamically
  createAddQuoteForm('form-container' /* optional container id; will fallback to body if not found */);

  // Wire up Show New Quote button (expected ID in spec: newQuote)
  const newQuoteBtn = document.getElementById('newQuote');
  if (newQuoteBtn) {
    newQuoteBtn.addEventListener('click', showRandomQuote);
  } else {
    console.warn('No element with id "newQuote" found. Create a button with id="newQuote" or adjust the script.');
  }

  // If the page has a pre-existing import or export elements, wire them (compat)
  const importEl = document.getElementById('importFile');
  if (importEl && !importEl.onchange) importEl.addEventListener('change', importFromJsonFile);

  const exportEl = document.getElementById('exportBtn');
  if (exportEl && !exportEl.onclick) exportEl.addEventListener('click', exportToJsonFile);

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
