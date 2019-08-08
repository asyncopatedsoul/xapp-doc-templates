<template>
  <div id="app">
    <SlideshowTemplater/>
  </div>
</template>

<script>
import SlideshowTemplater from './components/SlideshowTemplater'

export default {
  name: 'App',
  components: {
    SlideshowTemplater
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 10px;
}
</style>
