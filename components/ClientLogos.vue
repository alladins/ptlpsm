<template>
  <div class="my-8">
    <div class="bg-blue-600 p-4">
      <h3 class="text-white text-xl mb-4">ISO9001 인증 지도 주요 업체</h3>
      <div class="flex gap-4 overflow-x-auto pb-4">
        <nuxt-img
          v-for="i in 6"
          :key="i"
          src="/placeholder.svg"
          :alt="`Client ${i}`"
          width="120"
          height="60"
          class="bg-white p-2 rounded"
        />
      </div>
    </div>

    <div class="bg-green-600 p-4 mt-2">
      <h3 class="text-white text-xl mb-4">ISO14001 인증 지도 주요 업체</h3>
      <div class="flex gap-4 overflow-x-auto pb-4">
        <nuxt-img
          v-for="i in 6"
          :key="i"
          src="/placeholder.svg"
          :alt="`Client ${i}`"
          width="120"
          height="60"
          class="bg-white p-2 rounded"
        />
      </div>
    </div>

    <div class="bg-orange-500 p-4 mt-2">
      <h3 class="text-white text-xl mb-4">ISO45001 인증 지도 주요 업체</h3>
      <div class="flex gap-4 overflow-x-auto pb-4">
        <nuxt-img
          v-for="i in 6"
          :key="i"
          src="/placeholder.svg"
          :alt="`Client ${i}`"
          width="120"
          height="60"
          class="bg-white p-2 rounded"
        />
      </div>
    </div>
  </div>
</template>

