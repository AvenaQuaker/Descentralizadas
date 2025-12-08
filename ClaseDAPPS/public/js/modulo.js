
document.addEventListener('DOMContentLoaded', async () => {
    const editorEs = new JSONEditor(document.getElementById('es'), {
        mode: 'tree',
        modes: ['tree', 'code'],
        mainMenuBar: false,
    });

    const editorEn = new JSONEditor(document.getElementById('en'), {
        mode: 'tree',
        modes: ['tree', 'code'],
        mainMenuBar: false,
    });

    const editorSecEs = new JSONEditor(document.getElementById('secEs'), {
        mode: 'tree',
        modes: ['tree', 'code'],
        mainMenuBar: false,
    });

    const editorSecEn = new JSONEditor(document.getElementById('secEn'), {
        mode: 'tree',
        modes: ['tree', 'code'],
        mainMenuBar: false,
    });

    try {
        const [resEs, resEn, resSecEs, resSecEn] = await Promise.all([
        fetch('/admin/get/main/es'),
        fetch('/admin/get/main/en'),
        fetch('/admin/get/section/es'),
        fetch('/admin/get/section/en')
        ]);

        const [dataEs, dataEn, dataSecEs, dataSecEn] = await Promise.all([resEs.json(), resEn.json(), resSecEs.json(), resSecEn.json()]);

        editorEs.set(dataEs);
        editorEn.set(dataEn);
        editorSecEs.set(dataSecEs);
        editorSecEn.set(dataSecEn);

    } catch (error) {
        console.error('Error al cargar contenido:', error);
        Swal.fire({
        icon: 'error',
        title: 'Error de carga',
        text: 'No se pudo obtener el contenido desde el servidor.',
        });
}

  // Guardar cambios al presionar el botón
document.getElementById('saveBtn').addEventListener('click', async () => {
        try {
        const updatedEs = editorEs.get();
        const updatedEn = editorEn.get();
        const updatedSecEs = editorSecEs.get();
        const updatedSecEn = editorSecEn.get();

        const res = await fetch('/admin/update/all', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mainEs: updatedEs, mainEn: updatedEn, secEs: updatedSecEs, secEn: updatedSecEn })
        });

        const data = await res.json();

        if (data.success) {
            Swal.fire({
            icon: 'success',
            title: 'Guardado',
            text: 'Los cambios fueron aplicados correctamente.',
            timer: 1500,
            showConfirmButton: false,
            });

            setTimeout(() => {
                window.location.href = "/admin/logout"
            }, 1500);

        } else {
            Swal.fire({
            icon: 'error',
            title: 'Error',
            text: data.error || 'No se pudo guardar.',
            });
        }

        } catch (error) {
        console.error('Error al guardar:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error de conexión',
            text: 'No se pudo conectar con el servidor.',
        });
        }
    });
});

function cambiarDoc() {
    const inputs = document.querySelectorAll("#selec input");
    const lang = document.getElementById("lang").checked ? "En" : "Es";
    const textos = document.querySelectorAll("#textos .json");

    const seleccionado = Array.from(inputs).find(input => input.checked)?.id;
    if (!seleccionado) return; 

    const idVisible = seleccionado === "main" ? lang.toLowerCase() : `sec${lang}`;
    const titulo = seleccionado === "main" ? "Editando: Pagina Principal" : "Editando: Seccion Servicios";
    document.getElementById("titulo").textContent = titulo;
    
    textos.forEach(texto => {
        texto.classList.toggle("hidden", texto.id !== idVisible);
    })

}