# «Máquinas que leen» — plan y registro de estado

Curso interactivo de PLN para la especialización en IA del usuario (UNIR). Misma arquitectura que
`ConCode/neuro` (namespace `NL`, núcleo UI en `src/core`, algoritmos sin DOM en `src/lib`, capítulos
`src/chapters/NN-id.html|js`, programas Python reales en `py/` con salida en `py/out/`, validación en
`tests/`). Crédito: Mg. Manuel Alejandro Obando · Departamento de Física, Universidad del Cauca.

## Fuentes (en `scratchpad/`, se extraen de Descargas)
- ZIP «Documentación Deivis Eduard Ramírez Martínez»: guías de laboratorio (docx), laboratorio_pln.py,
  6 cuadernos Colab (PLN_Google_Colab.rar), glosario del tema 1, actividad 1 (HMM morfos5), libro
  Zong–Zhao–Ma «NLP and Large Language Models» (Springer 2026, CC BY-NC-ND: se resume y cita, no se copia).
- ZIP «Procesamiento del Lenguaje natural»: 10 temas UNIR (PDF). Texto limpio con `clean.py`.
- (El ZIP de «Razonamiento y Planificación Automática» NO es de este curso.)

## Convenciones
- Cada capítulo: lead, secciones, 1–3 sims (`NL.defineSim`), recuadros (`box def/law/ex/warn/explain/py/read/when/err/links/keys`),
  programa Python (`<div class="py" data-py="NN-nombre">`), «Cómo leer el resultado» CON LAS CIFRAS REALES de py/out,
  resumen, 5 problemas con respuesta, autoevaluación `<div class="sim" data-sim="quiz" data-cap="ID">` y banco
  `NL.bank.add('ID', [...])` (8–12 preguntas; num = numérica con tol). Enlaces a fuentes al final.
- Fórmulas: `\lt`/`\gt` dentro de HTML. Escribir archivos con Write/Edit (no heredocs).
- Comandos: `node build.js` · `node tests/validar.js` · `python tests/correr_py.py [nombre]` · preview `maquinas-que-leen` (puerto 8800).

