const XLSX = require('xlsx');
const XLSXStyle = require('xlsx-style');

const MONTHLY_MINIMUM = 100;

function monthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function mthLabel(mk) {
  const [y, m] = mk.split('-');
  return new Date(+y, +m - 1, 1).toLocaleString('en', { month: 'long', year: 'numeric' });
}
function alpha(arr) {
  return [...arr].sort((a, b) => a.name.localeCompare(b.name));
}

const H = { font:{bold:true,color:{rgb:'D0F020'},sz:12}, fill:{fgColor:{rgb:'1A3A00'},patternType:'solid'}, alignment:{horizontal:'center',vertical:'center',wrapText:true} };
const G = { font:{bold:true,color:{rgb:'C8E020'},sz:11}, fill:{fgColor:{rgb:'2A4800'},patternType:'solid'}, alignment:{horizontal:'left',vertical:'center'} };
const T = { font:{bold:true,color:{rgb:'FFFFFF'},sz:11}, fill:{fgColor:{rgb:'0D1F00'},patternType:'solid'}, alignment:{horizontal:'center',vertical:'center'} };
const C = { font:{sz:11}, alignment:{vertical:'center',wrapText:true} };
const A = { font:{sz:11}, fill:{fgColor:{rgb:'F2F7EC'},patternType:'solid'}, alignment:{vertical:'center',wrapText:true} };
const PAID    = { font:{bold:true,color:{rgb:'2A7A00'},sz:11}, fill:{fgColor:{rgb:'E6F4E0'},patternType:'solid'}, alignment:{horizontal:'center'} };
const UNPAID  = { font:{bold:true,color:{rgb:'C00000'},sz:11}, fill:{fgColor:{rgb:'FDE8E8'},patternType:'solid'}, alignment:{horizontal:'center'} };
const PARTIAL = { font:{bold:true,color:{rgb:'856404'},sz:11}, fill:{fgColor:{rgb:'FFF3CD'},patternType:'solid'}, alignment:{horizontal:'center'} };

function ps(s) { return s==='paid'?PAID:s==='partial'?PARTIAL:UNPAID; }
function pl(s) { return s==='paid'?'Paid':s==='partial'?'Partial':'Unpaid'; }

function styleWs(ws, fn) {
  if (!ws['!ref']) return;
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({r, c});
      if (!ws[addr]) ws[addr] = {v:'', t:'s'};
      const s = fn(r, c);
      if (s) ws[addr].s = s;
    }
  }
}

