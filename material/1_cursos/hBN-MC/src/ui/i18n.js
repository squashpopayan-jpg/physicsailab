/**
 * [REGISTRO-DOC-F11]
 * Módulo de internacionalización (i18n) de hBN-MC.
 *
 * Mantiene el diccionario bilingüe español/inglés y sincroniza textos,
 * etiquetas, opciones, estados y elementos del visor 3D con el idioma activo.
 * Esta documentación no modifica la lógica ejecutable del módulo.
 */
// i18n.js — idioma y traducciones
'use strict';
const LANG = {
  es: {
    status_idle:'Listo · presiona INICIAR', status_run:'Corriendo…', status_pause:'Pausado', status_done:'Finalizado',
    btn_lang:'EN', btn_3d:'🔮 Vista 3D',
    tab_ctrl:'CTRL', tab_stat:'STAT', tab_graf:'GRAF', tab_inv:'INV', tab_info:'INFO',
    lbl_orient:'Orientación de la red', lbl_start:'Subred inicial visible', start_b:'Boro (como ahora)', start_n:'Nitrógeno', lbl_temp:'Temperatura', opt_anneal:'Recocido (Ti → Tf)', opt_iso:'Isotérmico (Ti = Tf)', opt_3phase:'3 Fases (explorar/enfriar/equilibrar)', opt_cycle:'Ciclo Ti → Tf → Ti (histéresis)',
    lbl_type:'Tipo', lbl_term:'Terminación', lbl_hpass:'Pasivación H bordes', opt_yes:'Sí', opt_no:'No',
    lbl_robust:'Reservorio de hidrógeno del MC', lbl_nruns:'Réplicas del lote', lbl_overlay:'Visualización de poros', lbl_poregeom:'Geometría de poros', lbl_contour:'Contorno del poro',
    lbl_edit:'Edición manual', btn_edit:'✏ EDITAR', btn_edit_exit:'✏ SALIR EDICIÓN', btn_remove:'⚡ QUITAR',
    lbl_simmc:'Simulación MC', lbl_speed:'Velocidad', opt_fast:'Rápida', opt_normal:'Normal', opt_slow:'Lenta',
    btn_start:'▶  INICIAR', btn_pause:'⏸  PAUSAR', btn_reset:'↺  RESET', btn_dft:'🔬 Protocolo de referencia',
    rec_idle:'⏺ GRABAR SIMULACIÓN', rec_armed:'⏺ GRABACIÓN ACTIVADA', rec_stop:'⏹ DETENER GRABACIÓN',
    lbl_accepted:'Aceptados', lbl_rejected:'Rechazados', lbl_bonds:'Ligación',
    lbl_evsstep:'Energía vs pasos MC', lbl_tvsramp:'Temperatura (protocolo)', lbl_accept_rate:'Tasa aceptación',
    lbl_exp_motiv:'Motivación experimental', lbl_sim_detail:'Detalles de la simulación',
    dlg_done:'✓ Simulación completada', dlg_question:'¿Exportar resultados?', dlg_summary:'Resumen de resultados...', btn_report:'📋 Informe completo — resumen visual (PNG)', btn_img_init:'🖼 Imagen — configuración inicial', btn_img_final:'🖼 Imagen — configuración final', btn_charts:'📊 Gráficas — E, T, accept%, cNB', btn_video:'🎥 Video — transición + gráficas (última grabación)', btn_csv:'📄 Datos CSV — serie temporal completa', btn_poscar:'📐 POSCAR — para VASP / VESTA / ASE / Q-ESPRESSO', btn_xv:'⚛ XV — estructura para SIESTA (DFT)', btn_zip:'📦 Exportar TODO en ZIP (imagen + CSV + sesión + POSCAR + video)', btn_close:'Cerrar',
    btn_3d_top:'⬜ Top', btn_3d_front:'⬛ Frente', btn_3d_side:'◼ Lateral', btn_3d_iso:'◈ Iso', btn_3d_persp:'◉ Persp', btn_3d_reset:'↺ Reset', btn_3d_style:'⚪ Bolas+Palos', btn_3d_close:'✕ Cerrar',
    view3d_title:'🔮 Estructura 3D', view3d_atoms:'átomos', view3d_pore:'poro', view3d_hide_volatile:'ocultar H / BH₃ / NH₃', view3d_atoms_legend:'ÁTOMOS', view3d_instr:'🖱 Arrastrar: rotar · Rueda: zoom · Shift+drag: mover · slider: tamaño atómico',
    pore_auto:'Auto', pore_triangle:'Triángulo', pore_parallelogram:'Paralelogramo', pore_hexagon:'Hexágono', pore_irregular:'Irregular', pore_type:'tipo de poro',
    orient_ac:'Armchair horizontal (borde sup/inf = AC)', orient_zz:'Zigzag horizontal (borde sup/inf = ZZ)', orient_hint_ac:'AC: borde horizontal alterna N-B · ZZ: borde horizontal expone un solo tipo (N o B)', orient_hint_zz:'ZZ: borde horizontal muestra solo un tipo de átomo (N o B). Activa con opc 47/48 para nanoribbon pasivada ZZ.',
    tmode:'Modo T', ti_label:'T inicial / T exp (K)', tf_label:'T final (K) · en ciclo: T máxima',
    section_lattice:'Red h-BN (Nx × Ny)', section_pore:'Nanoporo', section_active_nb:'Ligaciones N–B activas', section_reference:'Referencia',
    lbl_nx:'Nx (ancho)', lbl_ny:'Ny (alto)', lbl_atoms:'Átomos', lbl_poresize:'Tamaño poro (anillos)', lbl_ribbonw:'Ancho fita (filas/cols)', lbl_pos:'Posición (% red)', lbl_wx:'Wx (átomos)', lbl_wy:'Wy (átomos)', lbl_vacfrac:'Vacantes / C%', lbl_steps:'Pasos', lbl_muh_full:'Δμ<sub>H</sub> del MC (eV)', lbl_epsxc_full:'ε<sub>CH</sub> / ε<sub>XC</sub> (eV) — C–H provisional',
    fita_term_arm:'Armchair (mixta)', fita_term_zn:'Zigzag-N', fita_term_zb:'Zigzag-B',
    overlay_off:'Oculta', overlay_edge:'Bordes resaltados', overlay_hull:'Contorno del poro',
    speed_turbo:'Turbo', speed_fast:'Rápida', speed_normal:'Normal (animada)', speed_slow:'Lenta (animada)',
    edit_hint:'Modo edición activo · Click sobre un átomo para modificarlo',
    rec_note:'El video combina la transición estructural y las gráficas E, T, aceptación y cNB. Si activas grabación, inicia con <b>INICIAR</b> y se descarga al finalizar.',
    dft_note:'Preset de referencia: red 24×24 (28×28 en fitas), 3 fases 5000→900 K, 400k pasos, parámetros de la tesis.',
    tip_remove:'Quitar átomos aleatoriamente sin reiniciar la red', tip_dft:'Aplicar el protocolo de referencia documentado',
    group_fortran:'— Fortran original —', group_specific:'— Geometrías específicas —', group_seg:'— Segregación —', group_ribbons:'— Fitas (nanoribbons) —', group_ribbon:'— Fita rectangular explícita —', group_nrpass:'— Nanoribbons pasivadas —',
    pore_1:'1 · Red perfecta', pore_2:'2 · Real + vacancias', pore_3:'3 · Aleatoria', pore_6:'6 · Furo Paralelogramo', pore_7:'7 · Furo Triangular', pore_8:'8 · Furo Aleatorio', pore_10:'10 · Triángulo — borde N', pore_11:'11 · Triángulo — borde B', pore_12:'12 · Paralelogramo — orientación A', pore_13:'13 · Paralelogramo — orientación B', pore_14:'14 · Hexágono (NH = BH)', pore_20:'20 · h-BNC (carbono en h-BN)', pore_30:'30 · Fita C horizontal (en h-BN)', pore_31:'31 · Fita C vertical (en h-BN)', pore_32:'32 · C|hBN — interfaz vertical (fp=% de C)', pore_33:'33 · C|hBN|C — franja h-BN en C horizontal', pore_34:'34 · C|hBN|C — 3 zonas vertical (33/34/33%)', pore_40:'40 · Fita C pura (Wx × Wy, sin h-BN)', pore_41:'41 · Fita h-BN pura (Wx × Wy, sin C)', pore_42:'42 · C|hBN|C — 3 zonas explícitas (fp=% C izq.)', pore_43:'43 · Red grafeno pura (toda C)', pore_44:'44 · Fita h-BN pura aislada (sin C)', pore_45:'45 · 2 fitas C adyacentes (sin separación)', pore_46:'46 · 3 fitas C adyacentes (bloque C)', pore_47:'47 · Nanoribbon ZZ-N (borde zigzag-N + H)', pore_48:'48 · Nanoribbon ZZ-B (borde zigzag-B + H)', pore_49:'49 · Nanoribbon AC (borde armchair + H)',
    atom_menu_vac:'□ Vacancia', atom_menu_n:'● N', atom_menu_b:'● B', atom_menu_c:'● C', atom_menu_cancel:'Cancelar', atom_menu_change_to:'cambiar a:',
    info_source:'<b style="color:#1e293b">Fuente: Pham et al., Nano Letters 2016</b><br>Imágenes HRTEM de nanoporos en h-BN monocapa bajo irradiación electrónica a distintas temperaturas:<br><br><span style="color:#2563eb">■</span> <b>500 °C:</b> poros triangulares con bordes N en zigzag (metaestables)<br><span style="color:#16a34a">■</span> <b>900 °C:</b> poros hexagonales y de paralelogramo (más estables)<br><span style="color:#f59e0b">■</span> <b>~700 °C:</b> temperatura de transición entre geometrías<br><br>La transición triangular → hexagonal ocurre porque los poros hexagonales tienen menor energía de formación por encima de un tamaño crítico. Los triangulares quedan "congelados" a baja temperatura (tesis Fig. 1.4, p. 4).',
    info_detail:'<b style="color:#1e293b">Modelo de enlaces (bond-counting)</b><br>E<sub>T</sub> = Σ ε<sub>αβ</sub>·n<sub>αβ</sub> sobre primeros vecinos. Los ε son coeficientes de ajuste en la escala de energía total de SIESTA, no energías de enlace físicas.<br><br><b>Parámetros por defecto</b>: tesis de M. A. Obando (FIMAT-UFOP, 2019), dir. Prof. R. J. C. Batista. ε<sub>NN</sub>, ε<sub>NB</sub>, ε<sub>BB</sub>, ε<sub>CC</sub>, ε<sub>CN</sub>, ε<sub>CB</sub>: Tabla 5.8 (mínimos cuadrados sobre las 20 estructuras de Mazzoni 2006). ε<sub>XN</sub>, ε<sub>XB</sub>: Tabla 5.7 (poros triangulares). ε<sub>XX</sub> = E(H<sub>2</sub>)/2. ε<sub>CH</sub> = −70.41 eV es <b>provisional</b> (no DFT). Tabla completa y procedencia en la pestaña INV.<br><br><b style="color:#1e293b">Metropolis</b>: P = min(1, e<sup>−ΔE/k<sub>B</sub>T</sup>), k<sub>B</sub> = 8.6173×10<sup>−5</sup> eV/K, d = 1.44 Å. Los movimientos elementales cuestan decenas de eV; las temperaturas de simulación (hasta 20 000 K) son un parámetro de control, no temperaturas físicas.<br><br><b style="color:#1e293b">Intercambio</b>: poros (opc 1–14) solo vecinos; BNC (opc 20, 30–46) 70 % local + 30 % global.<br><br><b style="color:#1e293b">Segregación BNC</b>: ΔE<sub>mix</sub> = (ε<sub>CN</sub>+ε<sub>CB</sub>) − (ε<sub>CC</sub>+ε<sub>NB</sub>) = +0.45 eV por par de enlaces mixtos → inmiscible. ΔE/k<sub>B</sub> ≈ 5 200 K es una escala de energía, no una temperatura crítica calculada.',
    info_ref:'Mg. M.A. Obando, <i>Efeito da temperatura na estabilidade de nanoporos em estruturas 2D</i>, FIMAT-UFOP, 2019<br>Orientador: Prof. R.J.C. Batista (UFOP)<br>Dpto. de Física, Universidad del Cauca, Colombia<br><br>Pham et al., <i>Nano Letters</i> 16, 7142 (2016) — HRTEM<br>Mazzoni et al., <i>PRB</i> 73, 073108 (2006) — energías<br>Martins &amp; Chacham, <i>ACS Nano</i> 5, 385 (2010) — BNC'
  },
  en: {
    status_idle:'Ready · press START', status_run:'Running…', status_pause:'Paused', status_done:'Done',
    btn_lang:'ES', btn_3d:'🔮 3D View',
    tab_ctrl:'CTRL', tab_stat:'STAT', tab_graf:'GRAPH', tab_inv:'RES', tab_info:'INFO',
    lbl_orient:'Lattice orientation', lbl_start:'Visible starting sublattice', start_b:'Boron (current)', start_n:'Nitrogen', lbl_temp:'Temperature', opt_anneal:'Anneal (Ti → Tf)', opt_iso:'Isothermal (Ti = Tf)', opt_3phase:'3 Phases (explore/cool/equilibrate)', opt_cycle:'Cycle Ti → Tf → Ti (hysteresis)',
    lbl_type:'Type', lbl_term:'Termination', lbl_hpass:'H edge passivation', opt_yes:'Yes', opt_no:'No',
    lbl_robust:'MC hydrogen reservoir', lbl_nruns:'Batch replicas', lbl_overlay:'Pore visualization', lbl_poregeom:'Pore geometry', lbl_contour:'Pore contour',
    lbl_edit:'Manual editing', btn_edit:'✏ EDIT', btn_edit_exit:'✏ EXIT EDIT', btn_remove:'⚡ REMOVE',
    lbl_simmc:'MC Simulation', lbl_speed:'Speed', opt_fast:'Fast', opt_normal:'Normal', opt_slow:'Slow',
    btn_start:'▶  START', btn_pause:'⏸  PAUSE', btn_reset:'↺  RESET', btn_dft:'🔬 Reference protocol',
    rec_idle:'⏺ RECORD SIMULATION', rec_armed:'⏺ RECORDING ARMED', rec_stop:'⏹ STOP RECORDING',
    lbl_accepted:'Accepted', lbl_rejected:'Rejected', lbl_bonds:'Bond type',
    lbl_evsstep:'Energy vs MC steps', lbl_tvsramp:'Temperature protocol', lbl_accept_rate:'Acceptance rate',
    lbl_exp_motiv:'Experimental motivation', lbl_sim_detail:'Simulation details',
    dlg_done:'✓ Simulation completed', dlg_question:'Export results?', dlg_summary:'Results summary...', btn_report:'📋 Full report — visual summary (PNG)', btn_img_init:'🖼 Image — initial configuration', btn_img_final:'🖼 Image — final configuration', btn_charts:'📊 Charts — E, T, accept%, cNB', btn_video:'🎥 Video — transition + charts (latest recording)', btn_csv:'📄 CSV data — full time series', btn_poscar:'📐 POSCAR — for VASP / VESTA / ASE / Q-ESPRESSO', btn_xv:'⚛ XV — structure for SIESTA (DFT)', btn_zip:'📦 Export ALL as ZIP (image + CSV + session + POSCAR + video)', btn_close:'Close',
    btn_3d_top:'⬜ Top', btn_3d_front:'⬛ Front', btn_3d_side:'◼ Side', btn_3d_iso:'◈ Iso', btn_3d_persp:'◉ Persp', btn_3d_reset:'↺ Reset', btn_3d_style:'⚪ Balls+Sticks', btn_3d_close:'✕ Close',
    view3d_title:'🔮 3D Structure', view3d_atoms:'atoms', view3d_pore:'pore', view3d_hide_volatile:'hide H / BH₃ / NH₃', view3d_atoms_legend:'ATOMS', view3d_instr:'🖱 Drag: rotate · Wheel: zoom · Shift+drag: pan · slider: atom size',
    pore_auto:'Auto', pore_triangle:'Triangle', pore_parallelogram:'Parallelogram', pore_hexagon:'Hexagon', pore_irregular:'Irregular', pore_type:'pore type',
    orient_ac:'Horizontal armchair (top/bottom edge = AC)', orient_zz:'Horizontal zigzag (top/bottom edge = ZZ)', orient_hint_ac:'AC: horizontal edge alternates N-B · ZZ: horizontal edge exposes a single atom type (N or B)', orient_hint_zz:'ZZ: the horizontal edge shows only one atom type (N or B). Use with option 47/48 for passivated ZZ nanoribbons.',
    tmode:'T mode', ti_label:'Initial T / explore T (K)', tf_label:'Final T (K) · cycle: maximum T',
    section_lattice:'h-BN lattice (Nx × Ny)', section_pore:'Nanopore', section_active_nb:'Active N–B bonds', section_reference:'Reference',
    lbl_nx:'Nx (width)', lbl_ny:'Ny (height)', lbl_atoms:'Atoms', lbl_poresize:'Pore size (rings)', lbl_ribbonw:'Ribbon width (rows/cols)', lbl_pos:'Position (% lattice)', lbl_wx:'Wx (atoms)', lbl_wy:'Wy (atoms)', lbl_vacfrac:'Vacancies / C%', lbl_steps:'Steps', lbl_muh_full:'MC Δμ<sub>H</sub> (eV)', lbl_epsxc_full:'ε<sub>CH</sub> / ε<sub>XC</sub> (eV) — provisional C–H',
    fita_term_arm:'Armchair (mixed)', fita_term_zn:'Zigzag-N', fita_term_zb:'Zigzag-B',
    overlay_off:'Hidden', overlay_edge:'Highlighted edges', overlay_hull:'Pore contour',
    speed_turbo:'Turbo', speed_fast:'Fast', speed_normal:'Normal (animated)', speed_slow:'Slow (animated)',
    edit_hint:'Edit mode active · Click an atom to modify it',
    rec_note:'The video combines the structural transition with the E, T, acceptance and cNB charts. If recording is enabled, it starts with <b>START</b> and downloads automatically at the end.',
    dft_note:'Reference preset: 24×24 lattice (28×28 for ribbons), 3 phases 5000→900 K, 400k steps, thesis parameters.',
    tip_remove:'Remove atoms randomly without rebuilding the lattice', tip_dft:'Apply the documented reference protocol',
    group_fortran:'— Original Fortran —', group_specific:'— Specific geometries —', group_seg:'— Segregation —', group_ribbons:'— Ribbons (nanoribbons) —', group_ribbon:'— Explicit rectangular ribbon —', group_nrpass:'— Passivated nanoribbons —',
    pore_1:'1 · Perfect lattice', pore_2:'2 · Real + vacancies', pore_3:'3 · Random', pore_6:'6 · Parallelogram hole', pore_7:'7 · Triangular hole', pore_8:'8 · Random hole', pore_10:'10 · Triangle — N edge', pore_11:'11 · Triangle — B edge', pore_12:'12 · Parallelogram — orientation A', pore_13:'13 · Parallelogram — orientation B', pore_14:'14 · Hexagon (NH = BH)', pore_20:'20 · h-BNC (carbon in h-BN)', pore_30:'30 · Horizontal C ribbon (in h-BN)', pore_31:'31 · Vertical C ribbon (in h-BN)', pore_32:'32 · C|hBN — vertical interface (fp=% of C)', pore_33:'33 · C|hBN|C — horizontal h-BN stripe in C', pore_34:'34 · C|hBN|C — 3 vertical zones (33/34/33%)', pore_40:'40 · Pure C ribbon (Wx × Wy, no h-BN)', pore_41:'41 · Pure h-BN ribbon (Wx × Wy, no C)', pore_42:'42 · C|hBN|C — explicit 3-zone layout (fp=% left C)', pore_43:'43 · Pure graphene lattice (all C)', pore_44:'44 · Isolated pure h-BN ribbon (no C)', pore_45:'45 · 2 adjacent C ribbons (no separation)', pore_46:'46 · 3 adjacent C ribbons (C block)', pore_47:'47 · ZZ-N nanoribbon (zigzag-N edge + H)', pore_48:'48 · ZZ-B nanoribbon (zigzag-B edge + H)', pore_49:'49 · AC nanoribbon (armchair edge + H)',
    atom_menu_vac:'□ Vacancy', atom_menu_n:'● N', atom_menu_b:'● B', atom_menu_c:'● C', atom_menu_cancel:'Cancel', atom_menu_change_to:'change to:',
    info_source:'<b style="color:#1e293b">Source: Pham et al., Nano Letters 2016</b><br>HRTEM images of nanopores in monolayer h-BN under electron irradiation at different temperatures:<br><br><span style="color:#2563eb">■</span> <b>500 °C:</b> triangular pores with zigzag N edges (metastable)<br><span style="color:#16a34a">■</span> <b>900 °C:</b> hexagonal and parallelogram pores (more stable)<br><span style="color:#f59e0b">■</span> <b>~700 °C:</b> transition temperature between geometries<br><br>The triangular → hexagonal transition occurs because hexagonal pores have lower formation energy above a critical size. Triangular pores remain “frozen” at low temperature (thesis Fig. 1.4, p. 4).',
    info_detail:'<b style="color:#1e293b">Bond-counting model</b><br>E<sub>T</sub> = Σ ε<sub>αβ</sub>·n<sub>αβ</sub> over nearest neighbours. The ε are fitting coefficients on the SIESTA total-energy scale, not physical bond energies.<br><br><b>Default parameters</b>: M. A. Obando thesis (FIMAT-UFOP, 2019), advisor Prof. R. J. C. Batista. ε<sub>NN</sub>, ε<sub>NB</sub>, ε<sub>BB</sub>, ε<sub>CC</sub>, ε<sub>CN</sub>, ε<sub>CB</sub>: Table 5.8 (least squares over the 20 Mazzoni 2006 structures). ε<sub>XN</sub>, ε<sub>XB</sub>: Table 5.7 (triangular pores). ε<sub>XX</sub> = E(H<sub>2</sub>)/2. ε<sub>CH</sub> = −70.41 eV is <b>provisional</b> (not DFT). Full table and provenance in the RES tab.<br><br><b style="color:#1e293b">Metropolis</b>: P = min(1, e<sup>−ΔE/k<sub>B</sub>T</sup>), k<sub>B</sub> = 8.6173×10<sup>−5</sup> eV/K, d = 1.44 Å. Elementary moves cost tens of eV; simulation temperatures (up to 20,000 K) are a control parameter, not physical temperatures.<br><br><b style="color:#1e293b">Exchange</b>: pores (opt 1–14) nearest neighbours only; BNC (opt 20, 30–46) 70 % local + 30 % global.<br><br><b style="color:#1e293b">BNC segregation</b>: ΔE<sub>mix</sub> = (ε<sub>CN</sub>+ε<sub>CB</sub>) − (ε<sub>CC</sub>+ε<sub>NB</sub>) = +0.45 eV per pair of mixed bonds → immiscible. ΔE/k<sub>B</sub> ≈ 5,200 K is an energy scale, not a computed critical temperature.',
    info_ref:'Mg. M.A. Obando, <i>Efeito da temperatura na estabilidade de nanoporos em estruturas 2D</i>, FIMAT-UFOP, 2019<br>Advisor: Prof. R.J.C. Batista (UFOP)<br>Physics Department, Universidad del Cauca, Colombia<br><br>Pham et al., <i>Nano Letters</i> 16, 7142 (2016) — HRTEM<br>Mazzoni et al., <i>PRB</i> 73, 073108 (2006) — energies<br>Martins &amp; Chacham, <i>ACS Nano</i> 5, 385 (2010) — BNC'
  }
};
let curLang='es';
/**
 * [REGISTRO-DOC-F11]
 * Resuelve una clave de traducción en el idioma activo.
 * @param {string} key Clave del diccionario LANG.
 * @returns {string} Texto traducido; usa español como respaldo y, en última instancia, la propia clave.
 */
