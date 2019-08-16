import jszip from 'jszip';

// Unzip file
// Regex search all slides for {{ key }}, return as ordered array
// Regex replace all placeholders with their values based on a dictionary
// Rezip file

const r = /{{\s*([a-zA-Z0-9_\-]+\s*[a-zA-Z0-9_\-]+)\s*}}/g;

class Templater {
  constructor() {
    this.archive = undefined;
    this.type = undefined;
    this.vars = [];
  }

  async parse(document) {
    // load document
    this.archive = await jszip.loadAsync(document);
    // determine whether it's a pptx or a docx
    const d = this.archive.file(/word\/document.xml/);
    const p = this.archive.file(/slides\/slide\d\.xml/);
    if (d.length > 0) {
      this.type = 'docx';
      console.log('Identified .DOCX');
      // contained in one xml file
      const origString = await d[0].async('string');
      // find all keys
      for (const match of origString.matchAll(r)) {
        this.vars.push(match[1]);
      }
    } else if (p.length > 0) {
      console.log('Identified .PPTX');
      this.type = 'pptx';
      // contained in multiple xml files
      for (const file of p) {
        const origString = await file.async('string');
        // find all keys
        for (const match of origString.matchAll(r)) {
          this.vars.push(match[1]);
        }
      }
    } else {
      throw new Error('Failed to identify file as .docx or .pptx')
    }
    // filter repeated keys
    // this.vars = Array.from(new Set(this.vars));
    return this.vars;
  }
  
  async replace(map, type) {
    if (this.type === 'docx') {
      const origString = await this.archive.file(/word\/document.xml/)[0].async('string');
      // replace or empty
      const moddedString = origString.replace(r, (m, p1) => {
        if (map[p1]) {
          return map[p1];
        } else {
          return '';
        }
      });
      this.archive.file(this.archive.file(/word\/document.xml/)[0].name, moddedString);
    } else if (this.type === 'pptx') {
      for (const file of this.archive.file(/slides\/slide\d\.xml/)) {
        const origString = await file.async('string');
        // replace or empty
        const moddedString = origString.replace(r, (m, p1) => {
          if (map[p1]) {
            return map[p1];
          } else {
            return '';
          }
        });
        this.archive.file(file.name, moddedString);
      }
    }
    return this.archive.generateAsync({type: type || 'blob'});
  }
}

export default {Templater};
