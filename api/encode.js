import { obfuscate } from "javascript-obfuscator";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: "Code is required" });
  }

  try {
    // Encode jadi Base64 + URI dua kali
    const json = JSON.stringify(code);
    const uri = encodeURIComponent(json);
    const b64 = Buffer.from(uri).toString("base64");
    const final = Buffer.from(b64).toString("base64");

    // Payload dengan Anti-Inspect dan Eval tersembunyi
    const payload = `
      (function(){
        const x = s => decodeURIComponent(atob(atob(s)));
        const y = 'eva' + 'l';

        // Anti Inspect & Debugger
        (function anti(){
          function trap(){
            const _ = () => {};
            ['log','warn','error','info','debug'].forEach(f => console[f] = _);
            Object.defineProperty(console, '_commandLineAPI', {
              get() { throw 'Inspect is disabled'; }
            });
            setInterval(function(){
              debugger;
              for(let i=0;i<1e6;i++){}
            }, 1000);
          }
          try { trap(); } catch(e){}
        })();

        // Jalankan code
        window[y](x("${final}"));
      })();
    `;

    // Obfuscate berat, tapi tanpa domain lock
    const obfuscated = obfuscate(payload, {
      compact: true,
      controlFlowFlattening: true,
      controlFlowFlatteningThreshold: 1,
      deadCodeInjection: true,
      deadCodeInjectionThreshold: 0.5,
      selfDefending: true,
      disableConsoleOutput: true,
      stringArray: true,
      stringArrayEncoding: ["base64", "rc4"],
      stringArrayThreshold: 1,
      rotateStringArray: true,
      splitStrings: true,
      splitStringsChunkLength: 3
    });

    res.status(200).json({ encoded: obfuscated.getObfuscatedCode() });

  } catch (e) {
    res.status(500).json({ error: "Encode error", detail: e.message });
  }
}