function t(key){ return (LANG[curLang]||LANG.es)[key] || (LANG.es[key] ?? key); }
/**
 * [REGISTRO-DOC-F11]
 * Asigna texto plano al primer elemento que coincide con un selector CSS.
 * @param {string} sel Selector CSS.
 * @param {string} txt Texto a asignar.
 * @returns {void}
 */
function setText(sel, txt){ const el=document.querySelector(sel); if(el) el.textContent=txt; }
/**
 * [REGISTRO-DOC-F11]
 * Asigna contenido HTML al primer elemento que coincide con un selector CSS.
 * @param {string} sel Selector CSS.
 * @param {string} html HTML localizado a asignar.
 * @returns {void}
 */
function setHTML(sel, html){ const el=document.querySelector(sel); if(el) el.innerHTML=html; }
/**
 * [REGISTRO-DOC-F11]
 * Actualiza un atributo de un elemento localizado mediante selector CSS.
 * @param {string} sel Selector CSS.
 * @param {string} attr Nombre del atributo.
 * @param {string} val Valor a establecer.
 * @returns {void}
 */
function setAttr(sel, attr, val){ const el=document.querySelector(sel); if(el) el.setAttribute(attr,val); }
/**
 * [REGISTRO-DOC-F11]
 * Actualiza el texto visible de las opciones de un elemento select según un mapa valor→texto.
 * @param {string} selectId Identificador DOM del select.
 * @param {Object<string,string>} map Mapa entre valor de opción y etiqueta traducida.
 * @returns {void}
 */