function buildXlsx(data) {
  const { students, classes, attendance, notes, payments } = data;
  const activeStudents = alpha((students||[]).filter(s=>!s.archived));
  const activeClasses = (classes||[]).filter(c=>!c.archived);
  const getPayStatus = (sid,mk) => (payments||{})[`${sid}-${mk}`]?.status||'unpaid';

  const allMonths = new Set();
  Object.values(attendance||{}).forEach(recs=>recs.forEach(r=>allMonths.add(r.date.slice(0,7))));
  allMonths.add(monthKey());
  const months = [...allMonths].sort((a,b)=>b.localeCompare(a));

  const wb = XLSX.utils.book_new();

  // STUDENTS
  const sRows = [['Name','Phone','Email','Birthday','Join Date','Classes Enrolled','Total Attended']];
  activeStudents.forEach(s => {
    const enrolled = (s.assignedClasses||[]).map(cid=>(classes||[]).find(c=>c.id===cid)?.name).filter(Boolean).join(', ');
    sRows.push([s.name,s.phone||'',s.email||'',s.birthday||'',s.joinDate||'',enrolled,(attendance[s.id]||[]).length]);
  });
  const sWs = XLSX.utils.aoa_to_sheet(sRows);
  sWs['!cols'] = [{wch:25},{wch:16},{wch:28},{wch:14},{wch:12},{wch:35},{wch:8}];
  styleWs(sWs, (r)=>r===0?H:r%2===0?A:C);
  XLSX.utils.book_append_sheet(wb, sWs, 'Students');

  // CLASSES
  const cRows = [['Class Name','Day','Time','Price/Class','Enrolled','Sessions']];
  activeClasses.forEach(c => {
    const enrolled = activeStudents.filter(s=>(s.assignedClasses||[]).includes(c.id)).length;
    const sessions = new Set(Object.values(attendance||{}).flatMap(recs=>recs.filter(r=>r.classId===c.id).map(r=>r.date))).size;
    cRows.push([c.name,c.day,c.time,c.pricePerClass||40,enrolled,sessions]);
  });
  cRows.push([]);
  const cGrp = new Set();
  activeClasses.forEach(c => {
    const enrolled = activeStudents.filter(s=>(s.assignedClasses||[]).includes(c.id));
    cGrp.add(cRows.length);
    cRows.push([`${c.name} — Enrolled (${enrolled.length})`]);
    cRows.push(['Name','Phone','Email']);
    enrolled.forEach(s=>cRows.push([s.name,s.phone||'',s.email||'']));
    cRows.push([]);
  });
  const cWs = XLSX.utils.aoa_to_sheet(cRows);
  cWs['!cols'] = [{wch:28},{wch:12},{wch:8},{wch:12},{wch:10},{wch:10}];
  styleWs(cWs, (r)=>r===0?H:cGrp.has(r)?G:r%2===0?A:C);
  XLSX.utils.book_append_sheet(wb, cWs, 'Classes');

  // MONTHLY
  months.forEach(mk => {
    const label = mthLabel(mk);
    const archivedWith = (classes||[]).filter(c=>c.archived&&Object.values(attendance||{}).some(recs=>recs.some(r=>r.classId===c.id&&r.date.startsWith(mk))));
    const monthCls = [...activeClasses,...archivedWith];
    const headers = ['Student','Phone',...monthCls.map(c=>c.name),'Total','Owed (₪)','Payment','Notes'];
    const mRows = [headers];
    const mGrp = new Set();
    const mPay = {};

    monthCls.forEach(cls => {
      const clsStudents = alpha(activeStudents.filter(s=>(s.assignedClasses||[]).includes(cls.id)));
      if (!clsStudents.length) return;
      mGrp.add(mRows.length);
      mRows.push([`${cls.name}  (${cls.day} ${cls.time})`]);
      clsStudents.forEach(s => {
        let total=0,owed=0;
        const cells = monthCls.map(c=>{
          const n=(attendance[s.id]||[]).filter(r=>r.date.startsWith(mk)&&r.classId===c.id).length;
          total+=n; owed+=n*(c.pricePerClass||40);
          return n||'';
        });
        const due = Math.max(MONTHLY_MINIMUM,owed);
        const status = getPayStatus(s.id,mk);
        const mnotes = (notes[s.id]||[]).filter(n=>n.ts.startsWith(mk)).map(n=>n.text).join(' | ')||'';
        mPay[mRows.length] = status;
        mRows.push([s.name,s.phone||'',...cells,total||'',total?due:'',pl(status),mnotes]);
      });
    });

    const colTotals = monthCls.map(c=>activeStudents.reduce((sum,s)=>sum+(attendance[s.id]||[]).filter(r=>r.date.startsWith(mk)&&r.classId===c.id).length,0));
    const grandRevenue = activeStudents.reduce((sum,s)=>{
      const recs=(attendance[s.id]||[]).filter(r=>r.date.startsWith(mk));
      let o=0; recs.forEach(r=>{const c=(classes||[]).find(x=>x.id===r.classId);o+=(c?.pricePerClass||40);});
      return sum+Math.max(MONTHLY_MINIMUM,o);
    },0);
    const totalRow = mRows.length;
    mRows.push(['TOTAL','',...colTotals,colTotals.reduce((a,b)=>a+b,0),grandRevenue,'','']);

    const mWs = XLSX.utils.aoa_to_sheet(mRows);
    mWs['!cols'] = [{wch:25},{wch:14},...monthCls.map(()=>({wch:16})),{wch:10},{wch:12},{wch:10},{wch:35}];
    const payCol = 2+monthCls.length+2;
    styleWs(mWs, (r,c)=>{
      if (r===0) return H;
      if (r===totalRow) return T;
      if (mGrp.has(r)) return G;
      if (c===payCol && mPay[r]) return ps(mPay[r]);
      return r%2===0?A:C;
    });
    XLSX.utils.book_append_sheet(wb, mWs, label.slice(0,31));
  });

  // NOTES
  const nRows = [['Date','Student','Note']];
  const allNotes = [];
  (students||[]).forEach(s=>(notes[s.id]||[]).forEach(n=>allNotes.push({name:s.name,text:n.text,ts:n.ts})));
  allNotes.sort((a,b)=>b.ts.localeCompare(a.ts));
  allNotes.forEach(n=>nRows.push([n.ts.slice(0,10),n.name,n.text]));
  const nWs = XLSX.utils.aoa_to_sheet(nRows);
  nWs['!cols'] = [{wch:12},{wch:25},{wch:60}];
  styleWs(nWs, (r)=>r===0?H:r%2===0?A:C);
  XLSX.utils.book_append_sheet(wb, nWs, 'Notes');

  const wbStyled = { SheetNames: wb.SheetNames, Sheets: wb.Sheets };
  return XLSXStyle.write(wbStyled, { type: 'base64', bookType: 'xlsx' });
}

