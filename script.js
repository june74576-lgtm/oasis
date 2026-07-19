const days = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"];

const FILE_ICON_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M7 3.5h7l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V5a1.5 1.5 0 0 1 1.5-1.5Z"/>
    <path d="M14 3.5V8h4"/>
</svg>`;

let currentCourse = null;

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

const overlay = document.getElementById("modalOverlay");
const closeBtn = document.getElementById("modalClose");
const courseNameEl = document.getElementById("modalCourseName");
const horarioBody = document.getElementById("horarioBody");
const dayTabs = document.getElementById("dayTabs");
const dayTrack = document.getElementById("dayTrack");

const fileListEl = document.getElementById("fileList");

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

const materiaModalOverlay = document.getElementById("materiaModalOverlay");
const materiaModalClose = document.getElementById("materiaModalClose");
const materiaModalNombre = document.getElementById("materiaModalNombre");
const materiaModalProfFoto = document.getElementById("materiaModalProfFoto");
const profPhotoFallback = document.getElementById("profPhotoFallback");
const materiaModalProfNombre = document.getElementById("materiaModalProfNombre");
const materiaModalTemas = document.getElementById("materiaModalTemas");

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

        card.addEventListener("click", () => openModal(course.id));
        coursesTrack.appendChild(card);
    });
}

coursesPrevBtn.addEventListener("click", () => coursesTrack.scrollBy({ left: -320, behavior: "smooth" }));
coursesNextBtn.addEventListener("click", () => coursesTrack.scrollBy({ left: 320, behavior: "smooth" }));

renderCourses();

/* =========================================================
   MODAL DE CURSO
   ========================================================= */

closeBtn.addEventListener("click", closeModal);
overlay.addEventListener("click", e => { if (e.target === overlay) closeModal(); });

document.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    if (materiaModalOverlay.classList.contains("active")) closeMateriaModal();
    else if (studentModalOverlay.classList.contains("active")) closeStudentModal();
    else if (overlay.classList.contains("active")) closeModal();
});

function openModal(courseId) {
    const course = getCourseById(courseId);
    if (!course) return;

    currentCourse = courseId;
    courseNameEl.textContent = course.nombre;

    renderHorario(courseId);
    renderStudentsTrack(courseId);
    renderArchivos(courseId);

    overlay.classList.add("active");
    lockScroll();
}

function closeModal() {
    overlay.classList.remove("active");
    currentCourse = null;
    unlockScroll();
}

/* =========================================================
   HORARIO — de solo lectura, desde horarios.js
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
        tab.textContent = day.slice(0, 3);
        tab.addEventListener("click", () => {
            dayTrack.children[idx].scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
        });
        dayTabs.appendChild(tab);

        const panel = document.createElement("div");
        panel.classList.add("day-panel");

        const h4 = document.createElement("h4");
        h4.textContent = day;
        panel.appendChild(h4);

        rows.forEach(row => {
            const item = document.createElement("div");
            item.classList.add("day-item");

            if (row.tipo === "recreo") {
                item.classList.add("day-item-recreo");
                item.innerHTML = `<span class="day-item-hora">${row.hora}</span><span>${row.label || "Recreo"}</span>`;
            } else {
                const cell = row[day];
                if (cell) {
                    item.innerHTML = `<span class="day-item-hora">${row.hora}</span><span>${materiaNombre(cell.materia)}</span>`;
                    item.classList.add("clickable");
                    item.addEventListener("click", () => openMateriaModal(cell.materia, cell.profesor));
                } else {
                    item.innerHTML = `<span class="day-item-hora">${row.hora}</span><span class="day-item-libre">Libre</span>`;
                }
            }

            panel.appendChild(item);
        });

        dayTrack.appendChild(panel);
    });
}

/* =========================================================
   MINI MODAL: MATERIA
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

    materiaModalNombre.textContent = materia ? materia.nombre : materiaId;

    if (profesor) {
        setProfPhoto(profesor.foto || "");
        materiaModalProfNombre.textContent = profesor.nombre;
    } else {
        setProfPhoto("");
        materiaModalProfNombre.textContent = "Profesor sin asignar";
    }

    materiaModalTemas.innerHTML = "";
    const temas = materia && materia.temas ? materia.temas : [];
    if (temas.length === 0) {
        materiaModalTemas.innerHTML = `<li>Sin temas registrados todavía</li>`;
    } else {
        temas.forEach(t => {
            const li = document.createElement("li");
            li.textContent = t;
            materiaModalTemas.appendChild(li);
        });
    }

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
   ARCHIVOS — lista estática desde archivos.js
   ========================================================= */

function renderArchivos(courseId) {
    const dbAll = typeof archivosDB !== "undefined" ? archivosDB : {};
    const list = dbAll[courseId] || [];
    fileListEl.innerHTML = "";

    if (list.length === 0) {
        const li = document.createElement("li");
        li.classList.add("empty");
        li.textContent = "Aún no hay archivos";
        fileListEl.appendChild(li);
        return;
    }

    list.forEach(file => {
        const li = document.createElement("li");

        const icon = document.createElement("span");
        icon.classList.add("file-icon");
        icon.innerHTML = FILE_ICON_SVG;

        const link = document.createElement("a");
        link.href = file.ruta;
        link.target = "_blank";
        link.rel = "noopener";
        link.textContent = file.nombre;

        li.appendChild(icon);
        li.appendChild(link);
        fileListEl.appendChild(li);
    });
}

/* =========================================================
   ESTUDIANTES — carrusel, primer apellido, mini modal
   ========================================================= */

// Soporta "Nombre Apellido" y "Nombre Nombre Apellido Apellido":
// los últimos 1 o 2 tokens se toman como apellidos, el primero de esos
// es el que se muestra en la tarjeta.
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

    studentModalOverlay.classList.add("active");
    lockScroll();
}

function closeStudentModal() {
    studentModalOverlay.classList.remove("active");
    unlockScroll();
}

studentModalClose.addEventListener("click", closeStudentModal);
studentModalOverlay.addEventListener("click", e => { if (e.target === studentModalOverlay) closeStudentModal(); });