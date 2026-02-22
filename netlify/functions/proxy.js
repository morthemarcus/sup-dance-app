exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const GAS_URL = process.env.GAS_URL;

  try {
    const body = JSON.parse(event.body);
    const action = body.action;

    // READ: fetch data from Google Sheet and return it to the app
    if (action === 'read') {
      const response = await fetch(`${GAS_URL}?action=read`, {
        method: 'GET',
        redirect: 'follow',
      });
      const text = await response.text();
      let data = {};
      try { data = JSON.parse(text); } catch(e) { data = {}; }
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      };
    }

    // SAVE or BACKUP: forward to Google Apps Script
    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: event.body,
      redirect: 'follow',
    });

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: true }),
    };

  } catch (err) {
    console.log("ERROR:", err.toString());
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: false, error: err.toString() }),
    };
  }
};
