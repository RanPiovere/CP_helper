package careermatch.routes

import akka.http.scaladsl.server.Directives.*
import akka.http.scaladsl.server.Route
import akka.http.scaladsl.model.StatusCodes
import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport.*
import spray.json.*
import careermatch.models.*
import careermatch.models.AuthJsonFormats.given
import careermatch.services.AuthService
import careermatch.db.Database

object AdminRoutes:
  
  private def withAdminAuth(token: String)(handler: Int => Route): Route =
    if AuthService.isAdmin(token) then
      AuthService.getUserId(token) match
        case Some(userId) => handler(userId)
        case None => complete(StatusCodes.Unauthorized -> ErrorResponse("Недействительный токен").toJson)
    else
      complete(StatusCodes.Forbidden -> ErrorResponse("Требуются права администратора").toJson)
  
  val coursesRoutes: Route = pathPrefix("courses") {
    concat(
      pathEnd {
        concat(
          get {
            val courses = Database.getAllCourses()
            complete(courses.toJson)
          },
          post {
            optionalHeaderValueByName("Authorization") {
              case Some(authHeader) if authHeader.startsWith("Bearer ") =>
                val token = authHeader.stripPrefix("Bearer ")
                withAdminAuth(token) { _ =>
                  entity(as[CreateCourseRequest]) { request =>
                    Database.createCourse(request.professionId, request.title, request.description, request.url, request.provider) match
                      case Some(course) => complete(StatusCodes.Created -> course.toJson)
                      case None => complete(StatusCodes.InternalServerError -> ErrorResponse("Ошибка создания курса").toJson)
                  }
                }
              case _ =>
                complete(StatusCodes.Unauthorized -> ErrorResponse("Требуется авторизация").toJson)
            }
          }
        )
      },
      path("profession" / IntNumber) { professionId =>
        get {
          val courses = Database.getCoursesByProfession(professionId)
          complete(courses.toJson)
        }
      },
      path(IntNumber) { courseId =>
        delete {
          optionalHeaderValueByName("Authorization") {
            case Some(authHeader) if authHeader.startsWith("Bearer ") =>
              val token = authHeader.stripPrefix("Bearer ")
              withAdminAuth(token) { _ =>
                if Database.deleteCourse(courseId) then
                  complete(MessageResponse("Курс удалён").toJson)
                else
                  complete(StatusCodes.NotFound -> ErrorResponse("Курс не найден").toJson)
              }
            case _ =>
              complete(StatusCodes.Unauthorized -> ErrorResponse("Требуется авторизация").toJson)
          }
        }
      }
    )
  }
  
  val newsRoutes: Route = pathPrefix("news") {
    concat(
      pathEnd {
        concat(
          get {
            val news = Database.getAllNews()
            complete(news.toJson)
          },
          post {
            optionalHeaderValueByName("Authorization") {
              case Some(authHeader) if authHeader.startsWith("Bearer ") =>
                val token = authHeader.stripPrefix("Bearer ")
                withAdminAuth(token) { userId =>
                  entity(as[CreateNewsRequest]) { request =>
                    Database.createNews(request.title, request.content, userId) match
                      case Some(news) => complete(StatusCodes.Created -> news.toJson)
                      case None => complete(StatusCodes.InternalServerError -> ErrorResponse("Ошибка создания новости").toJson)
                  }
                }
              case _ =>
                complete(StatusCodes.Unauthorized -> ErrorResponse("Требуется авторизация").toJson)
            }
          }
        )
      },
      path(IntNumber) { newsId =>
        delete {
          optionalHeaderValueByName("Authorization") {
            case Some(authHeader) if authHeader.startsWith("Bearer ") =>
              val token = authHeader.stripPrefix("Bearer ")
              withAdminAuth(token) { _ =>
                if Database.deleteNews(newsId) then
                  complete(MessageResponse("Новость удалена").toJson)
                else
                  complete(StatusCodes.NotFound -> ErrorResponse("Новость не найдена").toJson)
              }
            case _ =>
              complete(StatusCodes.Unauthorized -> ErrorResponse("Требуется авторизация").toJson)
          }
        }
      }
    )
  }
  
  val testsRoutes: Route = pathPrefix("tests") {
    concat(
      pathEnd {
        concat(
          get {
            val tests = Database.getAllTests()
            complete(tests.toJson)
          },
          post {
            optionalHeaderValueByName("Authorization") {
              case Some(authHeader) if authHeader.startsWith("Bearer ") =>
                val token = authHeader.stripPrefix("Bearer ")
                withAdminAuth(token) { userId =>
                  entity(as[CreateTestRequest]) { request =>
                    Database.createTest(request.title, request.description, userId, request.questions) match
                      case Some(test) => complete(StatusCodes.Created -> test.toJson)
                      case None => complete(StatusCodes.InternalServerError -> ErrorResponse("Ошибка создания теста").toJson)
                  }
                }
              case _ =>
                complete(StatusCodes.Unauthorized -> ErrorResponse("Требуется авторизация").toJson)
            }
          }
        )
      },
      path("admin") {
        get {
          optionalHeaderValueByName("Authorization") {
            case Some(authHeader) if authHeader.startsWith("Bearer ") =>
              val token = authHeader.stripPrefix("Bearer ")
              withAdminAuth(token) { _ =>
                val tests = Database.getAllTestsAdmin()
                complete(tests.toJson)
              }
            case _ =>
              complete(StatusCodes.Unauthorized -> ErrorResponse("Требуется авторизация").toJson)
          }
        }
      },
      path(IntNumber) { testId =>
        concat(
          get {
            Database.getTestById(testId) match
              case Some(test) =>
                val questions = Database.getTestQuestions(testId)
                complete(TestWithQuestions(test, questions).toJson)
              case None =>
                complete(StatusCodes.NotFound -> ErrorResponse("Тест не найден").toJson)
          },
          delete {
            optionalHeaderValueByName("Authorization") {
              case Some(authHeader) if authHeader.startsWith("Bearer ") =>
                val token = authHeader.stripPrefix("Bearer ")
                withAdminAuth(token) { _ =>
                  if Database.deleteTest(testId) then
                    complete(MessageResponse("Тест удалён").toJson)
                  else
                    complete(StatusCodes.NotFound -> ErrorResponse("Тест не найден").toJson)
                }
              case _ =>
                complete(StatusCodes.Unauthorized -> ErrorResponse("Требуется авторизация").toJson)
            }
          }
        )
      },
      path(IntNumber / "toggle") { testId =>
        post {
          optionalHeaderValueByName("Authorization") {
            case Some(authHeader) if authHeader.startsWith("Bearer ") =>
              val token = authHeader.stripPrefix("Bearer ")
              withAdminAuth(token) { _ =>
                parameter("active".as[Boolean]) { isActive =>
                  if Database.toggleTestActive(testId, isActive) then
                    complete(MessageResponse(if isActive then "Тест активирован" else "Тест деактивирован").toJson)
                  else
                    complete(StatusCodes.NotFound -> ErrorResponse("Тест не найден").toJson)
                }
              }
            case _ =>
              complete(StatusCodes.Unauthorized -> ErrorResponse("Требуется авторизация").toJson)
          }
        }
      }
    )
  }
  
  val routes: Route = concat(coursesRoutes, newsRoutes, testsRoutes)