function setOptionText(selectId, map){ const el=document.getElementById(selectId); if(!el) return; [...el.options].forEach(opt=>{ if(map[opt.value]!=null) opt.textContent=map[opt.value]; }); }
/**
 * [REGISTRO-DOC-F11]
 * Traduce las etiquetas de grupos del selector de geometrías/nanoporos.
 * @returns {void}
 */
function setOptgroupLabels(){
  const s=document.getElementById('iPore'); if(!s) return;
  const groups=s.querySelectorAll('optgroup');
  const vals=['group_fortran','group_specific','group_seg','group_ribbons','group_ribbon','group_nrpass'];
  groups.forEach((g,i)=>{ if(vals[i]) g.label=t(vals[i]); });
}
/**
 * [REGISTRO-DOC-F11]
 * Sustituye el contenido de la etiqueta asociada a un control preservando su elemento <em> dinámico.
 * @param {string} inputId Identificador del control de entrada.
 * @param {string} html Texto/HTML traducido para la etiqueta.
 * @returns {void}
 */
function setLabelHTMLForInput(inputId, html){
  const input=document.getElementById(inputId); if(!input) return;
  const label=input.closest('.fi')?.querySelector('label'); if(!label) return;
  const em=label.querySelector('em');
  label.innerHTML=html + (em?(' ' + em.outerHTML):'');
}
/**
 * [REGISTRO-DOC-F11]
 * Actualiza etiquetas cuyo contenido incluye valores dinámicos o depende del estado actual de la interfaz.
 * @returns {void}
 */
