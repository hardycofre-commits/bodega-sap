# Estructura requerida en Google Sheets

La hoja debe tener estos encabezados en la fila 1:

| codigo_sap | oculto | stock_real | fecha_revision |
|---|---|---|---|

Ejemplo:

| codigo_sap | oculto | stock_real | fecha_revision |
|---|---|---:|---|
| 190000 | SI |  |  |
| 210843 |  | 1 | 03-07-2026 |

Notas:
- `codigo_sap` debe ir en la columna A.
- `oculto` usa `SI` para materiales ocultos.
- `stock_real` guarda el conteo físico.
- `fecha_revision` guarda la fecha de revisión.
