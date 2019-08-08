<template>
  <div id="wrapper">
    <transition name="slide-fade">
    <div v-if="mode == 'begin'">
      <h1>Select a template:</h1>
      <span v-if="templates.length == 0">Loading templates...</span>
      <div id="template_container">
        <transition-group name="slide-fade" tag="div">
        <fieldset class="template" v-for="template in templates" v-bind:key="template.id" @click="select(template)">
          <legend class="t_name">{{template.name}}</legend>
          <div>
            <img class="t_image" :src="getThumbnailImage(template)">
          </div>
        </fieldset>
        </transition-group>
      </div>
    </div>
    </transition>
    <transition name="slide-fade">
    <div v-if="mode == 'template'">
      <h1>Specify Substitutions:</h1>
      <span v-if="!vars">Processing template...</span>
      <table>
        <transition-group name="slide-fade-side" tag="div">
          <tr class="form_field" v-for="varName in vars" v-bind:key="varName">
            <td><label>{{varName}}</label></td>
            <td><input type="text"></td>
          </tr>
        </transition-group>
      </table>
      <transition name="slide-fade-side">
        <div id="inputError" v-if="inputError">{{inputError}}</div>
      </transition>
      <div class="button_container">
        <button @click="reset()">Cancel</button>
        <button @click="generate()" class="ok_b">Generate Document</button>
      </div>
    </div>
    </transition>
    <transition name="slide-fade">
    <div v-if="mode == 'confirm'">
      <h1>Download:</h1>
      <label>Filename:</label><input type="text" v-model="name">
      <transition name="slide-fade-side">
        <div id="inputError" v-if="inputError">{{inputError}}</div>
      </transition>
      <div class="button_container">
        <button @click="downloadBlob()" class="ok_b finalb">Download</button>
        <button @click="myFilesBlob()" class="ok_b_b finalb">Upload to My Files</button>
      </div>
      <button @click="reset()" class="finalb">Return to Templates</button>
    </div>
    </transition>
  </div>
</template>

<script>
import showpad from '../modules/showpad.js';
import templating from '../modules/templating.js';
import { isFulfilled } from 'q';

export default {
  name: 'SlideshowTemplater',
  mounted() {
    (async () => {
      await showpad.waitForShowpadLib();
      this.templates = (await showpad.getConfigJson()).assets;
      console.log(this.templates);
    })()
    this.mode = 'begin';
  },
  data() {
    return {
      // modes:
      // begin - selecting template
      // template - making substitutions
      // confirm - downloading or uploading
      mode: 'init',
      templates: [],
      selected: undefined,
      templater: undefined,
      vars: undefined,
      inputError: undefined,
      finalMap: undefined,
      blob: undefined,
      name: ""
    }
  },
  methods: {
    getThumbnailImage(asset) {
      return showpad.getThumbnailImage(asset);
    },
    select(template) {
      this.selected = template;
      console.log("Selected template ", this.selected.name);
      this.mode = 'template';
      this.templater = new templating.Templater();
      (async () => {
        const resp = await showpad.getAssetById(
          this.selected.id, await showpad.getApiConfig()
        );
        console.log(resp);
        const fullAsset = resp.response;
        const downloadUrl = fullAsset.shortLivedDownloadLink;
        console.log(downloadUrl);
        const file = await (await fetch(downloadUrl)).blob();
        const vars = await this.templater.parse(file);
        this.vars = vars;
      })();
    },
    reset() {
      this.selected = undefined;
      this.templater = undefined;
      this.vars = undefined;
      this.inputError = undefined;
      this.finalMap = undefined;
      this.blob = undefined;
      this.name = "";
      this.mode = "begin";
    },
    generate() {
      const form_elems = document.getElementsByClassName('form_field');
      for (const elem of form_elems) {
        const label = elem.children[0].firstChild.innerText;
        const input = elem.children[1].firstChild.value;
        if (input == "") {
          this.inputError = "Please fill all of the boxes."
          return;
        }
      }
      this.inputError = undefined;
      this.finalMap = {};
      for (const elem of form_elems) {
        const label = elem.children[0].firstChild.innerText;
        const input = elem.children[1].firstChild.value;
        this.finalMap[label] = input;
      }
      // do stuff with final map
      console.log(this.finalMap);
      (async () => {
        this.blob = await this.templater.replace(this.finalMap);
        const dt = new Date()
        const date_part = dt.getFullYear().toString() + '_' + dt.getMonth().toString() + '_' + dt.getDay().toString() + '_'
        this.name = date_part + this.selected.name
        this.mode = "confirm";
      })()
    },
    downloadBlob() {
      if (this.name.length < 1) {
        this.inputError = "Please provide a filename.";
        return;
      } else if ((!this.name.toLowerCase().endsWith('.docx')) && (!this.name.toLowerCase().endsWith('.pptx'))) {
        this.inputError = "Please include a file extension.";
        return;
      } else {
        this.inputError = "";
      }
      showpad.saveLocally(this.blob, this.name);
    },
    myFilesBlob() {
      if (this.name.length < 1) {
        this.inputError = "Please provide a filename.";
        return;
      } else if ((!this.name.toLowerCase().endsWith('.docx')) && (!this.name.toLowerCase().endsWith('.pptx'))) {
        this.inputError = "Please include a file extension.";
        return;
      } else {
        this.inputError = "";
      }
      showpad.saveToMyFiles(this.blob, this.name);
    }
  }
}
</script>

