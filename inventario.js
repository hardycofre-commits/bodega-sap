window.Inventory = (() => {
  function norm(v){ return String(v ?? '').trim(); }
  function num(v){
    if(v === undefined || v === null || v === '') return 0;
    const s = String(v).trim();
    if(/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) return Number(s.replace(/\./g,'').replace(',','.')) || 0;
    return Number(s.replace(',','.')) || 0;
  }
  function pick(row, names){
    const keys = Object.keys(row);
    for(const n of names){
      const k = keys.find(x => x.toLowerCase().trim() === n.toLowerCase());
      if(k) return row[k];
    }
    for(const n of names){
      const k = keys.find(x => x.toLowerCase().includes(n.toLowerCase()));
      if(k) return row[k];
    }
    return '';
  }
  function parseWorkbook(buffer, archivo){
    const wb = XLSX.read(buffer, { type:'array' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval:'' });
    return rows.map(r => {
      const codigo = norm(pick(r, ['Material','Código','Codigo','Cod.Material','N° material','codigo_sap']));
      const desc = norm(pick(r, ['Texto breve de material','Texto breve','Descripción','Descripcion','Denominación','Material Description']));
      const sap = num(pick(r, ['Libre utilización','Libre utilizacion','Stock libre utilización','Stock','Cantidad','SAP']));
      const um = norm(pick(r, ['Unidad medida base','UMB','Unidad','UM']));
      return { codigo, desc, sap, um, archivo, search: `${codigo} ${desc}`.toLowerCase() };
    }).filter(x => x.codigo && x.desc);
  }
  function merge(materiales, sheetMap){
    return materiales.map(m => ({ ...m, rev: sheetMap[m.codigo] || {} }));
  }
  function estado(item){
    const r = item.rev || {};
    if(r.oculto) return 'oculto';
    if(r.stock_real === undefined || r.stock_real === '' || Number.isNaN(Number(r.stock_real))) return 'pendiente';
    const real = Number(r.stock_real);
    if(item.sap === 0 && real > 0) return 'cero';
    if(real < item.sap) return 'rebajar';
    if(real > item.sap) return 'revisar';
    return 'ok';
  }
  function estadoLabel(e){
    return {
      todos:'📋 Todos', pendiente:'⏳ Pendiente', ok:'✅ Correcto', rebajar:'🔻 Rebajar SAP', revisar:'⚠️ Revisar', cero:'🔵 SAP 0', oculto:'🚫 Oculto'
    }[e] || e;
  }
  function counts(items){
    const c = { todos:0, pendiente:0, ok:0, rebajar:0, revisar:0, cero:0, oculto:0 };
    for(const it of items){
      const e = estado(it); c[e]++; if(e !== 'oculto') c.todos++;
    }
    return c;
  }
  function comparePriority(e){ return ({rebajar:0,revisar:1,pendiente:2,cero:3,ok:4,oculto:5})[e] ?? 9; }
  return { parseWorkbook, merge, estado, estadoLabel, counts, comparePriority };
})();
