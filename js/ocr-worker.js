/* Lector de texto de fotos (Tesseract, carpeta js/vendor/ocr). Todo pasa dentro del teléfono: la foto no se envía a ningún lado. */
var listo = null;
function iniciar(base) {
  if (listo) return listo;
  listo = (async function () {
    var simd = false;
    try { simd = WebAssembly.validate(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11])); } catch (e) { /* sin SIMD */ }
    importScripts(base + (simd ? 'tesseract-core-simd-lstm.wasm.js' : 'tesseract-core-lstm.wasm.js'));
    var T = await TesseractCore();
    var r = await fetch(base + 'spa.traineddata.gz');
    if (!r.ok) throw new Error('No se pudo descargar el lector (' + r.status + ')');
    var datos = new Uint8Array(await r.arrayBuffer());
    if (datos[0] === 0x1f && datos[1] === 0x8b) datos = new Uint8Array(await new Response(new Blob([datos]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
    T.FS.writeFile('./spa.traineddata', datos);
    var api = new T.TessBaseAPI();
    if (api.Init(null, 'spa')) throw new Error('No se pudo iniciar el lector.');
    return { T: T, api: api };
  })();
  listo.catch(function () { listo = null; });
  return listo;
}
onmessage = async function (e) {
  try {
    var x = await iniciar(e.data.base);
    x.T.FS.writeFile('/input', new Uint8Array(e.data.imagen));
    if (x.api.SetImageFile(1, 0) === 1) throw new Error('No pude abrir la imagen.');
    x.api.Recognize(null);
    var texto = x.api.GetUTF8Text();
    x.api.Clear();
    postMessage({ ok: true, texto: texto });
  } catch (err) { postMessage({ ok: false, error: String(err && err.message || err) }); }
};
