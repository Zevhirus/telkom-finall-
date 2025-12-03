// app.js - CRM Monitoring System Final Version
// Integrasi: Firebase Realtime DB (Data)

// 1. Firebase SDK Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-analytics.js";
import {
  getDatabase, ref, onValue, set, update, remove
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-database.js";

// 2. Supabase SDK Import (DIHAPUS)
// import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";


// CONFIG: Firebase Realtime Database
const firebaseConfig = {
  apiKey: "AIzaSyBsL8V7-Bqjl7MKSimMq0ZkAzJjswgurdQ",
  authDomain: "tellokom.firebaseapp.com",
  databaseURL: "https://tellokom-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "tellokom",
  storageBucket: "tellokom.firebasestorage.app",
  messagingSenderId: "73519990087",
  appId: "1:73519990087:web:e0d497632bef43aa2f3488"
};

// CONFIG: Supabase Storage (DIHAPUS)
// const supabaseUrl = 'https://nkjqfxtvjylwshktyvdf.supabase.co';
// const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ranFmeHR2anlsc3Noa3R5dmRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODU1MjU2OTcsImV4cCI6MjAwMTEwMTY5N30.8i00d5yq71z40_47jF9eQ-2x3fK23r8o9l9tY8O2x0s';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);

// Initialize Supabase Client (DIHAPUS)
// const supabase = createClient(supabaseUrl, supabaseAnonKey, {
//     auth: { persistSession: false },
//     realtime: { enabled: false }
// });

// Utility Functions
const $ = s => document.querySelector(s);
const $all = s => document.querySelectorAll(s);
const mapToArray = obj => obj ? Object.values(obj) : [];
const nowDateTime = () => new Date().toLocaleDateString('id-ID', {year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit', hour12:false});

// Global Data Store
let planning = [];
let visiting = [];
let masterpelanggan = [];


/********************
 Realtime Database Listener & Data Sync
********************/
onValue(ref(db), (snapshot) => {
  if (snapshot.exists()) {
    const data = snapshot.val();
    planning = mapToArray(data.planning || {});
    // Mengubah sumber data 'visiting' dari 'SUPABASE' ke 'visiting'
    visiting = mapToArray(data.visiting || {}); 
    masterpelanggan = mapToArray(data.masterpelanggan || {});
    
    // Re-render current page
    renderPage();
  } else {
    console.log("No data available");
  }
});


/********************
 Page Rendering
********************/
function getActivePage(){
  return $all('.nav li.active')[0]?.dataset.page || 'dashboard';
}

function renderPage(){
  const page = getActivePage();
  $('#page-title').innerText = page.split('-').map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(' ');
  
  let content = '';
  switch(page){
    case 'dashboard':
      content = renderDashboard();
      break;
    case 'master-pelanggan':
      content = renderMasterPelanggan();
      break;
  }

  $('#page-content').innerHTML = content;
  hydrateListeners();
}

function renderDashboard(){
  const today = new Date().toISOString().split('T')[0];

  // Aggregate Stats
  const totalKegiatan = planning.length + visiting.length;
  const totalBiaya = planning.reduce((sum, p) => sum + (p.biaya || 0), 0) + visiting.reduce((sum, v) => sum + (v.biaya || 0), 0);
  
  // Logic for Upcoming Planning
  const upcomingPlanning = planning
    .filter(p => p.tgl >= today)
    .sort((a, b) => new Date(a.tgl) - new Date(b.tgl))
    .slice(0, 5); // Ambil 5 kegiatan terdekat

  const planningListHtml = upcomingPlanning.length === 0 
    ? '<tr><td colspan="3" style="text-align:center; color:var(--muted);">Tidak ada rencana kegiatan mendatang.</td></tr>'
    : upcomingPlanning.map(p => {
        const cust = masterpelanggan.find(c => c.idcust === p.idcust);
        return `
          <tr>
            <td>${p.tgl}</td>
            <td>${cust ? cust.namacust : p.idcust}</td>
            <td>${p.jeniskegiatan || 'Planning'}</td>
          </tr>
        `;
    }).join('');

  return `
    <div class="stats-grid">
      <div class="stat-box">
        <p>Total Pelanggan</p>
        <h3>${masterpelanggan.length}</h3>
      </div>
      <div class="stat-box" style="background:#e6ffed">
        <p>Total Kegiatan (Plan & Visit)</p>
        <h3>${totalKegiatan}</h3>
      </div>
      <div class="stat-box" style="background:#fff3e0">
        <p>Total Biaya Kegiatan</p>
        <h3>Rp ${totalBiaya.toLocaleString('id-ID')}</h3>
      </div>
    </div>

    <div class="card" style="margin-bottom: 16px;">
        <h3>Upcoming Planning </h3>
        <table style="width:100%; font-size:14px;">
            <thead>
                <tr>
                    <th style="width: 100px;">Tanggal</th>
                    <th style="width: 200px;">Pic</th>
                    <th>Jenis Kegiatan</th>
                </tr>
            </thead>
            <tbody>
                ${planningListHtml}
            </tbody>
        </table>
    </div>

    <div class="card">
      ${renderCalendar()}
    </div>
  `;
}

function renderMasterPelanggan(){
  const planningRows = planning.map(p=>({ type:'planning', id:p.idplan, date:p.tgl, desc: p.jeniskegiatan || 'Planning', biaya:p.biaya }));
  const visitingRows = visiting.map(v=>({ type:'visiting', id:v.idvisit, date:v.tgl, desc: v.jeniskegiatan || 'Visiting', biaya:v.biaya }));
  const kegiatanRows = [...planningRows, ...visitingRows].sort((a,b) => new Date(b.date) - new Date(a.date));

  return `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <h3>DATA</h3>
        <div>
          <button class="btn ghost" id="add-kegiatan">➕ Tambah PIC</button>
          <button class="btn primary" id="add-master">➕ Tambah Kegiatan</button>
        </div>
      </div>

      <h4 style="margin:8px 0 6px">Daftar PIC</h4>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Tgl Buat</th>
            <th>Nama Pelanggan</th>
            <th>Account Manager</th> 
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          ${masterpelanggan.map(m=>{
            const numDocs = Object.keys(m.documents || {}).length || 0;
            const numPicCc = (Object.keys(m.pic || {}).length || 0) + (Object.keys(m.costcenters || {}).length || 0);

            return `<tr>
              <td>${m.idcust}</td>
              <td>${m.tglbuat}</td>
              <td>${m.namacust}</td>
              <td>${m.namaAM || '-'}</td> 
              <td>
                <button class="action-btn action-edit" data-act="edit-cust" data-id="${m.idcust}">✏️</button>
                <button class="action-btn action-delete" data-act="del-cust" data-id="${m.idcust}">🗑️</button>
                <button class="btn primary" style="padding: 6px 8px; margin-left: 8px; font-size: 12px;" data-act="manage-docs" data-id="${m.idcust}">📁 Dokumen (${numDocs})</button>
                <button class="btn ghost" style="padding: 6px 8px; margin-left: 4px; font-size: 12px;" data-act="manage-pic-cc" data-id="${m.idcust}">👥 PIC/CC (${numPicCc})</button>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>

      <div style="margin-top:16px">
        <h4 style="margin:8px 0 6px">Daftar Kegiatan</h4>
        <table>
          <thead><tr><th>Tipe</th><th>ID</th><th>Tanggal</th><th>Deskripsi</th><th>Biaya</th><th>Aksi</th></tr></thead>
          <tbody>
            ${kegiatanRows.map(k=>`<tr>
              <td>${k.type.toUpperCase()}</td>
              <td>${k.id}</td>
              <td>${k.date}</td>
              <td class="small">${k.desc}</td>
              <td>Rp ${(k.biaya||0).toLocaleString('id-ID')}</td>
              <td>
                <button class="action-btn action-edit" data-act="edit-evt" data-type="${k.type}" data-id="${k.id}">✏️</button>
                <button class="action-btn action-delete" data-act="del-evt" data-type="${k.type}" data-id="${k.id}">🗑️</button>
              </td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}


/********************
 Calendar Rendering
********************/
let currentCalendarDate = new Date();

function renderCalendar() {
    const date = currentCalendarDate;
    const year = date.getFullYear();
    const month = date.getMonth();
    const today = new Date();

    // Get first day of the month
    const firstDay = new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)
    // Get last date of the month
    const lastDate = new Date(year, month + 1, 0).getDate();
    // Get last date of previous month
    const prevLastDate = new Date(year, month, 0).getDate();

    let calendarDays = [];

    // Days from previous month
    const startDay = firstDay === 0 ? 6 : firstDay - 1; // Start from Monday
    for (let i = startDay; i > 0; i--) {
        calendarDays.push({ date: prevLastDate - i + 1, month: 'prev', events: [] });
    }

    // Days of the current month
    for (let i = 1; i <= lastDate; i++) {
        const fullDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const events = [...planning, ...visiting].filter(e => e.tgl === fullDate);
        
        calendarDays.push({ 
            date: i, 
            month: 'current', 
            isToday: i === today.getDate() && month === today.getMonth() && year === today.getFullYear(),
            fullDate: fullDate,
            events: events 
        });
    }

    // Remaining days from next month
    const remainingDays = 42 - calendarDays.length; // 6 weeks * 7 days
    for (let i = 1; i <= remainingDays; i++) {
        calendarDays.push({ date: i, month: 'next', events: [] });
    }

    const monthName = date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

    const gridHtml = calendarDays.map(day => {
        const eventsHtml = day.events.map(e => 
            `<div class="calendar-event" title="${e.jeniskegiatan}">${e.jeniskegiatan}</div>`
        ).join('');

        const classList = ['calendar-day'];
        if (day.month !== 'current') classList.push('other-month');
        if (day.isToday) classList.push('today');

        return `<div class="${classList.join(' ')}" data-date="${day.fullDate || ''}">
            <div class="calendar-day-number">${day.date}</div>
            ${eventsHtml}
        </div>`;
    }).join('');

    return `
        <div class="calendar">
            <div class="calendar-header">
                <h4 style="margin:0">${monthName}</h4>
                <div class="calendar-nav">
                    <button id="prev-month">←</button>
                    <button id="next-month">→</button>
                </div>
            </div>
            <div class="calendar-grid">
                <div class="calendar-day-header">Sen</div>
                <div class="calendar-day-header">Sel</div>
                <div class="calendar-day-header">Rab</div>
                <div class="calendar-day-header">Kam</div>
                <div class="calendar-day-header">Jum</div>
                <div class="calendar-day-header">Sab</div>
                <div class="calendar-day-header">Min</div>
                ${gridHtml}
            </div>
        </div>
    `;
}

function changeMonth(delta) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + delta);
    renderPage();
}


/********************
 CRUD: Pelanggan
********************/
async function saveNewCustomer(){
    const idcust = $('#ac-idcust').value.trim().toUpperCase();
    const namacust = $('#ac-name').value.trim();
    const namaAM = $('#ac-am').value.trim();
    const tglbuat = new Date().toISOString().split('T')[0];
    
    if(!idcust || !namacust) return alert('ID Customer dan Nama Pelanggan wajib diisi!');
    if(masterpelanggan.some(c => c.idcust === idcust)) return alert('ID Customer sudah ada!');
    
    try{
        await set(ref(db, `masterpelanggan/${idcust}`), { idcust, namacust, namaAM, tglbuat });
        alert('✅ Pelanggan baru berhasil disimpan.');
        $('#modal-add-cust').style.display = 'none';
    }catch(err){ console.error(err); alert('Gagal menyimpan: '+err.message); }
}

function openEditCustomer(idcust){
    const cust = masterpelanggan.find(c => c.idcust === idcust);
    if(!cust) return alert('Pelanggan tidak ditemukan.');
    
    $('#ec-idcust').value = cust.idcust;
    $('#ec-name').value = cust.namacust;
    $('#ec-am').value = cust.namaAM || '';
    $('#modal-edit-cust').style.display = 'flex';
}

async function saveEditCustomer(){
    const idcust = $('#ec-idcust').value;
    const namacust = $('#ec-name').value.trim();
    const namaAM = $('#ec-am').value.trim();

    if(!namacust) return alert('Nama Pelanggan wajib diisi!');
    
    try{
        await update(ref(db, `masterpelanggan/${idcust}`), { namacust, namaAM });
        alert('✅ Data pelanggan berhasil diperbarui.');
        $('#modal-edit-cust').style.display = 'none';
    }catch(err){ console.error(err); alert('Gagal memperbarui: '+err.message); }
}

async function deleteCustomer(idcust){
    if(!confirm(`Yakin menghapus pelanggan ID: ${idcust}? Semua PIC, CC, Dokumen, dan Kegiatan terkait akan hilang!`)) return;
    try{
        await remove(ref(db, `masterpelanggan/${idcust}`));
        // Opsional: Hapus kegiatan yang terkait juga (implementasi lebih kompleks)
        alert('✅ Pelanggan berhasil dihapus.');
    }catch(err){ console.error(err); alert('Gagal menghapus: '+err.message); }
}


/********************
 CRUD: Kegiatan (Planning/Visiting)
********************/
function openModalAddEdit(type = 'planning', id = null) {
    const isEdit = id !== null;
    $('#ae-title').innerText = isEdit ? 'Edit Kegiatan' : 'Tambah Kegiatan';
    $('#ae-id').value = id || '';
    $('#ae-type').value = type;
    $('#ae-cust').innerHTML = '<option value="">-- Pilih Pelanggan --</option>' + 
        masterpelanggan.map(c => `<option value="${c.idcust}">${c.namacust}</option>`).join('');

    if (isEdit) {
        const eventData = (type === 'planning' ? planning : visiting).find(e => (type === 'planning' ? e.idplan : e.idvisit) === id);
        if (eventData) {
            $('#ae-tgl').value = eventData.tgl;
            $('#ae-judul').value = eventData.jeniskegiatan || '';
            $('#ae-desc').value = eventData.deskripsi || '';
            $('#ae-biaya').value = eventData.biaya || '';
            $('#ae-cust').value = eventData.idcust || '';
        }
    } else {
        // Clear fields for Add mode
        $('#ae-tgl').value = new Date().toISOString().split('T')[0];
        $('#ae-judul').value = '';
        $('#ae-desc').value = '';
        $('#ae-biaya').value = '';
        $('#ae-cust').value = '';
    }

    $('#modal-add-edit').style.display = 'flex';
}

function closeModalAddEdit(){ $('#modal-add-edit').style.display = 'none'; }

async function saveAddEdit(){
    const type = $('#ae-type').value;
    const tgl = $('#ae-tgl').value;
    const judul = $('#ae-judul').value.trim();
    const desc = $('#ae-desc').value.trim();
    const biaya = parseInt($('#ae-biaya').value) || 0;
    const idcust = $('#ae-cust').value;
    const id = $('#ae-id').value;
    const isEdit = !!id;

    if(!tgl || !judul || !idcust) return alert('Tanggal, Judul/Jenis Kegiatan, dan Pelanggan wajib diisi!');

    const key = isEdit ? id : (type === 'planning' ? 'PLAN' : 'VISIT') + Date.now();
    // Mengubah path untuk visiting dari SUPABASE/key menjadi visiting/key
    const path = `${type}/${key}`; 
    const data = { 
        tgl, jeniskegiatan: judul, deskripsi: desc, biaya, idcust,
        ...(type === 'planning' ? {idplan: key} : {idvisit: key})
    };

    try{
        await set(ref(db, path), data);
        alert(`✅ Kegiatan ${isEdit ? 'diperbarui' : 'baru berhasil disimpan'}.`);
        closeModalAddEdit();
    }catch(err){ console.error(err); alert('Gagal menyimpan kegiatan: '+err.message); }
}

function openEditEvent(type, id){
    openModalAddEdit(type, id);
}

async function deleteEvent(type, id){
    if(!confirm(`Yakin menghapus kegiatan ${type.toUpperCase()} ID: ${id}?`)) return;
    try{
        await remove(ref(db, `${type}/${id}`));
        alert('✅ Kegiatan berhasil dihapus.');
    }catch(err){ console.error(err); alert('Gagal menghapus: '+err.message); }
}

/********************
 Document Manager Logic (FITUR UP DOKUMEN)
 * Catatan: Fitur upload/delete dokumen via Supabase telah dihapus.
 * Bagian ini hanya menampilkan data dokumen dari Firebase.
********************/
function openDocumentManager(idcust) {
    const cust = masterpelanggan.find(c => c.idcust === idcust);
    if (!cust) return alert('Pelanggan tidak ditemukan');

    $('#doc-manager-title').innerText = `📁 Dokumen: ${cust.namacust} (${idcust})`;
    const docListContainer = $('#doc-list-container');
    const docs = cust.documents || {};
    const docsArray = Object.keys(docs).map(key => ({ id: key, ...docs[key] }));

    if (docsArray.length === 0) {
        docListContainer.innerHTML = '<p style="color:var(--muted); text-align:center;">Belum ada dokumen yang diunggah.</p>';
    } else {
        docListContainer.innerHTML = `
            <table style="width:100%; font-size: 13px;">
                <thead><tr><th>Nama File</th><th>Tgl Unggah</th><th>Aksi</th></tr></thead>
                <tbody>
                    ${docsArray.map(doc => `
                        <tr>
                            <td>${doc.name}</td>
                            <td>${doc.uploadDate}</td>
                            <td>
                                <a href="${doc.url}" target="_blank" class="action-btn" title="Lihat File">👁️</a>
                                <button class="action-btn action-delete" data-act="del-doc" data-cust-id="${idcust}" data-doc-id="${doc.id}">🗑️</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    // Set customer ID for upload
    $('#doc-upload-btn').dataset.idcust = idcust;
    $('#doc-file-input').value = '';
    $('#modal-doc-manager').style.display = 'flex';
    
    // Attach delete listeners
    document.querySelectorAll('[data-act="del-doc"]').forEach(btn => {
        // Karena Supabase sudah dihapus, fungsi deleteDocument tidak bisa menghapus file storage
        btn.onclick = () => alert('Fungsi hapus dokumen telah dinonaktifkan karena Supabase Storage dihapus.'); 
        // btn.onclick = () => deleteDocument(btn.dataset.custId, btn.dataset.docId, docs[btn.dataset.docId].path);
    });
}

function closeModalDocManager() { $('#modal-doc-manager').style.display = 'none'; }

// Fungsi handleFileUpload() dan deleteDocument() DIHAPUS karena terkait Supabase Storage
async function handleFileUpload() {
    alert('⚠️ Fitur unggah file dinonaktifkan. Supabase Storage telah dihapus dari konfigurasi.');
}

async function deleteDocument(idcust, iddoc, path) {
    // Fungsi ini dinonaktifkan karena tidak dapat menghapus file dari storage tanpa Supabase.
    alert('⚠️ Fitur hapus file dinonaktifkan. Supabase Storage telah dihapus dari konfigurasi.');
    /* if(!confirm('Yakin ingin menghapus dokumen ini? Metadata di Firebase akan dihapus, tetapi file di Supabase mungkin tetap ada.')) return;
    try{
        await remove(ref(db, `masterpelanggan/${idcust}/documents/${iddoc}`));
        alert('✅ Dokumen metadata berhasil dihapus.');
        openDocumentManager(idcust); // Refresh modal
    }catch(err){ console.error(err); alert('Gagal menghapus dokumen metadata: '+err.message); }
    */
}


/********************
 PIC & Cost Center Manager Logic
********************/
function openPicCcManager(idcust) {
    const cust = masterpelanggan.find(c => c.idcust === idcust);
    if (!cust) return alert('Pelanggan tidak ditemukan');

    $('#pic-cc-title').innerText = `👥 PIC & Cost Centers: ${cust.namacust} (${idcust})`;
    const body = $('#pic-cc-body');

    // Data PIC
    const pics = mapToArray(cust.pic || {});
    const picHtml = `
        <h4 style="margin:16px 0 6px">Data PIC (Person In Charge)</h4>
        <button class="btn primary" id="add-pic-modal-in-cc" data-id="${idcust}" style="margin-bottom: 8px;">➕ Tambah PIC</button>
        ${pics.length === 0 ? 
            '<p style="color:var(--muted)">Belum ada data PIC.</p>' :
            `<table style="width:100%; font-size: 13px;">
                <thead><tr><th>#</th><th>Nama</th><th>No HP</th><th>Aksi</th></tr></thead>
                <tbody>
                    ${pics.map((p, index) => `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${p.nama}</td>
                            <td>${p.hp}</td>
                            <td><button class="action-btn action-delete" data-act="del-pic" data-cust-id="${idcust}" data-pic-id="${p.idpic}">🗑️</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>`
        }
    `;

    // Data Cost Centers (dengan kolom Anggaran/Biaya)
    const ccs = mapToArray(cust.costcenters || {});
    const ccHtml = `
        <h4 style="margin:16px 0 6px">Data Cost Centers (CC)</h4>
        <button class="btn primary" id="add-cc-modal" data-id="${idcust}" style="margin-bottom: 8px;">➕ Tambah CC</button>
        ${ccs.length === 0 ?
            '<p style="color:var(--muted)">Belum ada Cost Center.</p>' :
            `<table style="width:100%; font-size: 13px;">
                <thead><tr><th>#</th><th>Nama Dinas/Divisi</th><th>Anggaran/Biaya</th><th>Aksi</th></tr></thead>
                <tbody>
                    ${ccs.map((cc, index) => `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${cc.namaDivisi}</td>
                            <td>Rp ${(cc.biaya || 0).toLocaleString('id-ID')}</td>
                            <td><button class="action-btn action-delete" data-act="del-cc" data-cust-id="${idcust}" data-cc-id="${cc.idcc}">🗑️</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>`
        }
    `;

    body.innerHTML = picHtml + ccHtml;

    $('#modal-pic-cc').style.display = 'flex';
    
    // Attach listeners for PIC/CC management inside the modal
    document.getElementById('add-pic-modal-in-cc').onclick = () => {
        openModalAddPic(idcust); // Buka modal Tambah PIC
    };
    document.querySelectorAll('[data-act="del-pic"]').forEach(btn => {
        btn.onclick = () => deletePic(btn.dataset.custId, btn.dataset.picId);
    });

    document.getElementById('add-cc-modal').onclick = () => {
        openModalAddCc(idcust); // Buka modal Tambah CC
    };
    document.querySelectorAll('[data-act="del-cc"]').forEach(btn => {
        btn.onclick = () => deleteCc(btn.dataset.custId, btn.dataset.ccId);
    });
}

function closePicCcManager() {
    $('#modal-pic-cc').style.display = 'none';
}

async function deletePic(custId, picId){
    if(!confirm('Yakin ingin menghapus PIC ini?')) return;
    try{
        await remove(ref(db, `masterpelanggan/${custId}/pic/${picId}`));
        alert('✅ PIC berhasil dihapus.');
        openPicCcManager(custId); // Refresh modal
    }catch(err){ console.error(err); alert('Gagal menghapus PIC: '+err.message); }
}

async function deleteCc(custId, ccId){
    if(!confirm('Yakin ingin menghapus Cost Center ini?')) return;
    try{
        await remove(ref(db, `masterpelanggan/${custId}/costcenters/${ccId}`));
        alert('✅ Cost Center berhasil dihapus.');
        openPicCcManager(custId); // Refresh modal
    }catch(err){ console.error(err); alert('Gagal menghapus Cost Center: '+err.message); }
}

function openModalAddPic(idcust = null) {
    $('#pic-name').value = '';
    $('#pic-phone').value = '';
    
    let custIdInput = document.getElementById('pic-cust-id-hidden');
    if(!custIdInput){
        custIdInput = document.createElement('input');
        custIdInput.type = 'hidden';
        custIdInput.id = 'pic-cust-id-hidden';
        document.querySelector('#modal-add-pic .modal div').prepend(custIdInput);
    }
    custIdInput.value = idcust; 
    
    $('#modal-add-pic').style.display = 'flex';
}

async function saveNewPic(){
    const nama = $('#pic-name').value.trim();
    const hp = $('#pic-phone').value.trim();
    const idcust = document.getElementById('pic-cust-id-hidden')?.value || prompt('Masukkan ID Customer untuk PIC ini:');
    
    if(!nama || !hp || !idcust) return alert('Lengkapi data PIC dan ID Customer!');
    
    const newId = 'PIC' + Date.now();
    try{
        await set(ref(db, `masterpelanggan/${idcust}/pic/${newId}`), { idpic: newId, nama: nama, hp: hp });
        alert('✅ PIC berhasil disimpan!');
        $('#modal-add-pic').style.display = 'none';
        
        if($('#modal-pic-cc').style.display === 'flex'){
            openPicCcManager(idcust);
        }
    }catch(err){ console.error(err); alert('Gagal menyimpan PIC: '+err.message); }
}

// Cost Center Logic
function openModalAddCc(idcust = null) {
    $('#cc-divisi').value = '';
    $('#cc-biaya').value = '';
    
    let custIdInput = document.getElementById('cc-cust-id-hidden');
    if(!custIdInput){
        custIdInput = document.createElement('input');
        custIdInput.type = 'hidden';
        custIdInput.id = 'cc-cust-id-hidden';
        document.querySelector('#modal-add-cc .modal div').prepend(custIdInput);
    }
    custIdInput.value = idcust; 
    
    $('#modal-add-cc').style.display = 'flex';
}

function closeModalAddCc() { $('#modal-add-cc').style.display = 'none'; }

async function saveNewCc(){
    const namaDivisi = $('#cc-divisi').value.trim();
    const biaya = parseInt($('#cc-biaya').value) || 0;
    const idcust = document.getElementById('cc-cust-id-hidden')?.value || prompt('Masukkan ID Customer untuk Cost Center ini:');
    
    if(!namaDivisi || !idcust) return alert('Nama Divisi/Dinas dan ID Customer wajib diisi!');
    
    const newId = 'CC' + Date.now();
    try{
        await set(ref(db, `masterpelanggan/${idcust}/costcenters/${newId}`), { 
            idcc: newId, 
            namaDivisi: namaDivisi, 
            biaya: biaya 
        }); 
        alert('✅ Cost Center berhasil disimpan!');
        closeModalAddCc();
        
        if($('#modal-pic-cc').style.display === 'flex'){
            openPicCcManager(idcust);
        }
    }catch(err){ console.error(err); alert('Gagal menyimpan Cost Center: '+err.message); }
}


/********************
 Event Listeners
********************/
function hydrateListeners(){
  renderCalendar();

  // Calendar Nav
  $('#prev-month')?.addEventListener('click', () => changeMonth(-1));
  $('#next-month')?.addEventListener('click', () => changeMonth(1));

  // Modal Pelanggan
  $('#add-master')?.addEventListener('click', ()=>$('#modal-add-cust').style.display = 'flex');
  $('#ac-cancel').onclick = ()=>$('#modal-add-cust').style.display = 'none';
  $('#ac-save').onclick = ()=>saveNewCustomer();

  $('#ec-cancel').onclick = ()=>$('#modal-edit-cust').style.display = 'none';
  $('#ec-save').onclick = ()=>saveEditCustomer();

  // Modal Kegiatan
  $('#add-kegiatan')?.addEventListener('click', ()=>openModalAddEdit());
  $('#ae-cancel').onclick = ()=>closeModalAddEdit();
  $('#ae-save').onclick = ()=>saveAddEdit();

  // Modal PIC
  $('#pic-cancel').onclick = ()=>{ $('#modal-add-pic').style.display = 'none'; };
  $('#pic-save').onclick = ()=>saveNewPic(); 

  // Modal CC 
  $('#cc-cancel').onclick = ()=>closeModalAddCc();
  $('#cc-save').onclick = ()=>saveNewCc();
  
  // Document Manager Listeners
  $('#doc-manager-close').onclick = ()=>closeModalDocManager();
  // Karena handleFileUpload dihapus, tombol ini di-alert saja.
  $('#doc-upload-btn').onclick = ()=>handleFileUpload(); 
  
  // PIC/CC Manager Listeners 
  $('#pic-cc-close').onclick = ()=>closePicCcManager();
  document.addEventListener('click', e=>{ 
    if(e.target.id==='modal-pic-cc') closePicCcManager();
    if(e.target.id==='modal-add-cc') closeModalAddCc();
  });


  // global action buttons (edit/delete/manage docs/manage pic-cc) in master page - delegated
  setTimeout(()=>{
    document.querySelectorAll('[data-act]').forEach(btn=>{
      btn.onclick = ()=>{
        const act = btn.dataset.act;
        const id = btn.dataset.id;
        const type = btn.dataset.type;

        if(act === 'edit-cust'){
          openEditCustomer(id);
        } else if(act === 'del-cust'){
          deleteCustomer(id);
        } else if(act === 'edit-evt'){
          openEditEvent(type, id);
        } else if(act === 'del-evt'){
          deleteEvent(type, id);
        } else if(act === 'manage-docs'){
          openDocumentManager(id);
        } else if(act === 'manage-pic-cc'){
          openPicCcManager(id); 
        }
      };
    });
  }, 120);

  // nav
  $all('.nav li').forEach(li=> li.onclick = (ev)=>{ 
    $all('.nav li').forEach(x=>x.classList.remove('active'));
    ev.target.classList.add('active');
    renderPage(); 
  });
}

function openModalView(){ $('#modal-view').style.display='flex'; }
function closeModalView(){ $('#modal-view').style.display='none'; }


/********************
 Init
********************/
(function init(){
  // Menghapus baris placeholder login
  $('#datetime').innerText = nowDateTime();
  setInterval(()=>{ $('#datetime').innerText = nowDateTime(); }, 60000);

  renderPage();

  // close modals on backdrop click
  document.addEventListener('click', e=>{ 
    if(e.target.id==='modal-add-edit') closeModalAddEdit();
    if(e.target.id==='modal-edit-cust') $('#modal-edit-cust').style.display='none';
    if(e.target.id==='modal-add-cust') $('#modal-add-cust').style.display='none';
    if(e.target.id==='modal-add-pic') $('#modal-add-pic').style.display='none';
    if(e.target.id==='modal-doc-manager') closeModalDocManager();
  });
})();