## Temario
| Cap | id | Título | Fuente principal |
|---|---|---|---|
| **Parte I · El lenguaje como problema** | | | |
| 1 | que-es-pln | Qué es el PLN | UNIR T1 · HECHO |
| 2 | historia | Historia y paradigmas | UNIR T1 |
| 3 | preparar-texto | Preparar el texto (limpieza, regex) | Lab 01 |
| **Parte II · Las palabras** | | | |
| 4 | morfologia | Morfología | UNIR T2 |
| 5 | automatas | Autómatas finitos y expresiones regulares | UNIR T2 |
| 6 | transductores | Transductores y analizador con lexicón | UNIR T2 |
| 7 | tokenizacion | Tokenización, stemming, lematización | Lab 02 |
| 8 | edicion | Distancia de edición y corrección | UNIR/Jurafsky |
| **Parte III · Etiquetado** | | | |
| 9 | categorias | Categorías gramaticales y juegos de etiquetas | UNIR T3 |
| 10 | etiquetado-modelos | Etiquetado por reglas y estadístico | UNIR T3 |
| 11 | hmm-viterbi | HMM y Viterbi (Actividad 1) | UNIR T3, Lab 06 |
| 12 | etiquetado-aprendizaje | Brill, MaxEnt/CRF, neuronal, evaluación | UNIR T3 |
| **Parte IV · Sintaxis** | | | |
| 13 | gramaticas | Gramáticas libres de contexto | UNIR T4 |
| 14 | parsing | Análisis descendente, ascendente, CYK, Earley | UNIR T4–5 |
| 15 | unificacion | Rasgos y unificación | UNIR T4 |
| 16 | dependencias | Gramáticas de dependencias | UNIR T4, Lab 06 |
| 17 | pcfg | Ambigüedad y análisis probabilista | UNIR T5 |
| **Parte V · El significado** | | | |
| 18 | semantica-fol | Representar el significado: lógica de primer orden | UNIR T6 |
| 19 | logica-descriptiva | Lógica descriptiva y ontologías | UNIR T6 |
| 20 | semantica-composicional | Análisis semántico dirigido por la sintaxis | UNIR T7 |
| 21 | sentidos | Sentidos y relaciones léxicas, WordNet | UNIR T8 |
| 22 | wsd | Desambiguación del sentido | UNIR T8 |
| 23 | similitud | Similitud entre palabras | UNIR T8 |
| **Parte VI · Texto como números** | | | |
| 24 | bow-tfidf | Bolsa de palabras, n-gramas, TF-IDF | Lab 03 |
| 25 | modelos-lenguaje | Modelos de lenguaje de n-gramas | Libro cap. 5 |
| 26 | embeddings | Embeddings: PPMI, SVD, Word2Vec | Lab 04, libro cap. 3 |
| 27 | clasificacion | Clasificación de texto y opiniones | Lab 05, libro cap. 8 |
| **Parte VII · Redes y modelos grandes** | | | |
| 28 | redes | Redes para texto: FFNN, CNN, RNN, LSTM | libro cap. 2 |
| 29 | seq2seq | Seq2Seq y atención | libro cap. 4 |
| 30 | transformer | Transformer | libro cap. 4 |
| 31 | preentrenamiento | BERT, GPT, ajuste fino, BPE | libro cap. 6–7 |
| 32 | llm | Grandes modelos: instrucciones, RLHF, RAG, evaluación | libro cap. 6, 15 |
| 33 | tareas | NER, matching, resumen, QA, traducción | libro cap. 9–14 |
| **Parte VIII · Recursos y agentes** | | | |
| 34 | recursos | Recursos lingüísticos, corpus, WordNet | UNIR T9 |
| 35 | herramientas | Librerías y servicios cloud | UNIR T9 |
| 36 | agentes | Agentes conversacionales | UNIR T10 |
| 37 | chatbots | Diseño de chatbots | UNIR T10 |
| **Apéndices** | | | |
| A | pruebas | Centro de pruebas (97) · HECHO | — |
| B | formulario | Formulario (95) | |
| C | laboratorios | Laboratorios Colab y actividades (96) | |
| D | validacion | Validación (98) | |
| E | glosario | Glosario (99) | UNIR T1 + propios |

## Estado
- 2026-11-08: armazón (NL), quiz + Leitner + Centro de pruebas (apéndice A), portada, caps. 1–12 HECHOS (partes I–III). ~250 pruebas de validación (`node tests/validar.js`, ~16 s).
- Artefacto publicado (privado, icono language): https://claude.ai/artifact/23LtPnhdJuBK22EfMBxbwB — v2 con caps. 1–12 (republicar `dist/maquinas-que-leen.html` con la misma ruta; capacidades db, user, downloads).
- Datos locales: `data/opiniones.csv`/`oraciones.csv` (Colab; `tools/mk_opiniones.py` → `06-opiniones.js`), `tools/mk_vocab.py` → `07-vocab.js` (6.000 palabras CESS-ESP), `tools/mk_cess.py` → `08-cess.js` (300 oraciones CESS-ESP con EAGLES + estadísticas del corpus completo). NLTK tiene cess_esp, conll2002, wordnet + omw-1.4, stopwords, punkt_tab.
- Biblioteca (src/lib): 00-util, 05-corpus, 06-opiniones, 07-vocab, 08-cess, 10-ambig, 20-markov, 30-text, 40-fsa, 45-fst, 50-morph, 55-stem, 60-edit, 65-hmm (cadena de taggers, HMM, Viterbi), 66-perceptron, 85-ref (generada), 90-checks.
- Patrón de validación: Python independiente → `tests/referencias.py` (bloques ref_NN) → `85-ref.js`; pruebas en `90-checks.js`. Programas Python con `if __name__` pueden importarse desde referencias (`cargar_py('NN-nombre')`).
- Cifras reales para citar: CESS-ESP limpio 6.030 oraciones, 188.803 tokens, 24.496 tipos, 282 etiquetas; ambigüedad 5,3 % tipos / 36,9 % tokens; unigrama 81,1 %, +reglas 88,4 %, trigrama 89,9 %; HMM 90,5 % (k=0); perceptrón NLTK 95,0 %, logística 94,2 %.
- Verificación en navegador: `location.reload()` en llamada aparte y luego recorrer sims; recomendado tras cada capítulo.

