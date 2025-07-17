<script setup>
import FormInput from 'v3/components/Form/Input.vue';
import countries from 'shared/constants/countries.js';

// "name": "Afghanistan",
// "dial_code": "+93",
// "emoji": "🇦🇫",
// "id": "AF"
import TabBar from 'dashboard/components-next/tabbar/TabBar.vue';
import Spinner from 'shared/components/Spinner.vue';
import { defineProps, computed, reactive, watch } from 'vue';
import { useVuelidate } from '@vuelidate/core';
import { useStore } from 'dashboard/composables/store';
import { required, requiredIf, email, numeric } from '@vuelidate/validators';
import { useMapGetter } from 'dashboard/composables/store';
import { ref } from 'vue';
import Button from 'shared/components/Button.vue';

const props = defineProps({
  unverfied_shopify_email: {
    type: String,
    required: true,
  },
});

const input_type = ref('Email');

const input_types = [
  {
    label: 'Email',
    value: 'Email',
  },
  {
    label: 'Phone',
    value: 'Phone',
  },
];

const form = reactive({
  email: '',
  country_code: '',
  phone: '',
  orderId: 0,
});

const rules = computed(() => ({
  email: { required: requiredIf(() => input_type.value === 'Email'), email },
  phone: { required: requiredIf(() => input_type.value === 'Phone') },
  orderId: { required, numeric },
}));

const v$ = useVuelidate(rules, form);

const handleTypeChange = info => {
  input_type.value = info.value;

  if (info.value === 'Email') {
    form.phone = '';
  }

  if (info.value === 'Phone') {
    form.email = '';
  }

  v$.value.$touch();
};

const countryCode = ref(countries.find(e => e.id === 'IN'));

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

    store.dispatch('orders/get', {
      orderId: form.orderId,
      customerEmail: input_type.value === 'Email' ? form.email : null,
      customerPhone:
        input_type.value === 'Phone'
          ? countryCode.value.dial_code + form.phone.toString()
          : null,
    });
  } catch (e) {}
};
</script>

<template>
  <div class="flex flex-col gap-3">
    <h3 class="font-medium text-n-slate-12">
      {{ $t('TRACKING_INFO') }}
    </h3>
    <form
      v-if="props.unverfied_shopify_email === null"
      class="email-input-group h-30 my-2 mx-0 min-w-[200px] gap-4"
      @submit="onSubmit"
    >
      <div class="flex flex-col gap-4">
        <TabBar
          :tabs="input_types"
          :initial-active-tab="
            input_types.findIndex(e => e.label === input_type)
          "
          :fixed-size="true"
          @tab-changed="handleTypeChange"
          class="w-full"
        />

        <FormInput
          v-if="input_type === 'Email'"
          v-model="form.email"
          name="email"
          spacing="compact"
          type="text"
          :has-error="v$.email.$error"
          :label="$t('EMAIL')"
          :placeholder="$t('EMAIL_PLACEHOLDER')"
          :error-message="$t('EMAIL_ERROR')"
        />

        <div v-if="input_type === 'Phone'" class="flex flex-row px-0">
          <FormInput
            v-model="form.phone"
            name="phone"
            spacing="compact"
            type="number"
            class="w-full"
            :has-error="v$.phone.$error"
            :label="$t('PHONE')"
            :placeholder="$t('PHONE_PLACEHOLDER')"
            :error-message="$t('PHONE_ERROR')"
          >
            <template #leftOfInput>
              <select
                v-model="countryCode"
                name="countryCode"
                :options="countries"
                class="max-w-28"
              >
                <option
                  v-for="country in countries"
                  :value="country"
                  :key="country.id"
                >
                  <label class="text-lg">
                    {{ country.emoji }}
                  </label>
                  <label class="text-xxs">
                    {{ ' ' + country.dial_code }}
                  </label>
                </option>
              </select>
            </template>
          </FormInput>
        </div>
        <FormInput
          v-model="form.orderId"
          name="order_id"
          spacing="compact"
          type="number"
          :has-error="v$.orderId.$error"
          :label="$t('ORDER_ID')"
          :placeholder="$t('ORDER_ID_PLACEHOLDER')"
          :error-message="$t('ORDER_ID_ERROR')"
        />

        <Button
          :style="{ color: widgetColor }"
          :disabled="v$.$invalid"
          buttonType="submit"
        >
          <button class="flex flex-row items-center justify-center">
            <span
              class="text-white flex flex-row items-center justify-center"
              v-if="!orderUiFlags.isFetching"
            >
              {{ $t('TRACK_ORDER') }}
            </span>

            <Spinner v-else class="items-center justify-center" />
          </button>
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
