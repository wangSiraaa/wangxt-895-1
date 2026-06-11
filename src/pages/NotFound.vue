<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Home, ArrowLeft } from 'lucide-vue-next'

const router = useRouter()
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-teal-50 p-6">
    <div class="text-center max-w-md">
      <div class="mb-8">
        <div class="text-[140px] font-black leading-none bg-gradient-to-br from-teal-400 via-teal-500 to-teal-700 bg-clip-text text-transparent select-none">
          404
        </div>
      </div>
      <h1 class="text-2xl font-bold text-slate-800 mb-2">页面走丢了</h1>
      <p class="text-slate-500 mb-8 leading-relaxed">
        抱歉，您访问的页面不存在或已被移除。
        <br />请检查地址是否正确，或返回首页继续操作。
      </p>
      <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          @click="router.back()"
          class="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg font-medium transition-colors"
        >
          <ArrowLeft class="w-4 h-4" />
          返回上一页
        </button>
        <button
          @click="router.push('/dashboard')"
          class="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
        >
          <Home class="w-4 h-4" />
          回到首页
        </button>
      </div>
    </div>
  </div>
</template>
