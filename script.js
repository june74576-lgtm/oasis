const days = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"];

const FILE_ICON_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M7 3.5h7l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V5a1.5 1.5 0 0 1 1.5-1.5Z"/>
    <path d="M14 3.5V8h4"/>
</svg>`;

let currentCourse = null;
let currentMateriaId = null;
let currentMateriaBaseId = null;
let currentNivelId = null;
const materiaNiveles = document.getElementById("materiaNiveles");

/* ===== Bloqueo de scroll ===== */

let openOverlays = 0;
function lockScroll() {
    openOverlays++;
    document.body.style.overflow = "hidden";
}
function unlockScroll() {
    openOverlays = Math.max(0, openOverlays - 1);
    if (openOverlays === 0) document.body.style.overflow = "";
}

/* ===== Foto o fallback ===== */

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
const studentModalRole = document.getElementById("studentModalRole");
const studentModalRoleText = document.getElementById("studentModalRoleText");

const materiaModalOverlay = document.getElementById("materiaModalOverlay");
const materiaModalClose = document.getElementById("materiaModalClose");
const materiaModalNombre = document.getElementById("materiaModalNombre");
const materiaModalProfFoto = document.getElementById("materiaModalProfFoto");
const profPhotoFallback = document.getElementById("profPhotoFallback");
const materiaModalProfNombre = document.getElementById("materiaModalProfNombre");
const materiaArchivosList = document.getElementById("materiaArchivosList");
const dropzone = document.getElementById("dropzone");
const materiaFileInput = document.getElementById("materiaFileInput");
const uploadLoginHint = document.getElementById("uploadLoginHint");

const loginBtn = document.getElementById("loginBtn");
const userChip = document.getElementById("userChip");
const userChipBtn = document.getElementById("userChipBtn");
const userChipAvatar = document.getElementById("userChipAvatar");
const userChipName = document.getElementById("userChipName");
const userMenu = document.getElementById("userMenu");
const userMenuPerfil = document.getElementById("userMenuPerfil");
const userMenuConectar = document.getElementById("userMenuConectar");
const userMenuLogout = document.getElementById("userMenuLogout");

const loginModalOverlay = document.getElementById("loginModalOverlay");
const loginModalClose = document.getElementById("loginModalClose");
const loginUsername = document.getElementById("loginUsername");
const loginPassword = document.getElementById("loginPassword");
const loginError = document.getElementById("loginError");
const loginSubmitBtn = document.getElementById("loginSubmitBtn");


/* ===== UTILIDADES ===== */

function findMateria(id) {
    const list = typeof materiasDB !== "undefined" ? materiasDB : [];
    return list.find(m => m.id === id);
}

function findProfesor(id) {
    const list = typeof profesoresDB !== "undefined" ? profesoresDB : [];
    return list.find(p => p.id === id);
}

function getCourseById(id) {
    return (typeof cursosDB !== "undefined" ? cursosDB : []).find(c => c.id === id);
}

function primerNombreCompleto(nombreCompleto) {
    const parts = nombreCompleto.trim().split(/\s+/);
    if (parts.length === 0) return "";
    const apellidosCount = parts.length >= 3 ? 2 : 1;
    const nombre = parts[0];
    const apellido = parts[parts.length - apellidosCount] || parts[parts.length - 1] || "";
    return nombre + " " + apellido;
}

function normalizar(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function datosLogin(estudiante) {
    const partes = estudiante.nombre.trim().split(/\s+/);
    const apellidosCount = partes.length >= 3 ? 2 : (partes.length === 2 ? 1 : 0);
    const primerNombre = partes[0] || "";
    const primerApellido = partes[partes.length - apellidosCount] || partes[partes.length - 1] || "";
    const dia = estudiante.fechaNacimiento ? estudiante.fechaNacimiento.slice(8, 10) : "";
    return {
        username: normalizar(primerNombre + primerApellido),
        password: normalizar(primerApellido + primerNombre + dia)
    };
}

function primerApellido(nombreCompleto) {
    const parts = nombreCompleto.trim().split(/\s+/);
    if (parts.length <= 1) return parts[0] || "";
    const apellidosCount = parts.length >= 3 ? 2 : 1;
    return parts[parts.length - apellidosCount] || "";
}

function formatFecha(fecha) {
    if (!fecha) return "-";
    try {
        const d = new Date(fecha + "T00:00:00");
        return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric" }).format(d);
    } catch { return fecha; }
}

/* ===== SUPABASE ===== */

function supabaseListo() {
    return typeof supabaseClient !== "undefined" && supabaseClient !== null && typeof supabaseClient.from === "function";
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB (límite del plan gratis de Supabase)

async function loadMateriaArchivos(materiaId) {
    materiaArchivosList.innerHTML = `<p class="materia-archivos-empty">Cargando...</p>`;
    if (!supabaseListo()) {
        materiaArchivosList.innerHTML = `<p class="materia-archivos-empty">Supabase no está configurado.</p>`;
        return;
    }
    try {
        const { data, error } = await supabaseClient
            .from("archivos")
            .select("*")
            .eq("materia", materiaId)
            .order("fecha", { ascending: false });

        if (error) throw error;
        renderMateriaArchivos(data || []);
    } catch (err) {
        console.error("Error cargando archivos:", err);
        materiaArchivosList.innerHTML = `<p class="materia-archivos-empty">Error al cargar archivos.</p>`;
    }
}

function renderMateriaArchivos(files) {
    materiaArchivosList.innerHTML = "";
    if (files.length === 0) {
        materiaArchivosList.innerHTML = `<p class="materia-archivos-empty">Aún no hay archivos</p>`;
        return;
    }
    files.forEach(file => {
        const { data: urlData } = supabaseClient.storage.from("archivos").getPublicUrl(file.storage_path);
        const url = urlData.publicUrl;

        const row = document.createElement("div");
        row.classList.add("archivo-row");
        const subidoPor = file.subido_por_nombre ? `Subido por ${file.subido_por_nombre}` : "";

        const puedeBorrar = isAdmin || (currentUser && currentUser.id === file.subido_por_id);

        row.innerHTML = `
            <span class="archivo-icon">${FILE_ICON_SVG}</span>
            <div class="archivo-info">
                <a class="archivo-nombre" href="${url}" target="_blank" rel="noopener">${file.nombre}</a>
                ${subidoPor ? `<div class="archivo-meta">${subidoPor}</div>` : ""}
            </div>
            ${puedeBorrar ? `<button class="archivo-delete" aria-label="Borrar archivo">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>
            </button>` : ""}
        `;

        if (puedeBorrar) {
            row.querySelector(".archivo-delete").addEventListener("click", () => borrarArchivo(file));
        }

        materiaArchivosList.appendChild(row);
    });
}

async function borrarArchivo(file) {
    if (!confirm(`¿Borrar "${file.nombre}"?`)) return;

    try {
        await supabaseClient.storage.from("archivos").remove([file.storage_path]);
        const { error } = await supabaseClient.from("archivos").delete().eq("id", file.id);
        if (error) throw error;
        await loadMateriaArchivos(currentMateriaId);
    } catch (err) {
        console.error(err);
        alert("No se pudo borrar el archivo.");
    }
}

function rutaSegura(nombre) {
    // Supabase Storage no acepta ciertos caracteres/espacios sin problemas raros,
    // así que limpiamos el nombre para el path (el nombre original se guarda aparte).
    return nombre
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9._-]/g, "_");
}

// Deduce el id de nivel ("advanced" / "intermedio") a partir del texto
// libre que tiene el estudiante en estudiantes.js (ej. "Advanced (B2)").
function nivelIdDeEstudiante(estudiante) {
    if (!estudiante || !estudiante.nivelIngles) return null;
    return estudiante.nivelIngles.toLowerCase().startsWith("advanced") ? "advanced" : "intermedio";
}

// Solo puede subir si: hay sesión iniciada, Supabase está listo, el
// estudiante pertenece al curso que se está mirando, y si la materia
// tiene niveles, que además coincida con el nivel del estudiante.
function puedeSubirAqui() {
    if (!currentUser || !supabaseListo() || !currentCourse) return { ok: false, motivo: "sesion" };

    const yo = (typeof estudiantesDB !== "undefined" ? estudiantesDB : []).find(e => e.id === currentUser.id);
    if (!yo) return { ok: false, motivo: "sesion" };

    if (yo.curso !== currentCourse) return { ok: false, motivo: "curso" };

    if (currentNivelId && nivelIdDeEstudiante(yo) !== currentNivelId) {
        return { ok: false, motivo: "nivel" };
    }

    return { ok: true };
}

async function subirArchivos(files) {
    if (!puedeSubirAqui().ok || !currentMateriaId) return;
    const demasiadoGrandes = Array.from(files).filter(f => f.size > MAX_FILE_SIZE);
    if (demasiadoGrandes.length > 0) {
        alert(`"${demasiadoGrandes[0].name}" pesa demasiado (máximo 50 MB).`);
        return;
    }
    dropzone.classList.add("dragging");
    dropzone.querySelector("p").textContent = "Subiendo...";
    try {
        for (const file of Array.from(files)) {
            const path = `${currentMateriaId}/${Date.now()}_${rutaSegura(file.name)}`;

            const { error: uploadError } = await supabaseClient.storage.from("archivos").upload(path, file);
            if (uploadError) throw uploadError;

            const { error: insertError } = await supabaseClient.from("archivos").insert({
                materia: currentMateriaId,
                curso: currentCourse,
                nombre: file.name,
                storage_path: path,
                subido_por_id: currentUser.id,
                subido_por_nombre: currentUser.nombre,
                fecha: new Date().toISOString()
            });
            if (insertError) throw insertError;
        }
        await loadMateriaArchivos(currentMateriaId);
    } catch (err) {
        console.error(err);
        alert("Error al subir. Revisa la consola (F12).");
    } finally {
        dropzone.classList.remove("dragging");
        dropzone.querySelector("p").innerHTML = `Arrastra un archivo aquí, o <span class="dropzone-link">haz clic</span> (máx. 50 MB)`;
        materiaFileInput.value = "";
    }
}

function updateUploadUI() {
    const estado = puedeSubirAqui();
    if (estado.ok) {
        dropzone.style.display = "block";
        uploadLoginHint.style.display = "none";
    } else {
        dropzone.style.display = "none";
        uploadLoginHint.style.display = "block";
        if (!supabaseListo()) {
            uploadLoginHint.textContent = "Supabase todavía no está configurado.";
        } else if (estado.motivo === "curso") {
            uploadLoginHint.textContent = "Solo los estudiantes de este curso pueden subir archivos aquí.";
        } else if (estado.motivo === "nivel") {
            uploadLoginHint.textContent = "Este nivel de inglés no es el tuyo — no puedes subir archivos aquí.";
        } else {
            uploadLoginHint.textContent = "Inicia sesión para subir archivos.";
        }
    }
}

/* ===== CURSOS ===== */

function getCourseCardImage(course) {
    const gal = (typeof galeriaDB !== "undefined" ? galeriaDB[course.id] : null) || [];
    if (gal.length > 0) {
        const pick = gal[Math.floor(Math.random() * gal.length)];
        return pick.ruta;
    }
    return course.imagen || "";
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
        thumb.appendChild(buildPhotoSlot(getCourseCardImage(course), course.nombre));
        card.appendChild(thumb);

        const info = document.createElement("div");
        info.classList.add("info");
        info.innerHTML = `<span class="eyebrow">Curso</span><h3>${course.nombre}</h3>`;
        card.appendChild(info);

        if (course.disabled) {
            card.classList.add("card-disabled");
            const badge = document.createElement("span");
            badge.classList.add("card-disabled-badge");
            badge.textContent = "Próximamente";
            card.appendChild(badge);
        } else {
            card.setAttribute("role", "button");
            card.setAttribute("tabindex", "0");
            card.addEventListener("click", () => openCourseFullscreen(course.id));
            card.addEventListener("keydown", (e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openCourseFullscreen(course.id);
                }
            });
        }

        coursesTrack.appendChild(card);
    });
}

coursesPrevBtn.addEventListener("click", () => coursesTrack.scrollBy({ left: -320, behavior: "smooth" }));
coursesNextBtn.addEventListener("click", () => coursesTrack.scrollBy({ left: 320, behavior: "smooth" }));

renderCourses();

/* ===== PANTALLA COMPLETA ===== */

fsClose.addEventListener("click", closeCourseFullscreen);

document.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    if (imageViewer.classList.contains("active")) closeImageViewer();
    else if (materiaModalOverlay.classList.contains("active")) closeMateriaModal();
    else if (studentModalOverlay.classList.contains("active")) closeStudentModal();
    else if (loginModalOverlay.classList.contains("active")) closeLoginModal();
    else if (courseFullscreen.classList.contains("active")) closeCourseFullscreen();
});

function openCourseFullscreen(courseId) {
    const course = getCourseById(courseId);
    if (!course) return;
    currentCourse = courseId;
    fsTopbarTitle.textContent = course.nombre;
    renderTutor(courseId);
    renderHorario(courseId);
    renderStudentsTrack(courseId);
    renderGaleria(courseId);
    courseFullscreen.classList.add("active");
    courseFullscreen.scrollTop = 0;
    lockScroll();
}

function renderTutor(courseId) {
    const tutorCard = document.getElementById("tutorCard");
    const profs = typeof profesoresDB !== "undefined" ? profesoresDB : [];
    const tutor = profs.find(p => p.tutor === courseId);

    tutorCard.innerHTML = "";
    if (!tutor) {
        tutorCard.innerHTML = `<p class="materia-archivos-empty">Sin tutor asignado</p>`;
        return;
    }

    const photoWrap = document.createElement("div");
    photoWrap.classList.add("tutor-photo-wrap");
    
    const photoSlot = buildPhotoSlot(tutor.foto, tutor.nombre);
    photoWrap.appendChild(photoSlot);
    
    const tutorImg = photoSlot.querySelector("img");
    if (tutorImg) {
        tutorImg.addEventListener("click", () => openImageViewer(tutor.foto));
        tutorImg.style.cursor = "zoom-in";
    }
    
    tutorCard.appendChild(photoWrap);

    const name = document.createElement("span");
    name.textContent = tutor.nombre;
    tutorCard.appendChild(name);
}

function closeCourseFullscreen() {
    courseFullscreen.classList.remove("active");
    currentCourse = null;
    unlockScroll();
}

/* ===== HORARIO ===== */

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

    days.forEach((day, dayIdx) => {
        const tab = document.createElement("button");
        tab.classList.add("day-tab");
        if (dayIdx === 0) tab.classList.add("active");
        tab.textContent = day.slice(0, 3);
        tab.addEventListener("click", () => {
            showDay(dayIdx);
        });
        dayTabs.appendChild(tab);

        const panel = document.createElement("div");
        panel.classList.add("day-panel");
        if (dayIdx === 0) panel.classList.add("active");

        // Primera pasada: armamos la lista de entradas del día con su
        // "key" (materia+profesor) para saber cuáles son continuación
        // de la anterior.
        const entries = [];
        let prevKey = null;
        rows.forEach(row => {
            if (row.tipo === "recreo") {
                entries.push({ type: "recreo", row });
                prevKey = null;
                return;
            }
            const cell = row[day];
            if (!cell) {
                entries.push({ type: "libre", row });
                prevKey = null;
                return;
            }
            const key = cellKey(cell);
            entries.push({ type: "materia", row, cell, key, isContinuation: key === prevKey });
            prevKey = key;
        });

        // Segunda pasada: con el "de al lado" ya sabemos si esta entrada
        // es sola, el inicio de un bloque, la mitad, o el final — para
        // fusionar visualmente las que son la misma materia seguida
        // (estilo Material You: un solo bloque con esquinas compartidas).
        entries.forEach((entry, idx) => {
            const next = entries[idx + 1];
            const nextIsSame = entry.type === "materia" && next && next.type === "materia" && next.key === entry.key;

            let position = "solo";
            if (entry.type === "materia") {
                if (!entry.isContinuation && nextIsSame) position = "start";
                else if (entry.isContinuation && nextIsSame) position = "middle";
                else if (entry.isContinuation && !nextIsSame) position = "end";
            }

            let cardEl, horaLabel;
            if (entry.type === "recreo") {
                cardEl = buildRecreoCard(entry.row);
                horaLabel = entry.row.hora;
            } else if (entry.type === "libre") {
                cardEl = buildLibreCard();
                horaLabel = entry.row.hora.split(" - ")[0];
            } else {
                cardEl = buildMateriaCard(entry.cell);
                horaLabel = entry.row.hora.split(" - ")[0];
            }

            const item = buildTimelineItem(horaLabel, cardEl, position);
            panel.appendChild(item);
        });

        dayTrack.appendChild(panel);
    });
}

function buildTimelineItem(horaLabel, cardEl, position) {
    const item = document.createElement("div");
    item.classList.add("timeline-item");
    if (position !== "solo") item.classList.add("chain-" + position);

    const timeCol = document.createElement("div");
    timeCol.classList.add("timeline-time-col");
    timeCol.textContent = horaLabel;
    item.appendChild(timeCol);

    const connector = document.createElement("div");
    connector.classList.add("timeline-connector");
    const dotEl = document.createElement("span");
    dotEl.classList.add("timeline-dot");
    if (position === "middle" || position === "end") dotEl.classList.add("hollow");
    const lineEl = document.createElement("span");
    lineEl.classList.add("timeline-line");
    if (position === "start" || position === "middle") lineEl.classList.add("connected");
    connector.appendChild(dotEl);
    connector.appendChild(lineEl);
    item.appendChild(connector);

    item.appendChild(cardEl);
    return item;
}

function buildRecreoCard(row) {
    const card = document.createElement("div");
    card.classList.add("timeline-card", "recreo-card");
    card.textContent = row.label || "Recreo";
    return card;
}

function buildLibreCard() {
    const card = document.createElement("div");
    card.classList.add("timeline-card", "libre-card");
    card.textContent = "Libre";
    return card;
}

function buildMateriaCard(cell) {
    const card = document.createElement("div");
    card.classList.add("timeline-card", "clickable");
    const prof = findProfesor(cell.profesor);
    card.innerHTML = `
        <div class="materia-name">${materiaNombre(cell.materia)}</div>
        ${prof ? `<div class="prof-name">${prof.nombre}</div>` : ""}
    `;
    card.addEventListener("click", () => openMateriaModal(cell.materia, cell.profesor));
    return card;
}

function showDay(idx) {
    document.querySelectorAll(".day-tab").forEach((t, i) => t.classList.toggle("active", i === idx));
    document.querySelectorAll(".day-panel").forEach((p, i) => p.classList.toggle("active", i === idx));
}

// Clic en un día abre las Tareas de ese día — encabezados de la tabla
// (escritorio) y el botón "Ver tareas" (móvil, tarea del día activo).
document.querySelectorAll(".day-header-clickable").forEach(th => {
    th.addEventListener("click", () => openTareasModal(th.dataset.day));
});

if (tareasBtn) {
    tareasBtn.addEventListener("click", () => {
        const activeIdx = Array.from(document.querySelectorAll(".day-tab")).findIndex(t => t.classList.contains("active"));
        openTareasModal(days[activeIdx === -1 ? 0 : activeIdx]);
    });
}


/* ===== TAREAS ===== */

let currentTareaDia = null;

function puedeAgregarTareaAqui() {
    if (!currentUser || !supabaseListo() || !currentCourse) return false;
    const yo = (typeof estudiantesDB !== "undefined" ? estudiantesDB : []).find(e => e.id === currentUser.id);
    return !!(yo && yo.curso === currentCourse);
}

// Materias que ese curso tiene ese día (para el selector del formulario
// y para saber qué secciones mostrar aunque todavía no tengan tareas).
function materiasDelDia(courseId, dia) {
    const dbAll = typeof horariosDB !== "undefined" ? horariosDB : {};
    const rows = dbAll[courseId] || [];
    const ids = [];
    rows.forEach(row => {
        if (row.tipo !== "clase") return;
        const cell = row[dia];
        if (cell && !ids.includes(cell.materia)) ids.push(cell.materia);
    });
    return ids;
}

function openTareasModal(dia) {
    currentTareaDia = dia;
    tareasModalTitulo.textContent = "Tareas · " + dia;
    addTareaForm.classList.remove("open");

    if (puedeAgregarTareaAqui()) {
        addTareaToggle.style.display = "inline-flex";
        tareaLoginHint.style.display = "none";
        renderTareaMateriaOptions(dia);
    } else {
        addTareaToggle.style.display = "none";
        tareaLoginHint.style.display = "block";
        tareaLoginHint.textContent = !currentUser
            ? "Inicia sesión para agregar tareas."
            : "Solo los estudiantes de este curso pueden agregar tareas aquí.";
    }

    loadTareas(currentCourse, dia);

    tareasModalOverlay.classList.add("active");
    lockScroll();
}

function closeTareasModal() {
    tareasModalOverlay.classList.remove("active");
    unlockScroll();
}

tareasModalClose.addEventListener("click", closeTareasModal);
tareasModalOverlay.addEventListener("click", e => { if (e.target === tareasModalOverlay) closeTareasModal(); });

function renderTareaMateriaOptions(dia) {
    const ids = materiasDelDia(currentCourse, dia);
    tareaMateria.innerHTML = "";
    ids.forEach(id => {
        const opt = document.createElement("option");
        opt.value = id;
        opt.textContent = materiaNombre(id);
        tareaMateria.appendChild(opt);
    });
}

addTareaToggle.addEventListener("click", () => addTareaForm.classList.toggle("open"));

async function borrarTarea(t) {
    if (!confirm(`¿Borrar la tarea "${t.titulo}"?`)) return;
    if (!supabaseListo()) return;
    try {
        const { error } = await supabaseClient.from("tareas").delete().eq("id", t.id);
        if (error) throw error;
        await loadTareas(currentCourse, currentTareaDia);
    } catch (err) {
        console.error(err);
        alert("No se pudo borrar la tarea.");
    }
}

async function loadTareas(courseId, dia) {
    tareasList.innerHTML = `<p class="tareas-empty">Cargando...</p>`;

    const materiaIds = materiasDelDia(courseId, dia);

    if (materiaIds.length === 0) {
        tareasList.innerHTML = `<p class="tareas-empty">No hay materias registradas ese día.</p>`;
        return;
    }

    let tareas = [];
    if (supabaseListo()) {
        try {
            const { data, error } = await supabaseClient
                .from("tareas")
                .select("*")
                .eq("curso", courseId)
                .eq("dia", dia);
            if (error) throw error;
            tareas = data || [];
        } catch (err) {
            console.error(err);
            tareasList.innerHTML = `<p class="tareas-empty">Error al cargar las tareas.</p>`;
            return;
        }
    }

    renderTareas(materiaIds, tareas);
}

function renderTareas(materiaIds, tareas) {
    tareasList.innerHTML = "";

    materiaIds.forEach(materiaId => {
        const group = document.createElement("div");
        group.classList.add("tareas-materia-group");

        const titulo = document.createElement("div");
        titulo.classList.add("tareas-materia-titulo");
        titulo.textContent = materiaNombre(materiaId);
        group.appendChild(titulo);

        const propias = tareas.filter(t => t.materia === materiaId);

        if (propias.length === 0) {
            const vacio = document.createElement("p");
            vacio.classList.add("tareas-materia-empty");
            vacio.textContent = "Sin tareas todavía";
            group.appendChild(vacio);
        } else {
            propias.forEach(t => group.appendChild(buildTareaItem(t)));
        }

        tareasList.appendChild(group);
    });
}

function buildTareaItem(t) {
    const item = document.createElement("div");
    item.classList.add("tarea-item");

    const row = document.createElement("div");
    row.classList.add("tarea-item-row");

    const header = document.createElement("button");
    header.classList.add("tarea-item-header");
    header.type = "button";
    header.innerHTML = `
        <span>
            <span class="tarea-item-titulo">${t.titulo}</span>
            <div class="tarea-item-autor">Por ${t.autor_nombre || "alguien"}</div>
        </span>
        <svg class="tarea-item-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
    `;
    header.addEventListener("click", () => item.classList.toggle("open"));
    row.appendChild(header);

    const puedeBorrarTarea = isAdmin || (currentUser && currentUser.id === t.autor_id);
    if (puedeBorrarTarea) {
        const delBtn = document.createElement("button");
        delBtn.classList.add("tarea-item-delete");
        delBtn.type = "button";
        delBtn.setAttribute("aria-label", "Borrar tarea");
        delBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>`;
        delBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            borrarTarea(t);
        });
        row.appendChild(delBtn);
    }

    item.appendChild(row);

    const descWrap = document.createElement("div");
    descWrap.classList.add("tarea-desc-wrap");
    descWrap.innerHTML = `<div class="tarea-desc-inner"><p>${t.descripcion ? t.descripcion : "Sin descripción."}</p></div>`;
    item.appendChild(descWrap);

    return item;
}

