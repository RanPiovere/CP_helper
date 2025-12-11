package careermatch.models

import spray.json.*
import DefaultJsonProtocol.*
import java.time.Instant

case class User(
  id: Int,
  email: String,
  passwordHash: String,
  name: String,
  emailVerified: Boolean,
  googleId: Option[String],
  role: String,
  isViewingAsGuest: Boolean,
  createdAt: Instant
)

case class UserResponse(
  id: Int,
  email: String,
  name: String,
  emailVerified: Boolean,
  role: String,
  isViewingAsGuest: Boolean
)

object UserResponse:
  given RootJsonFormat[UserResponse] = jsonFormat6(UserResponse.apply)

case class ToggleViewModeRequest(
  viewAsGuest: Boolean
)

object ToggleViewModeRequest:
  given RootJsonFormat[ToggleViewModeRequest] = jsonFormat1(ToggleViewModeRequest.apply)

case class RegisterRequest(
  email: String,
  password: String,
  name: String
)

object RegisterRequest:
  given RootJsonFormat[RegisterRequest] = jsonFormat3(RegisterRequest.apply)

case class LoginRequest(
  email: String,
  password: String
)

object LoginRequest:
  given RootJsonFormat[LoginRequest] = jsonFormat2(LoginRequest.apply)

case class GoogleAuthRequest(
  idToken: String
)

object GoogleAuthRequest:
  given RootJsonFormat[GoogleAuthRequest] = jsonFormat1(GoogleAuthRequest.apply)

case class AuthResponse(
  token: String,
  user: UserResponse
)

object AuthResponse:
  given RootJsonFormat[AuthResponse] = jsonFormat2(AuthResponse.apply)

case class VerifyEmailRequest(
  token: String
)

object VerifyEmailRequest:
  given RootJsonFormat[VerifyEmailRequest] = jsonFormat1(VerifyEmailRequest.apply)

case class ResendVerificationRequest(
  email: String
)

object ResendVerificationRequest:
  given RootJsonFormat[ResendVerificationRequest] = jsonFormat1(ResendVerificationRequest.apply)

case class MessageResponse(
  message: String
)

object MessageResponse:
  given RootJsonFormat[MessageResponse] = jsonFormat1(MessageResponse.apply)

case class ErrorResponse(
  error: String
)

object ErrorResponse:
  given RootJsonFormat[ErrorResponse] = jsonFormat1(ErrorResponse.apply)

case class PartnerCourse(
  id: Int,
  professionId: Int,
  title: String,
  description: String,
  url: String,
  provider: String,
  createdAt: Instant
)

object PartnerCourse:
  given instantFormat: JsonFormat[Instant] = new JsonFormat[Instant]:
    def write(instant: Instant): JsValue = JsString(instant.toString)
    def read(value: JsValue): Instant = value match
      case JsString(s) => Instant.parse(s)
      case _ => throw DeserializationException("Expected Instant as JsString")
  given RootJsonFormat[PartnerCourse] = jsonFormat7(PartnerCourse.apply)

case class CreateCourseRequest(
  professionId: Int,
  title: String,
  description: String,
  url: String,
  provider: String
)

object CreateCourseRequest:
  given RootJsonFormat[CreateCourseRequest] = jsonFormat5(CreateCourseRequest.apply)

case class News(
  id: Int,
  title: String,
  content: String,
  authorId: Int,
  authorName: String,
  createdAt: Instant
)

object News:
  given instantFormat: JsonFormat[Instant] = new JsonFormat[Instant]:
    def write(instant: Instant): JsValue = JsString(instant.toString)
    def read(value: JsValue): Instant = value match
      case JsString(s) => Instant.parse(s)
      case _ => throw DeserializationException("Expected Instant as JsString")
  given RootJsonFormat[News] = jsonFormat6(News.apply)

case class CreateNewsRequest(
  title: String,
  content: String
)

object CreateNewsRequest:
  given RootJsonFormat[CreateNewsRequest] = jsonFormat2(CreateNewsRequest.apply)

case class CustomTest(
  id: Int,
  title: String,
  description: String,
  authorId: Int,
  isActive: Boolean,
  createdAt: Instant
)

object CustomTest:
  given instantFormat: JsonFormat[Instant] = new JsonFormat[Instant]:
    def write(instant: Instant): JsValue = JsString(instant.toString)
    def read(value: JsValue): Instant = value match
      case JsString(s) => Instant.parse(s)
      case _ => throw DeserializationException("Expected Instant as JsString")
  given RootJsonFormat[CustomTest] = jsonFormat6(CustomTest.apply)

