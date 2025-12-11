package careermatch.models

import spray.json.*
import DefaultJsonProtocol.*

case class RiasecProfile(
  realistic: Double,
  investigative: Double,
  artistic: Double,
  social: Double,
  enterprising: Double,
  conventional: Double
)

object RiasecProfile:
  given RootJsonFormat[RiasecProfile] = jsonFormat6(RiasecProfile.apply)

case class Profession(
  id: Int,
  name: String,
  description: String,
  skills: List[String],
  riasecProfile: RiasecProfile,
  avgSalary: Int,
  demandScore: Int,
  workType: String,
  educationRequired: String
)

object Profession:
  given RootJsonFormat[Profession] = jsonFormat9(Profession.apply)

case class ProfessionMatch(
  profession: Profession,
  matchPercentage: Double,
  riasecMatch: Double,
  skillsMatch: Double
)

object ProfessionMatch:
  given RootJsonFormat[ProfessionMatch] = jsonFormat4(ProfessionMatch.apply)

case class RiasecQuestion(
  id: Int,
  text: String,
  category: String
)

object RiasecQuestion:
  given RootJsonFormat[RiasecQuestion] = jsonFormat3(RiasecQuestion.apply)

case class RiasecAnswer(
  questionId: Int,
  score: Int
)

object RiasecAnswer:
  given RootJsonFormat[RiasecAnswer] = jsonFormat2(RiasecAnswer.apply)

case class UserQuestionnaire(
  interests: List[String],
  skills: List[String],
  education: String,
  desiredSalary: Int,
  workConditions: List[String],
  riasecAnswers: List[RiasecAnswer]
)

object UserQuestionnaire:
  given RootJsonFormat[UserQuestionnaire] = jsonFormat6(UserQuestionnaire.apply)

case class MatchResult(
  userProfile: RiasecProfile,
  matches: List[ProfessionMatch]
)

object MatchResult:
  given RootJsonFormat[MatchResult] = jsonFormat2(MatchResult.apply)

case class FilterParams(
  minSalary: Option[Int],
  maxSalary: Option[Int],
  workType: Option[String],
  education: Option[String],
  sortBy: Option[String],
  sortOrder: Option[String]
)

object FilterParams:
  given RootJsonFormat[FilterParams] = jsonFormat6(FilterParams.apply)

object JsonFormats extends DefaultJsonProtocol:
  given RootJsonFormat[RiasecProfile] = RiasecProfile.given_RootJsonFormat_RiasecProfile
  given RootJsonFormat[Profession] = Profession.given_RootJsonFormat_Profession
  given RootJsonFormat[ProfessionMatch] = ProfessionMatch.given_RootJsonFormat_ProfessionMatch
  given RootJsonFormat[RiasecQuestion] = RiasecQuestion.given_RootJsonFormat_RiasecQuestion
  given RootJsonFormat[RiasecAnswer] = RiasecAnswer.given_RootJsonFormat_RiasecAnswer
  given RootJsonFormat[UserQuestionnaire] = UserQuestionnaire.given_RootJsonFormat_UserQuestionnaire
  given RootJsonFormat[MatchResult] = MatchResult.given_RootJsonFormat_MatchResult
  given RootJsonFormat[FilterParams] = FilterParams.given_RootJsonFormat_FilterParams
