<script setup>
import VariablesPopup from './VariablesPopup.vue';
import { watch } from 'vue';
import { useMapGetter } from 'dashboard/composables/store';
import TagMultiSelectComboBox from 'dashboard/components-next/combobox/TagMultiSelectComboBox.vue';
import CodeHighlighter from 'dashboard/components/widgets/CodeHighlighter.vue';
import {
  ref,
  computed,
  reactive,
  onMounted,
  onBeforeUnmount,
  toRaw,
} from 'vue';
import { useI18n } from 'vue-i18n';
import { useVuelidate } from '@vuelidate/core';
import { required, helpers } from '@vuelidate/validators';
import { useStore } from 'dashboard/composables/store';
import { useAlert } from 'dashboard/composables';
import Input from 'dashboard/components-next/input/Input.vue';
import Button from 'dashboard/components-next/button/Button.vue';
import ContactSelector from './ContactSelector.vue';
import TemplatePreview from './TemplatePreview.vue';
import ContactsAPI from 'dashboard/api/contacts';

const props = defineProps({
  selectedCampaign: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['submit', 'cancel']);
const store = useStore();
const { t } = useI18n();

// Form State
const currentStep = ref(1);

const labels = useMapGetter('labels/getLabels');

const formState = reactive({
  title: '',
  message: '<div>Name {{contact.name}}</div>',
  selectedInbox: null,
  scheduledAt: null,
  selectedAudience: [],
  selectedContacts: [],
  isTemplateValid: true,
  previewPosition: { right: 0, top: 0 },
});

// Contact State
const contactState = reactive({
  searchQuery: '',
  contactList: [],
  selectedAudience: [],
  isLoadingContacts: false,
  currentPage: 1,
  totalPages: 1,
  total_count: 0,
  sortAttribute: 'name',
});

function extractTemplateVariables(str) {
  const regex = /{{\s*([\w.]+)\s*}}/g;
  const matches = [];
  let match;

  match = regex.exec(str);
  while (match !== null) {
    match = regex.exec(str);
    matches.push(match[1]);
  }

  return matches;
}

const validVarsData = {
  'contact.name': 'Name of the reciever contact',
  'contact.first_name': 'First name of the reciever contact',
  'contact.last_name': 'Last name of the reciever contact',
  'contact.email': 'Email of the reciever contact',
  'contact.phone': 'Phone no. of the reciever contact',
};

const undefVariables = ref(new Set());

const inboxes = computed(() => {
  const allInboxes = store.getters['inboxes/getEmailInboxes'];
  return allInboxes;
});

// Validation Rules
const rules = computed(() => {
  const step1Rules = {
    title: { required },
    message: {
      required,
      allVarsValid: value => {
        const vars = extractTemplateVariables(value);
        const validVars = Object.keys(validVarsData);
        const undefVars = new Set(vars.filter(x => !validVars.includes(x)));

        undefVariables.value = undefVars;
        return undefVars.size === 0;
      },
    },
    selectedInbox: {
      required,
      isSmtpAvailable: value => {
        const inbox = toRaw(inboxes.value.filter(e => e.id === value)[0]);
        return inbox.smtp_enabled === true;
      },
    },
    scheduledAt: {
      required,
    },
    selectedAudience: {},
  };
  const step2Rules = {
    selectedContacts: {
      required,
      minLength: value => (value || []).length > 0,
    },
  };
  return currentStep.value === 1 ? step1Rules : step2Rules;
});

const v$ = useVuelidate(rules, formState);

const getErrorMessage = (field, errorKey) => {
  const baseKey = 'CAMPAIGN.WHATSAPP.CREATE.FORM';
  return v$.value[field].$error ? t(`${baseKey}.${errorKey}.ERROR`) : '';
};

const formErrors = computed(() => ({
  audience: getErrorMessage('selectedAudience', 'AUDIENCE'),
}));

// Computed Properties

const mapToOptions = (items, valueKey, labelKey) =>
  items?.map(item => ({
    value: item[valueKey],
    label: item[labelKey],
  })) ?? [];

const audienceList = computed(() => mapToOptions(labels.value, 'id', 'title'));

const uiFlags = computed(() => store.getters['campaigns/getUIFlags']);

const currentDateTime = computed(() => {
  const now = new Date();
  const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localTime.toISOString().slice(0, 16);
});

const variablesShown = ref(false);
const popupX = ref(0);
const popupY = ref(0);

function openPopup(event) {
  popupX.value = event.clientX;
  popupY.value = event.clientY;
  variablesShown.value = true;
}

// Methods
const calculatePreviewPosition = () => {
  const campaignForm = document.querySelector('.campaign-details-form');
  if (campaignForm) {
    const rect = campaignForm.getBoundingClientRect();
    formState.previewPosition = {
      right: window.innerWidth - rect.right - 470,
      top: rect.top - 90,
    };
  }
};

watch(
  () => formState.message,
  () => {
    if (v$.value.message) {
      v$.value.message.$touch();
      v$.value.message.$validate();
    }
  }
);

const handleInboxSelection = () => {
  v$.value.selectedInbox.$touch();
  v$.value.selectedInbox.$validate();

  // REVIEW: This doesn't seem to be needed, selectedInbox should never be 'create_new'
  // if (formState.selectedInbox === 'create_new') {
  //   const baseUrl = window.location.origin;
  //   window.location.href = `${baseUrl}/app/accounts/${accountId}/settings/inboxes/new/email`;
  //   formState.selectedInbox = null;
  // }
};
const contactSelector = ref(null);

const handleContactsResponse = data => {
  const { payload = [], meta = {} } = data;
  const filteredContacts = payload.filter(contact => contact.email);
  if (contactState.currentPage === 1) {
    contactState.contactList = filteredContacts;
  } else {
    contactState.contactList = [
      ...contactState.contactList,
      ...filteredContacts,
    ];
  }
  contactState.total_count = meta.count || 0;
  contactState.totalPages = Math.ceil(meta.count / 30);

  // Update selected contacts if we have contact IDs
  if (formState.selectedContacts.length > 0 && contactSelector.value) {
    contactSelector.value.updateSelectedContacts(formState.selectedContacts);
  }
};

const fetchContacts = async (page = 1, search = '') => {
  try {
    contactState.isLoadingContacts = true;
    let data;
    if (search) {
      contactState.contactList = [];
      const { data: responseData } = await ContactsAPI.search(
        search,
        page,
        contactState.sortAttribute
      );
      data = responseData;
    } else {
      const { data: responseData } = await ContactsAPI.get(
        page,
        contactState.sortAttribute
      );
      data = responseData;
    }
    handleContactsResponse(data);
  } catch (error) {
    useAlert(t('CAMPAIGN.EMAIL.CREATE.API.CONTACTS_ERROR'));
    contactState.contactList = [];
  } finally {
    contactState.isLoadingContacts = false;
  }
};

const loadMoreContacts = () => {
  if (
    contactState.currentPage < contactState.totalPages &&
    !contactState.isLoadingContacts
  ) {
    contactState.currentPage += 1;
    fetchContacts(contactState.currentPage, contactState.searchQuery);
  }
};

const handleSearch = query => {
  contactState.searchQuery = query;
  contactState.currentPage = 1;
  fetchContacts(1, query);
};

const handleFiltersCleared = () => {
  contactState.currentPage = 1;
  contactState.totalPages = 1;
  fetchContacts(1, contactState.searchQuery);
};

const onFilteredContacts = filteredContacts => {
  contactState.contactList = filteredContacts;
};

const fetchAllContactIds = async (isFiltered, filteredContacts) => {
  try {
    let contactIds = [];
    if (isFiltered) {
      contactState.total_count = filteredContacts.length;
      contactIds = filteredContacts.map(contact => contact.id);
      formState.selectedContacts = contactIds;
    } else {
      const { data } = await ContactsAPI.getAllIds();
      contactState.total_count = data.total_count;
      contactIds = data.contact_ids;
      formState.selectedContacts = contactIds;
    }
    if (contactSelector.value) {
      contactSelector.value.updateSelectedContacts(contactIds);
    }
    useAlert(t('CAMPAIGN.EMAIL.CONTACT_SELECTOR.SELECTED_ALL.SUCCESS'));
  } catch (error) {
    useAlert(t('CAMPAIGN.EMAIL.CONTACT_SELECTOR.SELECTED_ALL.ERROR'));
  }
};

const goToNext = async () => {
  v$.value.$reset();
  v$.value.$touch();

  if (!v$.value.$invalid) {
    contactState.contactList = [];
    contactState.currentPage = 1;
    contactState.searchQuery = '';
    await fetchContacts(1);
    currentStep.value = 2;
  } else {
  }
};

const goBack = () => {
  currentStep.value = 1;
};
const formatToUTCString = localDateTime =>
  localDateTime ? new Date(localDateTime).toISOString() : null;

const handleCancel = () => emit('cancel');

const handleUpdate = async () => {
  v$.value.$touch();
  if (v$.value.$invalid) return;

  const contactIds =
    formState.selectedContacts.length > 0 &&
    typeof formState.selectedContacts[0] === 'object'
      ? formState.selectedContacts.map(contact => contact.id)
      : formState.selectedContacts;

  const audienceData = formState.selectedAudience.map(e => {
    return {
      type: 'Label',
      id: e,
    };
  });

  const campaignDetails = {
    campaign: {
      title: formState.title,
      message: formState.message,
      inbox_id: formState.selectedInbox,
      scheduled_at: formState.scheduledAt
        ? formatToUTCString(formState.scheduledAt)
        : null,
      contacts: contactIds,
      audience: audienceData,
      enabled: true,
      trigger_only_during_business_hours: false,
    },
  };
  emit('submit', campaignDetails);
};

// Lifecycle Hooks
onMounted(() => {
  formState.title = props.selectedCampaign.title || '';
  formState.message = props.selectedCampaign.message || '';
  formState.selectedInbox = props.selectedCampaign.inbox_id || null;
  formState.selectedTemplate = props.selectedCampaign.template || null;
  formState.selectedAudience = props.selectedCampaign.audience.map(e => e.id);

  if (props.selectedCampaign.scheduled_at) {
    const utcDate = new Date(props.selectedCampaign.scheduled_at);
    const localDate = new Date(
      utcDate.getTime() - utcDate.getTimezoneOffset() * 60000
    );
    formState.scheduledAt = localDate.toISOString().slice(0, 16);
  } else {
    formState.scheduledAt = null;
  }

  formState.selectedContacts =
    props.selectedCampaign.contacts?.map(e => e.id) || [];

  calculatePreviewPosition();
  window.addEventListener('resize', calculatePreviewPosition);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', calculatePreviewPosition);
});
</script>

<template>
  <div class="h-auto">
    <woot-modal-header
      :header-title="$t('CAMPAIGN.EMAIL.UPDATE.TITLE')"
      :header-content="$t('CAMPAIGN.EMAIL.UPDATE.DESC')"
    />
    <!-- Step 1: Campaign Details -->
    <div v-if="currentStep === 1" class="campaign-details-form">
      <div class="flex flex-row gap-4">
        <form class="flex flex-col w-full">
          <div class="w-full space-y-4">
            <Input
              v-model="formState.title"
              :label="t('CAMPAIGN.EMAIL.CREATE.FORM.TITLE.LABEL')"
              type="text"
              :class="{ error: v$.title.$error }"
              :error="
                v$.title.$error
                  ? t('CAMPAIGN.EMAIL.CREATE.FORM.TITLE.ERROR')
                  : ''
              "
              :placeholder="t('CAMPAIGN.EMAIL.CREATE.FORM.TITLE.PLACEHOLDER')"
              @blur="v$.title.$touch"
            />

            <div class="flex flex-col mb-0">
              <div
                class="flex flex-row items-center content-centerjustify-center mb-0 space-x-2"
              >
                <label class="text-sm font-medium text-slate-700">
                  {{ t('CAMPAIGN.EMAIL.CREATE.FORM.BODY.LABEL') }}
                </label>
                <fluent-icon
                  v-tooltip="
                    $t('CAMPAIGN.EMAIL.CREATE.FORM.BODY.TOOLTIP_VARIABLES')
                  "
                  data-test-id="variables-popup"
                  size="14"
                  icon="info"
                  class="text-n-slate-11 my-0 mx-1 mt-0.5"
                  @click="openPopup"
                />
              </div>
              <CodeHighlighter v-model="formState.message" />
            </div>
            <div
              v-if="
                v$.message.$error ||
                (v$.message.$dirty && v$.message.allVarsValid.$invalid)
              "
            >
              <span
                v-if="v$.message.required.$invalid"
                class="text-xs text-red-500"
              >
                {{ t('CAMPAIGN.EMAIL.CREATE.FORM.BODY.ERRORS.REQUIRED') }}
              </span>

              <span
                v-else-if="v$.message.allVarsValid.$invalid"
                class="text-xs text-red-500"
              >
                {{
                  t('CAMPAIGN.EMAIL.CREATE.FORM.BODY.ERRORS.VARS_INVALID', {
                    var: Array.from(undefVariables)[0],
                  })
                }}
              </span>
            </div>

            <div class="flex flex-col mb-0">
              <label class="text-sm font-medium text-slate-700">
                {{ t('CAMPAIGN.EMAIL.CREATE.FORM.INBOX.LABEL') }}
                <select
                  v-model="formState.selectedInbox"
                  class="w-full p-2 mt-1 border-0 selectInbox"
                  :class="{ 'border-red-500': v$.selectedInbox.$error }"
                  @change="handleInboxSelection"
                >
                  <option
                    v-for="inbox in inboxes"
                    :key="inbox.id"
                    :value="inbox.id"
                  >
                    {{ inbox.name }}
                  </option>
                </select>

                <span
                  v-if="v$.selectedInbox.required.$invalid"
                  class="text-xs text-red-500"
                >
                  {{ t('CAMPAIGN.EMAIL.CREATE.FORM.INBOX.ERRORS.REQUIRED') }}
                </span>

                <span
                  v-else-if="v$.selectedInbox.isSmtpAvailable.$invalid"
                  class="text-xs text-red-500"
                >
                  {{
                    t('CAMPAIGN.EMAIL.CREATE.FORM.INBOX.ERRORS.SMTP_REQUIRED')
                  }}
                </span>
              </label>
            </div>

            <div class="flex flex-col gap-1">
              <label
                for="audience"
                class="mb-0.5 text-sm font-medium text-n-slate-12"
              >
                {{ t('CAMPAIGN.WHATSAPP.CREATE.FORM.AUDIENCE.LABEL') }}
              </label>

              <TagMultiSelectComboBox
                v-model="formState.selectedAudience"
                :options="audienceList"
                :label="t('CAMPAIGN.WHATSAPP.CREATE.FORM.AUDIENCE.LABEL')"
                :placeholder="
                  t('CAMPAIGN.WHATSAPP.CREATE.FORM.AUDIENCE.PLACEHOLDER')
                "
                :has-error="!!formErrors.audience"
                :message="formErrors.audience"
                class="[&>div>button]:bg-n-alpha-black2"
              />
            </div>

            <div class="flex flex-col">
              <label class="text-sm font-medium text-slate-700">
                {{ t('CAMPAIGN.EMAIL.CREATE.FORM.SCHEDULED_AT.LABEL') }}
                <Input
                  v-model="formState.scheduledAt"
                  type="datetime-local"
                  :min="currentDateTime"
                  class="w-full mt-1"
                  :placeholder="
                    t('CAMPAIGN.EMAIL.CREATE.FORM.SCHEDULED_AT.PLACEHOLDER')
                  "
                  :error="
                    v$.scheduledAt.$error
                      ? t('CAMPAIGN.EMAIL.CREATE.FORM.SCHEDULED_AT.ERROR')
                      : ''
                  "
                  @blur="v$.scheduledAt.$touch"
                />
              </label>
            </div>
          </div>

          <div class="flex flex-row justify-end w-full gap-2 px-0 py-2 mt-4">
            <Button type="button" variant="primary" @click="goToNext">
              {{ t('CAMPAIGN.EMAIL.CREATE.NEXT_BUTTON_TEXT') }}
            </Button>
            <Button type="button" variant="clear" @click.prevent="handleCancel">
              {{ t('CAMPAIGN.EMAIL.CREATE.CANCEL_BUTTON_TEXT') }}
            </Button>
          </div>
        </form>

        <div class="flex-1">
          <TemplatePreview
            v-model="formState.message"
            :preview-position="formState.previewPosition"
          />
        </div>
      </div>
    </div>

    <!-- Step 2: Contact Selection -->
    <div v-else class="contact-selection">
      <ContactSelector
        ref="contactSelector"
        :contacts="contactState.contactList"
        :selected-contacts="formState.selectedContacts"
        :selected-audience="formState.selectedAudience"
        :is-loading="contactState.isLoadingContacts"
        :has-more="contactState.currentPage < contactState.totalPages"
        @contacts-selected="contacts => (formState.selectedContacts = contacts)"
        @load-more="loadMoreContacts"
        @select-all-contacts="fetchAllContactIds"
        @filter-contacts="onFilteredContacts"
        @filters-cleared="handleFiltersCleared"
      />

      <div class="flex flex-row justify-end w-full gap-2 px-0 py-2 mt-4">
        <Button
          :is-loading="uiFlags.isUpdating"
          :disabled="formState.selectedContacts.length === 0"
          variant="primary"
          @click="handleUpdate"
        >
          {{ t('CAMPAIGN.EMAIL.UPDATE_BUTTON_TEXT') }}
        </Button>
        <Button type="button" variant="secondary" @click.stop="goBack">
          {{ t('CAMPAIGN.EMAIL.CREATE.BACK_BUTTON_TEXT') }}
        </Button>
        <Button
          type="button"
          variant="clear"
          class="cancel"
          @click.prevent="handleCancel"
        >
          {{ t('CAMPAIGN.EMAIL.CREATE.CANCEL_BUTTON_TEXT') }}
        </Button>
      </div>
    </div>

    <VariablesPopup
      v-model="variablesShown"
      :variables="validVarsData"
      :x="popupX"
      :y="popupY"
    />
  </div>
</template>

<style scoped>
.create-inbox-option {
  color: #369eff;
  font-weight: 500;
}

.cancel {
  margin-right: 10px;
}

select option[value='create_new'] {
  color: #369eff;
  font-weight: 500;
}

select {
  @apply w-full p-2 bg-[#F5F5F5] dark:bg-[#1B1C21] mb-0;
}

.campaign-details-form {
  @apply relative;
}

.contact-selection {
  @apply min-h-[400px];
}

@media (max-width: 1024px) {
  .flex-row {
    flex-direction: column;
  }

  .pr-4 {
    padding-right: 0;
    padding-bottom: 1rem;
  }
}

.text-[#369EFF] {
  color: #369eff;
}

.hover\:text-[#1b67ae]:hover {
  color: #1b67ae;
}

.border-red-500 {
  border-color: #ef4444;
}

.text-red-500 {
  color: #ef4444;
}
</style>
