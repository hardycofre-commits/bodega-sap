# Bodega SAP v5.0

Versión móvil/profesional del inventario Bodega SAP.

## Archivos
- `index.html`
- `styles.css`
- `app.js`
- `apps_script.gs`
- `assets/logo.png`

## Qué hace
- Busca automáticamente el último Excel dentro de la carpeta `datos` del repositorio `bodega-sap`.
- Lee Google Sheets al iniciar.
- Guarda revisiones y ocultos en Google Sheets.
- Recalcula estados con cada nuevo Excel SAP.
- Si SAP se actualiza y coincide con el stock real, el estado pasa automáticamente a Correcto.
- Mantiene historial en la hoja `Historial`.

## Google Sheets
Pegar `apps_script.gs` en Extensiones → Apps Script. Luego implementar como Web App:
- Ejecutar como: Yo
- Acceso: Cualquier persona
- Crear nueva versión al actualizar.

## GitHub
Subir estos archivos al repositorio y mantener los Excel SAP dentro de:

```text
datos/
```

El sistema no necesita borrar archivos antiguos; toma el más nuevo por fecha en el nombre.
