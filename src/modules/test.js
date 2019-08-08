import templating from './templating';
import fetch from 'node-fetch'; // remove for prod

(async () => {
  const t = new templating.Templater();
  const file = await (await fetch('http://127.0.0.1:8080/testFile2.docx')).arrayBuffer();
  const keys = await t.parse(file);
  console.log(keys);
  // wait for form...
  const answerObject = {};
  for (const key of keys) {
    answerObject[key] = 'placeholder';
  }
  const finalFile = await t.replace(answerObject);
})();