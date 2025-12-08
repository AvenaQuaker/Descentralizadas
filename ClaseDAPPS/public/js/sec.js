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

window.addEventListener('beforeunload', () => {
    sessionStorage.setItem('scrollY', window.scrollY);
});


window.addEventListener('load', () => {
    const scrollY = sessionStorage.getItem('scrollY');
    if (scrollY) window.scrollTo(0, parseInt(scrollY));
});

document.getElementById("btnForm").addEventListener("click",()=>{
    Swal.fire({
    title: 'Contáctanos',
    html: `
    <div class="flex flex-col md:flex-row gap-6 text-left">
        <form id="contactForm" class="w-full space-y-6">
        <div class="flex flex-col md:flex-row w-full gap-2">
            <div class="w-full">
            <label for="name" class="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input type="text" id="name" class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-600">
            </div>
            <div class="w-full">
            <label for="emp" class="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
            <input type="text" id="emp" class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-600">
            </div>
        </div>
        <div class="flex flex-col md:flex-row w-full gap-2">
            <div class="w-full">
            <label for="tel" class="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input type="tel" id="tel" class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-600">
            </div>
            <div class="w-full">
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
            <input type="email" id="email" class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-600">
            </div>
        </div>
        <div>
            <label for="message" class="block text-sm font-medium text-gray-700 mb-1">Mensaje</label>
            <textarea id="message" rows="4" class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-600"></textarea>
        </div>
        </form>
    </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Enviar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#b91c1c',
    width: '50rem',
    background: '#fff',
    preConfirm: () => {

    const nombre = document.getElementById('name').value.trim();
    const empresa = document.getElementById('emp').value.trim();
    const telefono = document.getElementById('tel').value.trim();
    const email = document.getElementById('email').value.trim();
    const mensaje = document.getElementById('message').value.trim();

    if (!nombre || !email || !mensaje || !telefono || !empresa) {
        Swal.showValidationMessage('Por favor, completa los campos obligatorios');
        return false;
    }

    return { nombre, email, mensaje ,telefono, empresa };
    }
}).then(result => {
    if (result.isConfirmed) {
    const data = result.value;
    console.log('Datos enviados:', data);

    fetch('/enviarCorreo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(response => {
        Swal.fire({
        icon: 'success',
        title: 'Mensaje enviado',
        text: 'Tu mensaje ha sido enviado correctamente.',
        confirmButtonColor: '#b91c1c'
        });
    })
    .catch(err => {
        Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo enviar el mensaje. Inténtalo de nuevo.',
        });
    });
    }
});
})

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