// ─── הפעולות החדשות — מעבירות ישירות ל-Google Apps Script ───────────────────
const STUDENT_ACTIONS = ['getStudioData','studentLogin','registerClass','unregisterClass','updateStudentProfile','logPayment'];

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode:200, headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'}, body:'' };
  }

  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const GAS_URL = process.env.GAS_URL;

  try {
    const body = JSON.parse(event.body);
    const { action } = body;

    // ── פעולות תלמידה — מעבירות ישירות ל-GAS ──
    if (STUDENT_ACTIONS.includes(action)) {
      const res = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        redirect: 'follow'
      });
      const text = await res.text();
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: text
      };
    }

    // ── פעולות מורה — קיימות ──
    if (action === 'read') {
      const res = await fetch(`${GAS_URL}?action=read`, { method:'GET', redirect:'follow' });
      const text = await res.text();
      let d = {}; try { d = JSON.parse(text); } catch(e) {}
      return { statusCode:200, headers:{'Access-Control-Allow-Origin':'*','Content-Type':'application/json'}, body:JSON.stringify(d) };
    }
    if (action === 'save') {
      const b64 = buildXlsx(JSON.parse(body.json));
      await fetch(GAS_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action:'save',json:body.json,excel:{base64:b64,filename:'SUP-Studio.xlsx'}}), redirect:'follow' });
      return { statusCode:200, headers:{'Access-Control-Allow-Origin':'*'}, body:JSON.stringify({ok:true}) };
    }
    if (action === 'backup') {
      const b64 = buildXlsx(JSON.parse(body.json));
      const filename = `SUP-Backup-${new Date().toISOString().slice(0,10)}.xlsx`;
      await fetch(GAS_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action:'backup',base64:b64,filename}), redirect:'follow' });
      return { statusCode:200, headers:{'Access-Control-Allow-Origin':'*'}, body:JSON.stringify({ok:true}) };
    }

    return { statusCode:400, body:JSON.stringify({ok:false,error:'Unknown action'}) };

  } catch(err) {
    console.log('ERROR:', err.toString());
    return { statusCode:500, headers:{'Access-Control-Allow-Origin':'*'}, body:JSON.stringify({ok:false,error:err.toString()}) };
  }
};
