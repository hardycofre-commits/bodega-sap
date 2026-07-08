const SHEET_NAME = 'Hoja 1';

function doGet(e) {
  const sh = getSheet_();
  ensureHeaders_(sh);
  const data = sh.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1).filter(r => r[0] !== '').map(r => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = r[i]);
    return obj;
  });
  const json = JSON.stringify(rows);
  const cb = e && e.parameter && e.parameter.callback;
  if (cb) {
    return ContentService.createTextOutput(cb + '(' + json + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const sh = getSheet_();
  ensureHeaders_(sh);
  let body = {};
  try {
    if (e.parameter && e.parameter.payload) body = JSON.parse(e.parameter.payload);
    else if (e.postData && e.postData.contents) body = JSON.parse(e.postData.contents);
  } catch (err) {
    return ContentService.createTextOutput('json error');
  }
  const codigo = String(body.codigo_sap || '').trim();
  if (!codigo) return ContentService.createTextOutput('sin codigo');

  const data = sh.getDataRange().getValues();
  let row = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === codigo) { row = i + 1; break; }
  }
  const now = new Date();
  const values = [
    codigo,
    body.descripcion || '',
    body.stock_sap || '',
    body.stock_real || '',
    body.estado || '',
    body.oculto || '',
    body.fecha_revision || '',
    body.fecha_oculto || '',
    body.archivo_sap || '',
    Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss')
  ];
  if (row === -1) sh.appendRow(values);
  else sh.getRange(row, 1, 1, values.length).setValues([values]);
  return ContentService.createTextOutput('ok');
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
}

function ensureHeaders_(sh) {
  const headers = ['codigo_sap','descripcion','stock_sap','stock_real','estado','oculto','fecha_revision','fecha_oculto','archivo_sap','actualizado'];
  const first = sh.getRange(1,1,1,headers.length).getValues()[0];
  const empty = first.every(v => v === '');
  if (empty) sh.getRange(1,1,1,headers.length).setValues([headers]);
}