tareaSubmitBtn.addEventListener("click", async () => {
    if (!puedeAgregarTareaAqui() || !currentTareaDia) return;

    const materia = tareaMateria.value;
    const titulo = tareaTitulo.value.trim();
    const descripcion = tareaDescripcion.value.trim();
    if (!materia || !titulo) return;

    tareaSubmitBtn.disabled = true;
    tareaSubmitBtn.textContent = "Guardando...";

    try {
        const { error } = await supabaseClient.from("tareas").insert({
            curso: currentCourse,
            dia: currentTareaDia,
            materia,
            titulo,
            descripcion,
            autor_id: currentUser.id,
            autor_nombre: currentUser.nombre,
            fecha: new Date().toISOString()
        });
        if (error) throw error;

        tareaTitulo.value = "";
        tareaDescripcion.value = "";
        addTareaForm.classList.remove("open");
        await loadTareas(currentCourse, currentTareaDia);
    } catch (err) {
        console.error(err);
        alert("No se pudo guardar la tarea. Revisa la consola (F12).");
    } finally {
        tareaSubmitBtn.disabled = false;
        tareaSubmitBtn.textContent = "Guardar tarea";
    }
});


/* ===== MODAL MATERIA ===== */

function setProfPhoto(url) {
    if (url) {
        materiaModalProfFoto.onerror = () => {
            materiaModalProfFoto.style.display = "none";
            profPhotoFallback.style.display = "flex";
        };
        materiaModalProfFoto.src = url;
        materiaModalProfFoto.style.cursor = "zoom-in";
        materiaModalProfFoto.onclick = () => openImageViewer(url);
        materiaModalProfFoto.style.display = "block";
        profPhotoFallback.style.display = "none";
    } else {
        materiaModalProfFoto.style.display = "none";
        profPhotoFallback.style.display = "flex";
    }
}

