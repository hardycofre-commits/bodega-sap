window.GitHubData = (() => {
  const cfg = window.BODEGA_CONFIG;

  function fechaNombre(name){
    const n = String(name || '');
    const m = n.match(/(20\d{2})[-_]?([01]\d)[-_]?([0-3]\d)[T _-]?([0-2]\d)?([0-5]\d)?([0-5]\d)?(?:\.(\d+))?/);
    if(!m) return 0;
    const [, y, mo, d, h='00', mi='00', s='00'] = m;
    return new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}`).getTime() || 0;
  }

  async function listarExcel(){
    const api = `https://api.github.com/repos/${cfg.OWNER}/${cfg.REPO}/contents/${cfg.DATOS_PATH}?ref=${cfg.BRANCH}&t=${Date.now()}`;
    const res = await fetch(api, { cache: 'no-store' });
    if(!res.ok){
      throw new Error(`No se pudo leer datos/ (${res.status}). Revisa repo, rama main y carpeta datos.`);
    }
    const files = await res.json();
    if(!Array.isArray(files)) throw new Error('La respuesta de GitHub no fue una lista de archivos.');
    return files.filter(f => f.type === 'file' && /\.(xlsx|xls|csv)$/i.test(f.name));
  }

  async function obtenerUltimoExcel(){
    const files = await listarExcel();
    if(!files.length) throw new Error('La carpeta datos no tiene archivos .xlsx, .xls o .csv.');
    files.sort((a,b) => {
      const da = fechaNombre(a.name), db = fechaNombre(b.name);
      if(da !== db) return db - da;
      return String(b.name).localeCompare(String(a.name));
    });
    const file = files[0];
    const url = `${file.download_url}?t=${Date.now()}`;
    const res = await fetch(url, { cache: 'no-store' });
    if(!res.ok) throw new Error('No se pudo descargar el Excel desde GitHub.');
    const buffer = await res.arrayBuffer();
    return { name: file.name, url: file.download_url, buffer, totalFiles: files.length };
  }

  return { obtenerUltimoExcel };
})();