- 2026-11-08 (2): Parte IV hecha (caps. 13–17), 352 pruebas OK. Libs nuevas: 70-cfg (CKY/descendente/ascendente/Earley/PCFG/PARSEVAL), 71-gramaticas, 72-unif, 73-dep. NL.drawTree en 13-gramaticas.js. Validación contra NLTK (ChartParser, RecursiveDescent, FeatStruct) y NetworkX (Edmonds).
- PRÓXIMO: Parte V Significado (18 FOL, 19 lógica descriptiva, 20 semántica composicional, 21 sentidos y WordNet, 22 WSD, 23 similitud); leer UNIR T6, T7, T8 (scratchpad/clean/t6.txt..). WordNet en español con nltk (omw-1.4).


- 2026-11-10: Parte V hecha (caps. 18–23: FOL, lógica descriptiva/OWL, semántica composicional con λ, sentidos y WordNet, WSD con Lesk/Bayes, similitud con tesauro y PPMI). Libs nuevas: 74-logica, 75-alc, 76-lambda, 77-wordnet (+Lesk con opciones ejemplos/idf, +Bayes), 78-dist (11-cooc.js desde tools/mk_cooc.py), 09-wordnet, 10-wsd. Programas py 18–23 (rdflib/owlrl, Cooper storage, WordNet IC, sklearn NB). Pruebas contra NLTK, SymPy, sklearn, NumPy, owlrl. `node tests/humo.js` genera dist/_humo.html (rAF con setTimeout) para probar sims con el panel oculto.
- PRÓXIMO: Parte VI (24 bow-tfidf, 25 modelos-lenguaje, 26 embeddings, 27 clasificacion); luego VII (28–33), VIII (34–37) y apéndices B–E; republicar el artefacto.

- 2026-11-10 (2): HECHOS caps. 24–33 (bow-tfidf, modelos-lenguaje, embeddings, clasificacion, redes, seq2seq, transformer, preentrenamiento, llm, tareas). Libs nuevas 78-dist, 80-vectores, 81-lm, 82-embed, 83-clasif, 84-redes, 85-atencion, 86-transformer, 87-bpe, 88-evaluacion, 89-ner; datos 11-cooc, 12-lm, 13-s2s (tools/mk_s2s.py desde py/out/29-s2s.json), 14-ner. Programas py 24–33 corridos (31 y 33 con salida). ref_24…ref_33 y checks añadidos en referencias.py/90-checks.js.
- PENDIENTE: (1) re-ejecutar `python tests/referencias.py` y `node tests/validar.js` (última pasada: 666/676, fallaban solo ch31–33 sin referencias aún); si falla algo, revisar 'bpe', 'ner', 'ev' (BLEU/ROUGE ya verificados a mano contra sacrebleu/rouge-score). (2) ch30: reejecutar py/30-transformer.py si build avisa «salida desactualizada». (3) Parte VIII: 34 recursos, 35 herramientas, 36 agentes, 37 chatbots (UNIR T9, T10 en scratchpad/clean). (4) Apéndices B formulario, C laboratorios, D validación, E glosario. (5) Republicar artefacto (misma ruta dist/maquinas-que-leen.html, URL https://claude.ai/artifact/23LtPnhdJuBK22EfMBxbwB) y actualizar memoria. Probar sims con `node tests/humo.js` + http://localhost:8800/_humo.html#id (panel oculto: rAF no dispara).

- 2026-11-11: PROYECTO TERMINADO. Escritos caps. 34–37 y apéndices B–E (panel de validación ejecutable en 98). 689/689 pruebas (node y navegador). Artefacto publicado con todo el contenido.
