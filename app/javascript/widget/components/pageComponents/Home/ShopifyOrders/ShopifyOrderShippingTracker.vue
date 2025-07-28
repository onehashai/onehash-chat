<script setup>
import FormInput from 'v3/components/Form/Input.vue';
import countries from 'shared/constants/countries.js';
import Spinner from 'shared/components/Spinner.vue';
import { defineProps, computed, reactive } from 'vue';
import { useVuelidate } from '@vuelidate/core';
import { useStore } from 'dashboard/composables/store';
import { required, requiredIf, email, numeric } from '@vuelidate/validators';
import { useMapGetter } from 'dashboard/composables/store';
import { ref } from 'vue';
import Button from 'shared/components/Button.vue';

const form = reactive({
  number: '',
});

const rules = computed(() => ({
  number: { required },
}));

const v$ = useVuelidate(rules, form);

const store = useStore();

const widgetColor = useMapGetter('appConfig/getWidgetColor');

const orderUiFlags = computed(() => store.getters['orders/getUiFlags']);

const onSubmit = async event => {
  try {
    event.stopPropagation();
    event.preventDefault();
    v$.value.$touch();
    if (v$.value.$error) {
      return;
    }
    window.open(`https://t.17track.net/en#nums=${form.number}`, '_blank');
  } catch (e) {}
};
</script>

<template>
  <div class="flex flex-col gap-3">
    <h3 class="font-medium text-n-slate-12">
      {{ $t('TRACKING_INFO') }}
    </h3>
    <form
      class="email-input-group h-30 my-2 mx-0 min-w-[200px] gap-4"
      @submit="onSubmit"
    >
      <div class="flex flex-col gap-4">
        <FormInput
          v-model="form.number"
          name="number"
          spacing="compact"
          type="text"
          :has-error="v$.number.$error"
          :label="$t('TRACKING_NUMBER_LABEL')"
          :placeholder="$t('TRACKING_NUMBER_PLACEHOLDER')"
          :error-message="$t('TRACKING_NUMBER_ERROR')"
        />

        <Button
          :style="{ color: widgetColor }"
          :disabled="v$.$invalid"
          buttonType="submit"
          class="flex flex-row items-center justify-center"
        >
          <span class="text-white flex flex-row items-center justify-center">
            {{ $t('TRACK_SHIPMENT') }}
          </span>
        </Button>
      </div>
    </form>
  </div>
</template>

<style>
input[type='number']::-webkit-inner-spin-button,
input[type='number']::-webkit-outer-spin-button {
  -webkit-appearance: none;
  appearance: none;
  margin: 0;
}

/* Firefox */
input[type='number'] {
  -moz-appearance: textfield;
}
</style>
