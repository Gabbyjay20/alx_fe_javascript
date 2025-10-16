// Array of quotes with text and category
let quotes = [
  { text: "The best way to predict the future is to create it.", category: "Inspiration" },
  { text: "Do one thing every day that scares you.", category: "Courage" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", category: "Motivation" }
];

// Function to display a random quote
function showRandomQuote() {
  const quoteDisplay = document.getElementById("quoteDisplay");
  if (!quotes.length) {
    quoteDisplay.innerHTML = "<p>No quotes available.</p>";
    return;
  }

  const randomIndex = Math.floor(Math.random() * quotes.length);
  const quote = quotes[randomIndex];
  quoteDisplay.innerHTML = `
    <p>"${quote.text}"</p>
    <p><em>- Category: ${quote.category}</em></p>
  `;
}

// Function to add a new quote from input fields
function addQuote() {
  const textInput = document.getElementById("newQuoteText");
  const categoryInput = document.getElementById("newQuoteCategory");
  const newText = textInput.value.trim();
  const newCategory = categoryInput.value.trim();

  if (newText && newCategory) {
    quotes.push({ text: newText, category: newCategory });
    textInput.value = "";
    categoryInput.value = "";
    showRandomQuote();
  } else {
    alert("Please fill in both fields before adding a quote.");
  }
}

// Function to dynamically create the Add Quote form
function createAddQuoteForm() {
  const formContainer = document.createElement("div");

  const textInput = document.createElement("input");
  textInput.type = "text";
  textInput.id = "newQuoteText";
  textInput.placeholder = "Enter a new quote";

  const categoryInput = document.createElement("input");
  categoryInput.type = "text";
  categoryInput.id = "newQuoteCategory";
  categoryInput.placeholder = "Enter quote category";

  const addButton = document.createElement("button");
  addButton.textContent = "Add Quote";
  addButton.addEventListener("click", addQuote);

  formContainer.appendChild(textInput);
  formContainer.appendChild(categoryInput);
  formContainer.appendChild(addButton);

  document.body.appendChild(formContainer);
}

// Initialize
document.getElementById("newQuote").addEventListener("click", showRandomQuote);
createAddQuoteForm();
showRandomQuote();
