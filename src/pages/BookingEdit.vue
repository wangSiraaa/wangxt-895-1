<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ArrowLeft, Save, Plus, X } from 'lucide-vue-next'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import api from '@/lib/api'
import type { School, BookingDetail } from '../../../shared/types'

const route = useRoute()
const router = useRouter()
const { showToast } = useToast()

const bookingId = computed(() => route.params.id as string)
const isEdit = computed(() => !!bookingId.value && bookingId.value !== 'new')

const loading = ref(false)
const schoolsLoading = ref(false)
const schools = ref<School[]>([])
const showNewSchool = ref(false)
const newSchoolName = ref('')

const form = ref({
  school_id: '',
  visit_date: '',
  expected_student_count: 0,
  expected_teacher_count: 0,
  contact_name: '',
  contact_phone: '',
  notes: '',
})

function goBack() {
  router.back()
}

async function loadSchools() {
  schoolsLoading.value = true
  try {
    const res = (await api.get('/schools')) as { list: School[]; total: number }
    schools.value = res.list
  } catch (err) {
    showToast('加载学校列表失败', 'error')
    console.error(err)
  } finally {
    schoolsLoading.value = false
  }
}

async function loadBooking() {
  loading.value = true
  try {
    const data = (await api.get(`/bookings/${bookingId.value}`)) as BookingDetail
    form.value = {
      school_id: data.school_id,
      visit_date: data.visit_date,
      expected_student_count: data.expected_student_count,
      expected_teacher_count: data.expected_teacher_count,
      contact_name: data.contact_name || '',
      contact_phone: data.contact_phone || '',
      notes: data.notes || '',
    }
  } catch (err) {
    showToast('加载预约详情失败', 'error')
    console.error(err)
  } finally {
    loading.value = false
  }
}

async function handleCreateSchool() {
  if (!newSchoolName.value.trim()) {
    showToast('请输入学校名称', 'warning')
    return
  }
  try {
    const data = (await api.post('/schools', {
      name: newSchoolName.value.trim(),
    })) as School
    schools.value.unshift(data)
    form.value.school_id = data.id
    showNewSchool.value = false
    newSchoolName.value = ''
    showToast('学校创建成功', 'success')
  } catch (err) {
    console.error(err)
  }
}

async function handleSave() {
  if (!form.value.school_id) {
    showToast('请选择学校', 'warning')
    return
  }
  if (!form.value.visit_date) {
    showToast('请选择到访日期', 'warning')
    return
  }
  if (
    form.value.expected_student_count <= 0 &&
    form.value.expected_teacher_count <= 0
  ) {
    showToast('学生和老师人数不能都为0', 'warning')
    return
  }

  loading.value = true
  try {
    const payload = {
      school_id: form.value.school_id,
      visit_date: form.value.visit_date,
      expected_student_count: Number(form.value.expected_student_count) || 0,
      expected_teacher_count: Number(form.value.expected_teacher_count) || 0,
      contact_name: form.value.contact_name || undefined,
      contact_phone: form.value.contact_phone || undefined,
      notes: form.value.notes || undefined,
    }

    if (isEdit.value) {
      await api.put(`/bookings/${bookingId.value}`, payload)
      showToast('预约更新成功', 'success')
    } else {
      await api.post('/bookings', payload)
      showToast('预约创建成功', 'success')
    }
    router.push('/bookings')
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadSchools().then(() => {
    if (isEdit.value) {
      loadBooking()
    }
  })
})
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
        <h1 class="text-xl font-bold text-slate-800">
          {{ isEdit ? '编辑预约' : '新建预约' }}
        </h1>
        <p class="text-sm text-slate-500 mt-1">录入研学团队预约基本信息</p>
      </div>

      <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-slate-700 mb-1.5">
            学校/单位 <span class="text-red-500">*</span>
          </label>
          <div class="flex gap-2">
            <div class="relative flex-1">
              <select
                v-model="form.school_id"
                class="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 bg-white"
                :disabled="schoolsLoading"
              >
                <option value="">请选择学校</option>
                <option v-for="s in schools" :key="s.id" :value="s.id">
                  {{ s.name }}
                </option>
              </select>
            </div>
            <button
              v-if="!showNewSchool"
              @click="showNewSchool = true"
              class="flex items-center gap-1 px-3 py-2 border border-slate-300 text-slate-600 hover:bg-slate-50 rounded-lg text-sm transition-colors"
            >
              <Plus class="w-4 h-4" />
              新增学校
            </button>
            <button
              v-else
              @click="showNewSchool = false"
              class="flex items-center gap-1 px-3 py-2 border border-slate-300 text-slate-600 hover:bg-slate-50 rounded-lg text-sm transition-colors"
            >
              <X class="w-4 h-4" />
              取消
            </button>
          </div>
          <div v-if="showNewSchool" class="mt-2 flex gap-2">
            <input
              v-model="newSchoolName"
              type="text"
              placeholder="输入新学校名称"
              class="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
              @keyup.enter="handleCreateSchool"
            />
            <button
              @click="handleCreateSchool"
              class="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              确认新增
            </button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">
            到访日期 <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.visit_date"
            type="date"
            class="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">
            学生人数 <span class="text-red-500">*</span>
          </label>
          <input
            v-model.number="form.expected_student_count"
            type="number"
            min="0"
            placeholder="请输入"
            class="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">
            带队老师人数
          </label>
          <input
            v-model.number="form.expected_teacher_count"
            type="number"
            min="0"
            placeholder="请输入"
            class="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">
            联系人
          </label>
          <input
            v-model="form.contact_name"
            type="text"
            placeholder="请输入"
            class="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">
            联系电话
          </label>
          <input
            v-model="form.contact_phone"
            type="text"
            placeholder="请输入"
            class="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
          />
        </div>

        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-slate-700 mb-1.5">
            备注
          </label>
          <textarea
            v-model="form.notes"
            rows="3"
            placeholder="特殊需求等..."
            class="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 resize-none"
          />
        </div>
      </div>

      <div
        class="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50 rounded-b-xl"
      >
        <button
          @click="goBack"
          class="px-5 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
        >
          取消
        </button>
        <button
          @click="handleSave"
          :disabled="loading"
          class="flex items-center gap-2 px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          <Save class="w-4 h-4" />
          {{ loading ? '保存中...' : '保存预约' }}
        </button>
      </div>
    </div>
  </div>
</template>
