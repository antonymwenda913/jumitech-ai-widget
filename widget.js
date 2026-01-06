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

    addMessage(text, "jumitech-user");
    input.value = "";

    fetch("https://jumitech-assistant.antonymwenda913.workers.dev/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    })
    .then(res => res.json())
    .then(data => {

      addMessage(data.reply || "No response received.", "jumitech-bot");

      if (Array.isArray(data.links)) {
        data.links.forEach(link => {
          const a = document.createElement("a");
          a.href = link.url;
          a.textContent = "🔗 " + link.title;
          a.target = "_blank";
          a.rel = "noopener";
          a.style.display = "block";
          a.style.margin = "6px 0";
          a.style.color = "#007bff";
          messages.appendChild(a);
        });
      }

      if (data.follow_up) {
        addMessage(data.follow_up, "jumitech-bot");
      }

    })
    .catch(err => {
      console.error(err);
      addMessage("Sorry, something went wrong. Please try again.", "jumitech-bot");
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
