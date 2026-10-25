# Registro de soporte lógico ante la DNDA (Colombia) — hBN-MC v15.0.1

Resumen del trámite y de las decisiones tomadas para registrar hBN-MC v15.0.1
en la Dirección Nacional de Derecho de Autor (DNDA). No es asesoría jurídica.
La guía completa, con los textos listos para el formulario, es
`GUIA_REGISTRO_DNDA_hBN-MC_v15.0.1` (paquete de registro, fuera del
repositorio).

## 1. Trámite

* **Entidad:** DNDA, adscrita al Ministerio del Interior.
* **Plataforma:** www.registroenlinea.gov.co (cuenta con «Regístrese»).
* **Costo:** ninguno. **Respuesta:** 15 días hábiles.
* **Archivo:** uno solo, con el nombre completamente en MAYÚSCULAS, incluida
  la extensión: `HBN_MC_V15_0_1.ZIP`. El programa se admite en MDV, ZIP, RAR o
  APK; la descripción de programa en Word; el material auxiliar en PDF.
* **Descripción de la obra:** las funciones del software en 500 caracteres.
* **Normas:** Decreto 1066 de 2015, arts. 2.6.1.3.1 a 2.6.1.3.7 (compila el
  Decreto 1360 de 1989); Ley 23 de 1982; Decisión Andina 351 de 1993
  (art. 7: no se protegen las ideas; art. 53: el registro es declarativo).

## 2. Decisiones (septiembre de 2026)

| Campo | Decisión |
|---|---|
| Autor | Manuel Alejandro Obando Papamija |
| Titular de los derechos patrimoniales, productor y solicitante | El autor. El software se desarrolló sin recursos de la Universidad del Cauca (Acuerdo Superior 004 de 2018, art. 26) |
| Participación | Obra individual; el Prof. Ronaldo Junio Campos Batista se reconoce en Observaciones |
| Origen | Obra derivada del programa Fortran de la tesis (FIMAT-UFOP, 2019) |
| Publicación | Inédita |
| Uso de IA | Declaración firmada: ChatGPT (OpenAI) en v14.x y Claude (Anthropic) mediante Claude Code en v15 |

## 3. Paquete de registro

| Archivo | Elemento del soporte lógico |
|---|---|
| `HBN_MC_V15_0_1/PROGRAMA/` | A. Programa de computador (este repositorio) |
| `DESCRIPCION_DE_PROGRAMA_HBN_MC_V15_0_1.DOCX` | B. Descripción de programa (manual técnico con las 395 funciones explicadas) |
| `MANUAL_DE_USUARIO_HBN_MC_V15_0_1.PDF` | C. Material auxiliar (manual de usuario) |
| `DECLARACION_USO_IA_HBN_MC.PDF` | Anexo: declaración de uso de inteligencia artificial |

La huella SHA-256 agregada del código ejecutable (`SHA256SUMS.txt`) identifica
la versión registrada. Regenerarla justo antes de radicar si se cambia algo:

```bash
npm test
node tools/generar_manifiesto.js
```

## 4. Después del registro

* Conservar el certificado junto con el ZIP exacto que se radicó.
* Citar el número de registro en el artículo y en `CITATION.cff`.
* Una versión con cambios científicos importantes puede registrarse como obra
  derivada de esta.
