// Array of quote objects
const quotes = [
  { text: "The future belongs to those who prepare for it today.", category: "Inspiration" },
  { text: "Do what you can, with what you have, where you are.", category: "Motivation" },
  { text: "In the middle of difficulty lies opportunity.", category: "Wisdom" }
];

// Function to show a random quote and update the DOM
function displayRandomQuote() {
  const randomIndex = Math.floor(Math.random() * quotes.length);
  const randomQuote = quotes[randomIndex];
  
  // ✅ Update DOM using innerHTML
  const quoteDisplay = document.getElementById("quoteDisplay");
  quoteDisplay.innerHTML = `
    <p>"${randomQuote.text}"</p>
    <p><strong>Category:</strong> ${randomQuote.category}</p>
  `;
}

// Event listener for the “Show New Quote” button
document.getElementById("newQuote").addEventListener("click", displayRandomQuote);

// Display an initial quote when the page loads
window.onload = displayRandomQuote;