function renderNivelTabs(niveles) {
    materiaNiveles.style.display = "flex";
    materiaNiveles.innerHTML = "";
    niveles.forEach((nivel, idx) => {
        const tab = document.createElement("button");
        tab.classList.add("nivel-tab");
        if (idx === 0) tab.classList.add("active");
        tab.textContent = nivel.nombre;
        tab.addEventListener("click", () => {
            document.querySelectorAll(".nivel-tab").forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            showNivel(nivel);
        });
        materiaNiveles.appendChild(tab);
    });
}

function showNivel(nivel) {
    currentNivelId = nivel.id;
    currentMateriaId = currentMateriaBaseId + "::" + nivel.id;

    const profesor = findProfesor(nivel.profesor);
    if (profesor) {
        setProfPhoto(profesor.foto || "");
        materiaModalProfNombre.textContent = profesor.nombre;
    } else {
        setProfPhoto("");
        materiaModalProfNombre.textContent = "Profesor sin asignar";
    }

    loadMateriaArchivos(currentMateriaId);
    updateUploadUI();
}

function openMateriaModal(materiaId, profesorId) {
    const materia = findMateria(materiaId);
    currentMateriaBaseId = materiaId;
    materiaModalNombre.textContent = materia ? materia.nombre : materiaId;

    if (materia && materia.niveles && materia.niveles.length > 0) {
        // Esta materia se separa por nivel de inglés: cada nivel tiene
        // su propio profesor y sus propios archivos.
        renderNivelTabs(materia.niveles);
        showNivel(materia.niveles[0]);
    } else {
        // Materia normal, sin separación por nivel.
        materiaNiveles.style.display = "none";
        currentNivelId = null;
        currentMateriaId = materiaId;

        const profesor = findProfesor(profesorId);
        if (profesor) {
            setProfPhoto(profesor.foto || "");
            materiaModalProfNombre.textContent = profesor.nombre;
        } else {
            setProfPhoto("");
            materiaModalProfNombre.textContent = "Profesor sin asignar";
        }

        loadMateriaArchivos(currentMateriaId);
        updateUploadUI();
    }

    materiaModalOverlay.classList.add("active");
    lockScroll();
}

