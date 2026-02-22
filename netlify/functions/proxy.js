exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const GAS_URL = process.env.GAS_URL;
  console.log("GAS_URL:", GAS_URL);
  console.log("Body length:", event.body ? event.body.length : 0);

  try {
    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: event.body,
      redirect: 'follow',
    });

    const text = await response.text();
    console.log("GAS response status:", response.status);
    console.log("GAS response:", text.slice(0, 200));

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
