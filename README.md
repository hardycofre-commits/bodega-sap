# Bodega SAP v5.3

Versión con filtros funcionales por estado.

## Cambios principales

- Botones de filtro funcionales: Todos, Pendientes, Correctos, Rebajar SAP, Revisar, SAP 0 y Ocultos.
- Cada botón muestra cantidad actualizada.
- Al apretar Rebajar SAP muestra solo los materiales que tienen SAP mayor que el stock real.
- Al cargar un nuevo Excel desde `datos/`, los estados se recalculan automáticamente usando Google Sheets como memoria.
- Carga automática del último Excel disponible en la carpeta `datos` del repositorio.
- Sin carga manual.

## Archivos

- `index.html`
- `styles.css`
- `app.js`
- `apps_script.gs`
- `logo.png`
- `README.md`

## Configuración importante

En `app.js` está configurado:

```js
const OWNER = 'hardycofre-commits';
const REPO = 'bodega-sap';
const DATOS_PATH = 'datos';
```

El Excel SAP debe estar dentro de la carpeta `datos/` del repositorio.
