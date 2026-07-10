const CONFIG = {
  OWNER: 'hardycofre-commits',
  REPO: 'bodega-sap',
  DATOS_PATH: 'datos',
  COMPRAS_PATH: 'compras',
  SHEETS_WEBAPP_URL: 'https://script.google.com/macros/s/AKfycbxlntU4x4bOg4CQWIL80T0-gmrIKulE65hvqs9D0npSfGPmGCfVYcAMUyv8hKNsfOPMTg/exec',
  LOCAL_KEY: 'bodegaSap_v55_cache'
};

let materiales = [];
let avance = {};
let filtro = 'todos';
let current = null;
let sapFileName = '';
let comprasFileName = '';
let comprasPorMaterial = {};

const $ = (id) => document.getElementById(id);
const els = {
  sapStatus: $('sapStatus'), sheetStatus: $('sheetStatus'), searchInput: $('searchInput'), cards: $('cards'), listInfo: $('listInfo'),
  drawer: $('drawer'), dCode: $('dCode'), dDesc: $('dDesc'), dSap: $('dSap'), realInput: $('realInput'), dEstado: $('dEstado'), dMeta: $('dMeta'), unhideBtn: $('unhideBtn')
};

function norm(v){ return String(v ?? '').trim(); }
function num(v){ if(v === undefined || v === null || v === '') return 0; const s = String(v).trim().replace(/\./g,'').replace(',','.'); return Number(s) || 0; }
function today(){ return new Date().toLocaleDateString('es-CL'); }
function setStatus(el, text, type=''){ el.textContent = text; el.className = 'pill ' + type; }
function toast(msg){ const t=$('toast'); t.textContent=msg; t.classList.remove('hidden'); setTimeout(()=>t.classList.add('hidden'),2200); }
function pick(row,names){ const keys=Object.keys(row); for(const n of names){ const k=keys.find(x=>x.toLowerCase().trim()===n.toLowerCase()); if(k) return row[k]; } for(const n of names){ const k=keys.find(x=>x.toLowerCase().includes(n.toLowerCase())); if(k) return row[k]; } return ''; }

function loadCache(){ try{ const c=JSON.parse(localStorage.getItem(CONFIG.LOCAL_KEY)||'{}'); avance=c.avance||{}; }catch{} }
function saveCache(){ localStorage.setItem(CONFIG.LOCAL_KEY, JSON.stringify({avance, sapFileName, savedAt:new Date().toISOString()})); }

function fileDate(name){
  const m=String(name).match(/(20\d{2})[-_]?([01]\d)[-_]?([0-3]\d)[T _-]?([0-2]\d)?([0-5]\d)?([0-5]\d)?/);
  if(!m) return 0;
  return new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]||'00'}:${m[5]||'00'}:${m[6]||'00'}`).getTime() || 0;
}

async function cargarUltimoExcelGithub(){
  setStatus(els.sapStatus,'🔎 Buscando último Excel en GitHub...');
  const api=`https://api.github.com/repos/${CONFIG.OWNER}/${CONFIG.REPO}/contents/${CONFIG.DATOS_PATH}?ref=main&t=${Date.now()}`;
  const r=await fetch(api,{cache:'no-store'});
  if(!r.ok) throw new Error('No se pudo leer datos/');
  const files=await r.json();
  const excels=files.filter(f=>f.type==='file' && /\.(xlsx|xls|csv)$/i.test(f.name)).sort((a,b)=>{
    const da=fileDate(a.name), db=fileDate(b.name); if(da!==db) return db-da; return b.name.localeCompare(a.name);
  });
  if(!excels.length) throw new Error('No hay Excel en datos/');
  const f=excels[0]; sapFileName=f.name;
  const ab=await (await fetch(f.download_url+'?t='+Date.now(),{cache:'no-store'})).arrayBuffer();
  procesarWorkbook(XLSX.read(ab,{type:'array'}));
  setStatus(els.sapStatus,`✅ Último SAP cargado: ${f.name}`,'ok');
}


function fechaCompraInfo(valor){
  if(valor === undefined || valor === null || valor === '') return {texto:'', tiempo:0};

  if(typeof valor === 'number'){
    const d = XLSX.SSF.parse_date_code(valor);
    if(d){
      const fecha = new Date(d.y, d.m - 1, d.d);
      return {
        texto: fecha.toLocaleDateString('es-CL'),
        tiempo: fecha.getTime()
      };
    }
  }

  const textoOriginal = String(valor).trim();
  const fecha = new Date(textoOriginal);
  if(!Number.isNaN(fecha.getTime())){
    return {
      texto: fecha.toLocaleDateString('es-CL'),
      tiempo: fecha.getTime()
    };
  }

  return {texto:textoOriginal, tiempo:0};
}

