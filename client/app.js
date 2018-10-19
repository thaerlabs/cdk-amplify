import Vue from 'vue';
import Amplify from '@aws-amplify/core';
import App from './App.vue';
import awsConfig from './awsConfig';

Amplify.configure(awsConfig);

new Vue({
  render: h => h(App)
}).$mount('#app');
