// app.js - FINAL (Dokumen per Kegiatan: planning/{idplan}/documents & visiting/{idvisit}/documents)

// --- Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getDatabase, ref, onValue, set, update, remove, push } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-database.js";

// --- Supabase SDK
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// -------------- CONFIG --------------
const firebaseConfig = {
  apiKey: "AIzaSyBsL8V7-Bqjl7MKSimMq0ZkAzJjswgurdQ", 
  authDomain: "tellokom.firebaseapp.com",
  databaseURL: "https://tellokom-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "tellokom",
  storageBucket: "tellokom.firebasestorage.app",
  messagingSenderId: "73519990087",
  appId: "1:73519990087:web:e0d497632bef43aa2f3488"
};

const SUPABASE_URL = 'https://brbfjyrytesqjmejmtuh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyYmZqeXJ5dGVzcWptZWptdHVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwODM3NzcsImV4cCI6MjA3OTY1OTc3N30.8zX4pQAImFmoPmjj_Af09WwrO0QBXYDk_n9yTwGT9Po';
const BUCKET_NAME = 'kegiatan-dokumen';

// -------------- Init --------------
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// -------------- Utils --------------
const $ = s => document.querySelector(s);
const $all = s => document.querySelectorAll(s);
const mapToArray = obj => obj ? Object.values(obj) : [];
const nowDateTime = () => new Date().toLocaleDateString('id-ID', {year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit', hour12:false});

// -------------- Global Data --------------
let planning = [];
let visiting = [];
let masterpelanggan = [];

// Sample AM data (tetap)
const amData = [
  { nik: '406767', nama: 'AYU ULLAH', wilayah: 'SULTRA' },
  { nik: '730007', nama: 'FARIDA', wilayah: 'SULTRA' },
  { nik: '406247', nama: 'ZULFIKAR', wilayah: 'SULTRA' },
  { nik: '916695', nama: 'VARAMITA KIRRIK', wilayah: 'SULTRA' },
  { nik: '401805', nama: 'AHMAD MISWAR', wilayah: 'SULSELBAR' },
  { nik: '405127', nama: 'HARMIVA SUDIARTI', wilayah: 'SULSELBAR' },
  { nik: '402012', nama: 'HENDRA', wilayah: 'SULSELBAR' },
  { nik: '936355', nama: 'NELLA AGNES', wilayah: 'SULSELBAR' },
  { nik: '406565', nama: 'MASTINA', wilayah: 'SULSELBAR' },
  { nik: '402662', nama: 'OVIANA KARRANG', wilayah: 'SULSELBAR' },
  { nik: '730007', nama: 'FARIDA', wilayah: 'MAKASSAR' },
  { nik: '405126', nama: 'NUR AWAL FADLI ARWIN', wilayah: 'MAKASSAR' },
  { nik: '404465', nama: 'RIO ARDIANSYAH', wilayah: 'MAKASSAR' },
  { nik: '950432', nama: 'WULAN SETYA NINGSIH', wilayah: 'MAKASSAR' },
  { nik: '405428', nama: 'ZULKIFLI KAMANG', wilayah: 'MAKASSAR' },
];

// -------------- Realtime Listener --------------
onValue(ref(db), (snapshot) => {
  if (snapshot.exists()) {
    const data = snapshot.val();
    planning = mapToArray(data.planning || {});
    visiting = mapToArray(data.visiting || {});
    masterpelanggan = mapToArray(data.masterpelanggan || {});
    renderPage();
  } else {
    planning = []; visiting = []; masterpelanggan = [];
    renderPage();
  }
});

// -------------- Render & Pages --------------
function getActivePage(){
  return $all('.nav li.active')[0]?.dataset.page || 'dashboard';
}

function renderPage(){
  const page = getActivePage();
  $('#page-title').innerText = page.split('-').map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(' ');
  let content = '';
  switch(page){
    case 'dashboard': content = renderDashboard(); break;
    case 'master-pelanggan': content = renderMasterPelanggan(); break;
    default: content = '<p>Halaman belum dibuat</p>';
  }
  $('#page-content').innerHTML = content;
  hydrateListeners();
}

function renderDashboard(){
  const today = new Date().toISOString().split('T')[0];
  const totalKegiatan = planning.length + visiting.length;
  const totalBiaya = planning.reduce((s,p)=>s+(p.biaya||0),0) + visiting.reduce((s,v)=>s+(v.biaya||0),0);

  const upcomingPlanning = planning
    .filter(p => (p.tglMulai || p.tgl) >= today)
    .sort((a,b)=>new Date(a.tglMulai||a.tgl)-new Date(b.tglMulai||b.tgl))
    .slice(0,5);

  const planningListHtml = upcomingPlanning.length === 0 
    ? '<tr><td colspan="3" style="text-align:center; color:var(--muted);">Tidak ada rencana kegiatan mendatang.</td></tr>'
    : upcomingPlanning.map(p => {
        const cust = masterpelanggan.find(c => c.idcust === p.idcust);
        const tglMulai = p.tglMulai || p.tgl;
        const tglSelesai = p.tglSelesai || p.tglMulai || p.tgl;
        const tanggalTampil = (tglMulai === tglSelesai) ? tglMulai : `${tglMulai} s/d ${tglSelesai}`;
        return `<tr><td>${tanggalTampil}</td><td>${cust ? cust.namacust : p.idcust}</td><td>${p.jeniskegiatan||'Planning'}</td></tr>`;
    }).join('');

  return `
    <div class="stats-grid">
      <div class="stat-box"><p>Total Pelanggan</p><h3>${masterpelanggan.length}</h3></div>
      <div class="stat-box" style="background:#e6ffed"><p>Total Kegiatan (Plan & Visit)</p><h3>${totalKegiatan}</h3></div>
      <div class="stat-box" style="background:#fff3e0"><p>Total Biaya Kegiatan</p><h3>Rp ${totalBiaya.toLocaleString('id-ID')}</h3></div>
    </div>

    <div class="card" style="margin-bottom: 16px;">
      <h3>Upcoming Planning</h3>
      <table style="width:100%; font-size:14px;">
        <thead><tr><th style="width:200px">Tanggal</th><th style="width:200px">Pelanggan</th><th>Jenis Kegiatan</th></tr></thead>
        <tbody>${planningListHtml}</tbody>
      </table>
    </div>

    <div class="card">${renderCalendar()}</div>
  `;
}

function renderMasterPelanggan(){
  // Build rows for planning & visiting, and include docs button that opens per-kegiatan manager
  const planningRows = planning.map(p => ({
    type: 'planning', id: p.idplan, tglMulai: p.tglMulai || p.tgl || '-', tglSelesai: p.tglSelesai || p.tglMulai || p.tgl || '-', desc: p.deskripsi||'', biaya: p.biaya, wilayah: p.wilayah||'-', am: p.namaAM||'-', jeniskegiatan: p.jeniskegiatan||'Planning', idcust: p.idcust, sid: p.sid||'-', idunik: 'P'+p.idplan
  }));
  const visitingRows = visiting.map(v => ({
    type: 'visiting', id: v.idvisit, tglMulai: v.tglMulai || v.tgl || '-', tglSelesai: v.tglSelesai || v.tglMulai || v.tgl || '-', desc: v.deskripsi||'', biaya: v.biaya, wilayah: v.wilayah||'-', am: v.namaAM||'-', jeniskegiatan: v.jeniskegiatan||'Visiting', idcust: v.idcust, sid: v.sid||'-', idunik: 'V'+v.idvisit
  }));

  const kegiatanRows = [...planningRows, ...visitingRows].sort((a,b) => new Date(b.tglMulai) - new Date(a.tglMulai));

  return `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <h3>Master Pelanggan</h3>
        <div><button class="btn ghost" id="add-kegiatan">➕ Tambah Kegiatan</button></div>
      </div>

            ${masterpelanggan.map(m=>{
              const numDocsCustomer = Object.keys(m.documents || {}).length || 0;
              const numPicCc = (Object.keys(m.pic || {}).length || 0) + (Object.keys(m.costcenters || {}).length || 0);
              return `<tr>
                <td>${m.idcust}</td>
                <td>${m.tglbuat || '-'}</td>
                <td>${m.namacust}</td>
                <td>${m.namaAM || '-'}</td>
                <td>
                  <button class="action-btn action-edit" data-act="edit-cust" data-id="${m.idcust}">✏️</button>
                  <button class="action-btn action-delete" data-act="del-cust" data-id="${m.idcust}">🗑️</button>
                  <button class="btn primary" style="padding:6px 8px; margin-left:8px; font-size:12px;" data-act="manage-cust-docs" data-id="${m.idcust}">📁 Dokumen Customer (${numDocsCustomer})</button>
                  <button class="btn ghost" style="padding:6px 8px; margin-left:4px; font-size:12px;" data-act="manage-pic-cc" data-id="${m.idcust}">👥 PIC/CC (${numPicCc})</button>
                </td>
              </tr>`;
            }).join('')}
        </tbody>
      </table>

      <div style="margin-top:16px; overflow-x:auto;">
        <h4 style="margin:8px 0 6px">Daftar Kegiatan</h4>
        <table style="min-width:1200px;">
          <thead><tr><th>Tipe</th><th>Tanggal (Mulai s/d Selesai)</th><th>Wilayah</th><th>AM</th><th>Aktivitas</th><th>Pelanggan</th><th>SID</th><th>Deskripsi</th><th>Biaya</th><th>Dokumen</th><th>Aksi</th></tr></thead>
          <tbody>
            ${kegiatanRows.map(k=>{
              const cust = masterpelanggan.find(c => c.idcust === k.idcust);
              // jumlah dokumen untuk kegiatan (jika ada)
              const numDocs = (cust && cust.documentsByActivity && cust.documentsByActivity[k.type] && Object.values(cust.documentsByActivity[k.type] || {}).filter(d=>d.parentId===k.id).length) 
                              || ( (k._numDocs) ? k._numDocs : 0 ); // fallback
              const tanggalTampil = (k.tglMulai === k.tglSelesai) ? k.tglMulai : `${k.tglMulai} s/d ${k.tglSelesai}`;
              return `<tr>
                <td>${k.type.toUpperCase()}</td>
                <td>${tanggalTampil}</td>
                <td>${k.wilayah}</td>
                <td>${k.am}</td>
                <td>${k.jeniskegiatan}</td>
                <td>${cust ? cust.namacust : k.idcust}</td>
                <td>${k.sid}</td>
                <td class="small" title="${k.desc}">${k.desc.substring(0,30)}${k.desc.length>30?'...':''}</td>
                <td>Rp ${(k.biaya||0).toLocaleString('id-ID')}</td>
                <td>
                  <button class="btn primary" style="padding:6px 8px; font-size:12px;" data-act="manage-event-docs" data-type="${k.type}" data-id="${k.id}">📁 Docs (${numDocs})</button>
                </td>
                <td>
                  <button class="action-btn action-edit" data-act="edit-evt" data-type="${k.type}" data-id="${k.id}">✏️</button>
                  <button class="action-btn action-delete" data-act="del-evt" data-type="${k.type}" data-id="${k.id}">🗑️</button>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// -------------- Calendar (tidak diubah signifikan) --------------
let currentCalendarDate = new Date();
function renderCalendar() {
  const date = currentCalendarDate;
  const year = date.getFullYear();
  const month = date.getMonth();
  const today = new Date().toISOString().split('T')[0];
  const monthNames = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month+1, 0).getDate();
  const prevLastDate = new Date(year, month, 0).getDate();

  let calendarDays = [];
  const startDay = firstDay === 0 ? 6 : firstDay - 1;
  for(let i = startDay; i>0; i--) calendarDays.push({date: prevLastDate - i + 1, month: 'prev', events: []});
  for(let i=1;i<=lastDate;i++){
    const fullDate = `${year}-${String(month+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
    const events = [...planning, ...visiting].filter(e=>{
      const tglMulai = e.tglMulai || e.tgl;
      const tglSelesai = e.tglSelesai || e.tglMulai || e.tgl;
      return tglMulai && tglSelesai && tglMulai <= fullDate && fullDate <= tglSelesai;
    });
    calendarDays.push({ date: i, month: 'current', isToday: fullDate===today, fullDate, events });
  }
  const totalDays = calendarDays.length;
  const remainingDays = totalDays % 7 === 0 ? 0 : 42 - totalDays;
  for(let i=1;i<=remainingDays;i++) calendarDays.push({date: i, month:'next', events: []});

  const currentMonthYear = `${monthNames[month]} ${year}`;
  const gridHtml = calendarDays.map(day=>{
  const eventBadges = day.events.slice(0,3).map(e => {
  const namaKegiatan = e.jeniskegiatan || (e.idplan ? 'Planning' : 'Visiting');
  const badgeClass = e.idplan ? 'plan' : 'visit';
  return `<span class="event-badge badge-${badgeClass}" title="${namaKegiatan}">${namaKegiatan}</span>`;
}).join('');
    const extra = day.events.length>3?`<span class="event-more">+${day.events.length-3}</span>`:'';
    const cls = ['calendar-day']; if(day.month!=='current') cls.push('other-month'); if(day.isToday) cls.push('today');
    const dataAttr = day.month==='current' ? `data-date="${day.fullDate}"` : '';
    return `<div class="${cls.join(' ')}" ${dataAttr}><div class="calendar-day-number">${day.date}</div><div class="events-list">${eventBadges}${extra}</div></div>`;
  }).join('');

  return `
    <div class="calendar">
      <div class="calendar-header"><h4 style="margin:0">${currentMonthYear}</h4><div class="calendar-nav"><button id="prev-month">←</button><button id="next-month">→</button></div></div>
      <div class="calendar-grid">
        <div class="calendar-day-header">Sen</div><div class="calendar-day-header">Sel</div><div class="calendar-day-header">Rab</div><div class="calendar-day-header">Kam</div><div class="calendar-day-header">Jum</div><div class="calendar-day-header">Sab</div><div class="calendar-day-header">Min</div>
        ${gridHtml}
      </div>
    </div>
  `;
}

function changeMonth(delta){ currentCalendarDate.setMonth(currentCalendarDate.getMonth()+delta); renderPage(); }

// -------------- CRUD Pelanggan & Kegiatan (dipertahankan) --------------
function openModalAddCust(){ $('#modal-add-cust').style.display='flex'; }
function closeModalAddCust(){ $('#modal-add-cust').style.display='none'; }
async function saveNewCustomer(){
  const idcust = $('#ac-idcust').value.trim().toUpperCase();
  const namacust = $('#ac-name').value.trim();
  const namaAM = $('#ac-am').value.trim();
  const tglbuat = new Date().toISOString().split('T')[0];
  if(!idcust || !namacust) return alert('ID Customer dan Nama Pelanggan wajib diisi!');
  if(masterpelanggan.some(c=>c.idcust===idcust)) return alert('ID Customer sudah ada!');
  try{ await set(ref(db, `masterpelanggan/${idcust}`), { idcust, namacust, namaAM, tglbuat }); alert('✅ Pelanggan baru berhasil disimpan.'); closeModalAddCust(); }catch(err){ console.error(err); alert('Gagal menyimpan: '+err.message); }
}

function openEditCustomer(idcust){ const cust = masterpelanggan.find(c=>c.idcust===idcust); if(!cust) return alert('Pelanggan tidak ditemukan.'); $('#ec-idcust').value=cust.idcust; $('#ec-name').value=cust.namacust; $('#ec-am').value=cust.namaAM||''; $('#modal-edit-cust').style.display='flex'; }
function closeModalEditCust(){ $('#modal-edit-cust').style.display='none'; }
async function saveEditCustomer(){ const idcust = $('#ec-idcust').value; const namacust = $('#ec-name').value.trim(); const namaAM = $('#ec-am').value.trim(); if(!namacust) return alert('Nama Pelanggan wajib diisi!'); try{ await update(ref(db, `masterpelanggan/${idcust}`), { namacust, namaAM }); alert('✅ Data pelanggan berhasil diperbarui.'); closeModalEditCust(); }catch(err){ console.error(err); alert('Gagal memperbarui: '+err.message); } }

function openModalAddEdit(type='planning', id=null){
  const isEdit = id !== null;
  $('#ae-title').innerText = isEdit ? 'Edit Kegiatan' : 'Tambah Kegiatan';
  $('#ae-id').value = id || '';
  $('#ae-type').value = type;
  const custOptions = '<option value="">-- Pilih Pelanggan --</option>' + masterpelanggan.map(c => `<option value="${c.idcust}">${c.namacust}</option>`).join('');
  const aeCustElement = $('#ae-cust');
  if(aeCustElement && aeCustElement.tagName === 'SELECT') aeCustElement.innerHTML = custOptions;

  let eventData = {};
  if (isEdit) eventData = (type==='planning'?planning:visiting).find(e => (type==='planning'?e.idplan:e.idvisit)===id) || {};

  if(isEdit && eventData){
    $('#ae-tgl-mulai').value = eventData.tglMulai || eventData.tgl || new Date().toISOString().split('T')[0];
    $('#ae-tgl-akhir').value = eventData.tglSelesai || eventData.tglMulai || eventData.tgl || new Date().toISOString().split('T')[0];
    $('#ae-judul').value = eventData.jeniskegiatan || '';
    $('#ae-desc').value = eventData.deskripsi || '';
    $('#ae-biaya').value = eventData.biaya || 0;
    if(aeCustElement) aeCustElement.value = eventData.idcust || '';
    $('#ae-sid').value = eventData.sid || '';
    const selectedWilayah = eventData.wilayah || '';
    const selectedAmNik = eventData.amNik || '';
    $('#ae-wilayah').innerHTML = getWilayahOptions(selectedWilayah);
    $('#ae-am').innerHTML = getAmOptions(selectedWilayah, selectedAmNik);
  } else {
    $('#ae-tgl-mulai').value = new Date().toISOString().split('T')[0];
    $('#ae-tgl-akhir').value = new Date().toISOString().split('T')[0];
    $('#ae-judul').value = '';
    $('#ae-desc').value = '';
    $('#ae-biaya').value = 0;
    if(aeCustElement) aeCustElement.value = '';
    $('#ae-sid').value = '';
    $('#ae-wilayah').innerHTML = getWilayahOptions('');
    $('#ae-am').innerHTML = getAmOptions('', '');
  }

  $('#modal-add-edit').style.display = 'flex';
  $('#ae-wilayah').onchange = (e) => { $('#ae-am').innerHTML = getAmOptions(e.target.value, ''); };

  // Re-attach save btn
  const oldSaveBtn = $('#ae-save');
  const newSaveBtn = oldSaveBtn.cloneNode(true);
  oldSaveBtn.parentNode.replaceChild(newSaveBtn, oldSaveBtn);
  newSaveBtn.onclick = saveAddEdit;
  const oldCancel = $('#ae-cancel');
  const newCancel = oldCancel.cloneNode(true);
  oldCancel.parentNode.replaceChild(newCancel, oldCancel);
  newCancel.onclick = closeModalAddEdit;
}

function closeModalAddEdit(){ $('#modal-add-edit').style.display='none'; }

function getAmOptions(selectedWilayah, selectedAmNik){
  const uniqueAms = amData.filter(am => am.wilayah === selectedWilayah);
  let options = '<option value="">-- Pilih AM --</option>';
  uniqueAms.forEach(am => { const isSelected = am.nik === selectedAmNik; options += `<option value="${am.nik}" ${isSelected?'selected':''}>${am.nama} (${am.nik})</option>`; });
  return options;
}
function getWilayahOptions(selectedWilayah){
  const uniqueWilayah = [...new Set(amData.map(am=>am.wilayah))];
  let options = '<option value="">-- Pilih Wilayah --</option>';
  uniqueWilayah.forEach(w => { const isSelected = w===selectedWilayah; options += `<option value="${w}" ${isSelected?'selected':''}>${w}</option>`; });
  return options;
}

async function saveAddEdit(){
  const type = $('#ae-type').value;
  const tglMulai = $('#ae-tgl-mulai').value;
  const tglSelesai = $('#ae-tgl-akhir').value;
  const judul = $('#ae-judul').value.trim();
  const desc = $('#ae-desc').value.trim();
  const biaya = parseFloat($('#ae-biaya').value) || 0;
  const idcust = $('#ae-cust').value;
  const wilayah = $('#ae-wilayah').value;
  const amNik = $('#ae-am').value;
  const sid = $('#ae-sid').value.trim();
  const id = $('#ae-id').value;
  const isEdit = !!id;
  if(!tglMulai || !tglSelesai || !judul || !idcust) return alert('Tanggal Mulai & Selesai, Jenis Kegiatan, dan Pelanggan wajib diisi!');
  if(tglMulai > tglSelesai) return alert('Tanggal Mulai tidak boleh setelah Tanggal Selesai!');
  const namaAM = amData.find(am=>am.nik===amNik)?.nama || 'Unknown / Not Set';
  const selectedWilayah = wilayah || 'Not Set';
  const baseData = { tglMulai, tglSelesai, jeniskegiatan: judul, deskripsi: desc, biaya, idcust, wilayah: selectedWilayah, namaAM, amNik: amNik || 'Not Set', sid };

  try{
    if(isEdit){
      await set(ref(db, `${type}/${id}`), {...baseData, ...(type==='planning'?{idplan:id}:{idvisit:id})});
    } else {
      const newRef = push(ref(db, type));
      const newKey = newRef.key;
      const newData = {...baseData, ...(type==='planning'?{idplan:newKey}:{idvisit:newKey})};
      await set(newRef, newData);
    }
    alert(`✅ Kegiatan ${type.toUpperCase()} berhasil ${isEdit?'diperbarui':'ditambahkan'}!`);
    closeModalAddEdit();
  }catch(e){ console.error(e); alert(`Gagal menyimpan kegiatan ${type.toUpperCase()}. Cek konsol.`); }
}

async function deleteEvent(type, id){ if(!confirm(`Yakin ingin menghapus kegiatan ${type.toUpperCase()} dengan ID ${id}?`)) return; try{ await remove(ref(db, `${type}/${id}`)); alert(`✅ Kegiatan ${type.toUpperCase()} berhasil dihapus!`); }catch(e){ console.error(e); alert(`Gagal menghapus kegiatan ${type.toUpperCase()}. Cek konsol.`); } }

// -------------- Document Manager (Per Kegiatan & Customer) --------------
/*
Paths supported:
- Customer-level docs (opsional): masterpelanggan/{idcust}/documents/{uuid}
- Event-level docs (pilihanmu - utama): planning/{idplan}/documents/{uuid}  OR visiting/{idvisit}/documents/{uuid}
When opening manager, pass an object: { scope: 'event'|'customer', type: 'planning'|'visiting' (if event), id: '<id>' , idcust: '<idcust>' (optional) }
*/

function openDocumentManagerForEvent(type, id, idcust = '') {
  // type: 'planning' or 'visiting', id: idplan/idvisit
  $('#doc-manager-title').innerText = `📁 Dokumen: ${type.toUpperCase()} - ${id}`;
  $('#doc-list-container').innerHTML = '<p style="color:var(--muted); text-align:center">Memuat daftar dokumen...</p>';
  $('#doc-upload-btn').dataset.scope = 'event';
  $('#doc-upload-btn').dataset.type = type;
  $('#doc-upload-btn').dataset.id = id;
  $('#doc-upload-btn').dataset.idcust = idcust || '';
  $('#doc-file-input').value = '';
  $('#doc-upload-section').style.display = 'block';
  $('#modal-doc-manager').style.display = 'flex';
  fetchAndRenderEventDocs(type, id);
  // Re-attach upload listener (replace node)
  const oldUpload = $('#doc-upload-btn');
  const newUpload = oldUpload.cloneNode(true);
  oldUpload.parentNode.replaceChild(newUpload, oldUpload);
  newUpload.dataset.scope = 'event';
  newUpload.dataset.type = type;
  newUpload.dataset.id = id;
  newUpload.dataset.idcust = idcust || '';
  newUpload.onclick = handleFileUpload;
}

function openDocumentManagerForCustomer(idcust){
  $('#doc-manager-title').innerText = `📁 Dokumen Customer: ${idcust}`;
  $('#doc-list-container').innerHTML = '<p style="color:var(--muted); text-align:center">Memuat daftar dokumen...</p>';
  $('#doc-upload-btn').dataset.scope = 'customer';
  $('#doc-upload-btn').dataset.id = idcust;
  $('#doc-file-input').value = '';
  $('#doc-upload-section').style.display = 'block';
  $('#modal-doc-manager').style.display = 'flex';
  fetchAndRenderCustomerDocs(idcust);
  const oldUpload = $('#doc-upload-btn');
  const newUpload = oldUpload.cloneNode(true);
  oldUpload.parentNode.replaceChild(newUpload, oldUpload);
  newUpload.dataset.scope = 'customer';
  newUpload.dataset.id = idcust;
  newUpload.onclick = handleFileUpload;
}

function closeModalDocManager(){ $('#modal-doc-manager').style.display='none'; $('#doc-list-container').innerHTML=''; }

// Helper: fetch & render event docs
async function fetchAndRenderEventDocs(type, id){
  try{
    // Read data from DB: planning/{id}/documents or visiting/{id}/documents
    const eventRef = ref(db, `${type}/${id}/documents`);
    onValue(eventRef, (snap) => {
      const docs = snap.exists() ? snap.val() : {};
      renderDocsList(Object.values(docs), { scope: 'event', type, id });
    }, { onlyOnce: true });
  }catch(e){ console.error(e); $('#doc-list-container').innerHTML = `<p style="color:red">Gagal memuat dokumen: ${e.message}</p>`; }
}

// Helper: fetch & render customer docs
async function fetchAndRenderCustomerDocs(idcust){
  try{
    const custRef = ref(db, `masterpelanggan/${idcust}/documents`);
    onValue(custRef, (snap) => {
      const docs = snap.exists() ? snap.val() : {};
      renderDocsList(Object.values(docs), { scope: 'customer', id: idcust });
    }, { onlyOnce: true });
  }catch(e){ console.error(e); $('#doc-list-container').innerHTML = `<p style="color:red">Gagal memuat dokumen: ${e.message}</p>`; }
}

// Render docs list (generic)
function renderDocsList(docsArray, context){
  if(!docsArray || docsArray.length===0){
    $('#doc-list-container').innerHTML = '<p style="color:var(--muted); text-align:center;">Belum ada dokumen.</p>';
    return;
  }
  const html = `
    <table style="width:100%; font-size:13px;">
      <thead><tr><th>Nama File</th><th>Tgl Unggah</th><th>Aksi</th></tr></thead>
      <tbody>
        ${docsArray.map(doc => {
          const idKey = doc.id || doc.uuid || '';
          return `<tr>
            <td>${doc.name || doc.originalName || 'unknown'}</td>
            <td>${doc.uploadDate || '-'}</td>
            <td>
              <button class="action-btn" data-act="download-doc" data-storagepath="${doc.storagePath || doc.path || ''}" data-url="${doc.url || ''}">⬇️</button>
              <button class="action-btn action-delete" data-act="del-doc" data-context='${JSON.stringify(context)}' data-doc-id="${idKey}" data-storagepath="${doc.storagePath || doc.path || ''}">🗑️</button>
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  `;
  $('#doc-list-container').innerHTML = html;

  // Attach listeners
  document.querySelectorAll('[data-act="download-doc"]').forEach(btn => {
    btn.onclick = () => {
      const url = btn.dataset.url;
      const storagePath = btn.dataset.storagepath;
      if(url) window.open(url, '_blank');
      else if(storagePath) {
        // fallback getPublicUrl
        const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
        if(data?.publicUrl) window.open(data.publicUrl, '_blank');
        else alert('Gagal mendapatkan URL publik');
      } else alert('URL dokumen tidak ditemukan');
    };
  });

  document.querySelectorAll('[data-act="del-doc"]').forEach(btn => {
    btn.onclick = async () => {
      const ctx = JSON.parse(btn.dataset.context);
      const docId = btn.dataset.docId;
      const storagePath = btn.dataset.storagepath;
      await deleteDocument(ctx, docId, storagePath);
    };
  });
}

// -------------- Upload Handler (Generic for event or customer) --------------
async function handleFileUpload(){
  const scope = $('#doc-upload-btn').dataset.scope; // 'event' or 'customer'
  const fileInput = $('#doc-file-input');
  const file = fileInput.files[0];
  if(!file) return alert('Pilih file untuk diunggah.');

  // Prepare identifiers
  if(scope === 'event'){
    const type = $('#doc-upload-btn').dataset.type; // planning|visiting
    const id = $('#doc-upload-btn').dataset.id;     // idplan | idvisit
    const idcust = $('#doc-upload-btn').dataset.idcust || '';
    await uploadFileToEvent(type, id, file, idcust);
  } else if(scope === 'customer'){
    const idcust = $('#doc-upload-btn').dataset.id;
    await uploadFileToCustomer(idcust, file);
  } else {
    return alert('Context upload tidak dikenal.');
  }
}

// Upload to event path
async function uploadFileToEvent(type, id, file, idcust=''){
  // Use crypto.randomUUID for unique id
  const uuid = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : ('id' + Date.now());
  const ext = file.name.split('.').pop();
  const storageName = `${type}/${id}/${uuid}.${ext}`;

  try {
    const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(storageName, file, { cacheControl: '3600', upsert: false });
    if(uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storageName);

    const metadata = {
      id: uuid,
      storagePath: storageName,
      name: file.name,
      originalName: file.name,
      uploadDate: new Date().toISOString().split('T')[0],
      url: urlData?.publicUrl || ''
    };

    // Save under planning/{id}/documents/{uuid} or visiting/{id}/documents/{uuid}
    await set(ref(db, `${type}/${id}/documents/${uuid}`), metadata);

    alert('✅ Dokumen berhasil diunggah untuk kegiatan!');
    $('#doc-file-input').value = '';
    fetchAndRenderEventDocs(type, id);
  } catch (e) {
    console.error('Upload event file error', e);
    alert('Gagal mengunggah dokumen: ' + e.message);
  }
}

// Upload to customer
async function uploadFileToCustomer(idcust, file){
  const uuid = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : ('id' + Date.now());
  const ext = file.name.split('.').pop();
  const storageName = `customer/${idcust}/${uuid}.${ext}`;

  try {
    const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(storageName, file, { cacheControl: '3600', upsert: false });
    if(uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storageName);

    const metadata = {
      id: uuid,
      storagePath: storageName,
      name: file.name,
      originalName: file.name,
      uploadDate: new Date().toISOString().split('T')[0],
      url: urlData?.publicUrl || ''
    };

    await set(ref(db, `masterpelanggan/${idcust}/documents/${uuid}`), metadata);

    alert('✅ Dokumen Customer berhasil diunggah!');
    $('#doc-file-input').value = '';
    fetchAndRenderCustomerDocs(idcust);
  } catch (e) {
    console.error('Upload customer file error', e);
    alert('Gagal mengunggah dokumen customer: ' + e.message);
  }
}

// -------------- Delete Document (Generic) --------------
/*
 context: { scope: 'event'|'customer', type?: 'planning'|'visiting', id: '<id>' }
 docId: uuid
 storagePath: storagePath (optional)
*/
async function deleteDocument(context, docId, storagePathProvided){
  if(!confirm('Yakin ingin menghapus dokumen ini dari storage & metadata?')) return;
  try{
    let storagePath = storagePathProvided || '';

    // If storagePath not provided, try read metadata to get it
    if(!storagePath){
      if(context.scope === 'event'){
        const snap = await new Promise((res, rej) => onValue(ref(db, `${context.type}/${context.id}/documents/${docId}`), s => { res(s); }, { onlyOnce: true }));
        const val = snap && snap.val ? snap.val() : snap;
        storagePath = val?.storagePath || '';
      } else if(context.scope === 'customer'){
        const snap = await new Promise((res, rej) => onValue(ref(db, `masterpelanggan/${context.id}/documents/${docId}`), s => { res(s); }, { onlyOnce: true }));
        const val = snap && snap.val ? snap.val() : snap;
        storagePath = val?.storagePath || '';
      }
    }

    // Delete from Supabase Storage
    if(storagePath){
      const { error: delErr } = await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
      if(delErr) throw delErr;
    }

    // Remove metadata
    if(context.scope === 'event'){
      await remove(ref(db, `${context.type}/${context.id}/documents/${docId}`));
      fetchAndRenderEventDocs(context.type, context.id);
    } else if(context.scope === 'customer'){
      await remove(ref(db, `masterpelanggan/${context.id}/documents/${docId}`));
      fetchAndRenderCustomerDocs(context.id);
    }

    alert('✅ Dokumen berhasil dihapus.');
  }catch(err){ console.error(err); alert('Gagal menghapus dokumen: ' + err.message); }
}

// -------------- Events Modal for Calendar --------------
function openEventsModal(date){
  const events = [...planning, ...visiting].filter(e=>{
    const tglMulai = e.tglMulai || e.tgl;
    const tglSelesai = e.tglSelesai || e.tglMulai || e.tgl;
    return tglMulai && tglSelesai && tglMulai <= date && date <= tglSelesai;
  });
  const formattedDate = new Date(date+'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', year:'numeric', month:'long', day:'numeric' });
  $('#events-modal-title').innerText = `Kegiatan pada ${formattedDate}`;
  let content = '';
  if(events.length===0) content = '<p style="text-align:center; color:var(--muted);">Tidak ada kegiatan pada tanggal ini.</p>';
  else {
    content = events.map(e => {
      const type = e.idplan ? 'PLANNING' : 'VISITING';
      const idKey = e.idplan || e.idvisit;
      const cust = masterpelanggan.find(c => c.idcust === e.idcust);
      const tglMulai = e.tglMulai || e.tgl || '-';
      const tglSelesai = e.tglSelesai || e.tglMulai || e.tgl || '-';
      const rentangTampil = (tglMulai===tglSelesai) ? tglMulai : `${tglMulai} s/d ${tglSelesai}`;
      const namaKegiatan = e.jeniskegiatan || type;
      return `<div class="event-detail-box card" style="margin-bottom:12px;padding:10px;">
        <h4 style="margin:0 0 8px; color:${type==='PLANNING'?'green':'blue'};">${namaKegiatan}</h4>
        <p><strong>Tipe:</strong> <span style="font-weight:bold; color:${type==='PLANNING'?'green':'blue'};">${type}</span></p>
        <p><strong>ID:</strong> ${idKey}</p>
        <p><strong>Rentang Tanggal:</strong> ${rentangTampil}</p>
        <p><strong>Pelanggan:</strong> ${cust?cust.namacust:e.idcust}</p>
        <p><strong>Wilayah:</strong> ${e.wilayah||'-'}</p>
        <p><strong>AM:</strong> ${e.namaAM||'-'}</p>
        <p><strong>SID:</strong> ${e.sid||'-'}</p>
        <p><strong>Deskripsi:</strong> ${e.deskripsi||'-'}</p>
        <p><strong>Biaya:</strong> Rp ${(e.biaya||0).toLocaleString('id-ID')}</p>
      </div>`;
    }).join('');
  }
  $('#events-modal-content').innerHTML = content;
  $('#modal-event-day').style.display = 'flex';
}
function closeModalEventDay(){ $('#modal-event-day').style.display='none'; }


// -------------- PIC & CC (tidak diubah) --------------
function openPicCcManager(idcust){
  const cust = masterpelanggan.find(c => c.idcust === idcust);
  if(!cust) return alert('Pelanggan tidak ditemukan');
  $('#pic-cc-title').innerText = `👥 PIC & Cost Centers: ${cust.namacust} (${idcust})`;
  const body = $('#pic-cc-body');
  const pics = mapToArray(cust.pic || {});
  const picHtml = `<h4 style="margin:16px 0 6px">Data PIC (Person In Charge)</h4>
    <button class="btn primary" id="add-pic-modal-in-cc" data-id="${idcust}" style="margin-bottom:8px;">➕ Tambah PIC</button>
    ${pics.length===0?'<p style="color:var(--muted)">Belum ada data PIC.</p>':'<table style="width:100%; font-size:13px;"><thead><tr><th>#</th><th>Nama</th><th>No HP</th><th>Aksi</th></tr></thead><tbody>' + pics.map((p,i)=>`<tr><td>${i+1}</td><td>${p.nama}</td><td>${p.hp}</td><td><button class="action-btn action-delete" data-act="del-pic" data-cust-id="${idcust}" data-pic-id="${p.idpic}">🗑️</button></td></tr>`).join('') + '</tbody></table>'}
  `;
  const ccs = mapToArray(cust.costcenters || {});
  const ccHtml = `<h4 style="margin:16px 0 6px">Data Cost Centers (CC)</h4><button class="btn primary" id="add-cc-modal" data-id="${idcust}" style="margin-bottom:8px;">➕ Tambah CC</button>${ccs.length===0?'<p style="color:var(--muted)">Belum ada Cost Center.</p>':'<table style="width:100%; font-size:13px;"><thead><tr><th>#</th><th>Nama Dinas/Divisi</th><th>Anggaran/Biaya</th><th>Aksi</th></tr></thead><tbody>' + ccs.map((cc,i)=>`<tr><td>${i+1}</td><td>${cc.namaDivisi}</td><td>Rp ${(cc.biaya||0).toLocaleString('id-ID')}</td><td><button class="action-btn action-delete" data-act="del-cc" data-cust-id="${idcust}" data-cc-id="${cc.idcc}">🗑️</button></td></tr>`).join('') + '</tbody></table>'}
  `;
  body.innerHTML = picHtml + ccHtml;
  $('#modal-pic-cc').style.display = 'flex';
  document.getElementById('add-pic-modal-in-cc').onclick = () => openModalAddPic(idcust);
  document.querySelectorAll('[data-act="del-pic"]').forEach(btn => btn.onclick = ()=> deletePic(btn.dataset.custId, btn.dataset.picId));
  document.getElementById('add-cc-modal').onclick = () => openModalAddCc(idcust);
  document.querySelectorAll('[data-act="del-cc"]').forEach(btn => btn.onclick = ()=> deleteCc(btn.dataset.custId, btn.dataset.ccId));
}
function closePicCcManager(){ $('#modal-pic-cc').style.display='none'; }
async function deletePic(custId,picId){ if(!confirm('Yakin ingin menghapus PIC ini?')) return; try{ await remove(ref(db, `masterpelanggan/${custId}/pic/${picId}`)); alert('✅ PIC berhasil dihapus.'); openPicCcManager(custId); }catch(err){ console.error(err); alert('Gagal menghapus PIC: '+err.message); } }
async function deleteCc(custId, ccId){ if(!confirm('Yakin ingin menghapus Cost Center ini?')) return; try{ await remove(ref(db, `masterpelanggan/${custId}/costcenters/${ccId}`)); alert('✅ Cost Center berhasil dihapus.'); openPicCcManager(custId); }catch(err){ console.error(err); alert('Gagal menghapus Cost Center: '+err.message); } }
function openModalAddPic(idcust=null){ $('#pic-name').value=''; $('#pic-phone').value=''; let custIdInput = document.getElementById('pic-cust-id-hidden'); if(!custIdInput){ custIdInput = document.createElement('input'); custIdInput.type='hidden'; custIdInput.id='pic-cust-id-hidden'; document.querySelector('#modal-add-pic .modal div').prepend(custIdInput); } custIdInput.value = idcust; const oldSaveBtn = $('#pic-save'); const newSaveBtn = oldSaveBtn.cloneNode(true); oldSaveBtn.parentNode.replaceChild(newSaveBtn, oldSaveBtn); newSaveBtn.onclick = saveNewPic; $('#modal-add-pic').style.display='flex'; }
function closeModalAddPic(){ $('#modal-add-pic').style.display='none'; }
async function saveNewPic(){ const nama = $('#pic-name').value.trim(); const hp = $('#pic-phone').value.trim(); const idcust = document.getElementById('pic-cust-id-hidden')?.value || prompt('Masukkan ID Customer untuk PIC ini:'); if(!nama||!hp||!idcust) return alert('Lengkapi data PIC dan ID Customer!'); const newId = 'PIC' + Date.now(); try{ await set(ref(db, `masterpelanggan/${idcust}/pic/${newId}`), { idpic:newId, nama, hp }); alert('✅ PIC berhasil disimpan!'); closeModalAddPic(); if($('#modal-pic-cc').style.display === 'flex') openPicCcManager(idcust); }catch(err){ console.error(err); alert('Gagal menyimpan PIC: '+err.message); } }

// Cost center add
function openModalAddCc(idcust=null){ $('#cc-divisi').value=''; $('#cc-biaya').value=''; let custIdInput = document.getElementById('cc-cust-id-hidden'); if(!custIdInput){ custIdInput = document.createElement('input'); custIdInput.type='hidden'; custIdInput.id='cc-cust-id-hidden'; document.querySelector('#modal-add-cc .modal div').prepend(custIdInput); } custIdInput.value = idcust; const oldSaveBtn = $('#cc-save'); const newSaveBtn = oldSaveBtn.cloneNode(true); oldSaveBtn.parentNode.replaceChild(newSaveBtn, oldSaveBtn); newSaveBtn.onclick = saveNewCc; $('#modal-add-cc').style.display='flex'; }
function closeModalAddCc(){ $('#modal-add-cc').style.display='none'; }
async function saveNewCc(){ const namaDivisi = $('#cc-divisi').value.trim(); const biaya = parseInt($('#cc-biaya').value) || 0; const idcust = document.getElementById('cc-cust-id-hidden')?.value || prompt('Masukkan ID Customer untuk Cost Center ini:'); if(!namaDivisi || !idcust) return alert('Nama Divisi/Dinas dan ID Customer wajib diisi!'); const newId = 'CC' + Date.now(); try{ await set(ref(db, `masterpelanggan/${idcust}/costcenters/${newId}`), { idcc:newId, namaDivisi, biaya }); alert('✅ Cost Center berhasil disimpan!'); closeModalAddCc(); if($('#modal-pic-cc').style.display === 'flex') openPicCcManager(idcust); }catch(err){ console.error(err); alert('Gagal menyimpan Cost Center: '+err.message); } }

// -------------- Listeners hydration --------------
function hydrateListeners(){
  // Calendar nav
  $('#prev-month')?.addEventListener('click', ()=>changeMonth(-1));
  $('#next-month')?.addEventListener('click', ()=>changeMonth(1));

  // Calendar day
  document.querySelectorAll('.calendar-day[data-date]').forEach(dayEl=>{
    const newDay = dayEl.cloneNode(true);
    dayEl.parentNode.replaceChild(newDay, dayEl);
    newDay.addEventListener('click', ()=> { const date = newDay.dataset.date; if(date) openEventsModal(date); });
  });

  // Modal pelanggan
  document.querySelector('[data-act="open-add-cust"]')?.addEventListener('click', openModalAddCust);
  $('#ac-cancel').onclick = closeModalAddCust;
  $('#ac-save').onclick = saveNewCustomer;
  $('#ec-cancel').onclick = closeModalEditCust;
  $('#ec-save').onclick = saveEditCustomer;

  // Kegiatan
  $('#add-kegiatan')?.addEventListener('click', ()=>openModalAddEdit());

  // Pic/CC
  $('#pic-cancel').onclick = closeModalAddPic;
  $('#cc-cancel').onclick = closeModalAddCc;

  // Document modal close
  $('#doc-manager-close').onclick = closeModalDocManager;

// Pic-cc close
  $('#pic-cc-close').onclick = closePicCcManager;

// Event day modal close - multiple ID support
  const eventCloseBtn = $('#events-modal-close') || $('#close-event-day') || $('#modal-event-day .close-btn');
  if(eventCloseBtn) eventCloseBtn.onclick = closeModalEventDay;

  // Global action buttons (delegated)
  // Global action buttons (delegated)
  setTimeout(()=>{
    document.querySelectorAll('[data-act]').forEach(btn=>{
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      newBtn.onclick = ()=> {
        const act = newBtn.dataset.act;
        const id = newBtn.dataset.id;
        const type = newBtn.dataset.type;
        if(act === 'edit-cust') openEditCustomer(id);
        else if(act === 'del-cust') deleteCustomer(id);
        else if(act === 'edit-evt') openEditEvent(type, id);
        else if(act === 'del-evt') deleteEvent(type, id);
        else if(act === 'manage-event-docs') openDocumentManagerForEvent(newBtn.dataset.type, newBtn.dataset.id);
        else if(act === 'manage-cust-docs') openDocumentManagerForCustomer(id);
        else if(act === 'manage-pic-cc') openPicCcManager(id);
      };
    });
  }, 120);
  
  // Nav
  $all('.nav li').forEach(li=> li.onclick = (ev)=>{ $all('.nav li').forEach(x=>x.classList.remove('active')); ev.target.classList.add('active'); renderPage(); });
}

// -------------- Expose globals --------------
window.openModalAddCust = openModalAddCust;
window.closeModalAddCust = closeModalAddCust;
window.saveNewCustomer = saveNewCustomer;
window.openEditCustomer = openEditCustomer;
window.closeModalEditCust = closeModalEditCust;
window.saveEditCustomer = saveEditCustomer;

window.openModalAddEdit = openModalAddEdit;
window.closeModalAddEdit = closeModalAddEdit;
window.saveAddEdit = saveAddEdit;
window.openEditEvent = openEditEvent;
window.deleteEvent = deleteEvent;

window.openDocumentManagerForEvent = openDocumentManagerForEvent;
window.openDocumentManagerForCustomer = openDocumentManagerForCustomer;
window.closeModalDocManager = closeModalDocManager;
window.handleFileUpload = handleFileUpload;
window.deleteDocument = deleteDocument;

window.openPicCcManager = openPicCcManager;
window.closePicCcManager = closePicCcManager;
window.deletePic = deletePic;
window.deleteCc = deleteCc;
window.openModalAddPic = openModalAddPic;
window.closeModalAddPic = closeModalAddPic;
window.saveNewPic = saveNewPic;
window.openModalAddCc = openModalAddCc;
window.closeModalAddCc = closeModalAddCc;
window.saveNewCc = saveNewCc;

window.openEventsModal = openEventsModal;
window.closeModalEventDay = closeModalEventDay;
window.changeMonth = changeMonth;

// -------------- Init --------------
(function init(){
  $('#datetime').innerText = nowDateTime();
  setInterval(()=>{ $('#datetime').innerText = nowDateTime(); }, 60000);
  renderPage();
  // backdrop close
  document.addEventListener('click', e=>{
    if(e.target.id==='modal-add-edit') closeModalAddEdit();
    if(e.target.id==='modal-edit-cust') closeModalEditCust();
    if(e.target.id==='modal-add-cust') closeModalAddCust();
    if(e.target.id==='modal-add-pic') closeModalAddPic();
    if(e.target.id==='modal-add-cc') closeModalAddCc();
    if(e.target.id==='modal-doc-manager') closeModalDocManager();
    if(e.target.id==='modal-pic-cc') closePicCcManager();
    if(e.target.id==='modal-event-day') closeModalEventDay();
  });
})();