async function cargarUltimoExcelComprasGithub(){
  const api=`https://api.github.com/repos/${CONFIG.OWNER}/${CONFIG.REPO}/contents/${CONFIG.COMPRAS_PATH}?ref=main&t=${Date.now()}`;
  const r=await fetch(api,{cache:'no-store'});
  if(!r.ok) throw new Error('No se pudo leer compras/');

  const files=await r.json();
  const excels=files
    .filter(f=>f.type==='file' && /\.(xlsx|xls|csv)$/i.test(f.name))
    .sort((a,b)=>{
      const da=fileDate(a.name), db=fileDate(b.name);
      if(da!==db) return db-da;
      return b.name.localeCompare(a.name);
    });

  if(!excels.length) throw new Error('No hay Excel en compras/');

  const f=excels[0];
  comprasFileName=f.name;

  const respuesta=await fetch(f.download_url+'?t='+Date.now(),{cache:'no-store'});
  if(!respuesta.ok) throw new Error('No se pudo descargar el archivo de compras');

  const ab=await respuesta.arrayBuffer();
  procesarComprasWorkbook(XLSX.read(ab,{type:'array'}));
}

function procesarComprasWorkbook(wb){
  const sheet=wb.Sheets[wb.SheetNames[0]];
  const rows=XLSX.utils.sheet_to_json(sheet,{defval:''});
  const mapa={};

  rows.forEach(r=>{
    const codigo=norm(pick(r,['Material','Código','Codigo','Cod.Material','N° material','codigo_sap']));
    const oc=norm(pick(r,['Documento compras','Documento de compras','Orden de compra','OC']));
    const fechaValor=pick(r,['Fecha documento','Fecha del documento','Fecha OC']);
    const fecha=fechaCompraInfo(fechaValor);

    if(!codigo || !oc) return;

    const actual=mapa[codigo];
    const esMasReciente=!actual
      || fecha.tiempo>actual.tiempo
      || (fecha.tiempo===actual.tiempo && String(oc).localeCompare(String(actual.oc))>0);

    if(esMasReciente){
      mapa[codigo]={
        oc,
        fecha:fecha.texto,
        tiempo:fecha.tiempo
      };
    }
  });

  comprasPorMaterial=mapa;
}

function compraDe(codigo){
  return comprasPorMaterial[codigo] || null;
}

function procesarWorkbook(wb){
  const sheet=wb.Sheets[wb.SheetNames[0]];
  const rows=XLSX.utils.sheet_to_json(sheet,{defval:''});
  materiales=rows.map(r=>{
    const codigo=norm(pick(r,['Material','Código','Codigo','Cod.Material','N° material','codigo_sap']));
    const desc=norm(pick(r,['Texto breve de material','Texto breve','Descripción','Descripcion','Denominación','descripcion']));
    const sap=num(pick(r,['Libre utilización','Libre utilizacion','Stock libre utilización','Stock','Cantidad','stock_sap']));
    const um=norm(pick(r,['Unidad medida base','UMB','Unidad','UM']));
    return {codigo, desc, sap, um, search:(codigo+' '+desc).toLowerCase()};
  }).filter(x=>x.codigo && x.desc && !x.desc.toUpperCase().includes('(NULO)'));
}

async function cargarGoogleSheets(){
  setStatus(els.sheetStatus,'☁️ Conectando con Google Sheets...');
  try{
    const r=await fetch(CONFIG.SHEETS_WEBAPP_URL+'?t='+Date.now(),{cache:'no-store'});
    if(!r.ok) throw new Error('GET Sheets falló');
    const data=await r.json();
    const map={};
    (Array.isArray(data)?data:[]).forEach(row=>{
      const codigo=norm(row.codigo_sap || row.codigo || row.Codigo || row.Código || row[0]);
      if(!codigo) return;
      map[codigo]={
        real: row.stock_real !== '' && row.stock_real !== undefined ? Number(row.stock_real) : undefined,
        oculto: String(row.oculto||'').toUpperCase()==='SI' || row.oculto===true,
        fecha: row.fecha_revision || row.fecha || '',
        fechaOculto: row.fecha_oculto || ''
      };
    });
    avance={...avance,...map};
    saveCache();
    setStatus(els.sheetStatus,'✅ Sincronizado con Google Sheets','ok');
  }catch(e){
    setStatus(els.sheetStatus,'⚠️ Sin conexión a Google Sheets. Usando respaldo local.','warn');
  }
}

