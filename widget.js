document.addEventListener("DOMContentLoaded", function () {

  const btn = document.getElementById("jumitech-ai-btn");
  const box = document.getElementById("jumitech-ai-box");
  const messages = document.getElementById("jumitech-ai-messages");
  const input = document.getElementById("jumitech-ai-text");

  // ✅ CONSTANTS FOR STORAGE
  const STORAGE_KEY = "jumitech_history";
  const EXPIRY_HOURS = 24;

  if (!btn || !box || !messages || !input) {
    console.warn("Jumitech AI Widget: elements not found");
    return;
  }

  // ✅ 1. LOAD HISTORY ON STARTUP
  loadChatHistory();

  btn.addEventListener("click", function () {
    box.style.display = box.style.display === "flex" ? "none" : "flex";
  });

  // --- INTERNAL HELPER FUNCTIONS ---

  // ✅ Updated to accept a 'save' flag (default true)
  function addMessage(text, className, save = true) {
    const div = document.createElement("div");
    div.className = className;
    
    // This part converts the AI's Markdown (* or #) into real HTML lists
    if (typeof marked !== 'undefined') {
        div.innerHTML = marked.parse(text);
    } else {
        div.textContent = text; // Fallback if library fails to load
    }
    
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;

    // ✅ SAVE TO LOCAL STORAGE
    if (save) {
        saveToHistory({ type: "text", text: text, className: className });
    }
  }

  function addLink(link, save = true) {
    const a = document.createElement("a");
    a.href = link.url;
    a.textContent = "🔗 " + link.title;
    a.target = "_blank";
    a.style.display = "block";
    a.style.margin = "6px 0";
    a.style.color = "#007bff";
    messages.appendChild(a);

    // ✅ SAVE TO LOCAL STORAGE
    if (save) {
        saveToHistory({ type: "link", link: link });
    }
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

  // ✅ NEW FUNCTION: SAVE HISTORY
  function saveToHistory(item) {
    let history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"items": [], "timestamp": 0}');
    
    // Set timestamp if it's new/empty
    if (history.items.length === 0) {
        history.timestamp = Date.now();
    }
    
    history.items.push(item);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }

  // ✅ NEW FUNCTION: LOAD HISTORY
  function loadChatHistory() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return;

    const history = JSON.parse(data);
    const now = Date.now();
    const hoursElapsed = (now - history.timestamp) / (1000 * 60 * 60);

    // Check Expiration (24 Hours)
    if (hoursElapsed > EXPIRY_HOURS) {
        localStorage.removeItem(STORAGE_KEY); // Expired, clear it
        return;
    }

    // Restore Messages
    history.items.forEach(item => {
        if (item.type === "text") {
            addMessage(item.text, item.className, false); // false = don't save again
        } else if (item.type === "link") {
            addLink(item.link, false);
        }
    });
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
            // ✅ Use updated helper function
            addLink(link);
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
  
  setTimeout(() => {
    // We check if the box is NOT visible
    const isHidden = !box.style.display || box.style.display === "none";
    
    // ✅ CHECK: Don't nudge if user has history (already chatted)
    const hasHistory = localStorage.getItem(STORAGE_KEY);

    if (isHidden && !hasHistory) {
        console.log("Jumitech: Triggering nudge..."); 
        const nudge = document.createElement("div");
        nudge.className = "jumitech-nudge";
        nudge.innerHTML = "Hi! Ask Jumitech AI";
        
        nudge.onclick = () => {
            box.style.display = "flex";
            nudge.remove();
        };

        document.body.appendChild(nudge);
        
        // Let's keep it visible for 15 seconds instead of 8 so you have time to see it
        setTimeout(() => {
            if (nudge.parentNode) nudge.remove();
        }, 15000);
    }
}, 3000);

});
