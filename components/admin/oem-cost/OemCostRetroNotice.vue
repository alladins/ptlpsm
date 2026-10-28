<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="ccm-modal-overlay" @click.self="emit('close')">
        <div class="ccm-modal-container ccm-modal-medium">
          <div class="ccm-modal-header">
            <div class="ccm-header-content">
              <div class="ccm-header-icon ccm-icon-blue">
                <i class="fas fa-info" />
              </div>
              <div class="ccm-header-text">
                <h2 class="ccm-modal-title">
                  기존 발주는 아직 이전 원가입니다
                </h2>
                <span class="ccm-modal-subtitle">{{ skuName }} · {{ oemCompanyName }}</span>
              </div>
            </div>
            <button class="ccm-close-button" @click="emit('close')">
              <i class="fas fa-times" />
            </button>
          </div>
          <div class="ccm-modal-body notice-body">
            <p>
              <b>{{ from }}</b> 이후 이미 등록된 발주 <b>{{ count }}건</b>이 원가표와 다른 단가로 되어 있습니다
              (금액 차이 <b>{{ diffText }}</b>).
            </p>
            <p class="notice-sub">
              원가표를 바꿔도 이미 등록된 발주·출하 원가는 자동으로 바뀌지 않습니다.
              소급하면 발주서·출하 원가·기성청구·기성 차수까지 한 번에 맞춥니다. 적용 전에 미리보기로 확인할 수 있습니다.
            </p>
          </div>
          <div class="ccm-modal-footer">
            <button class="ccm-btn-cancel" @click="emit('close')">
              나중에
            </button>
            <button class="ccm-btn-confirm" @click="emit('retro')">
              기존 건도 새 원가로 소급하기
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatNumber } from '~/utils/format'

interface Props {
  isOpen: boolean
  skuName: string
  oemCompanyName: string
  from: string
  count: number
  amountDiff: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  retro: []
}>()

const diffText = computed(() => (props.amountDiff > 0 ? '+' : '') + formatNumber(props.amountDiff) + '원')
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-buttons.css';
@import '@/assets/css/admin-modals.css';

.notice-body p {
  margin: 0 0 0.75rem;
  line-height: 1.7;
}

.notice-sub {
  color: #64748b;
  font-size: 0.875rem;
}
</style>
