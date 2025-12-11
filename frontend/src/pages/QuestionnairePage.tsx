import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, RiasecQuestion, RiasecAnswer, UserQuestionnaire } from '../services/api'

const INTERESTS = [
  'Технологии', 'Медицина', 'Творчество', 'Финансы', 'Образование',
  'Наука', 'Бизнес', 'Искусство', 'Спорт', 'Право'
]

const SKILLS_SUGGESTIONS = [
  'Python', 'JavaScript', 'управление', 'коммуникация', 'дизайн',
  'аналитика', 'маркетинг', 'продажи', 'Excel', 'английский'
]

const EDUCATION_OPTIONS = [
  { value: 'среднее', label: 'Среднее' },
  { value: 'среднее спец.', label: 'Среднее специальное' },
  { value: 'высшее', label: 'Высшее' },
  { value: 'магистратура', label: 'Магистратура' }
]

const WORK_CONDITIONS = [
  'удалённая', 'офис', 'гибкий график', 'командировки'
]

export default function QuestionnairePage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [questions, setQuestions] = useState<RiasecQuestion[]>([])
  const [loading, setLoading] = useState(false)
  
  const [interests, setInterests] = useState<string[]>([])
  const [skills, setSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState('')
  const [education, setEducation] = useState('высшее')
  const [desiredSalary, setDesiredSalary] = useState(100000)
  const [workConditions, setWorkConditions] = useState<string[]>([])
  const [riasecAnswers, setRiasecAnswers] = useState<Record<number, number>>({})

  useEffect(() => {
    api.getQuestions().then(setQuestions).catch(console.error)
  }, [])

  const toggleInterest = (interest: string) => {
    setInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    )
  }

  const addSkill = (skill: string) => {
    if (skill && !skills.includes(skill)) {
      setSkills(prev => [...prev, skill])
    }
    setSkillInput('')
  }

  const removeSkill = (skill: string) => {
    setSkills(prev => prev.filter(s => s !== skill))
  }

  const toggleWorkCondition = (condition: string) => {
    setWorkConditions(prev =>
      prev.includes(condition)
        ? prev.filter(c => c !== condition)
        : [...prev, condition]
    )
  }

  const handleRiasecAnswer = (questionId: number, score: number) => {
    setRiasecAnswers(prev => ({ ...prev, [questionId]: score }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const answers: RiasecAnswer[] = Object.entries(riasecAnswers).map(([id, score]) => ({
        questionId: parseInt(id),
        score
      }))

      const questionnaire: UserQuestionnaire = {
        interests,
        skills,
        education,
        desiredSalary,
        workConditions,
        riasecAnswers: answers
      }

      const result = await api.matchProfessions(questionnaire)
      navigate('/results', { state: { result, questionnaire } })
    } catch (error) {
      console.error('Error submitting questionnaire:', error)
    } finally {
      setLoading(false)
    }
  }

  const canProceedStep1 = interests.length > 0
  const canProceedStep2 = true
  const canProceedStep3 = Object.keys(riasecAnswers).length === questions.length && questions.length > 0

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-800">Анкета</h1>
              <span className="text-gray-500">Шаг {step} из 3</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Выберите ваши интересы</h2>
                <div className="flex flex-wrap gap-3">
                  {INTERESTS.map(interest => (
                    <button
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      className={`px-4 py-2 rounded-full border-2 transition-colors ${
                        interests.includes(interest)
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Ваши навыки</h2>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addSkill(skillInput)}
                    placeholder="Введите навык..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => addSkill(skillInput)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Добавить
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {skills.map(skill => (
                    <span key={skill} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full flex items-center gap-2">
                      {skill}
                      <button onClick={() => removeSkill(skill)} className="text-blue-600 hover:text-blue-800">&times;</button>
                    </span>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mb-2">Популярные навыки:</p>
                <div className="flex flex-wrap gap-2">
                  {SKILLS_SUGGESTIONS.filter(s => !skills.includes(s)).map(skill => (
                    <button
                      key={skill}
                      onClick={() => addSkill(skill)}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-full hover:border-blue-400 hover:text-blue-600"
                    >
                      + {skill}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Далее
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Образование</h2>
                <select
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {EDUCATION_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Желаемый доход: {desiredSalary.toLocaleString('ru-RU')} ₽/мес
                </h2>
                <input
                  type="range"
                  min="30000"
                  max="300000"
                  step="10000"
                  value={desiredSalary}
                  onChange={(e) => setDesiredSalary(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>30 000 ₽</span>
                  <span>300 000 ₽</span>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Условия работы</h2>
                <div className="flex flex-wrap gap-3">
                  {WORK_CONDITIONS.map(condition => (
                    <button
                      key={condition}
                      onClick={() => toggleWorkCondition(condition)}
                      className={`px-4 py-2 rounded-full border-2 transition-colors ${
                        workConditions.includes(condition)
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      {condition}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50"
                >
                  Назад
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!canProceedStep2}
                  className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
                >
                  Далее
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Тест RIASEC</h2>
              <p className="text-gray-600 mb-6">Оцените, насколько вы согласны с каждым утверждением (1 - не согласен, 5 - полностью согласен)</p>
              
              <div className="space-y-6">
                {questions.map((question, idx) => (
                  <div key={question.id} className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-800 mb-3">{idx + 1}. {question.text}</p>
                    <div className="flex gap-2 justify-center">
                      {[1, 2, 3, 4, 5].map(score => (
                        <button
                          key={score}
                          onClick={() => handleRiasecAnswer(question.id, score)}
                          className={`w-10 h-10 rounded-full border-2 font-semibold transition-colors ${
                            riasecAnswers[question.id] === score
                              ? 'border-blue-600 bg-blue-600 text-white'
                              : 'border-gray-300 hover:border-blue-400'
                          }`}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50"
                >
                  Назад
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!canProceedStep3 || loading}
                  className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
                >
                  {loading ? 'Анализ...' : 'Получить результаты'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