async function guardarSheets(codigo){
  const r=avance[codigo] || {};
  const body={ codigo_sap: codigo, oculto: r.oculto?'SI':'', stock_real: r.real ?? '', fecha_revision: r.fecha || '', fecha_oculto: r.fechaOculto || '' };
  try{
    await fetch(CONFIG.SHEETS_WEBAPP_URL,{ method:'POST', mode:'no-cors', headers:{'Content-Type':'text/plain;charset=utf-8'}, body:JSON.stringify(body) });
    setStatus(els.sheetStatus,'✅ Sincronizado con Google Sheets','ok');
    return true;
  }catch(e){
    setStatus(els.sheetStatus,'⚠️ Sin conexión a Google Sheets. Guardado local.','warn');
    return false;
  }
}

function rec(codigo){ avance[codigo]=avance[codigo]||{}; return avance[codigo]; }
function estado(m){ const r=avance[m.codigo]; if(r?.oculto) return 'oculto'; if(!r || r.real===undefined || r.real==='') return 'pendiente'; const real=Number(r.real); if(m.sap===0 && real>0) return 'cero'; if(real<m.sap) return 'rebajar'; if(real>m.sap) return 'revisar'; return 'ok'; }
function estadoLabel(e){ return {ok:'✅ Correcto',rebajar:'🔻 Rebajar SAP',revisar:'⚠️ Revisar',cero:'🔵 SAP 0',oculto:'🚫 Oculto',pendiente:'⏳ Pendiente'}[e]||e; }

function counts(){ const c={todos:materiales.length,pendiente:0,ok:0,rebajar:0,revisar:0,cero:0,oculto:0}; materiales.forEach(m=>{c[estado(m)]++;}); return c; }
function updateCounts(){ const c=counts(); kTotal.textContent=c.todos; kPend.textContent=c.pendiente; kOk.textContent=c.ok; kReb.textContent=c.rebajar; kRev.textContent=c.revisar; kCero.textContent=c.cero; fTodos.textContent=c.todos; fPend.textContent=c.pendiente; fOk.textContent=c.ok; fReb.textContent=c.rebajar; fRev.textContent=c.revisar; fCero.textContent=c.cero; fOcultos.textContent=c.oculto; }
function filtered(){ const q=els.searchInput.value.toLowerCase().trim(); return materiales.filter(m=>{ if(filtro!=='todos' && estado(m)!==filtro) return false; if(q && !m.search.includes(q)) return false; return true; }); }
function render(){ updateCounts(); document.querySelectorAll('[data-filter]').forEach(b=>b.classList.toggle('active', b.dataset.filter===filtro)); const list=filtered(); els.listInfo.textContent=`${list.length} materiales encontrados${list.length>300?' · mostrando primeros 300':''}`; els.cards.innerHTML=list.slice(0,300).map(cardHtml).join('') || '<div class="empty">Sin materiales para mostrar.</div>'; }
function cardHtml(m){
  const e=estado(m), r=avance[m.codigo]||{};
  const compra=compraDe(m.codigo);
  const tieneReal = r.real !== undefined && r.real !== '';
  const real = tieneReal ? Number(r.real) : null;
  const dif = tieneReal ? (real - m.sap) : null;
  const rebajar = (e==='rebajar' && tieneReal) ? (m.sap - real) : null;

  let detalleStock = '';
  if(tieneReal){
    detalleStock = `<br><strong>SAP: ${m.sap} ${m.um||''} · Real: ${real} ${m.um||''}</strong>`;
    if(e==='rebajar'){
      detalleStock += `<br><strong style="color:#c62828;">🔻 Rebajar en SAP: ${rebajar} ${m.um||''}</strong>`;
    }else if(e==='revisar'){
      detalleStock += `<br><strong style="color:#b54708;">⚠️ Revisar diferencia: +${dif} ${m.um||''}</strong>`;
    }else if(e==='ok'){
      detalleStock += `<br><strong style="color:#067647;">✅ Diferencia: 0 ${m.um||''}</strong>`;
    }else if(e==='cero'){
      detalleStock += `<br><strong style="color:#026aa2;">🔵 SAP 0 con stock real: ${real} ${m.um||''}</strong>`;
    }
  }

  const detalleCompra=compra
    ? `<br><strong style="color:#344054;">🛒 Última OC: ${compra.oc} · 📅 Fecha documento: ${compra.fecha||'sin fecha'}</strong>`
    : `<br><strong style="color:#667085;">🛒 Sin OC registrada · 📅 Sin fecha de documento</strong>`;

  return `<article class="material-card" onclick="abrir('${m.codigo}')">
    <h3>${m.codigo} · SAP ${m.sap} ${m.um||''}</h3>
    <p>${m.desc}</p>
    <div class="meta">Última revisión: ${r.fecha||r.fechaOculto||'sin registro'} · Archivo: ${sapFileName||'sin archivo'}${detalleCompra}${detalleStock}</div>
    <span class="badge ${e}">${estadoLabel(e)}</span>
  </article>`;
}
function abrir(codigo){ current=materiales.find(m=>m.codigo===codigo); if(!current) return; const r=rec(codigo); els.dCode.textContent=current.codigo; els.dDesc.textContent=current.desc; els.dSap.textContent=`${current.sap} ${current.um||''}`; els.realInput.value=r.real ?? ''; const compra=compraDe(current.codigo);
  els.dMeta.textContent=`Última revisión: ${r.fecha||r.fechaOculto||'sin registro'} · Archivo: ${sapFileName||'sin archivo'}${compra ? ` · Última OC: ${compra.oc} · Fecha documento: ${compra.fecha||'sin fecha'}` : ''}`; els.unhideBtn.style.display=r.oculto?'block':'none'; updateDrawerState(); els.drawer.classList.remove('hidden'); setTimeout(()=>els.realInput.focus(),100); }
