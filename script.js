// data store
let berkas = JSON.parse(localStorage.getItem("berkas")) || [];
let pengurusData = JSON.parse(localStorage.getItem("pengurusData")) || [];

const tbody = document.querySelector("#tabelBerkas tbody");
const tbodyPengurus = document.querySelector("#tabelPengurus tbody");
const rekapMinggu = document.getElementById("rekapMinggu");
const rekapSelesai = document.getElementById("rekapSelesai");
const pengurusSelect = document.getElementById("pengurus");
let chart;

// helper: format tanggal (DD-MM-YYYY)
function formatTanggal(tgl) {
  if (!tgl) return "";
  const d = new Date(tgl);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

// helper: format rupiah (adds . as thousands)
function formatRupiah(angka) {
  return angka.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// init: apply rupiah formatter
document.getElementById("jumlahPkb").addEventListener("input", function () {
  this.value = formatRupiah(this.value);
});

// when pengurus selection changes: set telp
document.getElementById("pengurus").addEventListener("change", function () {
  const pid = this.value;
  if (!pid) {
    document.getElementById("noTelp").value = "";
    return;
  }
  const p = pengurusData.find(x => x.id === pid);
  document.getElementById("noTelp").value = p ? p.telp : "";
});

// handle berkas form submit
document.getElementById("berkasForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const pengurusId = pengurus.value;
  const pengurusObj = pengurusData.find(p => p.id === pengurusId) || {nama: pengurus.options[pengurus.selectedIndex]?.text || "", telp: document.getElementById("noTelp").value};

  const data = {
    id: Date.now().toString(),
    tanggalMasuk: tanggalMasuk.value,
    nrkb: nrkb.value,
    namaPemilik: namaPemilik.value,
    nomorRangka: nomorRangka.value,
    noBpkb: noBpkb.value,
    tanggalJatuhTempo: tanggalJatuhTempo.value,
    jumlahPkb: jumlahPkb.value,
    pengurusId: pengurusId || null,
    pengurusNama: pengurusObj.nama,
    pengurusTelp: pengurusObj.telp || document.getElementById("noTelp").value,
    catatan: catatan.value,
    proses: proses.value,
    checklist: defaultChecklist(proses.value),
    pengingat: Date.now() + 7 * 24 * 60 * 60 * 1000
  };

  berkas.push(data);
  saveData();
  this.reset();
  // reset select to default
  pengurusSelect.value = "";
  document.getElementById("noTelp").value = "";
});

// default checklist by proses
function defaultChecklist(proses) {
  if (proses === "Perpanjangan STNK") return { stnk: false, tnkb: false };
  if (proses === "Mutasi Keluar") return { selesai: false };
  return { stnk: false, tnkb: false, bpkb: false };
}

// save to localStorage + re-render
function saveData() {
  localStorage.setItem("berkas", JSON.stringify(berkas));
  localStorage.setItem("pengurusData", JSON.stringify(pengurusData));
  renderTable();
  renderPengurus();
  updatePengurusSelect();
  renderRekap();
}

// delete berkas
function hapusData(i) {
  if (confirm("Yakin ingin menghapus catatan ini?")) {
    berkas.splice(i, 1);
    saveData();
  }
}

// delete pengurus
function hapusPengurus(i) {
  const p = pengurusData[i];
  if (!p) return;
  if (confirm(`Hapus pengurus "${p.nama}"? (catatan lama tetap menyimpan nama dan telepon)`)) {
    pengurusData.splice(i, 1);
    saveData();
  }
}

// render table berkas
function renderTable() {
  tbody.innerHTML = "";
  if (berkas.length === 0) {
    tbody.innerHTML = `<tr><td colspan="14">Belum ada catatan</td></tr>`;
    return;
  }
  berkas.forEach((b, i) => {
    const checklistHTML = Object.keys(b.checklist)
      .map((k) =>
        `<div class="form-check form-check-inline">
           <input type="checkbox" class="form-check-input" ${b.checklist[k] ? "checked" : ""} onchange="toggleChecklist('${b.id}', '${k}')">
           <label class="form-check-label">${k.toUpperCase()}</label>
         </div>`
      ).join("");
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${formatTanggal(b.tanggalMasuk)}</td>
      <td>${b.nrkb}</td>
      <td>${b.namaPemilik}</td>
      <td>${b.noBpkb}</td>
      <td>${b.nomorRangka}</td>
      <td>${b.pengurusNama || "-"}</td>
      <td>${b.pengurusTelp || "-"}</td>
      <td>${b.proses}</td>
      <td>${formatTanggal(b.tanggalJatuhTempo)}</td>
      <td>Rp ${b.jumlahPkb}</td>
      <td>${b.catatan || "-"}</td>
      <td>${checklistHTML}</td>
      <td>
        <button class="btn btn-sm btn-danger" onclick="hapusData(${i})"><i class="fas fa-trash"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// render data master pengurus
document.getElementById("pengurusForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const nama = namaPengurus.value.trim();
  const telp = telpPengurus.value.trim();
  if (!nama || !telp) return alert("Isi nama dan telepon pengurus.");
  const newP = { id: Date.now().toString(), nama, telp };
  pengurusData.push(newP);
  saveData();
  this.reset();
});

// render pengurus table
function renderPengurus() {
  tbodyPengurus.innerHTML = "";
  if (pengurusData.length === 0) {
    tbodyPengurus.innerHTML = `<tr><td colspan="4">Belum ada data</td></tr>`;
    return;
  }
  pengurusData.forEach((p, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${p.nama}</td>
      <td>${p.telp}</td>
      <td><button class="btn btn-sm btn-danger" onclick="hapusPengurus(${i})"><i class="fas fa-trash"></i></button></td>
    `;
    tbodyPengurus.appendChild(tr);
  });
}

// update pengurus select (value=id; data-telp in option)
function updatePengurusSelect() {
  pengurusSelect.innerHTML = `<option value="">-- Pilih Pengurus --</option>`;
  pengurusData.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = `${p.nama} (${p.telp})`;
    opt.dataset.telp = p.telp;
    pengurusSelect.appendChild(opt);
  });
}

// toggle checklist by berkas id
function toggleChecklist(berkasId, key) {
  const idx = berkas.findIndex(b => b.id === berkasId);
  if (idx === -1) return;
  berkas[idx].checklist[key] = !berkas[idx].checklist[key];
  saveData();
}

// render rekap dan chart
function renderRekap() {
  const mingguIni = berkas.filter(
    (b) => new Date(b.tanggalMasuk) >= new Date(new Date().setDate(new Date().getDate() - 7))
  ).length;
  const selesai = berkas.filter((b) => Object.values(b.checklist).length > 0 && Object.values(b.checklist).every(v => v)).length;

  rekapMinggu.innerText = mingguIni;
  rekapSelesai.innerText = selesai;

  const prosesCount = {};
  berkas.forEach((b) => {
    prosesCount[b.proses] = (prosesCount[b.proses] || 0) + 1;
  });
  drawChart(prosesCount);
}

function drawChart(prosesCount) {
  const ctx = document.getElementById("chartProses").getContext("2d");
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: Object.keys(prosesCount),
      datasets: [{ data: Object.values(prosesCount) }]
    }
  });
}

// export ke excel (sheet lebih rapi)
function exportExcel() {
  // map data to friendly columns
  const dataForExcel = berkas.map(b => ({
    Tanggal: formatTanggal(b.tanggalMasuk),
    NRKB: b.nrkb,
    NamaPemilik: b.namaPemilik,
    NoBPKB: b.noBpkb,
    NoRangka: b.nomorRangka,
    PengurusNama: b.pengurusNama,
    PengurusTelp: b.pengurusTelp,
    Proses: b.proses,
    TglPKB: formatTanggal(b.tanggalJatuhTempo),
    JumlahPKB: b.jumlahPkb,
    Catatan: b.catatan
  }));
  const ws = XLSX.utils.json_to_sheet(dataForExcel);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Berkas");
  XLSX.writeFile(wb, "berkas.xlsx");
}

// show belum selesai (alert simple)
function showBelumSelesai() {
  const belum = berkas.filter(b => !(Object.values(b.checklist).length && Object.values(b.checklist).every(v => v)));
  if (belum.length === 0) return alert("Semua berkas telah selesai.");
  const list = belum.map(b => `${formatTanggal(b.tanggalMasuk)} - ${b.nrkb} - ${b.namaPemilik} (${b.proses})`).join("\n");
  alert(`Berkas belum selesai:\n\n${list}`);
}

// initial render
saveData();
