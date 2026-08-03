# Reactivar la sincronización con Google Sheets

La URL de Apps Script incluida en el proyecto responde **HTTP 404**. El despliegue fue eliminado o reemplazado y no se puede reparar sólo desde GitHub.

1. Abre la planilla de Google Sheets que usarás para Bodega SAP.
2. Entra a **Extensiones > Apps Script**.
3. Reemplaza el contenido de `Code.gs` por el archivo `google-apps-script/Code.gs` de este proyecto y guarda.
4. Selecciona **Implementar > Nueva implementación > Aplicación web**.
5. Configura **Ejecutar como: Yo** y **Quién tiene acceso: Cualquier persona**.
6. Autoriza el script y copia la URL terminada en `/exec`.
7. Reemplaza `SHEETS_WEBAPP_URL` al inicio de `app.js` por esa URL.
8. Publica los cambios y abre la aplicación nuevamente. El indicador debe mostrar `Sincronizado con Google Sheets`.

La pestaña `Inventario` y sus columnas se crean automáticamente la primera vez que la aplicación consulta el script.

Cada vez que modifiques `Code.gs`, crea una versión nueva desde **Administrar implementaciones**; guardar el código no actualiza por sí solo la versión publicada.
