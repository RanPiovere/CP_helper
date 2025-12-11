package careermatch.routes

import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.server.Route
import akka.http.scaladsl.model.StatusCodes
import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport._
import spray.json._
import careermatch.models._
import careermatch.models.JsonFormats.given
import careermatch.services._

object Routes:

  // -------------------
  // API маршруты
  // -------------------
  val apiRoutes: Route =
    pathPrefix("api") {
      concat(
        AuthRoutes.routes,

        path("health") {
          get {
            complete(StatusCodes.OK -> Map("status" -> "ok").toJson)
          }
        },

        path("questions") {
          get {
            complete(RiasecService.questions.toJson)
          }
        },

        path("professions") {
          get {
            parameters(
              "minSalary".as[Int].?,
              "maxSalary".as[Int].?,
              "workType".?,
              "education".?,
              "sortBy".?,
              "sortOrder".?
            ) { (minSalary, maxSalary, workType, education, sortBy, sortOrder) =>
              val professions = careermatch.db.Database.getAllProfessions()
              val filters = FilterParams(minSalary, maxSalary, workType, education, sortBy, sortOrder)
              val matches = professions.map(p => ProfessionMatch(p, 0, 0, 0))
              val filtered = ProfessionService.filterAndSort(matches, filters)
              complete(filtered.map(_.profession).toJson)
            }
          }
        },

        path("match") {
          post {
            entity(as[UserQuestionnaire]) { questionnaire =>
              complete(ProfessionService.matchProfessions(questionnaire).toJson)
            }
          }
        },

        AdminRoutes.routes
      )
    }

  // -------------------
  // Статика фронтенда (SPA)
  // -------------------
  val staticFiles: Route =
    getFromDirectory("public") ~                     // отдаёт все статические файлы (assets, css, js)
    pathSingleSlash(getFromFile("public/index.html")) ~ // отдаёт index.html на корне
    get {                                             // SPA fallback для фронтенд маршрутов
      path(Remaining) { _ =>
        getFromFile("public/index.html")
      }
    }

  // -------------------
  // Основной маршрут
  // -------------------
  val routes: Route = apiRoutes ~ staticFiles
