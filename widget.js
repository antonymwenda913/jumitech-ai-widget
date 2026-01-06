document.addEventListener("DOMContentLoaded", function () {

  const btn = document.getElementById("jumitech-ai-btn");
  const box = document.getElementById("jumitech-ai-box");
  const messages = document.getElementById("jumitech-ai-messages");
  const input = document.getElementById("jumitech-ai-text");

  if (!btn || !box || !messages || !input) {
    console.warn("Jumitech AI Widget: elements not found");
    return;
  }

  btn.addEventListener("click", function () {
    box.style.display = box.style.display === "flex" ? "none" : "flex";
  });

  window.sendJumitechMessage = function () {
    const text = input.value.trim();
    if (!text) return;

    // 1. Show the user's message immediately
    addMessage(text, "jumitech-user");
    input.value = "";

    // 2. CREATE THE LOADING BUBBLE
    const loadingMessageId = addLoadingMessage();

    fetch("https://jumitech-assistant.antonymwenda913.workers.dev/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    })
    .then(async res => {
      // 3. REMOVE THE LOADING BUBBLE (The AI is starting to answer)
      const loader = document.getElementById(loadingMessageId);
      if (loader) loader.remove();

      const textResponse = await res.text();
      try {
        return JSON.parse(textResponse);
      } catch {
        return { reply: "I'm having trouble connecting to the catalog.", links: [] };
      }
    })
    .then(data => {
      // 4. Display the actual AI response
      addMessage(data.reply || "No response received.", "jumitech-bot");

      // Handle links if they exist
      if (Array.isArray(data.links)) {
        data.links.forEach(link => {
          const a = document.createElement("a");
          a.href = link.url;
          a.textContent = "🔗 " + link.title;
          a.target = "_blank";
          a.style.display = "block";
          a.style.margin = "6px 0";
          messages.appendChild(a);
        });
      }

      if (data.follow_up) {
        addMessage(data.follow_up, "jumitech-bot");
      }
    })
    .catch(err => {
      // 5. Cleanup if there is a network error
      const loader = document.getElementById(loadingMessageId);
      if (loader) loader.remove();
      console.error(err);
      addMessage("Sorry, I encountered a connection error.", "jumitech-bot");
    });
};

  function addMessage(text, className) {
    const div = document.createElement("div");
    div.className = className;
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

});

// Add this at the very bottom of your frontend.js file
function addLoadingMessage() {
    const loadingId = "loading-" + Date.now();
    const loadingDiv = document.createElement("div");
    loadingDiv.id = loadingId;
    loadingDiv.className = "message jumitech-bot loading"; // 'loading' class can be styled in CSS
    loadingDiv.textContent = "Jumitech is thinking...";
    
    // This adds the bubble to your chat window
    messages.appendChild(loadingDiv);
    messages.scrollTop = messages.scrollHeight;
    return loadingId; // We return the ID so we can delete this specific bubble later
}