function closeMateriaModal() {
    materiaModalOverlay.classList.remove("active");
    currentMateriaId = null;
    currentMateriaBaseId = null;
    currentNivelId = null;
    unlockScroll();
}

materiaModalClose.addEventListener("click", closeMateriaModal);
materiaModalOverlay.addEventListener("click", e => { if (e.target === materiaModalOverlay) closeMateriaModal(); });

/* Dropzone */
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

/* ===== GALERIA ===== */

async function renderGaleria(courseId) {
    const dbAll = typeof galeriaDB !== "undefined" ? galeriaDB : {};
    let list = (dbAll[courseId] || []).map(item => ({ ruta: item.ruta }));

    if (supabaseListo()) {
        try {
            const { data, error } = await supabaseClient
                .from("galeria_fotos")
                .select("*")
                .eq("curso", courseId);
            if (error) throw error;
            (data || []).forEach(row => {
                const { data: urlData } = supabaseClient.storage.from("galeria").getPublicUrl(row.storage_path);
                list.push({ ruta: urlData.publicUrl });
            });
        } catch (err) {
            console.warn("No se pudieron cargar fotos de galería subidas:", err);
        }
    }

    galeriaTrack.innerHTML = "";
    galeriaTrack.style.animation = "none";

    if (list.length === 0) {
        galeriaTrack.innerHTML = `<p class="galeria-empty">Sin fotos en la galería todavía</p>`;
    } else {
        const sizeClasses = ["size-a", "size-b", "size-c"];
        const doubled = list.concat(list);

        doubled.forEach((item, i) => {
            const div = document.createElement("div");
            div.classList.add("galeria-item", sizeClasses[i % sizeClasses.length]);
            const img = document.createElement("img");
            img.src = item.ruta;
            img.alt = "";
            img.loading = "lazy";
            img.style.cursor = "zoom-in";
            img.addEventListener("click", () => openImageViewer(item.ruta));
            div.appendChild(img);
            galeriaTrack.appendChild(div);
        });

        const duration = Math.max(list.length * 5, 20);
        galeriaTrack.style.animation = `galeriaScroll ${duration}s linear infinite`;
    }

    setupGaleriaAutoScroll();
    updateGaleriaUploadUI();
}

