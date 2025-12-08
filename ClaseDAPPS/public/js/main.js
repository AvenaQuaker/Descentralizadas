AOS.init();

const menuBtn = document.getElementById("menuBtn");
  const sideMenu = document.getElementById("sideMenu");
  const closeMenu = document.getElementById("closeMenu");
  const overlay = document.getElementById("overlay");

  menuBtn.addEventListener("click", () => {
    sideMenu.classList.remove("translate-x-full");
    overlay.classList.remove("hidden");
  });

  closeMenu.addEventListener("click", () => {
    sideMenu.classList.add("translate-x-full");
    overlay.classList.add("hidden");
  });
const nav = document.getElementById("mainNav");

window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      nav.classList.remove("-translate-y-full", "opacity-0");
      nav.classList.add("translate-y-0", "opacity-100");
    } else {
      nav.classList.remove("translate-y-0", "opacity-100");
      nav.classList.add("-translate-y-full", "opacity-0");
    }
});

document.querySelector("form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.querySelector("#name").value.trim();
    const email = document.querySelector("#email").value.trim();
    const message = document.querySelector("#message").value.trim();
    const telefono = document.querySelector("#tel").value.trim();
    const empresa = document.querySelector("#emp").value.trim();

    const response = await fetch("/enviarCorreo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: name, email: email, mensaje: message, telefono: telefono, empresa: empresa })
    });

    const result = await response.json();

    if (result.success) {
        alert("✅ Tu mensaje ha sido enviado correctamente.");
        e.target.reset();
    } else {
        alert("❌ Ocurrió un error al enviar tu mensaje.");
    }
});

// LAS COSITAS DEL BOT
  const chatButton = document.getElementById('chatButton');
  const chatWindow = document.getElementById('chatWindow');
  const closeChat = document.getElementById('closeChat');
  const chatMessages = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');

  chatButton.addEventListener('click', () => {
    chatWindow.classList.toggle('hidden');
    chatWindow.classList.toggle('animate-slide-up');
  });

  closeChat.addEventListener('click', () => {
    chatWindow.classList.add('hidden');
  });

  function addMessage(text, sender = "bot") {
    const msg = document.createElement("div");
    msg.classList.add("p-2", "rounded-lg", "max-w-[75%]");
    if (sender === "bot") {
      msg.classList.add("bg-blue-100", "self-start");
    } else {
      msg.classList.add("bg-gray-200", "self-end", "ml-auto");
    }
    msg.textContent = text;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

  async function sendMessage(){
    const text = chatInput.value.trim();
    console.log(text)
    if (!text) return;

    addMessage(text, true);
    chatInput.value = "";

    const res = await fetch("/bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
    });

    const data = await res.json();
    addMessage(data.reply, "bot");
  }

  sendBtn.addEventListener('click', sendMessage);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });


