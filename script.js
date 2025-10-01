document.addEventListener('DOMContentLoaded', () => {
  // ELEMENTS
  const bal = document.getElementById('currentBalance');
  const inc = document.getElementById('totalIncome');
  const exp = document.getElementById('totalExpense');
  const hist = document.getElementById('transactionHistoryBody');
  const recap = document.getElementById('monthlyRecapBody');
  const monthSel = document.getElementById('monthSelector');

  const inDate = document.getElementById('incomeDate');
  const inAmt = document.getElementById('incomeAmount');
  const inDesc = document.getElementById('incomeDescription');
  const inCat = document.getElementById('incomeCategory');
  const addIn = document.getElementById('addIncomeBtn');

  const exDate = document.getElementById('expenseDate');
  const exAmt = document.getElementById('expenseAmount');
  const exDesc = document.getElementById('expenseDescription');
  const exCat = document.getElementById('expenseCategory');
  const addEx = document.getElementById('addExpenseBtn');

  const btnXlsx = document.getElementById('exportExcelBtn');
  const btnCsv = document.getElementById('exportCsvBtn');

  // Edit modal
  const editTxMonth = document.getElementById('editTxMonth');
  const editTxId = document.getElementById('editTxId');
  const editType = document.getElementById('editType');
  const editDate = document.getElementById('editDate');
  const editAmount = document.getElementById('editAmount');
  const editCategory = document.getElementById('editCategory');
  const editDescription = document.getElementById('editDescription');
  const saveEditBtn = document.getElementById('saveEditBtn');

  let pie = null, bar = null;

  // Helpers
  function today(){ return new Date().toISOString().slice(0,10); }
  inDate.value = today(); exDate.value = today();

  function fmt(n){ return String(n||0).replace(/\B(?=(\d{3})+(?!\d))/g,'.'); }
  function clean(s){ return parseInt(String(s).replace(/\D/g,'')) || 0; }
  function mKeyFromDate(dateStr){ return dateStr ? dateStr.slice(0,7) : today().slice(0,7); }
  function mLabel(k){ const [y,m]=k.split('-'); return new Date(`${y}-${m}-01`).toLocaleString('id-ID',{month:'long',year:'numeric'}); }

  const STORE = 'catatan_keuangan_v2';

  function load(){ return JSON.parse(localStorage.getItem(STORE)||'{}'); }
  function save(d){ localStorage.setItem(STORE, JSON.stringify(d)); }

  function ensureMonthExists(k){
    const d=load();
    if(!d[k]) d[k]={income:0,expense:0,tx:[]};
    save(d); return d;
  }

  function refreshMonthSelector(){
    const defaultKey=mKeyFromDate(today());
    ensureMonthExists(defaultKey);
    const d=load(), keys=Object.keys(d).sort();
    monthSel.innerHTML='';
    keys.forEach(k=>{
      const o=document.createElement('option');
      o.value=k; o.textContent=mLabel(k);
      monthSel.appendChild(o);
    });
    if(keys.includes(defaultKey)) monthSel.value=defaultKey;
    else if(keys.length) monthSel.value=keys[keys.length-1];
    else { monthSel.value=defaultKey; }
  }

  function render(){
    const d=load();
    const k=monthSel.value||mKeyFromDate(today());
    ensureMonthExists(k);
    const m=d[k];
    bal.textContent='Rp '+fmt(m.income-m.expense);
    inc.textContent='Rp '+fmt(m.income);
    exp.textContent='Rp '+fmt(m.expense);

    // Riwayat
    hist.innerHTML='';
    if(m.tx.length===0){
      hist.innerHTML='<tr><td colspan="6" class="text-center text-muted">Belum ada transaksi.</td></tr>';
    } else {
      m.tx.forEach((t,i)=>{
        const tr=document.createElement('tr');
        tr.innerHTML=`
          <td>${t.date}</td>
          <td class="${t.type==='pemasukan'?'text-success':'text-danger'}">${t.type}</td>
          <td>${t.cat}</td>
          <td>${t.type==='pemasukan'?'+':'-'} Rp ${fmt(t.amt)}</td>
          <td>${t.desc}</td>
          <td>
            <button class="btn btn-sm btn-outline-primary me-1" data-action="edit" data-id="${i}" data-month="${k}">Edit</button>
            <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${i}" data-month="${k}">Hapus</button>
          </td>`;
        hist.appendChild(tr);
      });
    }

    // Rekap
    recap.innerHTML='';
    Object.keys(d).sort().forEach(kk=>{
      const mm=d[kk], sal=mm.income-mm.expense;
      const tr=document.createElement('tr');
      tr.innerHTML=`<td>${mLabel(kk)}</td>
        <td>Rp ${fmt(mm.income)}</td>
        <td>Rp ${fmt(mm.expense)}</td>
        <td>Rp ${fmt(sal)}</td>`;
      recap.appendChild(tr);
    });

    // Charts
    const cat={}; m.tx.forEach(t=>{if(t.type==='pengeluaran') cat[t.cat]=(cat[t.cat]||0)+t.amt;});
    if(pie) pie.destroy();
    pie=new Chart(document.getElementById('expenseCategoryChart'),{type:'pie',data:{labels:Object.keys(cat),datasets:[{data:Object.values(cat)}]}});
    if(bar) bar.destroy();
    const labs=Object.keys(d).sort();
    bar=new Chart(document.getElementById('monthlyFlowChart'),{type:'bar',data:{labels:labs.map(mLabel),datasets:[
      {label:'Pemasukan',data:labs.map(x=>d[x].income)},
      {label:'Pengeluaran',data:labs.map(x=>d[x].expense)}
    ]}});
  }

  function addTx(type,amt,desc,cat,date){
    const k=mKeyFromDate(date);
    const d=ensureMonthExists(k);
    const full=load();
    const tx={type,amt,desc,cat,date};
    full[k].tx.push(tx);
    if(type==='pemasukan') full[k].income+=amt; else full[k].expense+=amt;
    save(full); refreshMonthSelector(); monthSel.value=k; render();
  }

  function updateTx(month,id,newTx){
    const d=load();
    const m=d[month]; if(!m) return;
    const old=m.tx[id];
    if(old.type==='pemasukan') m.income-=old.amt; else m.expense-=old.amt;
    m.tx[id]=newTx;
    if(newTx.type==='pemasukan') m.income+=newTx.amt; else m.expense+=newTx.amt;
    save(d); render();
  }

  function deleteTx(month,id){
    const d=load();
    const m=d[month]; if(!m) return;
    const old=m.tx[id];
    if(old.type==='pemasukan') m.income-=old.amt; else m.expense-=old.amt;
    m.tx.splice(id,1);
    save(d); render();
  }

  // Formatter input
  function attachFormatter(input){
    if(!input) return;
    input.addEventListener('input',()=>{
      const val=clean(input.value);
      input.value=val?fmt(val):'';
    });
  }
  attachFormatter(inAmt); attachFormatter(exAmt); attachFormatter(editAmount);

  // Handlers add
  addIn.onclick=()=>{const a=clean(inAmt.value),desc=inDesc.value.trim(); if(!a||!desc) return alert('Isi pemasukan valid'); addTx('pemasukan',a,desc,inCat.value,inDate.value); inAmt.value=inDesc.value='';};
  addEx.onclick=()=>{const a=clean(exAmt.value),desc=exDesc.value.trim(); if(!a||!desc) return alert('Isi pengeluaran valid'); addTx('pengeluaran',a,desc,exCat.value,exDate.value); exAmt.value=exDesc.value='';};
  monthSel.onchange=render;

  // Delegate edit/delete buttons
  hist.addEventListener('click',e=>{
    const btn=e.target.closest('button'); if(!btn) return;
    const id=btn.dataset.id, month=btn.dataset.month;
    const d=load(), tx=d[month].tx[id];
    if(btn.dataset.action==='edit'){
      editTxMonth.value=month;
      editTxId.value=id;
      editType.value=tx.type;
      editDate.value=tx.date;
      editAmount.value=fmt(tx.amt);
      editCategory.value=tx.cat;
      editDescription.value=tx.desc;
      new bootstrap.Modal(document.getElementById('editModal')).show();
    }
    if(btn.dataset.action==='delete'){
      if(confirm('Hapus transaksi ini?')) deleteTx(month,id);
    }
  });

  saveEditBtn.onclick=()=>{
    const month=editTxMonth.value;
    const id=editTxId.value;
    const newTx={
      type:editType.value,
      date:editDate.value,
      amt:clean(editAmount.value),
      cat:editCategory.value.trim(),
      desc:editDescription.value.trim()
    };
    if(!newTx.amt||!newTx.desc) return alert('Isi data edit dengan benar');
    updateTx(month,id,newTx);
    bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
  };

  // Export
  btnCsv.onclick=()=>{const d=load(),rows=[['Bulan','Tanggal','Jenis','Kategori','Jumlah','Deskripsi']]; Object.keys(d).forEach(k=>d[k].tx.forEach(t=>rows.push([mLabel(k),t.date,t.type,t.cat,t.amt,t.desc]))); const csv=rows.map(r=>r.join(',')).join('\n'); const blob=new Blob([csv],{type:'text/csv'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='keuangan.csv'; a.click();};
  btnXlsx.onclick=()=>{const d=load(),rows=[['Bulan','Tanggal','Jenis','Kategori','Jumlah','Deskripsi']]; Object.keys(d).forEach(k=>d[k].tx.forEach(t=>rows.push([mLabel(k),t.date,t.type,t.cat,t.amt,t.desc]))); const wb=XLSX.utils.book_new(); const ws=XLSX.utils.aoa_to_sheet(rows); XLSX.utils.book_append_sheet(wb,ws,'Data'); XLSX.writeFile(wb,'keuangan.xlsx');};

  // Init
  refreshMonthSelector(); render();

  // register service worker
  if('serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js');
});
