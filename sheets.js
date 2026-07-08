window.SheetsDB = (() => {
  const cfg = window.BODEGA_CONFIG;

  function normalizeRow(r){
    const code = String(r.codigo_sap ?? r.codigo ?? r.Codigo ?? r.CÓDIGO ?? '').trim();
    if(!code) return null;
    return {
      codigo_sap: code,
      stock_real: r.stock_real === '' || r.stock_real === undefined ? undefined : Number(r.stock_real),
      oculto: String(r.oculto ?? '').toUpperCase() === 'SI' || r.oculto === true,
      fecha_revision: r.fecha_revision || r.fecha || '',
      fecha_oculto: r.fecha_oculto || '',
      usuario: r.usuario || '',
      archivo_sap: r.archivo_sap || ''
    };
  }

  async function leer(){
    const url = `${cfg.SHEETS_WEBAPP_URL}?action=list&t=${Date.now()}`;
    const res = await fetch(url, { cache:'no-store' });
    if(!res.ok) throw new Error('Google Sheets no respondió.');
    const txt = await res.text();
    const json = JSON.parse(txt || '[]');
    const rows = Array.isArray(json) ? json : (json.data || []);
    const map = {};
    rows.map(normalizeRow).filter(Boolean).forEach(r => { map[r.codigo_sap] = r; });
    return map;
  }

  async function guardar(reg){
    const payload = {
      action: 'upsert',
      codigo_sap: String(reg.codigo_sap || '').trim(),
      stock_real: reg.stock_real ?? '',
      oculto: reg.oculto ? 'SI' : '',
      fecha_revision: reg.fecha_revision || '',
      fecha_oculto: reg.fecha_oculto || '',
      usuario: reg.usuario || '',
      archivo_sap: reg.archivo_sap || ''
    };
    if(!payload.codigo_sap) throw new Error('Sin código SAP');

    // text/plain evita preflight CORS con Apps Script.
    await fetch(cfg.SHEETS_WEBAPP_URL, {
      method:'POST',
      mode:'no-cors',
      headers:{ 'Content-Type':'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    return true;
  }

  return { leer, guardar };
})();