function applyLangDynamicLabels(){
  setLabelHTMLForInput('iNx', t('lbl_nx'));
  setLabelHTMLForInput('iNy', t('lbl_ny'));
  const atLabel=document.querySelector('#t-ctrl .fi label em#lAt')?.parentElement; if(atLabel) atLabel.innerHTML=t('lbl_atoms')+' <em id="lAt">'+document.getElementById('lAt').textContent+'</em>';
  setLabelHTMLForInput('iTi', t('ti_label'));
  setLabelHTMLForInput('iTf', t('tf_label'));
  setLabelHTMLForInput('iPsz', t('lbl_poresize'));
  setLabelHTMLForInput('iFw', t('lbl_ribbonw'));
  setLabelHTMLForInput('iFp', t('lbl_pos'));
  setLabelHTMLForInput('iWx', t('lbl_wx'));
  setLabelHTMLForInput('iWy', t('lbl_wy'));
  setLabelHTMLForInput('iWpos', (curLang==='es'?'Pos X inicio (% red)':'Start X pos (% lattice)'));
  setLabelHTMLForInput('iVac', t('lbl_vacfrac'));
  setLabelHTMLForInput('iMuH', t('lbl_muh_full'));
  setLabelHTMLForInput('iSt', t('lbl_steps'));
  setLabelHTMLForInput('iEpsXC', t('lbl_epsxc_full'));
  const tmodeLabel=document.querySelector('#iTmode')?.closest('.fi')?.querySelector('label'); if(tmodeLabel) tmodeLabel.textContent=t('tmode');
  const nrunsSelect=document.getElementById('iNruns'); if(nrunsSelect){ [...nrunsSelect.options].forEach(opt=>{ const n=opt.value; opt.textContent=curLang==='es' ? `${n} réplica${n==='1'?'':'s'}` : `${n} replica${n==='1'?'':'s'}`; }); }
}
/**
 * [REGISTRO-DOC-F11]
 * Sincroniza los textos estáticos y semiestáticos de controles, diálogos, visor 3D, opciones y ayudas.
 * @returns {void}
 */
