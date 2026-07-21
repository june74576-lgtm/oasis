const days = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"];

const FILE_ICON_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M7 3.5h7l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V5a1.5 1.5 0 0 1 1.5-1.5Z"/>
    <path d="M14 3.5V8h4"/>
</svg>`;

let currentCourse = null;
let dayObserver = null;

/* ===== Bloqueo de scroll de fondo mientras hay overlays abiertos ===== */

let openOverlays = 0;
function lockScroll() {
    openOverlays++;
    document.body.style.overflow = "hidden";
}
function unlockScroll() {
    openOverlays = Math.max(0, openOverlays - 1);
    if (openOverlays === 0) document.body.style.overflow = "";
}

/* ===== Foto o fallback "No Photo" ===== */

function buildPhotoSlot(url, altText) {
    const wrap = document.createElement("div");
    wrap.classList.add("photo-slot");

    if (url) {
        const img = document.createElement("img");
        img.alt = altText;
        img.onerror = () => {
            wrap.innerHTML = "";
            const fallback = document.createElement("div");
            fallback.classList.add("no-photo");
            fallback.textContent = "No Photo";
            wrap.appendChild(fallback);
        };
        img.src = url;
        wrap.appendChild(img);
    } else {
        const fallback = document.createElement("div");
        fallback.classList.add("no-photo");
        fallback.textContent = "No Photo";
        wrap.appendChild(fallback);
    }

    return wrap;
}

/* ===== Elementos ===== */

const courseFullscreen = document.getElementById("courseFullscreen");
const fsClose = document.getElementById("fsClose");
const fsCourseName = document.getElementById("fsCourseName");
const fsTopbar = document.getElementById("fsTopbar");
const fsTopbarTitle = document.getElementById("fsTopbarTitle");
const horarioBody = document.getElementById("horarioBody");
const dayTabs = document.getElementById("dayTabs");
const dayTrack = document.getElementById("dayTrack");

const galeriaTrack = document.getElementById("galeriaTrack");

const coursesTrack = document.getElementById("coursesTrack");
const coursesPrevBtn = document.getElementById("coursesPrevBtn");
const coursesNextBtn = document.getElementById("coursesNextBtn");

const studentsTrack = document.getElementById("studentsTrack");
const studentsPrevBtn = document.getElementById("studentsPrevBtn");
const studentsNextBtn = document.getElementById("studentsNextBtn");

const studentModalOverlay = document.getElementById("studentModalOverlay");
const studentModalClose = document.getElementById("studentModalClose");
const studentModalPhoto = document.getElementById("studentModalPhoto");
const studentPhotoFallback = document.getElementById("studentPhotoFallback");
const studentModalName = document.getElementById("studentModalName");
const studentModalBirth = document.getElementById("studentModalBirth");
const studentModalIngles = document.getElementById("studentModalIngles");
const studentModalContrib = document.getElementById("studentModalContrib");

const materiaModalOverlay = document.getElementById("materiaModalOverlay");
const materiaModalClose = document.getElementById("materiaModalClose");
const materiaModalNombre = document.getElementById("materiaModalNombre");
const materiaModalProfFoto = document.getElementById("materiaModalProfFoto");
const profPhotoFallback = document.getElementById("profPhotoFallback");
const materiaModalProfNombre = document.getElementById("materiaModalProfNombre");

/* =========================================================
   CURSOS
   ========================================================= */

function getCourseById(id) {
    return (typeof cursosDB !== "undefined" ? cursosDB : []).find(c => c.id === id);
}

function renderCourses() {
    const courses = typeof cursosDB !== "undefined" ? cursosDB : [];
    coursesTrack.innerHTML = "";

    if (courses.length === 0) {
        coursesTrack.innerHTML = `<p class="courses-empty">No hay cursos todavía</p>`;
        return;
    }

    courses.forEach(course => {
        const card = document.createElement("div");
        card.classList.add("card");

        const thumb = document.createElement("div");
        thumb.classList.add("thumb");
        thumb.appendChild(buildPhotoSlot(course.imagen, course.nombre));
        card.appendChild(thumb);

        const info = document.createElement("div");
        info.classList.add("info");
        info.innerHTML = `<span class="eyebrow">Curso</span><h3>${course.nombre}</h3>`;
        card.appendChild(info);

        card.addEventListener("click", () => openCourseFullscreen(course.id));
        coursesTrack.appendChild(card);
    });
}

coursesPrevBtn.addEventListener("click", () => coursesTrack.scrollBy({ left: -320, behavior: "smooth" }));
coursesNextBtn.addEventListener("click", () => coursesTrack.scrollBy({ left: 320, behavior: "smooth" }));

renderCourses();

/* =========================================================
   CURSO A PANTALLA COMPLETA
   ========================================================= */

fsClose.addEventListener("click", closeCourseFullscreen);

courseFullscreen.addEventListener("scroll", () => {
    fsTopbar.classList.toggle("scrolled", courseFullscreen.scrollTop > 60);
});

document.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    if (materiaModalOverlay.classList.contains("active")) closeMateriaModal();
    else if (studentModalOverlay.classList.contains("active")) closeStudentModal();
    else if (courseFullscreen.classList.contains("active")) closeCourseFullscreen();
});

function openCourseFullscreen(courseId) {
    const course = getCourseById(courseId);
    if (!course) return;

    currentCourse = courseId;
    fsCourseName.textContent = course.nombre;
    fsTopbarTitle.textContent = course.nombre;
    fsTopbar.classList.remove("scrolled");

    renderHorario(courseId);
    renderStudentsTrack(courseId);
    renderGaleria(courseId);

    courseFullscreen.classList.add("active");
    courseFullscreen.scrollTop = 0;
    lockScroll();
}

function closeCourseFullscreen() {
    courseFullscreen.classList.remove("active");
    currentCourse = null;
    unlockScroll();
}

/* =========================================================
   HORARIO — tabla desktop + timeline por día en móvil
   ========================================================= */

function materiaNombre(id) {
    const list = typeof materiasDB !== "undefined" ? materiasDB : [];
    const m = list.find(x => x.id === id);
    return m ? m.nombre : id;
}

function cellKey(cell) {
    if (!cell) return null;
    return cell.materia + "|" + (cell.profesor || "");
}

function renderHorario(courseId) {
    const dbAll = typeof horariosDB !== "undefined" ? horariosDB : {};
    const rows = dbAll[courseId] || [];

    renderHorarioTable(rows);
    renderHorarioMobile(rows);
}

function renderHorarioTable(rows) {
    horarioBody.innerHTML = "";

    const skip = new Set();
    const rowspan = {};

    days.forEach(day => {
        let i = 0;
        while (i < rows.length) {
            if (rows[i].tipo !== "clase") { i++; continue; }
            let j = i + 1;
            while (
                j < rows.length &&
                rows[j].tipo === "clase" &&
                cellKey(rows[i][day]) &&
                cellKey(rows[j][day]) === cellKey(rows[i][day])
            ) {
                skip.add(j + "|" + day);
                j++;
            }
            rowspan[i + "|" + day] = j - i;
            i = j;
        }
    });

    rows.forEach((row, i) => {
        const tr = document.createElement("tr");

        const tdHora = document.createElement("td");
        tdHora.textContent = row.hora;
        tdHora.classList.add("hora-cell");
        tr.appendChild(tdHora);

        if (row.tipo === "recreo") {
            const td = document.createElement("td");
            td.textContent = row.label || "Recreo";
            td.colSpan = days.length;
            td.classList.add("recreo-cell");
            tr.appendChild(td);
        } else {
            days.forEach(day => {
                if (skip.has(i + "|" + day)) return;

                const cell = row[day];
                const td = document.createElement("td");

                const span = rowspan[i + "|" + day] || 1;
                if (span > 1) td.rowSpan = span;

                if (cell) {
                    td.textContent = materiaNombre(cell.materia);
                    td.classList.add("materia-cell");
                    td.addEventListener("click", () => openMateriaModal(cell.materia, cell.profesor));
                } else {
                    td.textContent = "Libre";
                    td.classList.add("libre-cell");
                }

                tr.appendChild(td);
            });
        }

        horarioBody.appendChild(tr);
    });
}

function renderHorarioMobile(rows) {
    dayTabs.innerHTML = "";
    dayTrack.innerHTML = "";

    days.forEach((day, idx) => {
        const tab = document.createElement("button");
        tab.classList.add("day-tab");
        if (idx === 0) tab.classList.add("active");
        tab.textContent = day.slice(0, 3);
        tab.addEventListener("click", () => {
            dayTrack.children[idx].scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
        });
        dayTabs.appendChild(tab);

        const panel = document.createElement("div");
        panel.classList.add("day-panel");

        rows.forEach(row => {
            const item = document.createElement("div");
            item.classList.add("timeline-item");

            const timeCol = document.createElement("div");
            timeCol.classList.add("timeline-time-col");
            timeCol.textContent = row.hora.split(" - ")[0];
            item.appendChild(timeCol);

            const connector = document.createElement("div");
            connector.classList.add("timeline-connector");
            connector.innerHTML = `<span class="timeline-dot"></span><span class="timeline-line"></span>`;
            item.appendChild(connector);

            const card = document.createElement("div");

            if (row.tipo === "recreo") {
                card.classList.add("timeline-card", "recreo-card");
                card.textContent = row.label || "Recreo";
            } else {
                const cell = row[day];
                if (cell) {
                    card.classList.add("timeline-card", "clickable");
                    const prof = findProfesor(cell.profesor);
                    card.innerHTML = `
                        <div class="materia-name">${materiaNombre(cell.materia)}</div>
                        ${prof ? `<div class="prof-name">${prof.nombre}</div>` : ""}
                    `;
                    card.addEventListener("click", () => openMateriaModal(cell.materia, cell.profesor));
                } else {
                    card.classList.add("timeline-card", "libre-card");
                    card.textContent = "Libre";
                }
            }

            item.appendChild(card);
            panel.appendChild(item);
        });

        dayTrack.appendChild(panel);
    });

    setupDayObserver();
}

function setupDayObserver() {
    if (dayObserver) dayObserver.disconnect();

    dayObserver = new IntersectionObserver(
        entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const idx = Array.from(dayTrack.children).indexOf(entry.target);
                document.querySelectorAll(".day-tab").forEach((t, i) => t.classList.toggle("active", i === idx));
            });
        },
        { root: dayTrack, threshold: 0.6 }
    );

    Array.from(dayTrack.children).forEach(panel => dayObserver.observe(panel));
}

/* =========================================================
   MODAL: MATERIA (solo nombre + profesor)
   ========================================================= */

function findMateria(id) {
    const list = typeof materiasDB !== "undefined" ? materiasDB : [];
    return list.find(m => m.id === id);
}

function findProfesor(id) {
    const list = typeof profesoresDB !== "undefined" ? profesoresDB : [];
    return list.find(p => p.id === id);
}

function setProfPhoto(url) {
    if (url) {
        materiaModalProfFoto.onerror = () => {
            materiaModalProfFoto.style.display = "none";
            profPhotoFallback.style.display = "flex";
        };
        materiaModalProfFoto.src = url;
        materiaModalProfFoto.style.display = "block";
        profPhotoFallback.style.display = "none";
    } else {
        materiaModalProfFoto.style.display = "none";
        profPhotoFallback.style.display = "flex";
    }
}

function openMateriaModal(materiaId, profesorId) {
    const materia = findMateria(materiaId);
    const profesor = findProfesor(profesorId);

    currentMateriaId = materiaId;
    materiaModalNombre.textContent = materia ? materia.nombre : materiaId;

    if (profesor) {
        setProfPhoto(profesor.foto || "");
        materiaModalProfNombre.textContent = profesor.nombre;
    } else {
        setProfPhoto("");
        materiaModalProfNombre.textContent = "Profesor sin asignar";
    }

    loadMateriaArchivos(materiaId);
    updateUploadUI();

    materiaModalOverlay.classList.add("active");
    lockScroll();
}

function closeMateriaModal() {
    materiaModalOverlay.classList.remove("active");
    unlockScroll();
}

materiaModalClose.addEventListener("click", closeMateriaModal);
materiaModalOverlay.addEventListener("click", e => { if (e.target === materiaModalOverlay) closeMateriaModal(); });

/* =========================================================
   GALERÍA — carrusel automático, sin control del usuario
   ========================================================= */

function renderGaleria(courseId) {
    const dbAll = typeof galeriaDB !== "undefined" ? galeriaDB : {};
    const list = dbAll[courseId] || [];
    galeriaTrack.innerHTML = "";
    galeriaTrack.style.animation = "none";

    if (list.length === 0) {
        galeriaTrack.innerHTML = `<p class="galeria-empty">Sin fotos en la galería todavía</p>`;
        return;
    }

    const sizeClasses = ["size-a", "size-b", "size-c"];
    const doubled = list.concat(list); // loop continuo sin salto

    doubled.forEach((item, i) => {
        const div = document.createElement("div");
        div.classList.add("galeria-item", sizeClasses[i % sizeClasses.length]);

        const img = document.createElement("img");
        img.src = item.ruta;
        img.alt = "";
        img.loading = "lazy";
        div.appendChild(img);

        galeriaTrack.appendChild(div);
    });

    const duration = Math.max(list.length * 5, 20);
    galeriaTrack.style.animation = `galeriaScroll ${duration}s linear infinite`;
}

/* =========================================================
   LOGIN — usuario/contraseña derivados de estudiantes.js
   (no es seguridad real, solo identifica quién sos)
   ========================================================= */

let currentUser = null; // { id, nombre }

function normalizar(str) {
    // Saca tildes, pasa a minúsculas, y deja solo letras y números
    // (así "Álvarez" -> "alvarez", pero "quichimbo2010" conserva el año)
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function datosLogin(estudiante) {
    const partes = estudiante.nombre.trim().split(/\s+/);
    const apellidosCount = partes.length >= 3 ? 2 : (partes.length === 2 ? 1 : 0);
    const primerNombre = partes[0] || "";
    const primerApellido = partes[partes.length - apellidosCount] || partes[partes.length - 1] || "";
    const anio = estudiante.fechaNacimiento ? estudiante.fechaNacimiento.slice(0, 4) : "";

    return {
        username: normalizar(primerNombre + primerApellido),
        password: normalizar(primerApellido + anio)
    };
}

const loginBtn = document.getElementById("loginBtn");
const userChip = document.getElementById("userChip");
const userChipName = document.getElementById("userChipName");
const logoutBtn = document.getElementById("logoutBtn");

const loginModalOverlay = document.getElementById("loginModalOverlay");
const loginModalClose = document.getElementById("loginModalClose");
const loginUsername = document.getElementById("loginUsername");
const loginPassword = document.getElementById("loginPassword");
const loginError = document.getElementById("loginError");
const loginSubmitBtn = document.getElementById("loginSubmitBtn");

function updateAuthUI() {
    if (currentUser) {
        loginBtn.style.display = "none";
        userChip.style.display = "flex";
        userChipName.textContent = currentUser.nombre;
    } else {
        loginBtn.style.display = "inline-flex";
        userChip.style.display = "none";
    }
    updateUploadUI();
}

loginBtn.addEventListener("click", () => {
    loginError.style.display = "none";
    loginUsername.value = "";
    loginPassword.value = "";
    loginModalOverlay.classList.add("active");
    lockScroll();
});

function closeLoginModal() {
    loginModalOverlay.classList.remove("active");
    unlockScroll();
}

loginModalClose.addEventListener("click", closeLoginModal);
loginModalOverlay.addEventListener("click", e => { if (e.target === loginModalOverlay) closeLoginModal(); });

loginSubmitBtn.addEventListener("click", intentarLogin);
loginPassword.addEventListener("keydown", e => { if (e.key === "Enter") intentarLogin(); });

function intentarLogin() {
    const u = normalizar(loginUsername.value);
    const p = normalizar(loginPassword.value);

    const list = typeof estudiantesDB !== "undefined" ? estudiantesDB : [];
    const match = list.find(e => {
        const creds = datosLogin(e);
        return creds.username === u && creds.password === p;
    });

    if (!match) {
        loginError.style.display = "block";
        return;
    }

    currentUser = { id: match.id, nombre: match.nombre };
    sessionStorage.setItem("oasis_session", JSON.stringify(currentUser));
    updateAuthUI();
    closeLoginModal();
}

logoutBtn.addEventListener("click", () => {
    currentUser = null;
    sessionStorage.removeItem("oasis_session");
    updateAuthUI();
});

const savedSession = sessionStorage.getItem("oasis_session");
if (savedSession) currentUser = JSON.parse(savedSession);
updateAuthUI();

/* =========================================================
   ARCHIVOS POR MATERIA (Firebase) — dentro del modal de materia
   ========================================================= */

let currentMateriaId = null;

const materiaArchivosList = document.getElementById("materiaArchivosList");
const dropzone = document.getElementById("dropzone");
const materiaFileInput = document.getElementById("materiaFileInput");
const uploadLoginHint = document.getElementById("uploadLoginHint");

function firebaseListo() {
    return db !== null;
}

const MAX_FILE_SIZE = 700 * 1024; // ~700 KB, para no pasarse del límite de 1MB de Firestore

function updateUploadUI() {
    if (currentUser && firebaseListo()) {
        dropzone.style.display = "block";
        uploadLoginHint.style.display = "none";
    } else {
        dropzone.style.display = "none";
        uploadLoginHint.style.display = "block";
        uploadLoginHint.textContent = firebaseListo()
            ? "Iniciá sesión para subir archivos."
            : "Firebase todavía no está configurado.";
    }
}

async function loadMateriaArchivos(materiaId) {
    materiaArchivosList.innerHTML = `<p class="materia-archivos-empty">Cargando…</p>`;

    if (!firebaseListo()) {
        materiaArchivosList.innerHTML = `<p class="materia-archivos-empty">Firebase todavía no está configurado.</p>`;
        return;
    }

    try {
        const snap = await db.collection("archivos").where("materia", "==", materiaId).get();
        const files = [];
        snap.forEach(doc => files.push(doc.data()));
        files.sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));
        renderMateriaArchivos(files);
    } catch (err) {
        console.error(err);
        materiaArchivosList.innerHTML = `<p class="materia-archivos-empty">No se pudieron cargar los archivos.</p>`;
    }
}

function renderMateriaArchivos(files) {
    materiaArchivosList.innerHTML = "";

    if (files.length === 0) {
        materiaArchivosList.innerHTML = `<p class="materia-archivos-empty">Aún no hay archivos</p>`;
        return;
    }

    files.forEach(file => {
        const row = document.createElement("div");
        row.classList.add("archivo-row");

        row.innerHTML = `
            <span class="archivo-icon">${FILE_ICON_SVG}</span>
            <div class="archivo-info">
                <a class="archivo-nombre" href="${file.data}" download="${file.nombre}">${file.nombre}</a>
                <div class="archivo-meta">Subido por ${file.subidoPorNombre || "alguien"}</div>
            </div>
        `;

        materiaArchivosList.appendChild(row);
    });
}

function leerComoBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function subirArchivos(files) {
    if (!currentUser || !firebaseListo() || !currentMateriaId) return;

    const demasiadoGrandes = Array.from(files).filter(f => f.size > MAX_FILE_SIZE);
    if (demasiadoGrandes.length > 0) {
        alert(
            `"${demasiadoGrandes[0].name}" pesa demasiado (máximo ~700 KB por archivo, ya que se guarda directo en la base de datos sin costo). Probá comprimirlo o subir una versión más liviana.`
        );
        return;
    }

    dropzone.classList.add("dragging");
    dropzone.querySelector("p").textContent = "Subiendo…";

    try {
        for (const file of Array.from(files)) {
            const data = await leerComoBase64(file);

            await db.collection("archivos").add({
                materia: currentMateriaId,
                curso: currentCourse,
                nombre: file.name,
                data,
                subidoPorId: currentUser.id,
                subidoPorNombre: currentUser.nombre,
                fecha: new Date().toISOString()
            });
        }
        await loadMateriaArchivos(currentMateriaId);
    } catch (err) {
        console.error(err);
        alert("Hubo un error al subir el archivo. Revisá la consola (F12) para más detalle.");
    } finally {
        dropzone.classList.remove("dragging");
        dropzone.querySelector("p").innerHTML = `Arrastrá un archivo acá, o <span class="dropzone-link">hacé click</span> (máx. ~700 KB)`;
        materiaFileInput.value = "";
    }
}

dropzone.addEventListener("click", () => materiaFileInput.click());
materiaFileInput.addEventListener("change", e => subirArchivos(e.target.files));

["dragenter", "dragover"].forEach(evt =>
    dropzone.addEventListener(evt, e => {
        e.preventDefault();
        dropzone.classList.add("dragging");
    })
);
["dragleave", "drop"].forEach(evt =>
    dropzone.addEventListener(evt, e => {
        e.preventDefault();
        if (evt === "dragleave") dropzone.classList.remove("dragging");
    })
);
dropzone.addEventListener("drop", e => {
    if (e.dataTransfer.files.length) subirArchivos(e.dataTransfer.files);
});

/* =========================================================
   ESTUDIANTES — carrusel, primer apellido, modal
   ========================================================= */

function primerApellido(nombreCompleto) {
    const parts = nombreCompleto.trim().split(/\s+/);
    if (parts.length <= 1) return parts[0] || "";
    const apellidosCount = parts.length >= 3 ? 2 : 1;
    const apellidos = parts.slice(parts.length - apellidosCount);
    return apellidos[0];
}

function formatFecha(fecha) {
    if (!fecha) return "—";
    try {
        const d = new Date(fecha + "T00:00:00");
        return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric" }).format(d);
    } catch {
        return fecha;
    }
}

function renderStudentsTrack(courseId) {
    const list = (typeof estudiantesDB !== "undefined" ? estudiantesDB : []).filter(e => e.curso === courseId);
    studentsTrack.innerHTML = "";

    if (list.length === 0) {
        studentsTrack.innerHTML = `<p class="students-empty">Sin estudiantes todavía</p>`;
        return;
    }

    list.forEach(s => {
        const card = document.createElement("div");
        card.classList.add("card-estudiante");

        const thumb = document.createElement("div");
        thumb.classList.add("thumb");
        thumb.appendChild(buildPhotoSlot(s.foto, s.nombre));
        card.appendChild(thumb);

        if (s.cargo) {
            const badge = document.createElement("span");
            badge.classList.add("badge-cargo");
            badge.textContent = s.cargo;
            card.appendChild(badge);
        }

        const apellidoEl = document.createElement("div");
        apellidoEl.classList.add("apellido");
        apellidoEl.textContent = primerApellido(s.nombre);
        card.appendChild(apellidoEl);

        card.addEventListener("click", () => openStudentModal(s));
        studentsTrack.appendChild(card);
    });
}

studentsPrevBtn.addEventListener("click", () => studentsTrack.scrollBy({ left: -320, behavior: "smooth" }));
studentsNextBtn.addEventListener("click", () => studentsTrack.scrollBy({ left: 320, behavior: "smooth" }));

function openStudentModal(s) {
    if (s.foto) {
        studentModalPhoto.onerror = () => {
            studentModalPhoto.style.display = "none";
            studentPhotoFallback.style.display = "flex";
        };
        studentModalPhoto.src = s.foto;
        studentModalPhoto.style.display = "block";
        studentPhotoFallback.style.display = "none";
    } else {
        studentModalPhoto.style.display = "none";
        studentPhotoFallback.style.display = "flex";
    }

    studentModalName.textContent = s.nombre;
    studentModalBirth.textContent = formatFecha(s.fechaNacimiento);
    studentModalIngles.textContent = s.nivelIngles || "—";
    studentModalContrib.textContent = "…";

    studentModalOverlay.classList.add("active");
    lockScroll();

    if (firebaseListo()) {
        db.collection("archivos").where("subidoPorId", "==", s.id).get()
            .then(snap => {
                studentModalContrib.textContent = snap.size + (snap.size === 1 ? " archivo" : " archivos");
            })
            .catch(() => { studentModalContrib.textContent = "—"; });
    } else {
        studentModalContrib.textContent = "—";
    }
}

function closeStudentModal() {
    studentModalOverlay.classList.remove("active");
    unlockScroll();
}

studentModalClose.addEventListener("click", closeStudentModal);
studentModalOverlay.addEventListener("click", e => { if (e.target === studentModalOverlay) closeStudentModal(); });