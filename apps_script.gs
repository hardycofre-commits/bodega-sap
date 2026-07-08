const SHEET_NAME = 'Hoja 1';

function doGet(e) {
  const sh = getSheet_();
  ensureHeaders_(sh);
  const values = sh.getDataRange().getValues();
  const headers = values[0];
  const rows = values.slice(1).filter(r => r[0] !== '').map(r => {
    const o = {};
    headers.forEach((h,i) => o[h] = r[i]);
    return o;
  });
  return json_(rows);
}

function doPost(e) {
  const sh = getSheet_();
  ensureHeaders_(sh);
  const body = JSON.parse(e.postData.contents || '{}');
  const codigo = String(body.codigo_sap || '').trim();
  if (!codigo) return json_({ ok:false, error:'sin codigo' });

  const data = sh.getDataRange().getValues();
  let row = -1;
  for (let i=1;i<data.length;i++) {
    if (String(data[i][0]).trim() === codigo) { row = i + 1; break; }
  }

  const values = [
    codigo,
    body.oculto || '',
    body.stock_real === undefined ? '' : body.stock_real,
    body.fecha_revision || '',
    body.fecha_oculto || '',
    body.usuario || '',
    body.archivo_sap || '',
    new Date()
  ];

  if (row === -1) sh.appendRow(values);
  else sh.getRange(row, 1, 1, values.length).setValues([values]);

  return json_({ ok:true });
}

function getSheet_(){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
}
function ensureHeaders_(sh){
  const headers = ['codigo_sap','oculto','stock_real','fecha_revision','fecha_oculto','usuario','archivo_sap','actualizado_en'];
  const current = sh.getRange(1,1,1,headers.length).getValues()[0];
  if (current[0] !== 'codigo_sap') sh.getRange(1,1,1,headers.length).setValues([headers]);
}
function json_(obj){
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
