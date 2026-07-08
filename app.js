const OWNER='hardycofre-commits';
const REPO='inventario-bodega-sap';
const DATOS_PATH='datos';
const STORAGE_KEY='bodegaSapInventario_v4_1';
const SHEETS_WEBAPP_URL='https://script.google.com/macros/s/AKfycbxlntU4x4bOg4CQWIL80T0-gmrIKulE65hvqs9D0npSfGPmGCfVYcAMUyv8hKNsfOPMTg/exec';

let materiales=[], current=null, filtro='rebajar';
let store=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');

function $(id){return document.getElementById(id)}
function norm(v){return String(v??'').trim()}
function num(v){if(v===undefined||v===null||v==='')return 0;return Number(String(v).replace(/\./g,'').replace(',','.'))||0}
function pick(row,names){const keys=Object.keys(row);for(const n of names){let k=keys.find(x=>x.toLowerCase().trim()===n.toLowerCase());if(k)return row[k]}for(const n of names){let k=keys.find(x=>x.toLowerCase().includes(n.toLowerCase()));if(k)return row[k]}return ''}
function saveLocal(){localStorage.setItem(STORAGE_KEY,JSON.stringify(store));}
function syncStatus(txt){$('saveInfo').textContent=txt;}
function sapStatus(txt){$('sapInfo').textContent=txt;}
function rec(code){store[code]=store[code]||{};return store[code]}
function verdad(v){return v===true||['true','si','sí','1','x','oculto'].includes(String(v).toLowerCase().trim())}
function fechaHoy(){return new Date().toLocaleDateString('es-CL')}

function jsonp(url,timeout=12000){
  return new Promise((resolve,reject)=>{
    const cb='cb_'+Date.now()+'_'+Math.random().toString(36).slice(2);
    const s=document.createElement('script');
    const timer=setTimeout(()=>{cleanup();reject(new Error('timeout'))},timeout);
    function cleanup(){clearTimeout(timer);delete window[cb];s.remove();}
    window[cb]=(data)=>{cleanup();resolve(data)};
    s.onerror=()=>{cleanup();reject(new Error('jsonp error'))};
    s.src=url+(url.includes('?')?'&':'?')+'callback='+cb+'&t='+Date.now();
    document.body.appendChild(s);
  });
}

async function cargarAvanceSheets(){
  try{
    syncStatus('🟠 Leyendo Google Sheets...');
    const rows=await jsonp(SHEETS_WEBAPP_URL);
    if(!Array.isArray(rows))throw new Error('Formato inválido');
    for(const row of rows){
      const vals=Object.values(row);
      const codigo=norm(row.codigo_sap||row.Codigo||row.Código||row.codigo||row.Material||row['Código SAP']||vals[0]);
      if(!codigo)continue;
      const realRaw=row.stock_real??row['Stock Real']??row.Real??row.real??row.stock??row['Stock real']??vals[2];
      const fecha=row.fecha_revision||row.Fecha||row.fecha||row['Fecha revisión']||vals[3]||'';
      const oculto=verdad(row.oculto??row.Oculto??vals[1]);
      store[codigo]={...rec(codigo)};
      if(realRaw!==''&&realRaw!==undefined&&realRaw!==null)store[codigo].real=num(realRaw);
      if(fecha)store[codigo].fecha=String(fecha);
      if(oculto){store[codigo].oculto=true;store[codigo].fechaOculto=String(fecha||store[codigo].fechaOculto||'');}
      if(!oculto && row.oculto!==undefined)store[codigo].oculto=false;
    }
    saveLocal();
    syncStatus('🟢 Sincronizado con Google Sheets');
    renderAll();
  }catch(e){
    syncStatus('🟠 Sin conexión a Google Sheets. Usando guardado local.');
  }
}

async function sincronizarMaterial(codigo){
  const m=materiales.find(x=>x.codigo===codigo)||{codigo,desc:'',sap:''};
  const r=rec(codigo);
  const payload={
    codigo_sap:codigo,
    descripcion:m.desc||'',
    stock_sap:m.sap??'',
    stock_real:r.real??'',
    estado:estado(m),
    oculto:r.oculto?'SI':'',
    fecha_revision:r.fecha||r.fechaOculto||fechaHoy(),
    hora:new Date().toLocaleTimeString('es-CL')
  };
  try{
    syncStatus('🟠 Sincronizando con Google Sheets...');
    await fetch(SHEETS_WEBAPP_URL,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload)});
    syncStatus('🟢 Sincronizado con Google Sheets');
    return true;
  }catch(e){
    syncStatus('🟠 Sin conexión a Google Sheets. Guardado local pendiente.');
    return false;
  }
}

