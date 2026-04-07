/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const workerUrl = "https://still-union-bereaved.wjscata.workers.dev/"; // Replace with your Cloudflare Worker URL
const chatHistory = [
  {
    role: "system",
    content:
      "You are a helpful product advisor. Answer questions about our products and help customers find what they need. Use the conversation history to provide context in your responses. Be friendly and concise. Be sure to only answer questions related to our products and services. If you're asked about something besides our products and applications and routines, politely let the user know you can only answer questions about our offerings.",
  },
];

// Add one message bubble to the chat window.
function addMessage(role, text) {
  const messageEl = document.createElement("div");
  messageEl.classList.add("msg", "bubble");
  messageEl.classList.add(role === "user" ? "user" : "ai");

  messageEl.textContent = text;

  chatWindow.appendChild(messageEl);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  return messageEl;
}

// Add one full question-and-answer turn to the chat window.
function addConversationTurn(question, answer) {
  const turnEl = document.createElement("div");
  turnEl.classList.add("chat-turn");

  const questionEl = document.createElement("div");
  questionEl.classList.add("msg", "bubble", "user");
  questionEl.textContent = question;

  const answerEl = document.createElement("div");
  answerEl.classList.add("msg", "bubble", "ai");
  answerEl.textContent = answer;

  turnEl.appendChild(questionEl);
  turnEl.appendChild(answerEl);
  chatWindow.appendChild(turnEl);
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

  const pendingUserMessage = addMessage("user", question);
  userInput.value = "";

  // Add user's message to the conversation we send to the worker.
  chatHistory.push({
    role: "user",
    content: question,
  });

  const loadingMessage = document.createElement("div");
  loadingMessage.classList.add("msg", "bubble", "ai", "thinking");
  loadingMessage.textContent = "Thinking...";
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

    pendingUserMessage.remove();

    addConversationTurn(question, aiResponse);

    // Save assistant response so next question has conversation context.
    chatHistory.push({
      role: "assistant",
      content: aiResponse,
    });
  } catch (error) {
    loadingMessage.remove();
    pendingUserMessage.remove();
    addConversationTurn(
      question,
      "Sorry, I could not get a response right now. Please try again.",
    );
    console.error("Worker request failed:", error);
  }
});
