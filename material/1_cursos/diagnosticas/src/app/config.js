/* Configuración del sitio. Llena "firebase" con los datos de tu proyecto
   (Consola de Firebase → Configuración del proyecto → Tus apps → Web). Ver README.md.
   En localhost el sitio usa siempre los emuladores locales y no toca la base real. */
window.CONFIG = {
  marca: 'Pruebas Diagnósticas',
  autor: 'Mg. Manuel Alejandro Obando · Departamento de Física, Universidad del Cauca',
  contacto: '',            // correo de ventas que aparece en la página principal, p. ej. 'pruebas@tudominio.com'
  whatsapp: '',            // número con indicativo, p. ej. '573001234567' (opcional)
  urlSitio: '',            // dirección pública del sitio, p. ej. 'https://pruebas-diagnosticas.web.app' (para los enlaces de los correos)
  firebase: {
    apiKey: '',
    authDomain: '',
    databaseURL: '',
    projectId: '',
    appId: ''
  }
};
