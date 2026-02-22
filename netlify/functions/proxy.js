const XLSX = require('xlsx');

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

function buildXlsx(data) {
  const { students, classes, attendance, notes, payments } = data;
  const activeStudents = alpha((students || []).filter(s => !s.archived));
  const activeClasses = (classes || []).filter(c => !c.archived);

  const getPayStatus = (sid, mk) => (payments || {})[`${sid}-${mk}`]?.status || 'unpaid';
  const payLabel = s => s === 'paid' ? 'Paid' : s === 'partial' ? 'Partial' : 'Unpaid';

  const allMonths = new Set();
  Object.values(attendance || {}).forEach(recs => recs.forEach(r => allMonths.add(r.date.slice(0, 7))));
  allMonths.add(monthKey());
  const months = [...allMonths].sort((a, b) => b.localeCompare(a));

  const wb = XLSX.utils.book_new();

  // STUDENTS TAB
  const studentsData = [
    ['Name', 'Phone', 'Email', 'Birthday', 'Join Date', 'Classes Enrolled', 'Total Classes Attended']
  ];
  activeStudents.forEach(s => {
    const enrolled = (s.assignedClasses || []).map(cid => (classes || []).find(c => c.id === cid)?.name).filter(Boolean).join(', ');
    const total = (attendance[s.id] || []).length;
    studentsData.push([s.name, s.phone || '', s.email || '', s.birthday || '', s.joinDate || '', enrolled, total]);
  });
  const studentsSheet = XLSX.utils.aoa_to_sheet(studentsData);
  studentsSheet['!cols'] = [{ wch: 25 }, { wch: 16 }, { wch: 28 }, { wch: 14 }, { wch: 12 }, { wch: 35 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, studentsSheet, 'Students');

  // CLASSES TAB
  const classesData = [
    ['Class Name', 'Day', 'Time', 'Price / Class', 'Enrolled Students', 'Total Sessions']
  ];
  activeClasses.forEach(c => {
    const enrolled = activeStudents.filter(s => (s.assignedClasses || []).includes(c.id)).length;
    const sessions = new Set(
      Object.values(attendance || {}).flatMap(recs => recs.filter(r => r.classId === c.id).map(r => r.date))
    ).size;
    classesData.push([c.name, c.day, c.time, `${c.pricePerClass || 40}`, enrolled, sessions]);
  });
  classesData.push([]);
  activeClasses.forEach(c => {
    const enrolled = activeStudents.filter(s => (s.assignedClasses || []).includes(c.id));
    classesData.push([`${c.name} - Enrolled Students (${enrolled.length})`]);
    classesData.push(['Name', 'Phone', 'Email']);
    enrolled.forEach(s => classesData.push([s.name, s.phone || '', s.email || '']));
    classesData.push([]);
  });
  const classesSheet = XLSX.utils.aoa_to_sheet(classesData);
  classesSheet['!cols'] = [{ wch: 28 }, { wch: 12 }, { wch: 8 }, { wch: 14 }, { wch: 10 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, classesSheet, 'Classes');

  // MONTHLY TABS
  months.forEach(mk => {
    const label = mthLabel(mk);
    const archivedWithAttend = (classes || []).filter(c =>
      c.archived && Object.values(attendance || {}).some(recs => recs.some(r => r.classId === c.id && r.date.startsWith(mk)))
    );
    const monthCls = [...activeClasses, ...archivedWithAttend];

    const headers = ['Student', 'Phone', ...monthCls.map(c => c.name), 'Total Classes', 'Amount Owed', 'Payment Status', 'Notes'];
    const sheetData = [headers];

    monthCls.forEach(cls => {
      const classStudents = alpha(activeStudents.filter(s => (s.assignedClasses || []).includes(cls.id)));
      if (!classStudents.length) return;
      sheetData.push([`-- ${cls.name} (${cls.day} ${cls.time}) --`]);
      classStudents.forEach(s => {
        let total = 0, owed = 0;
        const classCells = monthCls.map(c => {
          const n = (attendance[s.id] || []).filter(r => r.date.startsWith(mk) && r.classId === c.id).length;
          total += n;
          owed += n * (c.pricePerClass || 40);
          return n || '';
        });
        const due = Math.max(MONTHLY_MINIMUM, owed);
        const status = getPayStatus(s.id, mk);
        const mnotes = (notes[s.id] || []).filter(n => n.ts.startsWith(mk)).map(n => n.text).join(' | ') || '';
        sheetData.push([s.name, s.phone || '', ...classCells, total || '', total ? due : '', payLabel(status), mnotes]);
      });
    });

    const colTotals = monthCls.map(c =>
      activeStudents.reduce((sum, s) => sum + (attendance[s.id] || []).filter(r => r.date.startsWith(mk) && r.classId === c.id).length, 0)
    );
    const grandTotal = colTotals.reduce((a, b) => a + b, 0);
    const grandRevenue = activeStudents.reduce((sum, s) => {
      const recs = (attendance[s.id] || []).filter(r => r.date.startsWith(mk));
      let o = 0;
      recs.forEach(r => { const c = (classes || []).find(x => x.id === r.classId); o += (c?.pricePerClass || 40); });
      return sum + Math.max(MONTHLY_MINIMUM, o);
    }, 0);
    sheetData.push(['TOTAL', '', ...colTotals, grandTotal, grandRevenue, '', '']);

    const monthSheet = XLSX.utils.aoa_to_sheet(sheetData);
    monthSheet['!cols'] = [{ wch: 25 }, { wch: 14 }, ...monthCls.map(() => ({ wch: 18 })), { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 35 }];
    XLSX.utils.book_append_sheet(wb, monthSheet, label.slice(0, 31));
  });

  // NOTES TAB
  const notesData = [['Date', 'Student', 'Note']];
  const allNoteRows = [];
  (students || []).forEach(s => (notes[s.id] || []).forEach(n => allNoteRows.push({ name: s.name, text: n.text, ts: n.ts })));
  allNoteRows.sort((a, b) => b.ts.localeCompare(a.ts));
  allNoteRows.forEach(n => notesData.push([n.ts.slice(0, 10), n.name, n.text]));
  const notesSheet = XLSX.utils.aoa_to_sheet(notesData);
  notesSheet['!cols'] = [{ wch: 12 }, { wch: 25 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, notesSheet, 'Notes');

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
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      };
    }

    if (action === 'save') {
      const appData = JSON.parse(body.json);
      const xlsxBase64 = buildXlsx(appData);
      await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', json: body.json, excel: { base64: xlsxBase64, filename: 'SUP-Studio.xlsx' } }),
        redirect: 'follow',
      });
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ ok: true }),
      };
    }

    if (action === 'backup') {
      const appData = JSON.parse(body.json);
      const xlsxBase64 = buildXlsx(appData);
      const filename = `SUP-Backup-${new Date().toISOString().slice(0, 10)}.xlsx`;
      await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'backup', base64: xlsxBase64, filename }),
        redirect: 'follow',
      });
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ ok: true }),
      };
    }

    return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Unknown action' }) };

  } catch (err) {
    console.log('ERROR:', err.toString());
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: false, error: err.toString() }),
    };
  }
};
