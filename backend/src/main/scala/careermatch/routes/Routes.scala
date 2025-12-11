package careermatch.routes

import akka.http.scaladsl.server.Directives.*
import akka.http.scaladsl.server.Route
import akka.http.scaladsl.model.{HttpMethods, StatusCodes}
import akka.http.scaladsl.model.headers.*
import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport.*
import spray.json.*
import careermatch.models.*
import careermatch.models.JsonFormats.given
import careermatch.services.*

object Routes:
  
  private val corsHeaders = List(
    `Access-Control-Allow-Origin`.*,
    `Access-Control-Allow-Methods`(HttpMethods.GET, HttpMethods.POST, HttpMethods.PUT, HttpMethods.DELETE, HttpMethods.OPTIONS),
    `Access-Control-Allow-Headers`("Content-Type", "Authorization", "X-Requested-With")
  )
  
  def corsHandler(routes: Route): Route =
    respondWithHeaders(corsHeaders) {
      options {
        complete(StatusCodes.OK)
      } ~ routes
    }
  
  val routes: Route = corsHandler {
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
        
        path("professions" / IntNumber) { id =>
          get {
            ProfessionService.getProfessionById(id) match
              case Some(profession) => complete(profession.toJson)
              case None => complete(StatusCodes.NotFound -> Map("error" -> "Profession not found").toJson)
          }
        },
        
        path("match") {
          post {
            entity(as[UserQuestionnaire]) { questionnaire =>
              val result = ProfessionService.matchProfessions(questionnaire)
              complete(result.toJson)
            }
          }
        },
        
        path("compare") {
          get {
            parameters("ids".as[String]) { idsParam =>
              val ids = idsParam.split(",").map(_.trim.toInt).toList
              val professions = ProfessionService.compareProfessions(ids)
              complete(professions.toJson)
            }
          }
        },
        
        AdminRoutes.routes
      )
    }
  }
