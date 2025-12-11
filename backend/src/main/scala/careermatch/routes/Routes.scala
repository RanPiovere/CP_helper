package careermatch.routes

import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.server.Route
import akka.http.scaladsl.model.StatusCodes
import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport._
import spray.json._
import careermatch.models._
import careermatch.models.JsonFormats.given
import careermatch.services._
import java.nio.file.{Files, Paths}

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

        AdminRoutes.routes,
        BlogRoutes.routes
      )
    }

  // -------------------
  // Статика фронтенда (SPA)
  // -------------------
  private val frontendDir =
    List("public", "frontend/dist").find(path => Files.exists(Paths.get(path)))

  val staticFiles: Route = frontendDir match
    case Some(dir) =>
      val indexFile = Paths.get(dir, "index.html").toString

      pathSingleSlash(getFromFile(indexFile)) ~      // index.html на корне
      getFromDirectory(dir) ~                        // статика (assets, css, js)
      get {                                          // SPA fallback для фронтенд маршрутов
        path(Remaining) { _ =>
          getFromFile(indexFile)
        }
      }

    case None =>
      // Если билд фронта не найден, отдаём 404
      pathPrefix("") {
        complete(StatusCodes.NotFound -> "Frontend build not found")
      }

  // -------------------
  // Основной маршрут
  // -------------------
  val routes: Route = apiRoutes ~ staticFiles
