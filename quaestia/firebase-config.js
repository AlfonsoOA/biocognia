/* Configuración del envío automático de datos de QUAESTIA (Firebase, región UE).
   - envio: false  → la app funciona como siempre; no se envía nada a ningún servidor.
   - envio: true   → las respuestas de quien participa en el estudio (enlace de grupo + consentimiento)
                     se envían a Firestore con un identificador anónimo.
   Actívalo SOLO cuando el Comité Ético haya aprobado la modificación del estudio.
   El bloque "config" no es secreto: la protección de los datos la dan las reglas de Firestore. */
window.QUAESTIA_FIREBASE = {
  envio: false,
  config: {
    apiKey: "AIzaSyD-a_pFNg0iYINQohQRkwuxgHdjGbQFZ1E",
    authDomain: "biocognia-c9afc.firebaseapp.com",
    projectId: "biocognia-c9afc",
    storageBucket: "biocognia-c9afc.firebasestorage.app",
    messagingSenderId: "56224603447",
    appId: "1:56224603447:web:29eb0bc291b19835e50eb2",
  },
};