case class CustomTestQuestion(
  id: Int,
  testId: Int,
  text: String,
  options: List[String],
  correctOptionIndex: Int,
  orderNum: Int
)

object CustomTestQuestion:
  given RootJsonFormat[CustomTestQuestion] = jsonFormat6(CustomTestQuestion.apply)

case class CreateTestRequest(
  title: String,
  description: String,
  questions: List[CreateQuestionRequest]
)

case class CreateQuestionRequest(
  text: String,
  options: List[String],
  correctOptionIndex: Int
)

object CreateQuestionRequest:
  given RootJsonFormat[CreateQuestionRequest] = jsonFormat3(CreateQuestionRequest.apply)

object CreateTestRequest:
  given RootJsonFormat[CreateTestRequest] = jsonFormat3(CreateTestRequest.apply)

case class TestWithQuestions(
  test: CustomTest,
  questions: List[CustomTestQuestion]
)

object TestWithQuestions:
  given RootJsonFormat[TestWithQuestions] = jsonFormat2(TestWithQuestions.apply)

case class BlogPost(
  id: Int,
  title: String,
  content: String,
  category: String,
  subcategory: String,
  authorId: Option[Int],
  authorName: String,
  createdAt: Instant
)

object BlogPost:
  given instantFormat: JsonFormat[Instant] = new JsonFormat[Instant]:
    def write(instant: Instant): JsValue = JsString(instant.toString)
    def read(value: JsValue): Instant = value match
      case JsString(s) => Instant.parse(s)
      case _ => throw DeserializationException("Expected Instant as JsString")
  given RootJsonFormat[BlogPost] = jsonFormat8(BlogPost.apply)

case class CreateBlogRequest(
  title: String,
  content: String,
  category: String,
  subcategory: String,
  authorName: Option[String]
)

object CreateBlogRequest:
  given RootJsonFormat[CreateBlogRequest] = jsonFormat5(CreateBlogRequest.apply)

object AuthJsonFormats extends DefaultJsonProtocol:
  given RootJsonFormat[UserResponse] = UserResponse.given_RootJsonFormat_UserResponse
  given RootJsonFormat[RegisterRequest] = RegisterRequest.given_RootJsonFormat_RegisterRequest
  given RootJsonFormat[LoginRequest] = LoginRequest.given_RootJsonFormat_LoginRequest
  given RootJsonFormat[GoogleAuthRequest] = GoogleAuthRequest.given_RootJsonFormat_GoogleAuthRequest
  given RootJsonFormat[AuthResponse] = AuthResponse.given_RootJsonFormat_AuthResponse
  given RootJsonFormat[VerifyEmailRequest] = VerifyEmailRequest.given_RootJsonFormat_VerifyEmailRequest
  given RootJsonFormat[ResendVerificationRequest] = ResendVerificationRequest.given_RootJsonFormat_ResendVerificationRequest
  given RootJsonFormat[MessageResponse] = MessageResponse.given_RootJsonFormat_MessageResponse
  given RootJsonFormat[ErrorResponse] = ErrorResponse.given_RootJsonFormat_ErrorResponse
  given RootJsonFormat[ToggleViewModeRequest] = ToggleViewModeRequest.given_RootJsonFormat_ToggleViewModeRequest
  given RootJsonFormat[PartnerCourse] = PartnerCourse.given_RootJsonFormat_PartnerCourse
  given RootJsonFormat[CreateCourseRequest] = CreateCourseRequest.given_RootJsonFormat_CreateCourseRequest
  given RootJsonFormat[News] = News.given_RootJsonFormat_News
  given RootJsonFormat[CreateNewsRequest] = CreateNewsRequest.given_RootJsonFormat_CreateNewsRequest
  given RootJsonFormat[CustomTest] = CustomTest.given_RootJsonFormat_CustomTest
  given RootJsonFormat[CustomTestQuestion] = CustomTestQuestion.given_RootJsonFormat_CustomTestQuestion
  given RootJsonFormat[CreateQuestionRequest] = CreateQuestionRequest.given_RootJsonFormat_CreateQuestionRequest
  given RootJsonFormat[CreateTestRequest] = CreateTestRequest.given_RootJsonFormat_CreateTestRequest
  given RootJsonFormat[TestWithQuestions] = TestWithQuestions.given_RootJsonFormat_TestWithQuestions
  given RootJsonFormat[BlogPost] = BlogPost.given_RootJsonFormat_BlogPost
  given RootJsonFormat[CreateBlogRequest] = CreateBlogRequest.given_RootJsonFormat_CreateBlogRequest