/* ===== Subida de fotos a la galería (cualquier usuario logueado) ===== */

const galeriaDropzone = document.getElementById("galeriaDropzone");
const galeriaFileInput = document.getElementById("galeriaFileInput");
const galeriaLoginHint = document.getElementById("galeriaLoginHint");
const MAX_GALERIA_SIZE = 10 * 1024 * 1024;

function updateGaleriaUploadUI() {
    if (currentUser && !currentUser.isAdmin && supabaseListo()) {
        galeriaDropzone.style.display = "block";
        galeriaLoginHint.style.display = "none";
    } else {
        galeriaDropzone.style.display = "none";
        galeriaLoginHint.style.display = "block";
        galeriaLoginHint.textContent = supabaseListo()
            ? "Inicia sesión para sumar fotos a la galería."
            : "Supabase todavía no está configurado.";
    }
}

async function subirFotosGaleria(files) {
    if (!currentUser || currentUser.isAdmin || !supabaseListo() || !currentCourse) return;
    const grandes = Array.from(files).filter(f => f.size > MAX_GALERIA_SIZE);
    if (grandes.length > 0) {
        alert(`"${grandes[0].name}" pesa demasiado (máximo 10 MB).`);
        return;
    }
    galeriaDropzone.classList.add("dragging");
    galeriaDropzone.querySelector("p").textContent = "Subiendo...";
    try {
        for (const file of Array.from(files)) {
            const path = `${currentCourse}/${Date.now()}_${rutaSegura(file.name)}`;
            const { error: upErr } = await supabaseClient.storage.from("galeria").upload(path, file);
            if (upErr) throw upErr;
            const { error: insErr } = await supabaseClient.from("galeria_fotos").insert({
                curso: currentCourse,
                storage_path: path,
                subido_por_id: currentUser.id,
                subido_por_nombre: currentUser.nombre,
                fecha: new Date().toISOString()
            });
            if (insErr) throw insErr;
        }
        await renderGaleria(currentCourse);
    } catch (err) {
        console.error(err);
        alert("Error al subir la foto. Revisa la consola (F12).");
    } finally {
        galeriaDropzone.classList.remove("dragging");
        galeriaDropzone.querySelector("p").innerHTML = `Arrastra una foto aquí, o <span class="dropzone-link">haz clic</span> (máx. 10 MB c/u)`;
        galeriaFileInput.value = "";
    }
}

