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

const fileListEl = document.getElementById("fileList");
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
    renderArchivos(courseId);

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

    materiaModalNombre.textContent = materia ? materia.nombre : materiaId;

    if (profesor) {
        setProfPhoto(profesor.foto || "");
        materiaModalProfNombre.textContent = profesor.nombre;
    } else {
        setProfPhoto("");
        materiaModalProfNombre.textContent = "Profesor sin asignar";
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
   ARCHIVOS — grid de tarjetas
   ========================================================= */

function getFileExt(nombre) {
    const parts = nombre.split(".");
    return parts.length > 1 ? parts.pop().toUpperCase() : "";
}

function renderArchivos(courseId) {
    const dbAll = typeof archivosDB !== "undefined" ? archivosDB : {};
    const list = dbAll[courseId] || [];
    fileListEl.innerHTML = "";

    if (list.length === 0) {
        fileListEl.innerHTML = `<p class="archivos-empty">Aún no hay archivos</p>`;
        return;
    }

    list.forEach(file => {
        const link = document.createElement("a");
        link.classList.add("file-card");
        link.href = file.ruta;
        link.target = "_blank";
        link.rel = "noopener";

        const icon = document.createElement("div");
        icon.classList.add("file-card-icon");
        icon.innerHTML = FILE_ICON_SVG;

        const name = document.createElement("span");
        name.classList.add("file-card-name");
        name.textContent = file.nombre.replace(/\.[^/.]+$/, "");

        const ext = document.createElement("span");
        ext.classList.add("file-card-ext");
        ext.textContent = getFileExt(file.nombre);

        link.appendChild(icon);
        link.appendChild(name);
        link.appendChild(ext);
        fileListEl.appendChild(link);
    });
}

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

    studentModalOverlay.classList.add("active");
    lockScroll();
}

function closeStudentModal() {
    studentModalOverlay.classList.remove("active");
    unlockScroll();
}

studentModalClose.addEventListener("click", closeStudentModal);
studentModalOverlay.addEventListener("click", e => { if (e.target === studentModalOverlay) closeStudentModal(); });