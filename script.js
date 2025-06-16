const API_URL_LIST   = 'http://204.236.199.57:5678/webhook/candidates';
const API_URL_PERSON = 'http://204.236.199.57:5678/webhook/0e7cbf8b-c960-48d1-a3e6-da817e8f70db/canditate';
const API_URL_PATCH  = 'http://204.236.199.57:5678/webhook/2534c1f7-6624-42e6-bc5a-f2ee6c6679bb/candidate/status/review';

const limit = 5;
let offset = 0, page = 1;

const $tbody      = document.querySelector('#records tbody');
const $pageInfo   = document.getElementById('pageInfo');
const $prev       = document.getElementById('prev');
const $next       = document.getElementById('next');
const $viewer     = document.getElementById('viewer');
const $personName = document.getElementById('personName');
const $fileList   = document.getElementById('fileList');
const $pdfFrame   = document.getElementById('pdfFrame');

// ---------- LISTA PRINCIPAL ----------
async function loadList(){
  $tbody.innerHTML = `<tr><td colspan="6">Cargando…</td></tr>`;
  try{
    const res  = await fetch(`${API_URL_LIST}?offset=${offset}&limit=${limit}`);
    if(!res.ok) throw new Error('Error al consultar la lista');
    const data = await res.json();

    $tbody.innerHTML = data.map(r=>`
      <tr>
        <td>${r.id}</td>
        <td>${r.full_name}</td>
        <td>${r.id_number}</td>
        <td>${new Date(r.created_at).toLocaleString()}</td>
        <td>
          <button class="pill ${r.is_reviewed?'yes':'no'}"
                  data-id="${r.id}"
                  data-reviewed="${r.is_reviewed}">
            ${r.is_reviewed ? 'Revisado' : 'Pendiente'}
          </button>
        </td>
        <td><button data-details data-id="${r.id}" data-name="${r.full_name}">Ver</button></td>
      </tr>`).join('');

    $prev.disabled = offset===0;
    $next.disabled = data.length<limit;
    $pageInfo.textContent = `Página ${page}`;
  }catch(err){
    $tbody.innerHTML = `<tr><td colspan="6">${err.message}</td></tr>`;
  }
}

// ---------- PATCH DE ESTADO ----------
async function toggleReview(id, currentState, $btn){
  const reviewed = !JSON.parse(currentState); // nuevo estado
  $btn.textContent = '…';
  try{
    const res = await fetch(`${API_URL_PATCH}/${id}`, {
      method : 'PATCH',
      headers: { 'Content-Type':'application/json' },
      // body   : JSON.stringify({ is_reviewed: reviewed })
    });
    if(!res.ok) throw new Error('No se pudo actualizar');
    // UI optimista
    $btn.dataset.reviewed = reviewed;
    $btn.classList.toggle('yes', reviewed);
    $btn.classList.toggle('no', !reviewed);
    $btn.textContent = reviewed ? 'Revisado' : 'Pendiente';
  }catch(err){
    alert(err.message);
    loadList();
  }
}

// ---------- DETALLES (PDFs) ----------
async function loadPerson(id,name){
  $viewer.style.display='block';
  $personName.textContent = name;
  $fileList.innerHTML = '<li>Cargando archivos…</li>';
  $pdfFrame.src = '';
  try{
    const res  = await fetch(`${API_URL_PERSON}/${id}`);
    if(!res.ok) throw new Error('Error al obtener detalles');
    const [person] = await res.json();
    const files = person.files||[];
    if(!files.length){$fileList.innerHTML='<li>No hay archivos</li>';return;}
    $fileList.innerHTML = files.map((f,i)=>`
      <li><a href="#" data-url="${f.s3_url}">📄 Archivo ${i+1} (${f.file_type})</a></li>`
    ).join('');
  }catch(err){
    $fileList.innerHTML=`<li>${err.message}</li>`;
  }
}

// ---------- EVENTOS ----------
$prev.onclick = ()=>{if(offset>=limit){offset-=limit;page--;loadList();}};
$next.onclick = ()=>{offset+=limit;page++;loadList();};

document.addEventListener('click', e=>{
  if(e.target.matches('button[data-reviewed]')){
    const $btn = e.target;
    toggleReview($btn.dataset.id, $btn.dataset.reviewed, $btn);
  }
  if(e.target.matches('button[data-details]')){
    loadPerson(e.target.dataset.id, e.target.dataset.name);
  }
  if(e.target.matches('a[data-url]')){
    e.preventDefault();
    $pdfFrame.src = e.target.dataset.url + '#toolbar=0';
  }
});

// ---------- INIT ----------
loadList();
