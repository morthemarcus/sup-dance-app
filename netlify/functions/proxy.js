const XLSX = require('xlsx-style');

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

// Style helpers
const headerStyle = {
  font: { bold: true, color: { rgb: 'D0F020' }, sz: 12 },
  fill: { fgColor: { rgb: '1A3A00' }, patternType: 'solid' },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: { bottom: { style: 'thin', color: { rgb: 'AAAAAA' } } }
};
const groupStyle = {
  font: { bold: true, color: { rgb: 'C8E020' }, sz: 11 },
  fill: { fgColor: { rgb: '2A4800' }, patternType: 'solid' },
  alignment: { horizontal: 'left', vertical: 'center' }
};
const totalStyle = {
  font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
  fill: { fgColor: { rgb: '0D1F00' }, patternType: 'solid' },
  alignment: { horizontal: 'center', vertical: 'center' }
};
const cellStyle = {
  font: { sz: 11 },
  alignment: { vertical: 'center', wrapText: true },
  border: { bottom: { style: 'hair', color: { rgb: 'DDDDDD' } } }
};
const altStyle = {
  font: { sz: 11 },
  fill: { fgColor: { rgb: 'F2F7EC' }, patternType: 'solid' },
  alignment: { vertical: 'center', wrapText: true },
  border: { bottom: { style: 'hair', color: { rgb: 'DDDDDD' } } }
};
const paidStyle = {
  font: { bold: true, color: { rgb: '2A7A00' }, sz: 11 },
  fill: { fgColor: { rgb: 'E6F4E0' }, patternType: 'solid' },
  alignment: { horizontal: 'center', vertical: 'center' }
};
const unpaidStyle = {
  font: { bold: true, color: { rgb: 'C00000' }, sz: 11 },
  fill: { fgColor: { rgb: 'FDE8E8' }, patternType: 'solid' },
  alignment: { horizontal: 'center', vertical: 'center' }
};
const partialStyle = {
  font: { bold: true, color: { rgb: '856404' }, sz: 11 },
  fill: { fgColor: { rgb: 'FFF3CD' }, patternType: 'solid' },
  alignment: { horizontal: 'center', vertical: 'center' }
};

function payStyle(s) { return s === 'paid' ? paidStyle : s === 'partial' ? partialStyle : unpaidStyle; }
function payLabel(s) { return s === 'paid' ? 'Paid' : s === 'partial' ? 'Partial' : 'Unpaid'; }

function cell(v, s) { return { v, s, t: typeof v === 'number' ? 'n' : 's' }; }

function applyStyles(ws, data, styleMap) {
  // styleMap: { rowIndex: { colIndex: style } } or a function (r,c) => style
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      if (!ws[addr]) continue;
      const s = typeof styleMap === 'function' ? styleMap(r, c, ws[addr]) : (styleMap[r] && styleMap[r][c]);
      if (s) ws[addr].s = s;
    }
  }
}

