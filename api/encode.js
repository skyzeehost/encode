import { obfuscate } from 'javascript-obfuscator';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Invalid input: code must be string' });
    }

    const encode1 = encodeURIComponent(JSON.stringify(code));
    const b64a = Buffer.from(encode1).toString("base64");
    const b64b = Buffer.from(b64a).toString("base64");

    const payload = `
      (function(){
        const x = s => decodeURIComponent(atob(atob(s)));
        const run = 'eva' + 'l';
        (function anti(){
          ['log','warn','error','info','debug'].forEach(f => console[f] = () => {});
          Object.defineProperty(console, '_commandLineAPI', {
            get: () => { throw 'Inspect blocked'; }
          });
          setInterval(() => { debugger; }, 1000);
        })();
        window[run](x("${b64b}"));
      })();
    `;

    const result = obfuscate(payload, {
      compact: true,
      controlFlowFlattening: true,
      deadCodeInjection: true,
      selfDefending: true,
      stringArray: true,
      stringArrayEncoding: ['base64'],
      stringArrayThreshold: 1
    });

    return res.status(200).json({ encoded: result.getObfuscatedCode() });

  } catch (err) {
    return res.status(500).json({ error: 'Internal Error', message: err.message });
  }
}
