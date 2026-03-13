/* 
LÓGICA DE PENSAMIENTO (Mi cerebro funcionando antes de programar):
1. Conectar: Yo inicio Firebase con mis llaves secretas.
2. Vigilar: Me quedo atento a si el usuario entró o salió para mostrar su nombre.
3. Cargar Noticias: Busco las noticias en la bodega "noticias".
4. Cargar Comentarios: Por cada noticia, busco en una sub-bodega llamada "comentarios" y los dibujo abajo.
5. Permitir Comentar: Si el usuario está logueado, le muestro un espacio para que escriba su opinión.
6. Guardar: Cuando pinchen "Comentar", tomo el texto, el nombre del usuario y lo guardo en Firebase asociado a esa noticia específica.
7. Limpieza Visual: Mantengo todo sobre fondo blanco, sin marcos ni sombras, bien plano y elegante.
*/

// Mis llaves de conexión
const firebaseConfig = {
    apiKey: "AIzaSyASjJTeA2QUy0i-GU_m2T27H9ODZXGaOsI",
    authDomain: "portafolio-noticias-8825e.firebaseapp.com",
    projectId: "portafolio-noticias-8825e",
    storageBucket: "portafolio-noticias-8825e.firebasestorage.app",
    messagingSenderId: "98592375477",
    appId: "1:98592375477:web:872bc2ce4be691d1ea74fc",
    measurementId: "G-T40SEHK145"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

$(document).ready(function() {
    let usuarioActual = null;

    // Yo manejo la apertura del modal de login
    $('#nav-entrar').click(function(e) {
        e.preventDefault();
        const miModal = new bootstrap.Modal(document.getElementById('modalLogin'));
        miModal.show();
    });

    // Yo manejo el clic de Google con cierre inmediato
    $(document).on('click', '#btn-google', function(e) {
        e.preventDefault();
        const modalElement = document.getElementById('modalLogin');
        const modalInstance = bootstrap.Modal.getOrCreateInstance(modalElement);
        modalInstance.hide();
        $('.modal-backdrop').remove();
        $('body').removeClass('modal-open').css('overflow', 'auto');

        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider).then(() => {
            setTimeout(() => { location.reload(); }, 500);
        });
    });

    // Yo cierro la sesión
    $('#btn-cerrar-sesion').click(function(e) {
        e.preventDefault();
        auth.signOut().then(() => { location.reload(); });
    });

    // Yo vigilo al usuario y activo el nombre en el menú
    auth.onAuthStateChanged((user) => {
        if (user) {
            usuarioActual = user;
            const nombre = user.displayName ? user.displayName : user.email;
            $('#user-name').text(`Hola, ${nombre}`).removeClass('d-none');
            $('#btn-cerrar-sesion').removeClass('d-none');
            $('#nav-entrar').addClass('d-none');
        }
        // Llamo a cargar las noticias (o proyectos)
        cargarNoticias();
    });

    // Yo cargo las noticias y sus respectivos comentarios
    function cargarNoticias() {
        const contenedor = $('#contenedor-proyectos').length ? $('#contenedor-proyectos') : $('#contenedor-noticias');
        if (contenedor.length === 0) return;

        db.collection("noticias").onSnapshot((snapshot) => {
            contenedor.empty();
            snapshot.forEach((doc) => {
                const noticiaId = doc.id;
                const n = doc.data();

                // Yo armo el HTML de la noticia con un espacio para comentarios abajo
                const htmlNoticia = `
                    <article class="mb-5 pb-4 border-bottom">
                        <h2 class="fw-bold h3">${n.titulo}</h2>
                        <p class="text-secondary small">Por: ${n.autor}</p>
                        <p class="mt-3">${n.contenido}</p>
                        
                        <div class="seccion-comentarios mt-4 ps-3 border-start">
                            <h4 class="h6 fw-bold text-dark mb-3">Comentarios</h4>
                            <div id="lista-comentarios-${noticiaId}" class="mb-3">
                                <!-- Aquí yo cargaré los comentarios dinámicos -->
                            </div>
                            
                            ${usuarioActual ? `
                                <div class="input-group input-group-sm mt-2">
                                    <input type="text" id="input-comentario-${noticiaId}" class="form-control border-0 bg-light" placeholder="Escribe un comentario...">
                                    <button class="btn btn-dark btn-sm px-3 btn-enviar-comentario" data-id="${noticiaId}">Enviar</button>
                                </div>
                            ` : '<p class="small text-muted">Inicia sesión para comentar.</p>'}
                        </div>
                    </article>
                `;
                contenedor.append(htmlNoticia);
                // Yo mando a buscar los comentarios de esta noticia específica
                cargarComentarios(noticiaId);
            });
        });
    }

    // Yo voy a buscar los comentarios a la sub-colección dentro de cada noticia
    function cargarComentarios(noticiaId) {
        db.collection("noticias").doc(noticiaId).collection("comentarios")
          .orderBy("fecha", "asc").onSnapshot((snap) => {
            const caja = $(`#lista-comentarios-${noticiaId}`);
            caja.empty();
            snap.forEach((com) => {
                const c = com.data();
                caja.append(`
                    <div class="mb-2">
                        <span class="fw-bold small d-block text-dark">${c.usuario}</span>
                        <span class="small text-secondary">${c.texto}</span>
                    </div>
                `);
            });
        });
    }

    // Yo guardo el comentario cuando el usuario presiona el botón
    $(document).on('click', '.btn-enviar-comentario', function() {
        const noticiaId = $(this).data('id');
        const texto = $(`#input-comentario-${noticiaId}`).val();
        
        if (texto.trim() === "") return;

        db.collection("noticias").doc(noticiaId).collection("comentarios").add({
            texto: texto,
            usuario: usuarioActual.displayName || usuarioActual.email,
            fecha: new Date()
        }).then(() => {
            $(`#input-comentario-${noticiaId}`).val(""); // Yo limpio el campo después de enviar
        });
    });

    // Lógica para los filtros de la galería de proyectos
    $('.filter-menu a').click(function(e) {
        e.preventDefault();
        $('.filter-menu a').removeClass('active fw-bold text-dark').addClass('text-secondary');
        $(this).addClass('active fw-bold text-dark').removeClass('text-secondary');
        const filtro = $(this).data('filter');
        if (filtro === 'all') {
            $('.gallery-item').fadeIn(400);
        } else {
            $('.gallery-item').hide();
            $(`.gallery-item[data-category="${filtro}"]`).fadeIn(400);
        }
    });
});