function buildXlsx(data) {
  const { students, classes, attendance, notes, payments } = data;
  const activeStudents = alpha((students || []).filter(s => !s.archived));
  const activeClasses = (classes || []).filter(c => !c.archived);

  const getPayStatus = (sid, mk) => (payments || {})[`${sid}-${mk}`]?.status || 'unpaid';

  const allMonths = new Set();
  Object.values(attendance || {}).forEach(recs => recs.forEach(r => allMonths.add(r.date.slice(0, 7))));
  allMonths.add(monthKey());
  const months = [...allMonths].sort((a, b) => b.localeCompare(a));

  const wb = XLSX.utils.book_new();

  // ── STUDENTS ─────────────────────────────────────────────────────────────
  const sRows = [
    ['Name', 'Phone', 'Email', 'Birthday', 'Join Date', 'Classes Enrolled', 'Total Attended']
  ];
  activeStudents.forEach(s => {
    const enrolled = (s.assignedClasses || []).map(cid => (classes || []).find(c => c.id === cid)?.name).filter(Boolean).join(', ');
    sRows.push([s.name, s.phone || '', s.email || '', s.birthday || '', s.joinDate || '', enrolled, (attendance[s.id] || []).length]);
  });
  const sWs = XLSX.utils.aoa_to_sheet(sRows);
  sWs['!cols'] = [{ wch: 25 }, { wch: 16 }, { wch: 28 }, { wch: 14 }, { wch: 12 }, { wch: 35 }, { wch: 8 }];
  applyStyles(sWs, (r, c, cellObj) => {
    if (r === 0) return headerStyle;
    return r % 2 === 0 ? altStyle : cellStyle;
  });
  XLSX.utils.book_append_sheet(wb, sWs, 'Students');

  // ── CLASSES ───────────────────────────────────────────────────────────────
  const cRows = [['Class Name', 'Day', 'Time', 'Price/Class', 'Enrolled', 'Sessions']];
  activeClasses.forEach(c => {
    const enrolled = activeStudents.filter(s => (s.assignedClasses || []).includes(c.id)).length;
    const sessions = new Set(Object.values(attendance || {}).flatMap(recs => recs.filter(r => r.classId === c.id).map(r => r.date))).size;
    cRows.push([c.name, c.day, c.time, c.pricePerClass || 40, enrolled, sessions]);
  });
  cRows.push([]);
  const groupStartRows = {};
  activeClasses.forEach(c => {
    const enrolled = activeStudents.filter(s => (s.assignedClasses || []).includes(c.id));
    groupStartRows[cRows.length] = true;
    cRows.push([`${c.name} — Enrolled Students (${enrolled.length})`]);
    cRows.push(['Name', 'Phone', 'Email']);
    enrolled.forEach(s => cRows.push([s.name, s.phone || '', s.email || '']));
    cRows.push([]);
  });
  const cWs = XLSX.utils.aoa_to_sheet(cRows);
  cWs['!cols'] = [{ wch: 28 }, { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 10 }, { wch: 10 }];
  applyStyles(cWs, (r, c) => {
    if (r === 0) return headerStyle;
    if (groupStartRows[r]) return groupStyle;
    return r % 2 === 0 ? altStyle : cellStyle;
  });
  XLSX.utils.book_append_sheet(wb, cWs, 'Classes');

  // ── MONTHLY ───────────────────────────────────────────────────────────────
  months.forEach(mk => {
    const label = mthLabel(mk);
    const archivedWithAttend = (classes || []).filter(c =>
      c.archived && Object.values(attendance || {}).some(recs => recs.some(r => r.classId === c.id && r.date.startsWith(mk)))
    );
    const monthCls = [...activeClasses, ...archivedWithAttend];
    const headers = ['Student', 'Phone', ...monthCls.map(c => c.name), 'Total', 'Owed (₪)', 'Payment', 'Notes'];
    const mRows = [headers];
    const groupRows = {};
    const payRows = {}; // rowIndex -> status

    monthCls.forEach(cls => {
      const classStudents = alpha(activeStudents.filter(s => (s.assignedClasses || []).includes(cls.id)));
      if (!classStudents.length) return;
      groupRows[mRows.length] = true;
      mRows.push([`${cls.name}  (${cls.day} ${cls.time})`]);
      classStudents.forEach(s => {
        let total = 0, owed = 0;
        const classCells = monthCls.map(c => {
          const n = (attendance[s.id] || []).filter(r => r.date.startsWith(mk) && r.classId === c.id).length;
          total += n; owed += n * (c.pricePerClass || 40);
          return n || '';
        });
        const due = Math.max(MONTHLY_MINIMUM, owed);
        const status = getPayStatus(s.id, mk);
        const mnotes = (notes[s.id] || []).filter(n => n.ts.startsWith(mk)).map(n => n.text).join(' | ') || '';
        const rowIdx = mRows.length;
        payRows[rowIdx] = status;
        mRows.push([s.name, s.phone || '', ...classCells, total || '', total ? due : '', payLabel(status), mnotes]);
      });
    });

    const colTotals = monthCls.map(c => activeStudents.reduce((sum, s) => sum + (attendance[s.id] || []).filter(r => r.date.startsWith(mk) && r.classId === c.id).length, 0));
    const grandTotal = colTotals.reduce((a, b) => a + b, 0);
    const grandRevenue = activeStudents.reduce((sum, s) => {
      const recs = (attendance[s.id] || []).filter(r => r.date.startsWith(mk));
      let o = 0; recs.forEach(r => { const c = (classes || []).find(x => x.id === r.classId); o += (c?.pricePerClass || 40); });
      return sum + Math.max(MONTHLY_MINIMUM, o);
    }, 0);
    const totalRowIdx = mRows.length;
    mRows.push(['TOTAL', '', ...colTotals, grandTotal, grandRevenue, '', '']);

    const mWs = XLSX.utils.aoa_to_sheet(mRows);
    mWs['!cols'] = [{ wch: 25 }, { wch: 14 }, ...monthCls.map(() => ({ wch: 16 })), { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 35 }];
    const payColIdx = 2 + monthCls.length + 2; // Payment column
    applyStyles(mWs, (r, c) => {
      if (r === 0) return headerStyle;
      if (r === totalRowIdx) return totalStyle;
      if (groupRows[r]) return groupStyle;
      if (c === payColIdx && payRows[r]) return payStyle(payRows[r]);
      return r % 2 === 0 ? altStyle : cellStyle;
    });
    XLSX.utils.book_append_sheet(wb, mWs, label.slice(0, 31));
  });

  // ── NOTES ─────────────────────────────────────────────────────────────────
  const nRows = [['Date', 'Student', 'Note']];
  const allNoteRows = [];
  (students || []).forEach(s => (notes[s.id] || []).forEach(n => allNoteRows.push({ name: s.name, text: n.text, ts: n.ts })));
  allNoteRows.sort((a, b) => b.ts.localeCompare(a.ts));
  allNoteRows.forEach(n => nRows.push([n.ts.slice(0, 10), n.name, n.text]));
  const nWs = XLSX.utils.aoa_to_sheet(nRows);
  nWs['!cols'] = [{ wch: 12 }, { wch: 25 }, { wch: 60 }];
  applyStyles(nWs, (r) => r === 0 ? headerStyle : r % 2 === 0 ? altStyle : cellStyle);
  XLSX.utils.book_append_sheet(wb, nWs, 'Notes');

  return XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  const GAS_URL = process.env.GAS_URL;
  try {
    const body = JSON.parse(event.body);
    const action = body.action;

    if (action === 'read') {
      const response = await fetch(`${GAS_URL}?action=read`, { method: 'GET', redirect: 'follow' });
      const text = await response.text();
      let data = {};
      try { data = JSON.parse(text); } catch (e) { data = {}; }
      return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: JSON.stringify(data) };
    }

    if (action === 'save') {
      const appData = JSON.parse(body.json);
      const xlsxBase64 = buildXlsx(appData);
      await fetch(GAS_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'save', json: body.json, excel: { base64: xlsxBase64, filename: 'SUP-Studio.xlsx' } }), redirect: 'follow' });
      return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ ok: true }) };
    }

    if (action === 'backup') {
      const appData = JSON.parse(body.json);
      const xlsxBase64 = buildXlsx(appData);
      const filename = `SUP-Backup-${new Date().toISOString().slice(0, 10)}.xlsx`;
      await fetch(GAS_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'backup', base64: xlsxBase64, filename }), redirect: 'follow' });
      return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Unknown action' }) };
  } catch (err) {
    console.log('ERROR:', err.toString());
    return { statusCode: 500, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ ok: false, error: err.toString() }) };
  }
};
