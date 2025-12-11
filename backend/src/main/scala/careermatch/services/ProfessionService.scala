package careermatch.services

import careermatch.models.*
import careermatch.db.Database

object ProfessionService:
  
  def matchProfessions(questionnaire: UserQuestionnaire): MatchResult =
    val userProfile = RiasecService.calculateProfile(questionnaire.riasecAnswers)
    val professions = Database.getAllProfessions()
    
    val matches = professions.map { profession =>
      val riasecMatch = RiasecService.calculateMatch(userProfile, profession.riasecProfile)
      val skillsMatch = RiasecService.calculateSkillsMatch(questionnaire.skills, profession.skills)
      
      val overallMatch = (riasecMatch * 0.7) + (skillsMatch * 0.3)
      
      ProfessionMatch(
        profession = profession,
        matchPercentage = math.round(overallMatch * 10) / 10.0,
        riasecMatch = math.round(riasecMatch * 10) / 10.0,
        skillsMatch = math.round(skillsMatch * 10) / 10.0
      )
    }.sortBy(-_.matchPercentage)
    
    MatchResult(userProfile, matches)
  
  def filterAndSort(
    matches: List[ProfessionMatch], 
    filters: FilterParams
  ): List[ProfessionMatch] =
    var filtered = matches
    
    filters.minSalary.foreach { min =>
      filtered = filtered.filter(_.profession.avgSalary >= min)
    }
    
    filters.maxSalary.foreach { max =>
      filtered = filtered.filter(_.profession.avgSalary <= max)
    }
    
    filters.workType.foreach { wt =>
      filtered = filtered.filter(_.profession.workType.toLowerCase == wt.toLowerCase)
    }
    
    filters.education.foreach { edu =>
      filtered = filtered.filter(_.profession.educationRequired.toLowerCase == edu.toLowerCase)
    }
    
    val sorted = filters.sortBy match
      case Some("salary") => filtered.sortBy(_.profession.avgSalary)
      case Some("demand") => filtered.sortBy(_.profession.demandScore)
      case Some("match") => filtered.sortBy(-_.matchPercentage)
      case _ => filtered
    
    filters.sortOrder match
      case Some("desc") => sorted.reverse
      case _ => sorted
  
  def getProfessionById(id: Int): Option[Profession] =
    Database.getProfessionById(id)
  
  def compareProfessions(ids: List[Int]): List[Profession] =
    ids.flatMap(Database.getProfessionById)
