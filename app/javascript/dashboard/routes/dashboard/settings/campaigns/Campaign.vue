<script>
import { mapGetters } from 'vuex';
import { useAlert } from 'dashboard/composables';
import campaignMixin from 'shared/mixins/campaignMixin';
import CampaignsTable from './CampaignsTable.vue';
import EditCampaign from './EditCampaign.vue';
import EditWhatsappCampaign from './EditWhatsappCampaign.vue';
export default {
  components: {
    CampaignsTable,
    EditCampaign,
    EditWhatsappCampaign,
  },
  mixins: [campaignMixin],
  props: {
    type: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      showEditPopup: false,
      selectedCampaign: {},
      showDeleteConfirmationPopup: false,
    };
  },
  computed: {
    ...mapGetters({
      uiFlags: 'campaigns/getUIFlags',
    }),
    campaigns() {
      return this.$store.getters['campaigns/getCampaigns'](this.campaignType);
    },
    showEmptyResult() {
      const hasEmptyResults =
        !this.uiFlags.isFetching && this.campaigns.length === 0;
      return hasEmptyResults;
    },
    isWhatsappType() {
      return this.campaignType === 'whatsapp';
    },
  },
  methods: {
    openEditPopup(campaign) {
      this.selectedCampaign = campaign;
      this.showEditPopup = true;
    },
    hideEditPopup() {
      this.showEditPopup = false;
    },
    openDeletePopup(campaign) {
      this.showDeleteConfirmationPopup = true;
      this.selectedCampaign = campaign;
    },
    closeDeletePopup() {
      this.showDeleteConfirmationPopup = false;
    },
    confirmDeletion() {
      this.closeDeletePopup();
      const { display_id } = this.selectedCampaign;
      this.deleteCampaign(display_id);
    },
    async deleteCampaign(id) {
      try {
        await this.$store.dispatch('campaigns/delete', id);
        useAlert(this.$t('CAMPAIGN.DELETE.API.SUCCESS_MESSAGE'));
      } catch (error) {
        useAlert(this.$t('CAMPAIGN.DELETE.API.ERROR_MESSAGE'));
      }
    },
  },
};
</script>

<template>
  <div class="flex-1 overflow-auto">
    <CampaignsTable
      :campaigns="campaigns"
      :show-empty-result="showEmptyResult"
      :is-loading="uiFlags.isFetching"
      :campaign-type="type"
      @edit="openEditPopup"
      @delete="openDeletePopup"
    />
    <woot-modal :show.sync="showEditPopup" :on-close="hideEditPopup">
      <!-- Conditionally render the appropriate edit component -->
      <EditWhatsappCampaign
        v-if="isWhatsappType"
        :selected-campaign="selectedCampaign"
        @onClose="hideEditPopup"
      />
      <EditCampaign
        v-else
        :selected-campaign="selectedCampaign"
        @onClose="hideEditPopup"
      />
    </woot-modal>
    <woot-delete-modal
      :show.sync="showDeleteConfirmationPopup"
      :on-close="closeDeletePopup"
      :on-confirm="confirmDeletion"
      :title="$t('CAMPAIGN.DELETE.CONFIRM.TITLE')"
      :message="$t('CAMPAIGN.DELETE.CONFIRM.MESSAGE')"
      :confirm-text="$t('CAMPAIGN.DELETE.CONFIRM.YES')"
      :reject-text="$t('CAMPAIGN.DELETE.CONFIRM.NO')"
    />
  </div>
</template>

<style scoped lang="scss">
.button-wrapper {
  @apply flex justify-end pb-2.5;
}
</style>
