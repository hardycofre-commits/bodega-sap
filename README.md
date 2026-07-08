# Bodega SAP v5.1

Cambios principales:

- Recuerda el último Excel SAP cargado manualmente.
- Al cerrar y volver a abrir el link, carga automáticamente el último inventario guardado en el navegador.
- Sigue intentando buscar el último Excel en GitHub dentro de `datos/`.
- Sigue leyendo y guardando avances en Google Sheets.
- Si GitHub no responde, mantiene el último SAP local.

## Uso

1. Sube `index.html`, `styles.css`, `app.js` y `apps_script.gs` a GitHub.
2. Mantén Google Sheets con el Apps Script actualizado.
3. Abre la aplicación.
4. Si deseas trabajar rápido, usa **Carga manual de Excel SAP**.
5. La próxima vez que abras el link, el sistema recordará ese último archivo.

## Importante

El Excel manual queda guardado en el navegador donde fue cargado.
Las revisiones y ocultos quedan sincronizados con Google Sheets.
