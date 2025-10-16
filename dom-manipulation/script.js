// Array of quotes with text and category
const quotes = [
    { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
    { text: "Don’t let yesterday take up too much of today.", category: "Inspiration" },
    { text: "It’s not whether you get knocked down, it’s whether you get up.", category: "Resilience" },
    { text: "Your time is limited, so don’t waste it living someone else’s life.", category: "Wisdom" },
    { text: "If you want to achieve greatness stop asking for permission.", category: "Courage" }
];

// Function to display a random quote
function showRandomQuote() {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    const quote = quotes[randomIndex];

    const quoteContainer = document.getElementById("quote-container");
    if (quoteContainer) {
        quoteContainer.innerHTML = `
            <p id="quote-text">${quote.text}</p>
            <p id="quote-category"><em>${quote.category}</em></p>
        `;
    }
}

// Function to add a new quote
function addQuote(text, category) {
    if (text && category) {
        quotes.push({ text, category });
        saveQuotesToStorage();
        showRandomQuote(); // Refresh display after adding
    }
}

// Save quotes to localStorage
function saveQuotesToStorage() {
    localStorage.setItem("quotes", JSON.stringify(quotes));
}

// Load quotes from localStorage if they exist
function loadQuotesFromStorage() {
    const storedQuotes = localStorage.getItem("quotes");
    if (storedQuotes) {
        const parsedQuotes = JSON.parse(storedQuotes);
        if (Array.isArray(parsedQuotes)) {
            quotes.length = 0;
            quotes.push(...parsedQuotes);
        }
    }
}

// Event listener for the “Show New Quote” button
document.addEventListener("DOMContentLoaded", () => {
    loadQuotesFromStorage();
    showRandomQuote();

    const newQuoteButton = document.getElementById("new-quote");
    if (newQuoteButton) {
        newQuoteButton.addEventListener("click", showRandomQuote);
    }

    // Optional: if you have a form for adding new quotes
    const addQuoteForm = document.getElementById("add-quote-form");
    if (addQuoteForm) {
        addQuoteForm.addEventListener("submit", (event) => {
            event.preventDefault();
            const text = document.getElementById("quote-input").value.trim();
            const category = document.getElementById("category-input").value.trim();
            addQuote(text, category);
            addQuoteForm.reset();
        });
    }
});