function updateDrawerState(){ if(!current) return; let old=avance[current.codigo]; if(els.realInput.value!==''){ avance[current.codigo]={...old,real:Number(els.realInput.value)}; } const e=estado(current); avance[current.codigo]=old; els.dEstado.className='state-badge '+e; els.dEstado.textContent=estadoLabel(e); }
function closeDrawer(){ els.drawer.classList.add('hidden'); current=null; }
async function saveCurrent(){ if(!current) return; if(els.realInput.value===''){ toast('Ingresa stock real o usa Igual que SAP'); return; } avance[current.codigo]={...rec(current.codigo), real:Number(els.realInput.value), oculto:false, fecha:today()}; saveCache(); render(); await guardarSheets(current.codigo); toast('Guardado'); closeDrawer(); }
async function hideCurrent(){ if(!current) return; avance[current.codigo]={...rec(current.codigo), oculto:true, fechaOculto:today()}; saveCache(); render(); await guardarSheets(current.codigo); toast('Material oculto'); closeDrawer(); }
async function unhideCurrent(){ if(!current) return; avance[current.codigo]={...rec(current.codigo), oculto:false}; saveCache(); render(); await guardarSheets(current.codigo); toast('Material desocultado'); closeDrawer(); }
function sameSap(){ if(!current) return; els.realInput.value=current.sap; updateDrawerState(); }
function continuar(){ const m=materiales.find(x=>estado(x)==='pendiente'); if(m) abrir(m.codigo); else toast('No hay pendientes'); }

async function init(){
  loadCache();
  try{ await cargarUltimoExcelGithub(); }catch(e){ setStatus(els.sapStatus,'❌ No se pudo leer la carpeta datos del repositorio','error'); }
  try{ await cargarUltimoExcelComprasGithub(); }catch(e){ console.warn('No se pudo cargar compras:',e); }
  await cargarGoogleSheets();
  render();
}

document.addEventListener('click',e=>{ const f=e.target.closest('[data-filter]')?.dataset.filter; if(f){ filtro=f; render(); } });
els.searchInput.addEventListener('input',render);
els.realInput.addEventListener('input',updateDrawerState);
$('continueBtn').addEventListener('click',continuar);
$('closeDrawer').addEventListener('click',closeDrawer);
$('sameSapBtn').addEventListener('click',sameSap);
$('saveBtn').addEventListener('click',saveCurrent);
$('hideBtn').addEventListener('click',hideCurrent);
$('unhideBtn').addEventListener('click',unhideCurrent);
init();