galeriaDropzone.addEventListener("click", () => galeriaFileInput.click());
galeriaFileInput.addEventListener("change", e => subirFotosGaleria(e.target.files));
["dragenter", "dragover"].forEach(evt =>
    galeriaDropzone.addEventListener(evt, e => { e.preventDefault(); galeriaDropzone.classList.add("dragging"); })
);
["dragleave", "drop"].forEach(evt =>
    galeriaDropzone.addEventListener(evt, e => {
        e.preventDefault();
        if (evt === "dragleave") galeriaDropzone.classList.remove("dragging");
    })
);
galeriaDropzone.addEventListener("drop", e => {
    if (e.dataTransfer.files.length) subirFotosGaleria(e.dataTransfer.files);
});

/* En celular la galería se desliza sola, pero el usuario también puede
   arrastrarla con el dedo — al soltar, retoma el auto-scroll solo tras
   una pausa breve. En escritorio sigue siendo la animación CSS de siempre. */

let galeriaAutoTimer = null;
let galeriaResumeTimer = null;
let galeriaListenersListos = false;

function esMobileGaleria() {
    return window.matchMedia("(max-width:700px)").matches;
}

function iniciarGaleriaAuto() {
    detenerGaleriaAuto();
    if (!esMobileGaleria()) return;
    const viewport = galeriaTrack.parentElement;
    if (!viewport || viewport.scrollWidth <= viewport.clientWidth) return;

    galeriaAutoTimer = setInterval(() => {
        const mitad = viewport.scrollWidth / 2;
        viewport.scrollLeft += 1;
        if (viewport.scrollLeft >= mitad) viewport.scrollLeft = 0;
    }, 25);
}

function detenerGaleriaAuto() {
    if (galeriaAutoTimer) { clearInterval(galeriaAutoTimer); galeriaAutoTimer = null; }
}

function pausarGaleriaTemporal() {
    detenerGaleriaAuto();
    if (galeriaResumeTimer) clearTimeout(galeriaResumeTimer);
    galeriaResumeTimer = setTimeout(iniciarGaleriaAuto, 2200);
}

function setupGaleriaAutoScroll() {
    const viewport = galeriaTrack.parentElement;
    if (!viewport) return;

    if (!galeriaListenersListos) {
        viewport.addEventListener("touchstart", pausarGaleriaTemporal, { passive: true });
        viewport.addEventListener("touchend", pausarGaleriaTemporal, { passive: true });
        window.addEventListener("resize", () => {
            if (esMobileGaleria()) iniciarGaleriaAuto();
            else detenerGaleriaAuto();
        });
        galeriaListenersListos = true;
    }

    iniciarGaleriaAuto();
}

/* ===== LOGIN ===== */

