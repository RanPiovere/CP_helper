import axios from 'axios'

// Единая базовая точка API. По умолчанию /api (работает в докере/прокси и на бэкенде).
// Убираем дублирование /api/api за счёт использования baseURL + относительных путей.
const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '')

const axiosPublic = axios.create({
  baseURL: API_BASE
})

const axiosAuth = axios.create({
  baseURL: API_BASE
})

axiosAuth.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export interface RiasecProfile {
  realistic: number
  investigative: number
  artistic: number
  social: number
  enterprising: number
  conventional: number
}

export interface Profession {
  id: number
  name: string
  description: string
  skills: string[]
  riasecProfile: RiasecProfile
  avgSalary: number
  demandScore: number
  workType: string
  educationRequired: string
}

export interface ProfessionMatch {
  profession: Profession
  matchPercentage: number
  riasecMatch: number
  skillsMatch: number
}

export interface MatchResult {
  userProfile: RiasecProfile
  matches: ProfessionMatch[]
}

export interface RiasecQuestion {
  id: number
  text: string
  category: string
}

export interface RiasecAnswer {
  questionId: number
  score: number
}

export interface UserQuestionnaire {
  interests: string[]
  skills: string[]
  education: string
  desiredSalary: number
  workConditions: string[]
  riasecAnswers: RiasecAnswer[]
}

export interface UserResponse {
  id: number
  email: string
  name: string
  emailVerified: boolean
  role: string
  isViewingAsGuest: boolean
}

export interface PartnerCourse {
  id: number
  professionId: number
  title: string
  description: string
  url: string
  provider: string
  createdAt: string
}

export interface News {
  id: number
  title: string
  content: string
  authorId: number
  authorName: string
  createdAt: string
}

export interface CustomTest {
  id: number
  title: string
  description: string
  authorId: number
  isActive: boolean
  createdAt: string
}

export interface CustomTestQuestion {
  id: number
  testId: number
  text: string
  options: string[]
  correctOptionIndex: number
  orderNum: number
}

export interface TestWithQuestions {
  test: CustomTest
  questions: CustomTestQuestion[]
}

export interface CreateCourseRequest {
  professionId: number
  title: string
  description: string
  url: string
  provider: string
}

export interface CreateNewsRequest {
  title: string
  content: string
}

export interface CreateQuestionRequest {
  text: string
  options: string[]
  correctOptionIndex: number
}

export interface CreateTestRequest {
  title: string
  description: string
  questions: CreateQuestionRequest[]
}

export interface AuthResponse {
  token: string
  user: UserResponse
}

export interface MessageResponse {
  message: string
}

export const api = {
  getQuestions: async (): Promise<RiasecQuestion[]> => {
    const res = await axiosPublic.get('/questions')
    return res.data
  },

  getProfessions: async (): Promise<Profession[]> => {
    const res = await axiosPublic.get('/professions')
    return res.data
  },

  matchProfessions: async (questionnaire: UserQuestionnaire): Promise<MatchResult> => {
    const res = await axiosPublic.post('/match', questionnaire)
    return res.data
  },

  compareProfessions: async (ids: number[]): Promise<Profession[]> => {
    const res = await axiosPublic.get(`/compare?ids=${ids.join(',')}`)
    return res.data
  }
}

export const authApi = {
  register: async (email: string, password: string, name: string): Promise<AuthResponse> => {
    const res = await axiosPublic.post('/auth/register', { email, password, name })
    return res.data
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const res = await axiosPublic.post('/auth/login', { email, password })
    return res.data
  },

  googleAuth: async (idToken: string): Promise<AuthResponse> => {
    const res = await axiosPublic.post('/auth/google', { idToken })
    return res.data
  },

  verifyEmail: async (token: string): Promise<MessageResponse> => {
    const res = await axiosPublic.post('/auth/verify-email', { token })
    return res.data
  },

  resendVerification: async (email: string): Promise<MessageResponse> => {
    const res = await axiosPublic.post('/auth/resend-verification', { email })
    return res.data
  },

  me: async (): Promise<UserResponse> => {
    const res = await axiosAuth.get('/auth/me')
    return res.data
  },

  toggleViewMode: async (viewAsGuest: boolean): Promise<UserResponse> => {
    const res = await axiosAuth.post('/auth/toggle-view-mode', { viewAsGuest })
    return res.data
  }
}

export const adminApi = {
  getCourses: async (): Promise<PartnerCourse[]> => {
    const res = await axiosPublic.get('/courses')
    return res.data
  },

  getCoursesByProfession: async (professionId: number): Promise<PartnerCourse[]> => {
    const res = await axiosPublic.get(`/courses/profession/${professionId}`)
    return res.data
  },

  createCourse: async (course: CreateCourseRequest): Promise<PartnerCourse> => {
    const res = await axiosAuth.post('/courses', course)
    return res.data
  },

  deleteCourse: async (courseId: number): Promise<void> => {
    await axiosAuth.delete(`/courses/${courseId}`)
  },

  getNews: async (): Promise<News[]> => {
    const res = await axiosPublic.get('/news')
    return res.data
  },

  createNews: async (news: CreateNewsRequest): Promise<News> => {
    const res = await axiosAuth.post('/news', news)
    return res.data
  },

  deleteNews: async (newsId: number): Promise<void> => {
    await axiosAuth.delete(`/news/${newsId}`)
  },

  getTests: async (): Promise<CustomTest[]> => {
    const res = await axiosPublic.get('/tests')
    return res.data
  },

  getTestsAdmin: async (): Promise<CustomTest[]> => {
    const res = await axiosAuth.get('/tests/admin')
    return res.data
  },

  getTestById: async (testId: number): Promise<TestWithQuestions> => {
    const res = await axiosPublic.get(`/tests/${testId}`)
    return res.data
  },

  createTest: async (test: CreateTestRequest): Promise<CustomTest> => {
    const res = await axiosAuth.post('/tests', test)
    return res.data
  },

  deleteTest: async (testId: number): Promise<void> => {
    await axiosAuth.delete(`/tests/${testId}`)
  },

  toggleTestActive: async (testId: number, active: boolean): Promise<void> => {
    await axiosAuth.post(`/tests/${testId}/toggle?active=${active}`)
  }
}
