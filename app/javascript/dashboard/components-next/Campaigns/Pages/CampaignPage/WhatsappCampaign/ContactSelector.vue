<script setup>
import {
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
  watch,
  nextTick,
} from 'vue';
import { useI18n } from 'vue-i18n';
import { useAlert } from 'dashboard/composables';
import { useStore } from 'dashboard/composables/store';
import Spinner from 'shared/components/Spinner.vue';
import ContactsAPI from 'dashboard/api/contacts';
import { useSnakeCase } from 'dashboard/composables/useTransformKeys';
import ContactsFilter from 'dashboard/components-next/filter/ContactsFilter.vue';

const props = defineProps({
  contacts: {
    type: Array,
    required: true,
  },
  selectedContacts: {
    type: Array,
    default: () => [],
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  hasMore: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  'contacts-selected',
  'load-more',
  'search',
  'select-all-contacts',
  'filter-contacts',
  'filters-cleared',
]);

const store = useStore();
const { t } = useI18n();

// State
const searchQuery = ref('');
const localSelectedContacts = ref([...props.selectedContacts]);
const observer = ref(null);
const isSelectingAll = ref(false);
const showFiltersModal = ref(false);
const currentPage = ref(1);
const totalPages = ref(1);
const contactList = ref([]);
const allFilteredContacts = ref([]);
const isLoadingContacts = ref(false);
const isFetchingAllPages = ref(false);
const sortAttribute = ref('name');
const selectAllVisible = ref(false);
const selectVisibleCheckboxStyle = ref({ marginLeft: '0px' });
const loadingMoreFiltered = ref(false);

const appliedFilters = ref([
  {
    attributeKey: 'name',
    filterOperator: 'equal_to',
    values: '',
    queryOperator: 'and',
    attributeModel: 'standard',
  },
]);

// Filter Types
const standardFilterTypes = [
  {
    attributeKey: 'name',
    attributeI18nKey: 'NAME',
    inputType: 'text',
    filterOperators: [
      { value: 'equal_to', label: 'Equals' },
      { value: 'not_equal_to', label: 'Does not equal' },
      { value: 'contains', label: 'Contains' },
      { value: 'does_not_contain', label: 'Does not contain' },
    ],
  },
  {
    attributeKey: 'phone_number',
    attributeI18nKey: 'PHONE',
    inputType: 'text',
    filterOperators: [
      { value: 'equal_to', label: 'Equals' },
      { value: 'not_equal_to', label: 'Does not equal' },
      { value: 'contains', label: 'Contains' },
      { value: 'does_not_contain', label: 'Does not contain' },
    ],
  },
  {
    attributeKey: 'email',
    attributeI18nKey: 'EMAIL',
    inputType: 'text',
    filterOperators: [
      { value: 'equal_to', label: 'Equals' },
      { value: 'not_equal_to', label: 'Does not equal' },
      { value: 'contains', label: 'Contains' },
      { value: 'does_not_contain', label: 'Does not contain' },
    ],
  },
  {
    attributeKey: 'company',
    attributeI18nKey: 'COMPANY',
    inputType: 'text',
    filterOperators: [
      { value: 'equal_to', label: 'Equals' },
      { value: 'not_equal_to', label: 'Does not equal' },
      { value: 'contains', label: 'Contains' },
      { value: 'does_not_contain', label: 'Does not contain' },
    ],
  },
  {
    attributeKey: 'city',
    attributeI18nKey: 'CITY',
    inputType: 'text',
    filterOperators: [
      { value: 'equal_to', label: 'Equals' },
      { value: 'not_equal_to', label: 'Does not equal' },
      { value: 'contains', label: 'Contains' },
      { value: 'does_not_contain', label: 'Does not contain' },
    ],
  },
];

const customAttributes = computed(() =>
  store.getters['attributes/getAttributesByModel']('contact_attribute')
);

const customFilterTypes = computed(() =>
  customAttributes.value.map(attr => ({
    attributeKey: attr.attribute_key,
    attributeI18nKey: attr.attribute_display_name,
    inputType: attr.attribute_display_type,
    filterOperators: [
      { value: 'equal_to', label: 'Equals' },
      { value: 'not_equal_to', label: 'Does not equal' },
      { value: 'contains', label: 'Contains' },
      { value: 'does_not_contain', label: 'Does not contain' },
    ],
    attributeModel: 'contact_attribute',
  }))
);

const mergedFilterTypes = computed(() => [
  ...standardFilterTypes,
  ...customFilterTypes.value,
]);

// Computed Properties
const filteredContacts = computed(() => {
  const contactsToFilter =
    contactList.value.length > 0 ? contactList.value : props.contacts;
  if (!searchQuery.value) return contactsToFilter;

  return contactsToFilter.filter(contact => {
    const searchLower = searchQuery.value.toLowerCase();
    return (
      (contact.name && contact.name.toLowerCase().includes(searchLower)) ||
      (contact.phone_number &&
        contact.phone_number.includes(searchQuery.value)) ||
      (contact.email && contact.email.toLowerCase().includes(searchLower))
    );
  });
});

const hasAppliedFilters = computed(() =>
  appliedFilters.value.some(filter => {
    if (filter.values === null || filter.values === undefined) {
      return false;
    }

    if (typeof filter.values === 'string') {
      return filter.values.trim() !== '';
    }

    if (Array.isArray(filter.values)) {
      return filter.values.length > 0;
    }

    if (typeof filter.values === 'object') {
      return Object.keys(filter.values).length > 0;
    }

    return !!filter.values;
  })
);

const shouldShowLoadingTrigger = computed(() => {
  const hasActiveFilters = appliedFilters.value.some(filter => {
    if (filter.values === null || filter.values === undefined) {
      return false;
    }

    if (typeof filter.values === 'string') {
      return filter.values.trim() !== '';
    }

    if (Array.isArray(filter.values)) {
      return filter.values.length > 0;
    }

    if (typeof filter.values === 'object') {
      return Object.keys(filter.values).length > 0;
    }

    return !!filter.values;
  });
  return hasActiveFilters
    ? currentPage.value < totalPages.value
    : props.hasMore;
});

// Methods
const handleContactsResponse = (data, isFiltered = false) => {
  const { payload = [], meta = {} } = data;
  const filteredContacts = payload.filter(contact => contact.phone_number);

  if (isFiltered) {
    contactList.value =
      currentPage.value === 1
        ? filteredContacts
        : [...contactList.value, ...filteredContacts];
    if (currentPage.value === 1) {
      allFilteredContacts.value = filteredContacts;
    } else {
      allFilteredContacts.value = [...allFilteredContacts.value];
    }
  } else {
    contactList.value =
      currentPage.value === 1
        ? filteredContacts
        : [...contactList.value, ...filteredContacts];
  }
  emit('filter-contacts', contactList.value);

  const totalpages = Math.ceil(meta.count / 30);
  totalPages.value = Math.min(totalpages, 33);

  nextTick(() => {
    resetObserver();
  });
};

const setupInfiniteScroll = () => {
  const options = {
    root: document.querySelector('.contacts-list'),
    rootMargin: '0px',
    threshold: 0.5,
  };

  observer.value = new IntersectionObserver(async ([entry]) => {
    if (entry && entry.isIntersecting) {
      const hasActiveFilters = appliedFilters.value.some(filter => {
        if (filter.values === null || filter.values === undefined) {
          return false;
        }

        if (typeof filter.values === 'string') {
          return filter.values.trim() !== '';
        }

        if (Array.isArray(filter.values)) {
          return filter.values.length > 0;
        }

        if (typeof filter.values === 'object') {
          return Object.keys(filter.values).length > 0;
        }

        return !!filter.values;
      });

      if (hasActiveFilters) {
        if (
          currentPage.value < totalPages.value &&
          !loadingMoreFiltered.value &&
          !isLoadingContacts.value
        ) {
          await loadMoreFilteredContacts();
        }
      } else if (props.hasMore && !props.isLoading) {
        emit('load-more');
      }
    }
  }, options);

  nextTick(() => {
    const trigger = document.querySelector('.loading-trigger');
    if (trigger) {
      observer.value.observe(trigger);
    }
  });
};

const toggleContact = contact => {
  const index = localSelectedContacts.value.findIndex(c => c.id === contact.id);
  if (index === -1) {
    localSelectedContacts.value.push(contact);
  } else {
    localSelectedContacts.value.splice(index, 1);
  }
  emit('contacts-selected', localSelectedContacts.value);
};

const isSelected = contact => {
  return localSelectedContacts.value.some(c => c.id === contact.id);
};

const clearSelection = () => {
  localSelectedContacts.value = [];
  emit('contacts-selected', localSelectedContacts.value);
};

const selectAll = async () => {
  if (isFetchingAllPages.value) return;
  isSelectingAll.value = true;
  const hasActiveFilters = appliedFilters.value.some(filter => {
    if (filter.values === null || filter.values === undefined) {
      return false;
    }

    if (typeof filter.values === 'string') {
      return filter.values.trim() !== '';
    }

    if (Array.isArray(filter.values)) {
      return filter.values.length > 0;
    }

    if (typeof filter.values === 'object') {
      return Object.keys(filter.values).length > 0;
    }

    return !!filter.values;
  });

  try {
    localSelectedContacts.value = [];
    if (hasActiveFilters) {
      localSelectedContacts.value = [...allFilteredContacts.value];
      emit('select-all-contacts', true, allFilteredContacts.value);
    } else {
      localSelectedContacts.value = [...props.contacts];
      emit('select-all-contacts', false, []);
    }
    emit('contacts-selected', localSelectedContacts.value);
  } finally {
    isSelectingAll.value = false;
  }
};

const isFilterValueValid = filter => {
  if (filter.values === null || filter.values === undefined) {
    return false;
  }

  if (typeof filter.values === 'string') {
    return filter.values.trim() !== '';
  }

  if (Array.isArray(filter.values)) {
    return filter.values.length > 0;
  }

  if (typeof filter.values === 'object') {
    return Object.keys(filter.values).length > 0;
  }

  return !!filter.values;
};

const formatFilterValue = filter => {
  if (typeof filter.values === 'string') {
    return [filter.values.trim()];
  } else if (Array.isArray(filter.values)) {
    return filter.values;
  } else if (
    typeof filter.values === 'object' &&
    Object.keys(filter.values).length > 0
  ) {
    return [
      filter.values.id ||
        filter.values.value ||
        Object.values(filter.values)[0],
    ];
  } else if (typeof filter.values === 'boolean') {
    return [filter.values.toString()];
  }
  return [filter.values];
};

const submitFilters = async () => {
  try {
    contactList.value = [];
    currentPage.value = 1;
    allFilteredContacts.value = [];

    const formattedFilters = appliedFilters.value
      .filter(filter => isFilterValueValid(filter))
      .map((filter, index, filteredArray) => {
        const baseFilter = {
          attributeKey: filter.attributeKey,
          attributeModel: filter.attributeModel || 'standard',
          filterOperator: filter.filterOperator,
          values: formatFilterValue(filter),
        };

        if (filteredArray.length > 1 && index < filteredArray.length - 1) {
          baseFilter.queryOperator = filter.queryOperator;
        }

        return useSnakeCase(baseFilter);
      });

    if (formattedFilters.length === 0) {
      await fetchContacts(1);
      showFiltersModal.value = false;
      return;
    }

    isLoadingContacts.value = true;
    isFetchingAllPages.value = true;
    const queryPayload = { payload: formattedFilters };

    const { data } = await ContactsAPI.filter(1, 'name', queryPayload);
    handleContactsResponse(data, true);
    showFiltersModal.value = false;

    const { payload = [], meta = {} } = data;
    const validContacts = payload.filter(contact => contact.phone_number);
    allFilteredContacts.value = [...validContacts];

    const totalpages = Math.ceil(meta.count / 30);
    totalPages.value = totalpages;
    for (let page = 2; page <= totalpages; page++) {
      const response = await ContactsAPI.filter(page, 'name', queryPayload);
      if (response.data && response.data.payload) {
        const validPageContacts = response.data.payload.filter(
          contact => contact.phone_number
        );
        allFilteredContacts.value = [
          ...allFilteredContacts.value,
          ...validPageContacts,
        ];
      }
    }
    nextTick(() => {
      resetObserver();
    });
  } catch (error) {
    useAlert(t('CAMPAIGN.WHATSAPP.CONTACT_SELECTOR.FILTER_ERROR'));
  } finally {
    isFetchingAllPages.value = false;
    isLoadingContacts.value = false;
  }
};

const clearFilters = async () => {
  appliedFilters.value = [
    {
      attributeKey: 'name',
      filterOperator: 'equal_to',
      values: '',
      queryOperator: 'and',
      attributeModel: 'standard',
    },
  ];
  contactList.value = [];
  allFilteredContacts.value = [];
  currentPage.value = 1;
  totalPages.value = 1;
  emit('filters-cleared');

  await nextTick();
  resetObserver();
  showFiltersModal.value = false;
};

const fetchContacts = async (page = 1) => {
  try {
    isLoadingContacts.value = true;
    const { data } = await ContactsAPI.get(page, sortAttribute.value);
    handleContactsResponse(data, false);
  } catch (error) {
    useAlert(t('CAMPAIGN.ADD.API.CONTACTS_ERROR'));
  } finally {
    isLoadingContacts.value = false;
  }
};

const loadMoreFilteredContacts = async () => {
  if (currentPage.value < totalPages.value && !isLoadingContacts.value) {
    try {
      loadingMoreFiltered.value = true;
      isLoadingContacts.value = true;
      currentPage.value += 1;

      const formattedFilters = appliedFilters.value
        .filter(filter => isFilterValueValid(filter))
        .map((filter, index, filteredArray) => {
          const baseFilter = {
            attributeKey: filter.attributeKey,
            attributeModel: filter.attributeModel || 'standard',
            filterOperator: filter.filterOperator,
            values: formatFilterValue(filter),
          };

          if (filteredArray.length > 1 && index < filteredArray.length - 1) {
            baseFilter.queryOperator = filter.queryOperator;
          }

          return useSnakeCase(baseFilter);
        });

      const queryPayload = { payload: formattedFilters };
      const { data } = await ContactsAPI.filter(
        currentPage.value,
        'name',
        queryPayload
      );
      handleContactsResponse(data, true);
    } catch (error) {
      useAlert(t('CAMPAIGN.WHATSAPP.CONTACT_SELECTOR.FILTER_ERROR'));
      currentPage.value -= 1;
    } finally {
      isLoadingContacts.value = false;
      loadingMoreFiltered.value = false;
    }
  }
};

const updateSelectedContacts = contactIds => {
  const currentSelectedIds = new Set(
    localSelectedContacts.value.map(c => c.id)
  );
  contactIds.forEach(id => {
    if (!currentSelectedIds.has(id)) {
      const contact = props.contacts.find(c => c.id === id);
      if (contact) {
        localSelectedContacts.value.push(contact);
      } else {
        localSelectedContacts.value.push({ id });
      }
    }
  });
  emit('contacts-selected', localSelectedContacts.value);
};

const getFilterOperators = attributeKey => {
  const filterType = mergedFilterTypes.value.find(
    type => type.attributeKey === attributeKey
  );
  return filterType ? filterType.filterOperators : [];
};

const updateSelectVisiblePosition = () => {
  nextTick(() => {
    const contactCheckbox = document.querySelector(
      '.contact-item input[type="checkbox"]'
    );
    if (contactCheckbox) {
      const checkboxRect = contactCheckbox.getBoundingClientRect();
      const containerRect = document
        .querySelector('.contact-selector')
        .getBoundingClientRect();
      const marginLeft = `${checkboxRect.left - containerRect.left - 430}px`;
      selectVisibleCheckboxStyle.value = { marginLeft };
    }
  });
};

const resetObserver = () => {
  if (observer.value) {
    observer.value.disconnect();
  }
  setupInfiniteScroll();
};

// Watchers
watch(selectAllVisible, newVal => {
  if (newVal) {
    filteredContacts.value.forEach(contact => {
      if (!isSelected(contact)) {
        localSelectedContacts.value.push(contact);
      }
    });
  } else {
    localSelectedContacts.value = localSelectedContacts.value.filter(
      selectedContact =>
        !filteredContacts.value.some(
          contact => contact.id === selectedContact.id
        )
    );
  }
  emit('contacts-selected', localSelectedContacts.value);
});

watch(
  () => props.contacts,
  () => {
    nextTick(() => {
      resetObserver();
    });
  }
);

watch(
  filteredContacts,
  () => {
    updateSelectVisiblePosition();
  },
  { immediate: true }
);

watch(
  () => props.selectedContacts,
  newVal => {
    localSelectedContacts.value = [...newVal];
  },
  { deep: true }
);

// Lifecycle Hooks
onMounted(() => {
  setupInfiniteScroll();
  updateSelectVisiblePosition();
  window.addEventListener('resize', updateSelectVisiblePosition);
});

onBeforeUnmount(() => {
  if (observer.value) observer.value.disconnect();
  window.removeEventListener('resize', updateSelectVisiblePosition);
});

defineExpose({
  updateSelectedContacts,
});
</script>

<template>
  <div class="contact-selector">
    <div class="search-header">
      <div class="search-controls">
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="
            t('CAMPAIGN.WHATSAPP.CONTACT_SELECTOR.SEARCH_PLACEHOLDER')
          "
          class="search-input"
        />
        <div class="filter-button-container">
          <div
            v-if="hasAppliedFilters"
            class="absolute w-2 h-2 rounded-full top-1 right-1 bg-slate-500 dark:bg-slate-500"
          />
          <woot-button
            v-tooltip.top-end="t('CAMPAIGN.WHATSAPP.CONTACT_SELECTOR.FILTER')"
            icon="filter"
            size="medium"
            color-scheme="secondary"
            class="clear [&>span]:hidden xs:[&>span]:block"
            @click="showFiltersModal = true"
          />
        </div>
      </div>
      <div class="selection-wrapper">
        <div class="selection-controls">
          <button :disabled="isFetchingAllPages" @click="selectAll">
            {{ $t('CAMPAIGN.WHATSAPP.CONTACT_SELECTOR.SELECT_ALL') }}
          </button>
          <button @click="clearSelection">
            {{ $t('CAMPAIGN.WHATSAPP.CONTACT_SELECTOR.CLEAR') }}
          </button>
        </div>
        <div
          class="select-visible-checkbox"
          :style="selectVisibleCheckboxStyle"
        >
          <input v-model="selectAllVisible" type="checkbox" />
        </div>
      </div>
    </div>

    <div v-if="isFetchingAllPages" class="loading-state">
      <Spinner />
      <span>{{
        t('CAMPAIGN.WHATSAPP.CONTACT_SELECTOR.LOADING_ALL_CONTACTS')
      }}</span>
    </div>

    <div v-else class="contacts-list">
      <div
        v-for="contact in filteredContacts"
        :key="contact.id"
        class="contact-item"
        :class="{ selected: isSelected(contact) }"
        @click="toggleContact(contact)"
      >
        <div class="contact-info">
          <span class="contact-name">{{ contact.name }}</span>
          <span class="contact-phone">{{ contact.phone_number }}</span>
          <span v-if="contact.email" class="contact-email">{{
            contact.email
          }}</span>
        </div>
        <input
          type="checkbox"
          :checked="isSelected(contact)"
          @click.stop="toggleContact(contact)"
        />
      </div>

      <div
        v-if="shouldShowLoadingTrigger"
        class="loading-trigger"
        :class="{ 'is-loading': props.isLoading || loadingMoreFiltered }"
      >
        <span
          v-if="props.isLoading || loadingMoreFiltered || isLoadingContacts"
        >
          {{ t('CAMPAIGN.WHATSAPP.CONTACT_SELECTOR.LOADING') }}
        </span>
      </div>
    </div>

    <div class="selection-summary">
      {{
        t('CAMPAIGN.WHATSAPP.CONTACT_SELECTOR.SELECTED_CONTACTS', {
          count: localSelectedContacts.length,
        })
      }}
    </div>
    <woot-modal
      :show="showFiltersModal"
      size="medium"
      class="contacts-filter-modal"
    >
      <ContactsFilter
        v-if="showFiltersModal"
        v-model="appliedFilters"
        class="w-full"
        :is-campaign="true"
        @apply-filter="submitFilters"
        @clear-filters="clearFilters"
        @close="showFiltersModal = false"
      />
    </woot-modal>
  </div>
</template>

<style lang="scss" scoped>
.contacts-filter-modal {
  :deep(.modal-container) {
    overflow: visible;
    max-height: none !important;

    .modal-content {
      overflow: visible;
      max-height: none;
      min-height: auto;
    }
  }
}

.contacts-filter {
  @apply border-0 shadow-none;
}

.contact-selector {
  @apply flex flex-col h-full;

  .search-header {
    @apply flex items-center justify-between p-4 border-b;
    background-color: #f8f9fa;
    border-color: #e2e8f0;
    @apply dark:bg-[#23242b] dark:border-[#23242b];

    .search-controls {
      @apply flex items-center gap-2;

      .search-input {
        @apply w-64 px-3 py-2 border rounded;
        background-color: #ffffff;
        border-color: #d1d5db;
        color: #000000;
        @apply dark:bg-[#23242b] dark:border-[#4a5568] dark:text-[#ffffff];
        &::placeholder {
          color: #a0a0a0;
        }
        &:focus {
          @apply outline-none ring-2 ring-slate-500;
        }
      }

      .filter-button-container {
        @apply relative top-[-7px];
      }
    }

    .selection-wrapper {
      @apply flex flex-col;

      .selection-controls {
        @apply flex flex-row gap-2;

        button {
          @apply px-3 py-1 text-sm border rounded;
          background-color: #ffffff;
          border-color: #e2e8f0;
          color: #000000;
          @apply dark:bg-[#23242b] dark:border-[#4a5568] dark:text-[#ffffff];
          &:hover {
            @apply bg-slate-50 dark:bg-[#2d2e33];
          }
        }
      }

      .select-visible-checkbox {
        @apply flex items-center mt-4 text-sm;
        color: #000000;
        @apply dark:text-[#ffffff];
        input[type='checkbox'] {
          @apply w-4 h-4 cursor-pointer;
          accent-color: #0078d4;
          border-color: #d1d5db;
          @apply dark:border-[#4a5568];
        }
      }
    }
  }

  .loading-state {
    @apply flex flex-col items-center justify-center p-8;
    background-color: #f8f9fa;
    color: #a0a0a0;
    min-height: 200px;
    @apply dark:bg-[#1b1c21];
  }

  .contacts-list {
    @apply flex-1 overflow-y-auto;
    background-color: #ffffff;
    max-height: 400px;
    min-height: 150px;
    @apply dark:bg-[#1b1c21];

    .contact-item {
      @apply flex items-center justify-between p-3 cursor-pointer border-b;
      border-color: #e2e8f0;
      @apply dark:border-[#23242b];
      &:hover {
        background-color: #f1f5f9;
        @apply dark:bg-n-solid-3;
      }
      &.selected {
        background-color: #e2e8f0;
        @apply dark:bg-n-solid-3;
      }

      .contact-info {
        @apply flex flex-col;

        .contact-name {
          @apply font-medium;
          color: #000000;
          @apply dark:text-[#ffffff];
        }

        .contact-phone,
        .contact-email {
          @apply text-sm;
          color: #4b5563;
          @apply dark:text-[#a0a0a0];
        }
      }

      input[type='checkbox'] {
        @apply w-4 h-4 cursor-pointer;
        accent-color: #0078d4;
        border-color: #d1d5db;
        @apply dark:border-[#4a5568];
      }
    }

    .loading-trigger {
      @apply p-4 text-center;
      color: #a0a0a0;
      &.is-loading {
        background-color: #f1f5f9;
        @apply dark:bg-[#23242b];
      }
    }
  }

  .selection-summary {
    @apply p-4 text-sm font-medium;
    background-color: #f8f9fa;
    color: #000000;
    border-top: 1px solid #e2e8f0;
    @apply dark:bg-[#23242b] dark:text-[#ffffff] dark:border-[#23242b];
  }
}
</style>