let currentUser = null;

let isAdmin = false;

function updateAuthUI() {
    if (currentUser) {
        loginBtn.style.display = "none";
        userChip.style.display = "flex";
        userChipName.textContent = currentUser.nombre;

        const yo = (typeof estudiantesDB !== "undefined" ? estudiantesDB : []).find(e => e.id === currentUser.id);
        userChipAvatar.innerHTML = "";
        userChipAvatar.appendChild(buildPhotoSlot(currentUser.foto || (yo ? yo.foto : ""), currentUser.nombre));

        userMenuAdmin.style.display = isAdmin ? "flex" : "none";
        userMenuPerfil.style.display = currentUser.isAdmin ? "none" : "flex";
        userMenuConectar.style.display = currentUser.isAdmin ? "none" : "flex";
    } else {
        loginBtn.style.display = "inline-flex";
        userChip.style.display = "none";
        userChip.classList.remove("open");
    }
    if (materiaModalOverlay.classList.contains("active")) updateUploadUI();
    if (courseFullscreen.classList.contains("active")) updateGaleriaUploadUI();
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
    isAdmin = false;
    currentUser = { id: match.id, nombre: primerNombreCompleto(match.nombre) };
    sessionStorage.setItem("oasis_session", JSON.stringify(currentUser));
    updateAuthUI();
    closeLoginModal();
}

// Menú del chip de usuario (Perfil / Conectar / Administrar / Cerrar sesión)

userChipBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    userChip.classList.toggle("open");
});

document.addEventListener("click", (e) => {
    if (!userChip.contains(e.target)) userChip.classList.remove("open");
});

userMenuPerfil.addEventListener("click", () => {
    userChip.classList.remove("open");
    if (!currentUser) return;
    const yo = (typeof estudiantesDB !== "undefined" ? estudiantesDB : []).find(e => e.id === currentUser.id);
    if (yo) openStudentModal(yo);
});

userMenuLogout.addEventListener("click", () => {
    currentUser = null;
    isAdmin = false;
    sessionStorage.removeItem("oasis_session");
    updateAuthUI();
});

const savedSession = sessionStorage.getItem("oasis_session");
if (savedSession) {
    currentUser = JSON.parse(savedSession);
    isAdmin = !!currentUser.isAdmin;
}
updateAuthUI();

/* ===== GOOGLE SIGN-IN ===== */

let conectandoGoogle = false;

function parseJwt(token) {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
        atob(base64).split("").map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join("")
    );
    return JSON.parse(jsonPayload);
}

function handleGoogleCredential(response) {
    const payload = parseJwt(response.credential);
    const email = payload.email;

    if (email === ADMIN_EMAIL) {
        isAdmin = true;
        currentUser = { id: "admin", nombre: payload.name, isAdmin: true, foto: payload.picture };
        sessionStorage.setItem("oasis_session", JSON.stringify(currentUser));
        updateAuthUI();
        closeLoginModal();
        return;
    }

    if (conectandoGoogle && currentUser && !currentUser.isAdmin) {
        const links = JSON.parse(localStorage.getItem("oasis_google_links") || "{}");
        links[email] = currentUser.id;
        localStorage.setItem("oasis_google_links", JSON.stringify(links));
        conectandoGoogle = false;
        alert("Tu cuenta de Google quedó conectada. La próxima vez podés entrar con \"Continuar con Google\".");
        return;
    }

    const links = JSON.parse(localStorage.getItem("oasis_google_links") || "{}");
    const estudianteId = links[email];
    const est = estudianteId
        ? (typeof estudiantesDB !== "undefined" ? estudiantesDB : []).find(e => e.id === estudianteId)
        : null;

    if (est) {
        isAdmin = false;
        currentUser = { id: est.id, nombre: primerNombreCompleto(est.nombre) };
        sessionStorage.setItem("oasis_session", JSON.stringify(currentUser));
        updateAuthUI();
        closeLoginModal();
    } else {
        alert("Esta cuenta de Google todavía no está conectada a ningún estudiante. Iniciá sesión con usuario y contraseña, y después conectala desde el menú de tu perfil.");
    }
}

function initGoogleAuth() {
    if (!window.google || !google.accounts || !google.accounts.id) return;
    if (GOOGLE_CLIENT_ID.includes("TU_CLIENT_ID")) {
        console.warn("Falta configurar GOOGLE_CLIENT_ID en data/supabase-config.js");
        return;
    }
    try {
        google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleGoogleCredential });
        const div = document.getElementById("googleSignInDiv");
        if (div) google.accounts.id.renderButton(div, { theme: "filled_black", shape: "pill", size: "large", width: 260 });
    } catch (err) {
        console.error("Error inicializando Google Sign-In:", err);
    }
}
window.addEventListener("load", initGoogleAuth);

userMenuConectar.addEventListener("click", () => {
    userChip.classList.remove("open");
    if (GOOGLE_CLIENT_ID.includes("TU_CLIENT_ID")) {
        alert("Todavía no se configuró Google Sign-In (falta pegar el Client ID en data/supabase-config.js).");
        return;
    }
    if (!window.google || !google.accounts || !google.accounts.id) {
        alert("Google Sign-In no está disponible todavía. Probá recargar la página.");
        return;
    }
    conectandoGoogle = true;
    google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            conectandoGoogle = false;
            alert("Google no mostró la ventana (a veces pasa por el navegador). Probá cerrar sesión y entrar de nuevo con el botón \"Continuar con Google\" del login.");
        }
    });
});

/* ===== PANEL DE ADMINISTRACIÓN ===== */

const adminModalOverlay = document.getElementById("adminModalOverlay");
const adminModalClose = document.getElementById("adminModalClose");
const adminDataType = document.getElementById("adminDataType");
const adminDataTextarea = document.getElementById("adminDataTextarea");
const adminSaveBtn = document.getElementById("adminSaveBtn");
const adminSaveStatus = document.getElementById("adminSaveStatus");
const userMenuAdmin = document.getElementById("userMenuAdmin");

