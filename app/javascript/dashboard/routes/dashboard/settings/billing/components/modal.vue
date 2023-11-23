<template>
  <transition name="modal-fade">
    <div
      :class="modalClassName"
      transition="modal"
      @mousedown="handleMouseDown"
    >
      <div
        :class="modalContainerClassName"
        style="display: block"
        @mouse.stop
        @mousedown="event => event.stopPropagation()"
      >
        <woot-button
          v-if="showCloseButton"
          color-scheme="secondary"
          icon="dismiss"
          variant="clear"
          class="ExpireModal"
          style="display: block"
          @click="close"
        />
        <slot />
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  props: {
    closeOnBackdropClick: {
      type: Boolean,
      default: false,
    },
    show: Boolean,
    showCloseButton: {
      type: Boolean,
      default: false,
    },
    onClose: {
      type: Function,
      required: false,
    },
    fullWidth: {
      type: Boolean,
      default: false,
    },
    modalType: {
      type: String,
      default: 'centered',
    },
    size: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      mousedDownOnBackdrop: false,
    };
  },
  computed: {
    modalContainerClassName() {
      let className =
        'modal-container bg-white dark:bg-slate-800 skip-context-menu';

      return `${className} ${this.size}`;
    },
    modalClassName() {
      const modalClassNameMap = {
        centered: '',
        'right-aligned': 'right-aligned',
      };

      return `modal-mask skip-context-menu ${
        modalClassNameMap[this.modalType] || ''
      }`;
    },
  },
  mounted() {
    document.addEventListener('keydown', e => {
      if (this.show && e.code === 'Escape') {
        this.onClose();
      }
    });

    document.body.addEventListener('mouseup', this.onMouseUp);
  },
  beforeDestroy() {
    document.body.removeEventListener('mouseup', this.onMouseUp);
  },
  methods: {
    handleMouseDown() {
      this.mousedDownOnBackdrop = true;
    },
    close() {
      this.onClose();
      this.$emit('close');
    },
    onMouseUp() {
      if (this.mousedDownOnBackdrop) {
        this.mousedDownOnBackdrop = false;
        this.onClose();
      }
    },
  },
};
</script>

<style scoped lang="scss">
.modal-container {
  align-items: center;
  border-radius: 0;
  display: flex;
  height: 20%;
  justify-content: center;
  width: 40%;
  padding: 1rem;
  padding-top: 1.5rem;
  margin: 10px;
  text-align: center;
}

.modal-mask.right-aligned {
  justify-content: flex-end;

  .modal-container {
    border-radius: 0;
    height: 30%;
    width: 30rem;
    padding: 100px;
    margin: 100px;
  }
}
.modal-big {
  width: 60%;
}
.ExpireModal {
  display: block;
}
</style>
