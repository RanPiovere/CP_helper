package careermatch.services

import careermatch.models.*

object RiasecService:
  
  val questions: List[RiasecQuestion] = List(
    RiasecQuestion(1, "Мне нравится работать с инструментами и механизмами", "realistic"),
    RiasecQuestion(2, "Я предпочитаю практическую деятельность теоретической", "realistic"),
    RiasecQuestion(3, "Мне нравится строить или ремонтировать вещи", "realistic"),
    RiasecQuestion(4, "Мне интересно понимать, как устроены сложные системы", "investigative"),
    RiasecQuestion(5, "Я люблю анализировать данные и решать задачи", "investigative"),
    RiasecQuestion(6, "Мне нравится проводить исследования и эксперименты", "investigative"),
    RiasecQuestion(7, "Я люблю творческую деятельность: рисование, музыка, дизайн", "artistic"),
    RiasecQuestion(8, "Мне важно самовыражение в работе", "artistic"),
    RiasecQuestion(9, "Я предпочитаю нестандартные подходы к решению задач", "artistic"),
    RiasecQuestion(10, "Мне нравится помогать людям и обучать их", "social"),
    RiasecQuestion(11, "Я хорошо работаю в команде", "social"),
    RiasecQuestion(12, "Мне важно, чтобы моя работа приносила пользу обществу", "social"),
    RiasecQuestion(13, "Мне нравится управлять проектами и людьми", "enterprising"),
    RiasecQuestion(14, "Я стремлюсь к лидерству и достижению целей", "enterprising"),
    RiasecQuestion(15, "Мне интересен бизнес и предпринимательство", "enterprising"),
    RiasecQuestion(16, "Мне нравится работать с документами и данными", "conventional"),
    RiasecQuestion(17, "Я ценю порядок, структуру и чёткие правила", "conventional"),
    RiasecQuestion(18, "Мне комфортно выполнять рутинные задачи качественно", "conventional")
  )
  
  def calculateProfile(answers: List[RiasecAnswer]): RiasecProfile =
    val categoryScores = answers.groupBy(a => 
      questions.find(_.id == a.questionId).map(_.category).getOrElse("")
    ).map { case (cat, ans) => 
      val avgScore = if ans.nonEmpty then ans.map(_.score).sum.toDouble / ans.size else 0.0
      cat -> avgScore
    }
    
    val maxPossible = 5.0
    def normalize(score: Double): Double = (score / maxPossible) * 100
    
    RiasecProfile(
      realistic = normalize(categoryScores.getOrElse("realistic", 0.0)),
      investigative = normalize(categoryScores.getOrElse("investigative", 0.0)),
      artistic = normalize(categoryScores.getOrElse("artistic", 0.0)),
      social = normalize(categoryScores.getOrElse("social", 0.0)),
      enterprising = normalize(categoryScores.getOrElse("enterprising", 0.0)),
      conventional = normalize(categoryScores.getOrElse("conventional", 0.0))
    )
  
  def calculateMatch(userProfile: RiasecProfile, professionProfile: RiasecProfile): Double =
    val userVec = Vector(
      userProfile.realistic,
      userProfile.investigative,
      userProfile.artistic,
      userProfile.social,
      userProfile.enterprising,
      userProfile.conventional
    )
    
    val profVec = Vector(
      professionProfile.realistic,
      professionProfile.investigative,
      professionProfile.artistic,
      professionProfile.social,
      professionProfile.enterprising,
      professionProfile.conventional
    )
    
    val dotProduct = userVec.zip(profVec).map((a, b) => a * b).sum
    val userMag = math.sqrt(userVec.map(x => x * x).sum)
    val profMag = math.sqrt(profVec.map(x => x * x).sum)
    
    if userMag == 0 || profMag == 0 then 0.0
    else (dotProduct / (userMag * profMag)) * 100
  
  def calculateSkillsMatch(userSkills: List[String], professionSkills: List[String]): Double =
    if professionSkills.isEmpty then 0.0
    else
      val userSkillsLower = userSkills.map(_.toLowerCase)
      val matchedSkills = professionSkills.count(ps => 
        userSkillsLower.exists(us => ps.toLowerCase.contains(us) || us.contains(ps.toLowerCase))
      )
      (matchedSkills.toDouble / professionSkills.size) * 100