function applyLangStaticTexts(){
  document.documentElement.lang=curLang;
  setText('#btn3D', t('btn_3d'));
  setText('.cv-tools .zhint', curLang==='es'?'rueda = zoom · Shift+arrastrar = mover':'wheel = zoom · Shift+drag = pan');
  const cvBtns=document.querySelectorAll('.cv-tools button');
  if(cvBtns[0]) cvBtns[0].title=curLang==='es'?'Acercar vista 2D':'Zoom in 2D view';
  if(cvBtns[1]) cvBtns[1].title=curLang==='es'?'Alejar vista 2D':'Zoom out 2D view';
  if(cvBtns[2]) cvBtns[2].title=curLang==='es'?'Restablecer encuadre':'Reset framing';
  const spans=document.querySelectorAll('#t-ctrl .sl');
  if(spans[0]) spans[0].textContent=t('section_lattice');
  if(spans[1]) spans[1].textContent=t('section_pore');
  const infoTabs=document.querySelectorAll('#t-info .sl');
  if(infoTabs[0]) infoTabs[0].textContent=t('lbl_exp_motiv');
  if(infoTabs[1]) infoTabs[1].textContent=t('lbl_sim_detail');
  if(infoTabs[2]) infoTabs[2].textContent=t('section_reference');
  setHTML('#t-info > div:nth-of-type(2)', t('info_source'));
  setHTML('#t-info > div:nth-of-type(4)', t('info_detail'));
  setHTML('#t-info > div:nth-of-type(6)', t('info_ref'));
  setText('#bRun', t('btn_start')); setText('#bPause', t('btn_pause')); setText('#bReset', t('btn_reset'));
  const editBtn=document.getElementById('bEdit'); if(editBtn) editBtn.textContent=(window.editMode ? t('btn_edit_exit') : t('btn_edit'));
  setText('#bRandVac', t('btn_remove')); setAttr('#bRandVac','title',t('tip_remove'));
  setHTML('#editHint', t('edit_hint'));
  setHTML('.rec-note', t('rec_note'));
  const dftBtn=document.querySelector('button[onclick="applyDFTProtocol()"]'); if(dftBtn){ dftBtn.textContent=t('btn_dft'); dftBtn.title=t('tip_dft'); }
  const dftNote=document.querySelector('button[onclick="applyDFTProtocol()"]+div'); if(dftNote) dftNote.textContent=t('dft_note');
  setText('#t-graf .sl:nth-of-type(4)', t('section_active_nb'));
  setText('#t-info .sl:nth-of-type(1)', t('lbl_exp_motiv'));
  setText('#t-info .sl:nth-of-type(2)', t('lbl_sim_detail'));
  setText('#t-info .sl:nth-of-type(3)', t('section_reference'));
  setText('#atomMenu button[onclick="setAtomType(0)"]', t('atom_menu_vac'));
  setText('#atomMenu button[onclick="setAtomType(1)"]', t('atom_menu_n'));
  setText('#atomMenu button[onclick="setAtomType(2)"]', t('atom_menu_b'));
  setText('#atomMenu button[onclick="setAtomType(3)"]', t('atom_menu_c'));
  setText('#atomMenu button[onclick="hideAtomMenu()"]', t('atom_menu_cancel'));
  setText('#dlgTitle', t('dlg_done'));
  setText('#dlgQuestion', t('dlg_question'));
  setText('#dlgSummary', t('dlg_summary'));
  const dlgMap=[
    ['#dlgReportBtn','btn_report'],
    ['#dlgInitBtn','btn_img_init'],
    ['#dlgFinalBtn','btn_img_final'],
    ['#dlgChartsBtn','btn_charts'],
    ['#dlgVideoBtn','btn_video'],
    ['#dlgCsvBtn','btn_csv'],
    ['#dlgPoscarBtn','btn_poscar'],
    ['#dlgXvBtn','btn_xv'],
    ['#dlgZipBtn','btn_zip'],
    ['#dlgCloseBtn','btn_close']
  ];
  dlgMap.forEach(([sel,key])=>{
    const btn=document.querySelector(sel);
    if(!btn) return;
    btn.textContent=t(key);
    btn.setAttribute('data-orig',t(key));
  });
  const hdr=document.querySelector('#modal3D > div:first-child > span'); if(hdr) hdr.textContent=t('view3d_title');
  const topBarBtns=document.querySelectorAll('#modal3D > div:first-child button');
  if(topBarBtns[0]){ topBarBtns[0].textContent=t('btn_3d_top'); topBarBtns[0].title=t('btn_3d_top'); }
  if(topBarBtns[1]){ topBarBtns[1].textContent=t('btn_3d_front'); topBarBtns[1].title=t('btn_3d_front'); }
  if(topBarBtns[2]){ topBarBtns[2].textContent=t('btn_3d_side'); topBarBtns[2].title=t('btn_3d_side'); }
  if(topBarBtns[3]){ topBarBtns[3].textContent=t('btn_3d_iso'); topBarBtns[3].title=t('btn_3d_iso'); }
  if(topBarBtns[4]){ topBarBtns[4].textContent=t('btn_3d_persp'); topBarBtns[4].title=t('btn_3d_persp'); }
  if(topBarBtns[5]){ topBarBtns[5].textContent=t('btn_3d_reset'); topBarBtns[5].title=t('btn_3d_reset'); }
  const styleBtn=document.getElementById('btn3Dstyle');
  if(styleBtn){
    const labels=curLang==='es' ? ['⚪ Bolas+Palos','🔵 Solo bolas','🔲 Solo enlaces'] : ['⚪ Balls+Sticks','🔵 Atoms only','🔲 Bonds only'];
    styleBtn.textContent = (window._3d ? labels[window._3d.styleMode||0] : labels[0]);
  }
  if(topBarBtns[topBarBtns.length-1]) topBarBtns[topBarBtns.length-1].textContent=t('btn_3d_close');
  const controls3d=document.querySelectorAll('#modal3D label');
  if(controls3d[0]) controls3d[0].childNodes[0].textContent=t('view3d_atoms')+' ';
  if(controls3d[1]) controls3d[1].childNodes[0].textContent=t('view3d_pore')+' ';
  if(controls3d[2]){ const txt=controls3d[2].lastChild; if(txt && txt.nodeType===3) txt.textContent=' '+t('view3d_hide_volatile'); }
  setOptionText('i3DPoreMode',{auto:t('pore_auto'),triangle:t('pore_triangle'),parallelogram:t('pore_parallelogram'),hexagon:t('pore_hexagon'),irregular:t('pore_irregular')});
  const legendTitle=document.querySelector('#cv3dWrap > div:nth-of-type(1) > div:first-child'); if(legendTitle) legendTitle.textContent=t('view3d_atoms_legend');
  const legendRows=document.querySelectorAll('#cv3dWrap > div:nth-of-type(1) > div span:last-child');
  if(legendRows[0]) legendRows[0].textContent=curLang==='es'?'N — Nitrógeno':'N — Nitrogen';
  if(legendRows[1]) legendRows[1].textContent=curLang==='es'?'B — Boro':'B — Boron';
  if(legendRows[2]) legendRows[2].textContent=curLang==='es'?'C — Carbono':'C — Carbon';
  if(legendRows[3]) legendRows[3].textContent=curLang==='es'?'H — Hidrógeno':'H — Hydrogen';
  const instr=document.querySelector('#cv3dWrap > div:nth-of-type(2)'); if(instr) instr.textContent=t('view3d_instr');
  setOptionText('iOrient',{AC:t('orient_ac'),ZZ:t('orient_zz')});
  setOptionText('iStart',{B:t('start_b'),N:t('start_n')});
  setOptionText('iFt',{arm:t('fita_term_arm'),zN:t('fita_term_zn'),zB:t('fita_term_zb')});
  setOptionText('iH',{'1':t('opt_yes'),'0':t('opt_no')});
  setOptionText('iOvl',{off:t('overlay_off'),edge:t('overlay_edge'),hull:t('overlay_hull')});
  setOptionText('iSpd',{turbo:t('speed_turbo'),fast:t('speed_fast'),normal:t('speed_normal'),slow:t('speed_slow')});
  setOptionText('iTmode',{anneal:t('opt_anneal'),iso:t('opt_iso'),'3phase':t('opt_3phase'),cycle:t('opt_cycle')});
  setOptionText('iPore',{
    '1':t('pore_1'),'2':t('pore_2'),'3':t('pore_3'),'6':t('pore_6'),'7':t('pore_7'),'8':t('pore_8'),'10':t('pore_10'),'11':t('pore_11'),'12':t('pore_12'),'13':t('pore_13'),'14':t('pore_14'),'20':t('pore_20'),'30':t('pore_30'),'31':t('pore_31'),'32':t('pore_32'),'33':t('pore_33'),'34':t('pore_34'),'40':t('pore_40'),'41':t('pore_41'),'42':t('pore_42'),'43':t('pore_43'),'44':t('pore_44'),'45':t('pore_45'),'46':t('pore_46'),'47':t('pore_47'),'48':t('pore_48'),'49':t('pore_49')
  });
  setOptgroupLabels();
  if(typeof updateRecordingButton==='function') updateRecordingButton();
  if(typeof onOrientChange==='function') onOrientChange();
  if(window._3d && typeof refresh3DInfoLabel==='function') refresh3DInfoLabel();
  if(window._3d && typeof update3DPoreVisual==='function') update3DPoreVisual();
}
/**
 * [REGISTRO-DOC-F11]
 * Aplica integralmente el idioma activo a elementos data-i18n y a etiquetas dinámicas/estáticas.
 * @returns {void}
 */
function applyLang(){
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const k=el.getAttribute('data-i18n');
    const attr=el.getAttribute('data-i18n-attr');
    if(attr) el.setAttribute(attr, t(k)); else el.textContent=t(k);
  });
  const btn=document.getElementById('btnLang'); if(btn) btn.textContent=t('btn_lang');
  applyLangDynamicLabels();
  applyLangStaticTexts();
  updateStatusLabel();
}
/**
 * [REGISTRO-DOC-F11]
 * Alterna el idioma activo entre español e inglés, reaplica la interfaz y registra el cambio.
 * @returns {void}
 */
function toggleLang(){ curLang = curLang==='es' ? 'en' : 'es'; applyLang(); addLog(curLang==='en'?'Language: English':'Idioma: Español','i'); }
/**
 * [REGISTRO-DOC-F11]
 * Traduce el indicador de estado de simulación a partir de su atributo data-status.
 * @returns {void}
 */
function updateStatusLabel(){
  const el=document.getElementById('statusLabel') || document.getElementById('cst');
  if(!el) return;
  const map={idle:t('status_idle'),run:t('status_run'),pause:t('status_pause'),done:t('status_done')};
  const cur=el.getAttribute('data-status')||'idle';
  el.textContent=map[cur]||t('status_idle');
}
