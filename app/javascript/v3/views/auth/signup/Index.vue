<script>
import { mapGetters } from 'vuex';
import globalConfigMixin from 'shared/mixins/globalConfigMixin';
import SignupForm from './components/Signup/Form.vue';
import Spinner from 'shared/components/Spinner.vue';

export default {
  components: {
    SignupForm,
    Spinner,
  },
  mixins: [globalConfigMixin],
  data() {
    return { isLoading: false };
  },
  computed: {
    ...mapGetters({ globalConfig: 'globalConfig/get' }),
    isAChatwootInstance() {
      return this.globalConfig.installationName === 'Chatwoot';
    },
  },
  beforeMount() {
    this.isLoading = false;
  },
  // methods: {
  //   resizeContainers() {
  //     this.isLoading = false;
  //   },
  // },
};
</script>

<template>
  <div class="w-full h-full bg-n-background">
    <div v-show="!isLoading" class="flex h-full min-h-screen items-center">
      <div
        class="flex-1 min-h-[640px] inline-flex items-center h-full justify-center overflow-auto py-6"
      >
        <div class="px-8 max-w-[700px] w-full overflow-auto">
          <div class="flex flex-col mb-4 justify-center items-center">
            <img
              v-if="globalConfig.logoDark"
              :src="globalConfig.logoDark"
              :alt="globalConfig.installationName"
              class="hidden w-auto h-12 dark:block"
            />
            <img
              v-else
              :src="globalConfig.logo"
              :alt="globalConfig.installationName"
              class="block w-auto h-12 dark:hidden"
            />
            <h2
              class="mt-6 text-3xl font-medium text-left mb-7 text-n-slate-12"
            >
              {{ $t('REGISTER.TRY_WOOT') }}
            </h2>
          </div>
          <SignupForm />
          <div class="px-1 text-sm text-n-slate-12">
            <span>{{ $t('REGISTER.HAVE_AN_ACCOUNT') }}</span>
            <router-link class="text-link text-n-brand" to="/app/login">
              {{
                useInstallationName(
                  $t('LOGIN.TITLE'),
                  globalConfig.installationName
                )
              }}
            </router-link>
          </div>
        </div>
      </div>
    </div>
    <div
      v-show="isLoading"
      class="flex items-center min-h-screen justify-center w-full h-full"
    >
      <Spinner color-scheme="primary" size="" />
    </div>
  </div>
</template>
