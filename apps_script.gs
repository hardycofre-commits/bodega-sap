
const SHEET_NAME = 'Hoja 1';
const HISTORY_SHEET_NAME = 'Historial';

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
  if (sh.getLastRow() === 0) {
    sh.appendRow(['codigo_sap','oculto','stock_real','fecha_revision','fecha_oculto','descripcion','stock_sap','estado','archivo_sap','ultima_accion','ultima_actualizacion']);
  }
  return sh;
}

function doGet(e) {
  const sh = getSheet_();
  const data = sh.getDataRange().getValues();
  const headers = data[0] || [];
  const rows = data.slice(1).filter(r => r.join('') !== '').map(r => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = r[i]);
    return obj;
  });
  const json = JSON.stringify(rows);
  const cb = e && e.parameter && e.parameter.callback;
  if (cb) {
    return ContentService.createTextOutput(cb + '(' + json + ')').setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const sh = getSheet_();
  const payloadText = e.parameter && e.parameter.payload ? e.parameter.payload : (e.postData ? e.postData.contents : '{}');
  const body = JSON.parse(payloadText || '{}');
  const codigo = String(body.codigo_sap || '').trim();
  if (!codigo) return ContentService.createTextOutput('sin codigo');

  const headers = ['codigo_sap','oculto','stock_real','fecha_revision','fecha_oculto','descripcion','stock_sap','estado','archivo_sap','ultima_accion','ultima_actualizacion'];
  if (sh.getLastRow() === 0 || String(sh.getRange(1,1).getValue()).trim() !== 'codigo_sap') {
    sh.clear();
    sh.appendRow(headers);
  }

  const data = sh.getDataRange().getValues();
  let row = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === codigo) { row = i + 1; break; }
  }

  const now = new Date();
  const values = [
    codigo,
    body.oculto || '',
    body.stock_real || '',
    body.fecha_revision || '',
    body.fecha_oculto || '',
    body.descripcion || '',
    body.stock_sap || '',
    body.estado || '',
    body.archivo_sap || '',
    body.accion || '',
    now
  ];

  if (row === -1) sh.appendRow(values);
  else sh.getRange(row, 1, 1, values.length).setValues([values]);

  let hist = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HISTORY_SHEET_NAME);
  if (!hist) {
    hist = SpreadsheetApp.getActiveSpreadsheet().insertSheet(HISTORY_SHEET_NAME);
    hist.appendRow(['fecha_hora','codigo_sap','accion','estado','stock_sap','stock_real','oculto','archivo_sap','descripcion']);
  }
  hist.appendRow([now,codigo,body.accion || '',body.estado || '',body.stock_sap || '',body.stock_real || '',body.oculto || '',body.archivo_sap || '',body.descripcion || '']);

  return ContentService.createTextOutput('ok');
}
