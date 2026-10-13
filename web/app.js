document.addEventListener('DOMContentLoaded', () => {
    const data = window.PLATFORM_DATA;
    if (!data) return;

    // 1. Contador de Visitas Real y Persistente
    const visitCounterElem = document.getElementById('visit-counter-value');
    if (visitCounterElem) {
        fetch('/api/visit')
            .then(res => res.json())
            .then(resData => {
                if (resData && resData.visits) {
                    visitCounterElem.textContent = Number(resData.visits).toLocaleString('es-ES');
                }
            })
            .catch(() => {
                // Fallback si no hay red o modo estatico
                let localCount = parseInt(localStorage.getItem('visitas_locales') || '350', 10) + 1;
                localStorage.setItem('visitas_locales', localCount);
                visitCounterElem.textContent = localCount.toLocaleString('es-ES');
            });
    }

    // 2. Estado de Desbloqueo Estudiantil
    let isStudentUnlocked = localStorage.getItem('estudiante_desbloqueado') === 'true';

    function updateStudentBannerState() {
        const bannerContainer = document.getElementById('student-banner-container');
        if (!bannerContainer) return;

        if (isStudentUnlocked) {
            bannerContainer.innerHTML = `
                <div class="student-banner" style="border-color:var(--accent-emerald); background:rgba(16, 185, 129, 0.1);">
                    <div>
                        <span class="unlocked-tag">🎓 Modo Estudiante Activo</span>
                        <h4 style="margin:0.25rem 0; color:#fff;">¡Acceso Gratuito de Semestre Desbloqueado!</h4>
                        <p style="font-size:0.85rem; color:var(--text-muted); margin:0;">
                            Tienes acceso libre a todos los laboratorios y cuadernos de la Universidad del Cauca.
                        </p>
                    </div>
                    <div>
                        <button class="btn btn-secondary" style="font-size:0.8rem; padding:0.4rem 0.8rem;" onclick="bloquearModoEstudiante()">
                            Cerrar sesión de estudiante 🔒
                        </button>
                    </div>
                </div>
            `;
        } else {
            bannerContainer.innerHTML = `
                <div class="student-banner">
                    <div>
                        <span class="card-tag interactive" style="margin-bottom:0.25rem;">🎓 Estudiantes de la Universidad</span>
                        <h4 style="margin:0.25rem 0; color:#fff;">¿Eres estudiante del profesor este semestre?</h4>
                        <p style="font-size:0.85rem; color:var(--text-muted); margin:0;">
                            Ingresa el código que dio el profesor en clase para liberar todos los cursos gratis.
                        </p>
                    </div>
                    <div class="code-input-group">
                        <input type="text" id="student-code-input" class="code-input" placeholder="Ingresa la clave de clase..." />
                        <button class="btn btn-primary" onclick="canjearCodigoEstudiante()">Desbloquear 🔓</button>
                    </div>
                </div>
            `;
        }
    }

    window.canjearCodigoEstudiante = function() {
        const input = document.getElementById('student-code-input');
        if (!input) return;
        const code = input.value.trim().toUpperCase();
        
        if (data.codigosEstudiantilesValidos.includes(code)) {
            isStudentUnlocked = true;
            localStorage.setItem('estudiante_desbloqueado', 'true');
            alert(`🎉 ¡Código ${code} válido!\n\nBienvenido(a). Todos los cursos y laboratorios han sido desbloqueados para ti sin costo durante este periodo académico.`);
            updateStudentBannerState();
            renderCourses();
        } else {
            alert('❌ Código no válido o expirado para este periodo académico. Consulta con tu profesor en clase.');
        }
    };

    window.bloquearModoEstudiante = function() {
        isStudentUnlocked = false;
        localStorage.removeItem('estudiante_desbloqueado');
        updateStudentBannerState();
        renderCourses();
    };

    // 3. Renderizar Cursos
    function renderCourses() {
        const coursesGrid = document.getElementById('courses-grid');
        if (!coursesGrid) return;

        coursesGrid.innerHTML = data.cursos.map(c => {
            const isLab = c.id === 'transformadores' || c.esLaboratorio;
            const openBtnText = isLab ? 'Abrir Laboratorio 🚀' : 'Abrir Curso 🚀';
            const buyBtnText = isLab ? 'Adquirir Lab 🛒' : 'Comprar Curso 🛒';
            const detailsBtnText = isLab ? 'Ficha Técnica 🔬' : 'Temario 📋';
            const tagClass = isLab ? 'lab-tag' : (c.destacado ? 'interactive' : '');
            return `
            <div class="card ${isLab ? 'card-lab-featured' : ''}">
                <div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
                        <span class="card-tag ${tagClass}">${c.categoria}</span>
                        ${isStudentUnlocked ? '<span class="unlocked-tag">🎓 Libre Estudiante</span>' : `<span style="font-size:0.75rem; color:var(--accent-blue); font-weight:600;">${c.tipo}</span>`}
                    </div>
                    <h3>${c.titulo}</h3>
                    <p>${c.descripcion}</p>
                    <div style="background:rgba(255,255,255,0.03); border-radius:8px; padding:0.75rem; margin-bottom:1rem; font-size:0.85rem;">
                        <strong style="color:var(--text-main);">${isLab ? 'Equipamiento:' : 'Estructura:'}</strong> <span style="color:var(--accent-indigo);">${c.modulos}</span>
                        <br>
                        <strong style="color:var(--text-main);">Nivel:</strong> ${c.nivel}
                    </div>
                </div>
                <div>
                    <div class="card-meta" style="flex-direction:column; align-items:flex-start; gap:0.35rem;">
                        <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
                            <div>
                                ${!isStudentUnlocked && c.valorReal ? `<span style="text-decoration:line-through; font-size:0.75rem; color:var(--text-muted); margin-right:0.4rem;">${c.valorReal}</span>` : ''}
                                <span style="font-weight:700; color:var(--text-main); font-size:0.95rem;">${isStudentUnlocked ? 'Gratis (Semestre Académico)' : c.precioEstimado}</span>
                            </div>
                            ${!isStudentUnlocked && c.descuentoTag ? `<span class="badge" style="font-size:0.65rem; padding:0.2rem 0.5rem; background:rgba(245,158,11,0.15); color:var(--accent-amber); border-color:rgba(245,158,11,0.3);">${c.descuentoTag}</span>` : '<span style="color:var(--accent-emerald);">● Activo</span>'}
                        </div>
                    </div>
                    <div class="card-actions">
                        ${c.demoPath ? `<a href="${c.demoPath}" target="_blank" class="btn btn-primary">${openBtnText}</a>` : ''}
                        ${!isStudentUnlocked && c.enlaceCompra ? `<button class="btn btn-secondary" onclick="openPaymentModal('${c.id}')" style="border-color:var(--accent-amber); color:var(--accent-amber);">${buyBtnText}</button>` : ''}
                        <button class="btn btn-secondary" onclick="openCourseDetails('${c.id}')">${detailsBtnText}</button>
                    </div>
                </div>
            </div>
            `;
        }).join('');
    }

    updateStudentBannerState();
    renderCourses();

    // 4. Renderizar Canales Oficiales en Spotify (Visual Nativo con Portadas Oficiales)
    const spotifyGrid = document.getElementById('spotify-grid');
    if (spotifyGrid) {
        spotifyGrid.innerHTML = data.canalesSpotify.map(sp => `
            <div class="spotify-card">
                <div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.85rem;">
                        <span style="font-size:0.75rem; background:rgba(29, 185, 84, 0.2); color:#1DB954; font-weight:700; padding:0.25rem 0.65rem; border-radius:9999px;">
                            🟢 ${sp.curso}
                        </span>
                        <span style="font-size:0.75rem; color:var(--text-muted);">${sp.facultad}</span>
                    </div>

                    <div style="display:flex; gap:1.25rem; align-items:flex-start; margin-bottom:1rem;">
                        <img src="${sp.portada}" alt="${sp.titulo}" onerror="this.src='https://open.spotifycdn.com/cdn/images/favicon.0f31d2ea.ico'" style="width:105px; height:105px; border-radius:12px; object-fit:cover; box-shadow:0 8px 20px rgba(0,0,0,0.45); flex-shrink:0; border:1px solid rgba(255,255,255,0.1);" />
                        <div style="flex-grow:1;">
                            <h3 style="font-size:1.25rem; font-weight:700; margin-bottom:0.35rem; line-height:1.25;">${sp.titulo}</h3>
                            <div style="font-size:0.85rem; color:#1DB954; font-weight:600; margin-bottom:0.35rem;">
                                🎙️ Creador: ${sp.autor}
                            </div>
                            <div style="font-size:0.75rem; color:var(--text-muted);">
                                📍 Universidad del Cauca
                            </div>
                        </div>
                    </div>

                    <p style="font-size:0.88rem; color:var(--text-muted); margin-bottom:1.25rem; line-height:1.5;">${sp.descripcion}</p>
                    
                    <div id="embed-container-${sp.id}" style="display:none; margin-bottom:1rem; border-radius:12px; overflow:hidden;"></div>
                </div>

                <div style="display:flex; gap:0.6rem; flex-wrap:wrap;">
                    <a href="${sp.url}" target="_blank" class="btn btn-spotify" style="flex:1; justify-content:center; text-decoration:none;">
                        Escuchar en Spotify 🎧
                    </a>
                    <button class="btn btn-secondary" style="font-size:0.8rem; padding:0.5rem 0.85rem;" onclick="toggleSpotifyPlayer('${sp.id}', '${sp.spotifyId}', this)">
                        Reproductor Web ⚡
                    </button>
                </div>
            </div>
        `).join('');
    }

    window.toggleSpotifyPlayer = function(elemId, spotifyId, btn) {
        const container = document.getElementById('embed-container-' + elemId);
        if (!container) return;

        if (container.style.display === 'block') {
            container.style.display = 'none';
            container.innerHTML = '';
            btn.textContent = 'Reproductor Web ⚡';
        } else {
            container.style.display = 'block';
            container.innerHTML = `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/show/${spotifyId}?utm_source=generator&theme=0" width="100%" height="152" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`;
            btn.textContent = 'Ocultar Reproductor ✕';
        }
    };

    // 5. Renderizar Cómics
    const comicsGrid = document.getElementById('comics-grid');
    window.renderComics = function(category = 'all') {
        if (!comicsGrid) return;
        const cat = (category || 'all').toLowerCase().trim();
        const filtered = cat === 'all' 
            ? data.comics 
            : data.comics.filter(c => {
                const cCat = (c.categoria || '').toLowerCase();
                const cTit = (c.titulo || '').toLowerCase();
                const cCon = (c.conceptoFisico || '').toLowerCase();
                if (cat === 'moderna' || cat === 'cuantico' || cat === 'cuantica') {
                    return cCat.includes('moderna') || cCat.includes('cuánt') || cTit.includes('cuánt') || cCon.includes('cuánt');
                }
                return cCat.includes(cat) || cTit.includes(cat) || cCon.includes(cat);
            });
        
        if (filtered.length === 0) {
            comicsGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align:center; padding:3rem; background:rgba(255,255,255,0.02); border-radius:16px; border:1px solid var(--border-color);">
                    <p style="color:var(--text-muted); font-size:1.05rem; margin-bottom:1rem;">No se encontraron cómics en esta categoría.</p>
                    <button class="btn btn-secondary" onclick="renderComics('all')">Ver todos los cómics</button>
                </div>
            `;
            return;
        }

        comicsGrid.innerHTML = filtered.map(c => `
            <div class="card">
                <div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
                        <span class="card-tag" style="background:rgba(245, 158, 11, 0.15); color:var(--accent-amber); border-color:rgba(245, 158, 11, 0.3);">🎨 ${c.categoria}</span>
                        <span style="font-size:0.75rem; color:var(--text-muted);">PDF Libre</span>
                    </div>
                    <h3>${c.titulo}</h3>
                    <p>${c.descripcion}</p>
                    <div style="margin-bottom:1rem; font-size:0.85rem; background:rgba(255,255,255,0.02); padding:0.75rem; border-radius:8px; border:1px solid var(--border-color);">
                        <div style="color:var(--accent-amber); font-weight:600; margin-bottom:0.25rem;">
                            🔬 Concepto: ${c.conceptoFisico}
                        </div>
                        <div style="color:var(--text-muted); font-size:0.8rem;">
                            🎓 Créditos: ${c.creditos}
                        </div>
                    </div>
                </div>
                <div>
                    <div class="card-actions">
                        <a href="${c.archivo}" target="_blank" class="btn btn-primary" style="flex:1; justify-content:center;">Leer Cómic (PDF) 📖</a>
                        <a href="${c.archivo}" download class="btn btn-secondary" style="font-size:0.85rem;">Descargar ⬇️</a>
                    </div>
                </div>
            </div>
        `).join('');
    };
    renderComics('all');

    // Comic Filter Buttons
    document.querySelectorAll('.comic-filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.comic-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderComics(btn.dataset.filter);
        });
    });

    // 6. Renderizar Episodios Locales de Podcasts
    const podcastsGrid = document.getElementById('podcasts-grid');
    if (podcastsGrid) {
        podcastsGrid.innerHTML = data.podcasts.map((p, idx) => `
            <div class="card">
                <div>
                    <span class="card-tag">${p.categoria}</span>
                    <h3>${p.titulo}</h3>
                    <p>${p.descripcion}</p>
                    <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:1rem;">
                        🎙️ Producción: ${p.creditos}
                    </div>
                </div>
                <div>
                    <div class="card-actions">
                        <button class="btn btn-primary" onclick="playPodcast('${p.archivo}', '${p.titulo.replace(/'/g, "\\'")}', '${p.categoria}')">
                            Reproducir Episodio ▶️
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Audio Player setup
    window.playPodcast = function(url, title, category) {
        const playerCard = document.getElementById('podcast-player-card');
        const audioElement = document.getElementById('main-audio-player');
        const playerTitle = document.getElementById('current-podcast-title');
        const playerCat = document.getElementById('current-podcast-cat');

        if (playerCard && audioElement) {
            playerCard.style.display = 'block';
            playerTitle.textContent = title;
            playerCat.textContent = "Categoría: " + category;
            audioElement.src = url;
            audioElement.play().catch(e => console.log('Autoplay blocked: ', e));
            playerCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    // Course Modal
    window.openCourseDetails = function(courseId) {
        const course = data.cursos.find(c => c.id === courseId);
        if (!course) return;

        const isLab = course.id === 'transformadores' || course.esLaboratorio;
        const entityWord = isLab ? 'Laboratorio' : 'Curso';
        const modal = document.getElementById('course-modal');
        const modalBody = document.getElementById('modal-course-body');
        modalBody.innerHTML = `
            <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.5rem;">
                <span class="badge">${isLab ? '🔬 Laboratorio Virtual Autónomo' : '📚 Cuaderno Computacional'}</span>
            </div>
            <h2 style="font-size:1.85rem; margin-bottom:0.5rem; color:var(--accent-blue);">${course.titulo}</h2>
            <p style="color:var(--text-muted); margin-bottom:1.5rem;">${course.descripcion}</p>
            <div style="background:rgba(255,255,255,0.03); border-radius:12px; padding:1.25rem; margin-bottom:1.5rem; border:1px solid var(--border-color);">
                <h4 style="margin-bottom:0.75rem; color:var(--text-main);">${isLab ? 'Prácticas y Ensayos del Laboratorio:' : 'Temario y Contenidos de la Suite:'}</h4>
                <ul style="display:grid; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:0.6rem; list-style:none;">
                    ${course.temas.map(t => `<li style="font-size:0.9rem; color:var(--text-muted);"><span style="color:var(--accent-emerald);">✓</span> ${t}</li>`).join('')}
                </ul>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
                <div>
                    <span style="font-size:0.85rem; color:var(--text-muted);">Modalidad:</span>
                    <strong style="color:var(--text-main); font-size:1rem; display:block;">${isLab ? 'Laboratorio Autónomo de Alta Precisión' : '100% Interactivo con simulación matemática'}</strong>
                </div>
                ${course.demoPath ? `<a href="${course.demoPath}" target="_blank" class="btn btn-primary">Abrir ${entityWord} 🚀</a>` : ''}
            </div>
        `;
        modal.classList.add('active');
    };

    window.closeModal = function() {
        document.getElementById('course-modal').classList.remove('active');
    };

    // 5. Renderizar Artículos de Squash & Física del Deporte
    function renderSquashArticles() {
        const grid = document.getElementById('articulos-grid');
        if (!grid || !data.articulosSquash) return;

        grid.innerHTML = data.articulosSquash.map(art => `
            <div class="card">
                <div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
                        <span class="card-tag interactive">${art.tag}</span>
                        <span style="font-size:0.75rem; color:var(--text-muted);">${art.tiempoLectura}</span>
                    </div>
                    <h3 style="font-size:1.25rem; line-height:1.35; margin-bottom:0.4rem;">${art.icono} ${art.titulo}</h3>
                    <div style="font-size:0.85rem; color:var(--accent-blue); font-weight:600; margin-bottom:0.85rem;">
                        ${art.subtitulo}
                    </div>
                    <p style="font-size:0.9rem; color:var(--text-muted); line-height:1.5; margin-bottom:1.25rem;">
                        ${art.resumen}
                    </p>
                </div>
                <div>
                    <div class="card-actions" style="margin-top:auto;">
                        <button class="btn btn-primary" onclick="openArticle('${art.id}')" style="flex:1;">
                            Leer Artículo 📖
                        </button>
                        <a href="${art.demoPath}" target="_blank" class="btn btn-secondary" style="font-size:0.85rem;">
                            Probar Simulador 🎾
                        </a>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderSquashArticles();

    // Modal de Artículos de Squash
    window.openArticle = function(id) {
        const art = (data.articulosSquash || []).find(a => a.id === id);
        if (!art) return;

        const modal = document.getElementById('article-modal');
        const modalBody = document.getElementById('modal-article-body');
        modalBody.innerHTML = `
            <div style="display:flex; gap:0.5rem; align-items:center; margin-bottom:0.5rem;">
                <span class="badge" style="background:rgba(16, 185, 129, 0.1); border-color:rgba(16, 185, 129, 0.3); color:var(--accent-emerald);">${art.tag}</span>
                <span style="font-size:0.8rem; color:var(--text-muted);">⏱️ ${art.tiempoLectura}</span>
            </div>
            <h2 style="font-size:1.85rem; line-height:1.3; color:#fff; margin-bottom:0.5rem;">${art.icono} ${art.titulo}</h2>
            <p style="color:var(--accent-blue); font-weight:600; margin-bottom:1.5rem;">${art.subtitulo}</p>
            <div style="line-height:1.75; color:var(--text-main); font-size:1rem; border-top:1px solid rgba(255,255,255,0.1); padding-top:1.25rem; margin-bottom:2rem;">
                ${art.contenido}
            </div>
            <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-color); border-radius:12px; padding:1.25rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
                <div>
                    <strong style="color:#fff; display:block;">¿Quieres experimentar la física interactiva?</strong>
                    <span style="font-size:0.85rem; color:var(--text-muted);">Prueba el modelo de cadena cinética y la simulación de impacto en tiempo real.</span>
                </div>
                <a href="${art.demoPath}" target="_blank" class="btn btn-primary">Abrir Simulador de Squash 🎾</a>
            </div>
        `;
        modal.classList.add('active');
    };

    window.closeArticleModal = function() {
        document.getElementById('article-modal').classList.remove('active');
    };

    // Modal de Checkout / Pasarela de Pago
    window.openPaymentModal = function(courseId) {
        const course = data.cursos.find(c => c.id === courseId);
        if (!course) return;

        const isLab = course.id === 'transformadores' || course.esLaboratorio;
        const entityWord = isLab ? 'Laboratorio' : 'Curso';
        const modal = document.getElementById('payment-modal');
        const modalBody = document.getElementById('modal-payment-body');
        
        modalBody.innerHTML = `
            <div style="text-align:center; margin-bottom:1.5rem;">
                <span class="badge" style="background:rgba(245,158,11,0.15); color:var(--accent-amber); border-color:rgba(245,158,11,0.3); margin-bottom:0.5rem;">
                    🛒 Checkout Seguro · PhysicsAILab
                </span>
                <h2 style="font-size:1.75rem; color:#fff; margin-bottom:0.35rem;">${course.titulo}</h2>
                <div style="font-size:0.9rem; color:var(--text-muted);">${course.tipo} · ${course.modulos}</div>
            </div>

            <div style="background:linear-gradient(135deg, rgba(30, 41, 59, 0.6), rgba(15, 23, 42, 0.8)); border:1px solid var(--border-color); border-radius:16px; padding:1.5rem; margin-bottom:1.5rem; text-align:center;">
                <div style="font-size:0.85rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; margin-bottom:0.25rem;">Precio de Lanzamiento</div>
                <div style="font-size:2.5rem; font-weight:800; color:#fff; margin-bottom:0.25rem;">
                    ${course.precioEstimado.split(' ')[0]} <span style="font-size:1.15rem; color:var(--accent-blue); font-weight:600;">USD</span>
                </div>
                <div style="font-size:0.95rem; color:var(--accent-emerald); font-weight:600; margin-bottom:0.75rem;">
                    ${course.precioEstimado.includes('COP') ? course.precioEstimado.substring(course.precioEstimado.indexOf('(~')) : 'Aproximadamente $115.000 - $195.000 COP'}
                </div>
                <div style="display:flex; justify-content:center; gap:1rem; font-size:0.8rem; color:var(--text-muted);">
                    <span>🔒 Acceso Permanente</span>
                    <span>⚡ Sin mensualidades</span>
                    <span>🎓 Soporte de Autor</span>
                </div>
            </div>

            <div style="display:flex; flex-direction:column; gap:0.85rem;">
                <a href="https://hotmart.com" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="justify-content:center; padding:0.85rem; font-size:1rem; background:linear-gradient(135deg, #f97316, #ea580c); border:none; box-shadow:0 8px 25px rgba(234,88,12,0.35);">
                    Adquirir en Hotmart (Tarjeta / PayPal / PSE) 💳
                </a>
                
                <a href="https://wa.me/?text=${encodeURIComponent('Hola Mg. Manuel Obando, me interesa adquirir: ' + course.titulo + ' en PhysicsAILab.com. ¿Cuáles son los datos para transferencia / Nequi?')}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary" style="justify-content:center; padding:0.75rem; font-size:0.9rem; border-color:rgba(16,185,129,0.4); color:#34d399;">
                    💬 Pago Directo (Transferencia / Nequi / Bancolombia)
                </a>

                <a href="mailto:manuelobando@unicauca.edu.co?subject=${encodeURIComponent('Interés en: ' + course.titulo)}&body=${encodeURIComponent('Cordial saludo profesor Manuel,\n\nEstoy interesado en adquirir ' + course.titulo + ' en PhysicsAILab.com.\n\nPor favor indíqueme el método de pago.')}" class="btn btn-secondary" style="justify-content:center; padding:0.75rem; font-size:0.9rem;">
                    ✉️ Consultar al Docente por Correo
                </a>
            </div>

            <p style="font-size:0.75rem; text-align:center; color:var(--text-muted); margin-top:1.25rem;">
                Docente de autoría: Mg. Manuel Alejandro Obando (Universidad del Cauca) · Cuenta oficial Hotmart: @manuel_obando_963654
            </p>
        `;

        modal.classList.add('active');
    };

    window.openBookPaymentModal = function(bookId) {
        const book = (data.librosHotmart || []).find(b => b.id === bookId);
        if (!book) return;

        const modal = document.getElementById('payment-modal');
        const modalBody = document.getElementById('modal-payment-body');
        
        modalBody.innerHTML = `
            <div style="text-align:center; margin-bottom:1.5rem;">
                <span class="badge" style="background:rgba(234,88,12,0.15); color:#f97316; border-color:rgba(234,88,12,0.3); margin-bottom:0.5rem;">
                    📚 Librería Digital Oficial Hotmart
                </span>
                <h2 style="font-size:1.75rem; color:#fff; margin-bottom:0.35rem;">${book.titulo}</h2>
                <div style="font-size:0.9rem; color:var(--text-muted);">Autor: ${book.autor}</div>
            </div>

            <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-color); border-radius:16px; padding:1.25rem; margin-bottom:1.5rem;">
                <p style="font-size:0.95rem; color:var(--text-main); margin-bottom:0.75rem; line-height:1.6;">${book.descripcion}</p>
                <div style="font-size:0.85rem; color:var(--accent-blue);">
                    Formatos: PDF de alta resolución + Códigos computacionales + ePub
                </div>
            </div>

            <div style="display:flex; flex-direction:column; gap:0.85rem;">
                <a href="https://hotmart.com" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="justify-content:center; padding:0.85rem; font-size:1rem; background:linear-gradient(135deg, #f97316, #ea580c); border:none;">
                    Adquirir en Hotmart Oficial 🛒
                </a>

                <a href="mailto:manuelobando@unicauca.edu.co?subject=${encodeURIComponent('Consulta Libro: ' + book.titulo)}" class="btn btn-secondary" style="justify-content:center; padding:0.75rem; font-size:0.9rem;">
                    ✉️ Contactar al Autor por Correo
                </a>
            </div>

            <p style="font-size:0.75rem; text-align:center; color:var(--text-muted); margin-top:1.25rem;">
                Cuenta oficial en Hotmart: @manuel_obando_963654 · Garantía de satisfacción de 7 días.
            </p>
        `;

        modal.classList.add('active');
    };

    window.closePaymentModal = function() {
        document.getElementById('payment-modal').classList.remove('active');
    };
});