function fechaArchivoGithub(f){
  const n=f.name||'';
  const m=n.match(/(20\d{2})[-_]?(\d{2})[-_]?(\d{2})[T _-]?(\d{2})?(\d{2})?(\d{2})?/);
  if(m)return new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]||'00'}:${m[5]||'00'}:${m[6]||'00'}`).getTime();
  return 0;
}
async function cargarDesdeGithub(){
  try{
    sapStatus('Buscando último Excel en GitHub...');
    const api=`https://api.github.com/repos/${OWNER}/${REPO}/contents/${DATOS_PATH}?t=${Date.now()}`;
    const r=await fetch(api,{cache:'no-store'});
    if(!r.ok)throw new Error('No existe carpeta datos o repo incorrecto');
    const files=await r.json();
    const excels=files.filter(f=>f.type==='file'&&/\.(xlsx|xls|csv)$/i.test(f.name)).sort((a,b)=>fechaArchivoGithub(b)-fechaArchivoGithub(a)||b.name.localeCompare(a.name));
    if(!excels.length)throw new Error('Sin Excel');
    const file=excels[0];
    await cargarExcelUrl(file.download_url+'?t='+Date.now());
    sapStatus('Último SAP cargado: '+file.name);
    $('manualBox').classList.add('hidden');
  }catch(e){
    sapStatus('Sin Excel automático. Usa carga manual o sube un Excel a /datos.');
  }
}
async function cargarExcelUrl(url){const ab=await (await fetch(url,{cache:'no-store'})).arrayBuffer();procesarWorkbook(XLSX.read(ab,{type:'array'}));}
function procesarWorkbook(wb){
  const sheet=wb.Sheets[wb.SheetNames[0]];
  const rows=XLSX.utils.sheet_to_json(sheet,{defval:''});
  materiales=rows.map(r=>{
    const codigo=norm(pick(r,['Material','Código','Codigo','Cod.Material','N° material','codigo_sap','Código SAP']));
    const desc=norm(pick(r,['Texto breve de material','Texto breve','Descripción','Descripcion','Denominación','descripcion']));
    const sap=num(pick(r,['Libre utilización','Libre utilizacion','Stock libre utilización','Stock','Cantidad','stock_sap']));
    const um=norm(pick(r,['Unidad medida base','UMB','Unidad','UM']));
    const almacen=norm(pick(r,['Almacén','Almacen','Centro']));
    return{codigo,desc,sap,um,almacen,search:(codigo+' '+desc).toLowerCase()}
  }).filter(x=>x.codigo&&x.desc);
  renderAll();
}

