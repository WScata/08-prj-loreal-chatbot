/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const workerUrl = "https://still-union-bereaved.wjscata.workers.dev/"; // Replace with your Cloudflare Worker URL
const chatHistory = [
  {
    role: "system",
    content: "You are a helpful product advisor. Answer questions about our products and help customers find what they need. Use the conversation history to provide context in your responses. Be friendly and concise. Be sure to only answer questions related to our products and services. If you're asked about something besides our products, politely let the user know you can only answer questions about our offerings.",
  },
];

// Add one message bubble to the chat window.
function addMessage(role, text) {
  const messageEl = document.createElement("div");
  messageEl.classList.add("msg");
  messageEl.classList.add(role === "user" ? "user" : "ai");

  const label = role === "user" ? "You" : "Advisor";
  messageEl.textContent = `${label}: ${text}`;

  chatWindow.appendChild(messageEl);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Set initial message
addMessage("assistant", "Hello! How can I help you today?");

/* Handle form submit */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const question = userInput.value.trim();
  if (!question) {
    return;
  }

  addMessage("user", question);
  userInput.value = "";

  // Add user's message to the conversation we send to the worker.
  chatHistory.push({
    role: "user",
    content: question,
  });

  const loadingMessage = document.createElement("div");
  loadingMessage.classList.add("msg", "ai");
  loadingMessage.textContent = "Advisor: Thinking...";
  chatWindow.appendChild(loadingMessage);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  try {
    // Cloudflare Worker expects { messages: [...] } in the body.
    const response = await fetch(workerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: chatHistory,
      }),
    });

    const data = await response.json();
    const aiResponse = data?.choices?.[0]?.message?.content;

    loadingMessage.remove();

    if (!response.ok || !aiResponse) {
      throw new Error("Invalid response from worker.");
    }

    addMessage("assistant", aiResponse);

    // Save assistant response so next question has conversation context.
    chatHistory.push({
      role: "assistant",
      content: aiResponse,
    });
  } catch (error) {
    loadingMessage.remove();
    addMessage(
      "assistant",
      "Sorry, I could not get a response right now. Please try again.",
    );
    console.error("Worker request failed:", error);
  }
});
