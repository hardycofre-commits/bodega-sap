# Solución de problemas

## La aplicación dice "Sin Excel automático"

Revisar:

1. Que el repositorio sea correcto en `index.html`:

```js
const OWNER='hardycofre-commits';
const REPO='inventario-bodega-sap';
const DATOS_PATH='datos';
```

2. Que exista la carpeta `datos` en GitHub.
3. Que dentro de `datos` exista un archivo `.xlsx`, `.xls` o `.csv`.
4. Que el repositorio sea público.

## Google Sheets no guarda

Revisar:

1. Que la URL del Apps Script termine en `/exec`.
2. Que el Apps Script esté implementado como Web App.
3. Que el acceso sea: "Cualquier persona".
4. Que después de cambiar el código se haya creado una "Nueva versión".

## Borrar datos locales del navegador

En Chrome, abrir la aplicación, presionar F12, ir a Console y ejecutar:

```js
localStorage.removeItem('bodegaSapInventario_v1');
location.reload();
```

## Los ocultos del computador no aparecen en el celular

Causa:

Estaban guardados en `localStorage`, no en Google Sheets.

Soluciones:

1. Exportar respaldo JSON y convertirlo para Google Sheets.
2. O borrar localStorage y trabajar solo con Google Sheets.