<style scoped>
button {
  padding: 15px;
  border-radius: 10px;
  color: darkslategrey;
  border-color: white;
}


.ok_b {
  background-color: lightgreen;
}

.ok_b_b {
  background-color: lightskyblue;
}

.finalb {
  margin-top: 20px;
}

#inputError {
  padding: 10px;
  background-color: white;
  color: lightcoral;
  border-color: lightcoral;
  border-style: solid;
  border-width: 1px;
  border-radius: 5px;
  border-top-left-radius: 0px;
  max-width: 190px;
  margin: auto;
  margin-bottom: 15px;
}

table {
  position: relative;
  right: 20px;
  margin:auto;
  margin-bottom: 10px;
}

td {
  text-align: right;
}

label {
  font-size: 20px;
  text-align: left;
  margin-right: 10px;
}

input {
  min-width: 300px;
  border-radius: 5px;
  margin-bottom: 5px;
  border-style: solid;
  border-color: lightgrey;
  border-width: 1px;
  height: 24px;
  font-size: 20px;
  color: darkslategrey;
}

input:focus,
select:focus,
textarea:focus,
button:focus {
    outline: none;
}

.form_field {
  max-width: 500px;
  margin: auto;
  padding: 5px;
}

#wrapper {
  padding-top: 10px;
  padding-bottom: 20px;
  background-color: whitesmoke;
  color: darkslategrey;
  border-radius: 20px;
  max-width: 800px;
  margin: auto;
}

#template-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
}
.template {
  display: inline-block;
  justify-content: center;
  border-color: lightgray;
  border-width: 1px;
  border-style: solid;
  border-radius: 5px;
  padding: 5px;
  margin: 5px;
  transition: background-color .4s;
}
.template:hover {
  cursor: pointer;
  background-color: white;
  transition: background-color .4s;
}
.t_image {
  max-height: 150px;
}

.slide-fade-enter-active {
  transition: all .3s ease;
}

.slide-fade-enter, .slide-fade-leave-to
/* .slide-fade-leave-active below version 2.1.8 */ {
  transform: translateY(10px);
  opacity: 0;
}

.slide-fade-side-enter-active {
  transition: all .4s ease;
}

.slide-fade-side-enter, .slide-fade-side-leave-to
/* .slide-fade-leave-active below version 2.1.8 */ {
  transform: translateX(10px);
  opacity: 0;
}
</style>
