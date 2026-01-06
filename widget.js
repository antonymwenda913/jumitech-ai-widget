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

  // --- INTERNAL HELPER FUNCTIONS ---

  function addMessage(text, className) {
    const div = document.createElement("div");
    // Ensure "message" class is always included for styling
    div.className = "message " + className;
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function addLoadingMessage() {
    const loadingId = "loading-" + Date.now();
    const loadingDiv = document.createElement("div");
    loadingDiv.id = loadingId;
    // Uses bot styling + a special 'loading' class
    loadingDiv.className = "message jumitech-bot loading"; 
    loadingDiv.textContent = "Jumitech is thinking...";
    
    messages.appendChild(loadingDiv);
    messages.scrollTop = messages.scrollHeight;
    return loadingId; 
  }

  // --- MAIN CHAT LOGIC ---

  window.sendJumitechMessage = function () {
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, "jumitech-user");
    input.value = "";

    // 1. Show Loading
    const loadingMessageId = addLoadingMessage();

    fetch("https://jumitech-assistant.antonymwenda913.workers.dev/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    })
    .then(async res => {
      // 2. Remove Loading immediately when response starts
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
      addMessage(data.reply || "No response received.", "jumitech-bot");

      if (Array.isArray(data.links)) {
        data.links.forEach(link => {
          const a = document.createElement("a");
          a.href = link.url;
          a.textContent = "🔗 " + link.title;
          a.target = "_blank";
          a.style.display = "block";
          a.style.margin = "6px 0";
          a.style.color = "#007bff";
          messages.appendChild(a);
        });
      }

      if (data.follow_up) {
        addMessage(data.follow_up, "jumitech-bot");
      }
      
      messages.scrollTop = messages.scrollHeight;
    })
    .catch(err => {
      const loader = document.getElementById(loadingMessageId);
      if (loader) loader.remove();
      console.error(err);
      addMessage("Sorry, I encountered a connection error.", "jumitech-bot");
    });
  };

  // Allow "Enter" key to send messages
  input.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      window.sendJumitechMessage();
    }
  });

});