$('fileInput').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;sapStatus('Archivo manual: '+f.name);const ab=await f.arrayBuffer();procesarWorkbook(XLSX.read(ab,{type:'array'}));});
$('searchInput').addEventListener('input',()=>{renderResults();abrirSiCodigoExacto();});
function abrirSiCodigoExacto(){const q=$('searchInput').value.trim();if(q.length>=5){const m=materiales.find(x=>x.codigo===q&&!rec(x.codigo).oculto);if(m)abrir(m.codigo);}}
function estado(m){const r=store[m.codigo];if(r?.oculto)return'oculto';if(!r||r.real===undefined)return'pendiente';const real=Number(r.real);if(m.sap===0&&real>0)return'cero';if(real<m.sap)return'rebajar';if(real>m.sap)return'revisar';return'ok'}
function estadoTexto(e,m){if(e==='ok')return'🟢 Coincide';if(e==='rebajar')return`🔴 Rebajar ${m.sap-rec(m.codigo).real}`;if(e==='revisar')return'🟡 Revisar diferencia';if(e==='cero')return'🔵 SAP 0 con stock';if(e==='oculto')return'🚫 Oculto';return'⚪ Pendiente'}
function renderKpis(){let t=0,p=0,ok=0,reb=0,rev=0,cero=0;for(const m of materiales){const e=estado(m);if(!rec(m.codigo).oculto&&m.sap>0)t++;if(e==='pendiente'&&!rec(m.codigo).oculto&&m.sap>0)p++;if(e==='ok')ok++;if(e==='rebajar')reb++;if(e==='revisar')rev++;if(e==='cero')cero++;}kTotal.textContent=t;kPend.textContent=p;kOk.textContent=ok;kReb.textContent=reb;kRev.textContent=rev;kCero.textContent=cero;}
function renderResults(){const q=$('searchInput').value.toLowerCase().trim();let base=materiales.filter(m=>!rec(m.codigo).oculto&&(q?m.search.includes(q):m.sap>0));const total=base.length;let list=base.slice(0,300);$('results').innerHTML=`<p class="small"><b>${total}</b> materiales encontrados${total>300?' · mostrando primeros 300':''}</p>`+list.map(m=>`<div class="item" onclick="abrir('${m.codigo}')"><div class="code">${m.codigo} · SAP ${m.sap} ${m.um||''}</div><div class="desc">${m.desc}</div><div class="meta">${estadoTexto(estado(m),m)} · Última revisión: ${rec(m.codigo).fecha||'sin registro'}</div></div>`).join('');}
function abrir(codigo){current=materiales.find(m=>m.codigo===codigo);if(!current)return;$('homePanel').classList.add('hidden');$('detailPanel').classList.remove('hidden');dCode.textContent=current.codigo;dDesc.textContent=current.desc;dSap.textContent=current.sap+' '+(current.um||'');const r=rec(current.codigo);realInput.value=r.real??'';dFecha.textContent='Última revisión: '+(r.fecha||r.fechaOculto||'sin registro');actualizaEstadoDetalle();realInput.focus();}
realInput.addEventListener('input',actualizaEstadoDetalle);
function actualizaEstadoDetalle(){if(!current)return;let temp=JSON.parse(JSON.stringify(store));if(realInput.value!=='')temp[current.codigo]={...temp[current.codigo],real:Number(realInput.value)};let old=store;store=temp;const e=estado(current);store=old;dEstado.className='state '+e;dEstado.textContent=estadoTexto(e,current);}
function volverBuscador(){$('detailPanel').classList.add('hidden');$('homePanel').classList.remove('hidden');$('searchInput').focus();renderAll();}
function igualSap(){if(current){realInput.value=current.sap;actualizaEstadoDetalle();}}
async function guardarRevision(){if(!current)return;if(realInput.value===''){alert('Ingresa stock real o usa Igual que SAP.');return;}store[current.codigo]={...rec(current.codigo),real:Number(realInput.value),fecha:fechaHoy(),oculto:false};saveLocal();await sincronizarMaterial(current.codigo);$('searchInput').value='';volverBuscador();}
async function ocultarMaterial(){if(!current)return;store[current.codigo]={...rec(current.codigo),oculto:true,fechaOculto:fechaHoy()};saveLocal();await sincronizarMaterial(current.codigo);$('searchInput').value='';volverBuscador();}
function continuarPendiente(){let m=materiales.find(x=>!rec(x.codigo).oculto&&x.sap>0&&estado(x)==='pendiente');if(m)abrir(m.codigo);else alert('No hay pendientes con stock SAP mayor a cero.');}
function setFiltro(f,el){filtro=f;document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));el.classList.add('active');renderList();}
function renderList(){let list=materiales.filter(m=>estado(m)===filtro);if(filtro==='pendiente')list=list.filter(m=>m.sap>0&&!rec(m.codigo).oculto);$('listBody').innerHTML=list.map(m=>{const r=rec(m.codigo);const real=r.real??'';const dif=real===''?'':(m.sap-Number(real));return`<tr onclick="abrir('${m.codigo}')"><td>${m.codigo}</td><td>${m.desc}</td><td class="num">${m.sap}</td><td class="num">${real}</td><td class="num">${dif}</td><td>${r.fecha||r.fechaOculto||''}</td></tr>`}).join('')||'<tr><td colspan="6" class="small">Sin materiales en este listado.</td></tr>';}
function renderAll(){renderKpis();renderResults();renderList();}

(async function init(){renderAll();await Promise.allSettled([cargarDesdeGithub(),cargarAvanceSheets()]);renderAll();})();
