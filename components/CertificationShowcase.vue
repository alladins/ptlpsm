<template>
  <div class="bg-white p-8 rounded-lg shadow-md my-8">
    <h2 class="text-center text-2xl font-bold mb-8">
      <span class="text-blue-800">ISO</span> 인증컨설팅
      <span class="text-orange-500">5,500건 인증 취득</span> 주요 업체
    </h2>
    <div class="flex items-center justify-center gap-4 flex-wrap">
      <nuxt-img
        src="/placeholder.svg"
        alt="ISO 9001"
        width="150"
        height="150"
        class="w-32 h-32"
      />
      <span class="text-3xl">+</span>
      <nuxt-img
        src="/placeholder.svg"
        alt="ISO 14001"
        width="150"
        height="150"
        class="w-32 h-32"
      />
      <span class="text-3xl">+</span>
      <nuxt-img
        src="/placeholder.svg"
        alt="ISO 45001"
        width="150"
        height="150"
        class="w-32 h-32"
      />
      <span class="text-3xl">=</span>
      <div class="relative">
        <nuxt-img
          src="/placeholder.svg"
          alt="5,500건 바로가기"
          width="150"
          height="150"
          class="w-40 h-40"
        />
        <button class="absolute bottom-2 right-2 bg-orange-500 text-white px-4 py-1 rounded-full text-sm">
          GO
        </button>
      </div>
    </div>
  </div>
</template>

