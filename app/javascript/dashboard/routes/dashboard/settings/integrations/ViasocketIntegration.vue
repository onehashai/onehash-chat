<template>
  <div
    id="viasocket"
    class="flex flex-col md:flex-row justify-start items-start md:items-center"
  />
</template>
<script>
import { mapGetters } from 'vuex';
import globalConfigMixin from 'shared/mixins/globalConfigMixin';

export default {
  mixins: [globalConfigMixin],
  computed: {
    ...mapGetters({
      currentUser: 'getCurrentUser',
      accountId: 'getCurrentAccountId',
      globalConfig: 'globalConfig/get',
    }),
  },
  mounted() {
    this.fetchViasocket();
    window.addEventListener('message', this.handleMessage);
  },
  beforeDestroy() {
    window.removeEventListener('message', this.handleMessage);
  },
  methods: {
    async fetchViasocket() {
      try {
        const res = await this.$store.dispatch('integrations/getViasocket');
        const embedToken = res.token;
        if (embedToken) {
          const script = document.createElement('script');
          script.id = 'viasocket-embed-main-script';
          script.setAttribute('embedToken', embedToken);
          script.src = 'https://embed.viasocket.com/prod-embedcomponent.js';
          script.setAttribute('parentId', 'viasocket');
          document.body.appendChild(script);
        }
      } catch (error) {
        this.$t('INTEGRATION_SETTINGS.DASHBOARD_APPS.CREATE.API_ERROR');
      }
    },
    handleMessage(event) {
      if (event.origin === 'https://flow.viasocket.com') {
        const receivedData = event.data;
        console.log('Received data:', receivedData);
      }
    },
  },
};
</script>
