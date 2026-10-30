/* BIOCOGNIA · registro del service worker (app instalable). Se carga en todas las páginas con
   <script src="…/comun/pwa.js" defer></script>; calcula la raíz a partir de su propia dirección. */
"use strict";
(function () {
  if (!("serviceWorker" in navigator)) return;
  const me = document.currentScript && document.currentScript.src;
  if (!me) return;
  const raiz = new URL("../", me);
  if (!/^https:$|^http:$/.test(raiz.protocol) || (raiz.protocol === "http:" && !/^(localhost|127\.0\.0\.1)$/.test(raiz.hostname))) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(new URL("sw.js", raiz).href, { scope: raiz.pathname }).catch(() => {});
  });
})();
