<script setup lang="ts">
import { ref } from 'vue'
import { ArrowLeft, Save } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const { showToast } = useToast()

const form = ref({
  school: '',
  contact: '',
  phone: '',
  grade: '',
  count: undefined,
  date: '',
  line: '',
  remark: '',
})

function goBack() {
  router.back()
}

function handleSave() {
  if (!form.value.school || !form.value.count || !form.value.date) {
    showToast('请填写必填项', 'warning')
    return
  }
  showToast('预约已创建', 'success')
  router.push('/bookings')
}
</script>

<template>
  <div class="space-y-5">
    <div class="flex items-center gap-3">
      <button
        @click="goBack"
        class="flex items-center gap-1 text-slate-500 hover:text-teal-600 text-sm transition-colors"
      >
        <ArrowLeft class="w-4 h-4" />
        返回列表
      </button>
    </div>

    <div class="bg-white rounded-xl border border-slate-200">
      <div class="px-6 py-4 border-b border-slate-100">
        <h1 class="text-xl font-bold text-slate-800">新建预约</h1>
        <p class="text-sm text-slate-500 mt-1">录入研学团队预约基本信息</p>
      </div>

      <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">学校/单位名称 <span class="text-red-500">*</span></label>
          <input v-model="form.school" type="text" placeholder="请输入" class="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">联系人</label>
          <input v-model="form.contact" type="text" placeholder="请输入" class="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">联系电话</label>
          <input v-model="form.phone" type="text" placeholder="请输入" class="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">年级/班级</label>
          <input v-model="form.grade" type="text" placeholder="例如：初二年级" class="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">人数 <span class="text-red-500">*</span></label>
          <input v-model="form.count" type="number" placeholder="请输入" class="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">到访日期 <span class="text-red-500">*</span></label>
          <input v-model="form.date" type="date" class="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500" />
        </div>
        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-slate-700 mb-1.5">选择线路</label>
          <select v-model="form.line" class="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 bg-white">
            <option value="">请选择线路</option>
            <option value="A">A线 - 历史文化探索</option>
            <option value="B">B线 - 科技创新体验</option>
            <option value="C">C线 - 自然生态观察</option>
          </select>
        </div>
        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-slate-700 mb-1.5">备注</label>
          <textarea v-model="form.remark" rows="3" placeholder="特殊需求等..." class="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 resize-none" />
        </div>
      </div>

      <div class="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50 rounded-b-xl">
        <button @click="goBack" class="px-5 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors">
          取消
        </button>
        <button @click="handleSave" class="flex items-center gap-2 px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors">
          <Save class="w-4 h-4" />
          保存预约
        </button>
      </div>
    </div>
  </div>
</template>