function getGlobalFor(tipo) {
    if (tipo === "cursos") return cursosDB;
    if (tipo === "estudiantes") return estudiantesDB;
    if (tipo === "profesores") return profesoresDB;
    if (tipo === "materias") return materiasDB;
    if (tipo === "horarios") return horariosDB;
}

function setGlobalFor(tipo, data) {
    if (tipo === "cursos") cursosDB = data;
    else if (tipo === "estudiantes") estudiantesDB = data;
    else if (tipo === "profesores") profesoresDB = data;
    else if (tipo === "materias") materiasDB = data;
    else if (tipo === "horarios") horariosDB = data;
}

function loadAdminTextarea() {
    adminDataTextarea.value = JSON.stringify(getGlobalFor(adminDataType.value), null, 4);
    adminSaveStatus.textContent = "";
}

adminDataType.addEventListener("change", loadAdminTextarea);

userMenuAdmin.addEventListener("click", () => {
    userChip.classList.remove("open");
    loadAdminTextarea();
    adminModalOverlay.classList.add("active");
    lockScroll();
});

adminModalClose.addEventListener("click", () => {
    adminModalOverlay.classList.remove("active");
    unlockScroll();
});
adminModalOverlay.addEventListener("click", e => {
    if (e.target === adminModalOverlay) {
        adminModalOverlay.classList.remove("active");
        unlockScroll();
    }
});

adminSaveBtn.addEventListener("click", async () => {
    const tipo = adminDataType.value;
    let parsed;
    try {
        parsed = JSON.parse(adminDataTextarea.value);
    } catch (err) {
        adminSaveStatus.style.color = "#ff8a8a";
        adminSaveStatus.textContent = "El texto no es JSON válido: " + err.message;
        return;
    }
    if (!supabaseListo()) {
        adminSaveStatus.style.color = "#ff8a8a";
        adminSaveStatus.textContent = "Supabase no está configurado.";
        return;
    }
    adminSaveBtn.disabled = true;
    adminSaveBtn.textContent = "Guardando...";
    try {
        const { error } = await supabaseClient
            .from("config")
            .upsert({ id: tipo, data: parsed, updated_at: new Date().toISOString() });
        if (error) throw error;
        setGlobalFor(tipo, parsed);
        adminSaveStatus.style.color = "";
        adminSaveStatus.textContent = "Guardado. Ya está visible para todos.";
        renderCourses();
        if (currentCourse) openCourseFullscreen(currentCourse);
    } catch (err) {
        console.error(err);
        adminSaveStatus.style.color = "#ff8a8a";
        adminSaveStatus.textContent = "Error al guardar: " + err.message;
    } finally {
        adminSaveBtn.disabled = false;
        adminSaveBtn.textContent = "Guardar cambios";
    }
});

async function cargarConfigsDesdeSupabase() {
    if (!supabaseListo()) return;
    try {
        const { data, error } = await supabaseClient.from("config").select("*");
        if (error) throw error;
        (data || []).forEach(row => {
            if (["cursos", "estudiantes", "profesores", "materias", "horarios"].includes(row.id) && row.data) {
                setGlobalFor(row.id, row.data);
            }
        });
        renderCourses();
    } catch (err) {
        console.warn("No se pudieron cargar los datos desde Supabase, se usan los archivos locales:", err);
    }
}
cargarConfigsDesdeSupabase();

/* ===== ESTUDIANTES ===== */

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
        studentModalPhoto.style.cursor = "zoom-in";
        studentModalPhoto.onclick = () => openImageViewer(s.foto);
        studentModalPhoto.style.display = "block";
        studentPhotoFallback.style.display = "none";
    } else {
        studentModalPhoto.style.display = "none";
        studentPhotoFallback.style.display = "flex";
    }
    studentModalName.textContent = s.nombre;
    if (s.cargo) {
        studentModalRole.style.display = "inline-flex";
        studentModalRoleText.textContent = s.cargo;
    } else {
        studentModalRole.style.display = "none";
    }
    studentModalBirth.textContent = formatFecha(s.fechaNacimiento);
    studentModalIngles.textContent = s.nivelIngles || "-";
    studentModalContrib.textContent = "...";

    // El modal se muestra siempre, pase lo que pase con Supabase después.
    studentModalOverlay.classList.add("active");
    lockScroll();

    if (supabaseListo()) {
        supabaseClient
            .from("archivos")
            .select("*", { count: "exact", head: true })
            .eq("subido_por_id", s.id)
            .then(({ count }) => {
                studentModalContrib.textContent = (count || 0) + ((count || 0) === 1 ? " archivo" : " archivos");
            })
            .catch(() => { studentModalContrib.textContent = "-"; });
    } else {
        studentModalContrib.textContent = "-";
    }
}

function closeStudentModal() {
    studentModalOverlay.classList.remove("active");
    unlockScroll();
}

studentModalClose.addEventListener("click", closeStudentModal);
studentModalOverlay.addEventListener("click", e => { if (e.target === studentModalOverlay) closeStudentModal(); });

/* =========================================================
   TELEFONO — click para copiar
   ========================================================= */

const phoneChip = document.getElementById("phoneChip");
const phoneChipText = document.getElementById("phoneChipText");

if (phoneChip) {
    const numeroOriginal = phoneChipText.textContent;

    phoneChip.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(numeroOriginal);
        } catch {
            // Si el navegador no permite el portapapeles (poco comun), no rompemos nada.
        }
        phoneChip.classList.add("copied");
        phoneChipText.textContent = "Copiado!";
        setTimeout(() => {
            phoneChip.classList.remove("copied");
            phoneChipText.textContent = numeroOriginal;
        }, 1500);
    });
}
const imageViewer = document.getElementById("imageViewer");
const imageViewerImg = document.getElementById("imageViewerImg");
const imageViewerClose = document.getElementById("imageViewerClose");

function openImageViewer(src){
    if(!src) return;

    imageViewerImg.src = src;

    imageViewer.classList.add("active");
    lockScroll();
}

function closeImageViewer(){
    imageViewer.classList.remove("active");
    unlockScroll();
}

imageViewerClose.addEventListener("click", closeImageViewer);

imageViewer.addEventListener("click", e=>{
    if(e.target===imageViewer)
        closeImageViewer();
});