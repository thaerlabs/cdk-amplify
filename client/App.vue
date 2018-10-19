<template>
  <div>
    <div v-if="user">
      Welcome back {{user.attributes.name}} <button @click="signOut">Sign Out</button>
    </div>

    <div class="signup"
      v-if="!user && !verify && !login">
      <input type="text"
        v-model="name"
        placeholder="name">
      <input type="text"
        v-model="email"
        placeholder="email">
      <input type="password"
        v-model="password"
        placeholder="password">
      <button @click="signUp">Sign up</button>
      <a href="#"
        @click.prevent="login = true">Or Sign in</a>
    </div>

    <div class="login"
      v-if="!user && login">
      <input type="text"
        v-model="email"
        placeholder="email">
      <input type="password"
        v-model="password"
        placeholder="password">
      <button @click="signIn">Sign in</button>
      <a href="#"
        @click.prevent="login = true">Or Sign up</a>
    </div>

    <div class="verify"
      v-if="!user && verify">
      <input type="text"
        v-model="code"
        placeholder="code">
      <button @click="verifyUser">Verify</button>
    </div>
  </div>
</template>

<script>
import Vue from 'vue';
import Auth from '@aws-amplify/auth';

export default {
  created() {
    this.loadUser();
  },

  data() {
    return {
      user: null,
      name: '',
      email: '',
      password: '',
      code: '',
      verify: false,
      login: false
    };
  },

  methods: {
    signUp() {
      Auth.signUp({
        username: this.email,
        password: this.password,
        attributes: {
          name: this.name
        }
      })
        .then(data => {
          console.log(data);
          this.verify = true;
        })
        .catch(err => console.log(err));
    },

    verifyUser() {
      // After retrieveing the confirmation code from the user
      Auth.confirmSignUp(this.email, this.code, {
        // Optional. Force user confirmation irrespective of existing alias. By default set to True.
        forceAliasCreation: true
      })
        .then(data => {
          return Auth.signIn(this.email, this.password).then(user => {
            this.loadUser();
          });
        })
        .catch(err => console.log(err));
    },

    signIn() {
      Auth.signIn(this.email, this.password)
        .then(user => {
          this.loadUser();
        })
        .catch(err => console.log(err));
    },

    signOut() {
      Auth.signOut()
        .then(data => (this.user = null))
        .catch(err => console.log(err));
    },

    loadUser() {
      Auth.currentAuthenticatedUser()
        .then(user => {
          this.user = user;
        })
        .then(data => console.log(data))
        .catch(err => console.log(err));
    }
  }
};
</script>

