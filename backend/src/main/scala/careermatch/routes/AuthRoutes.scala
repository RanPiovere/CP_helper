package careermatch.routes

import akka.http.scaladsl.server.Directives.*
import akka.http.scaladsl.server.Route
import akka.http.scaladsl.model.StatusCodes
import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport.*
import spray.json.*
import careermatch.models.*
import careermatch.models.AuthJsonFormats.given
import careermatch.services.AuthService

object AuthRoutes:
  
  val routes: Route = pathPrefix("auth") {
    concat(
      path("register") {
        post {
          entity(as[RegisterRequest]) { request =>
            AuthService.register(request) match
              case Right((user, token)) =>
                val userResponse = UserResponse(user.id, user.email, user.name, user.emailVerified, user.role, user.isViewingAsGuest)
                complete(StatusCodes.Created -> AuthResponse(token, userResponse).toJson)
              case Left(error) =>
                complete(StatusCodes.BadRequest -> ErrorResponse(error).toJson)
          }
        }
      },
      
      path("login") {
        post {
          entity(as[LoginRequest]) { request =>
            AuthService.login(request) match
              case Right(response) =>
                complete(response.toJson)
              case Left(error) =>
                complete(StatusCodes.Unauthorized -> ErrorResponse(error).toJson)
          }
        }
      },
      
      path("google") {
        post {
          entity(as[GoogleAuthRequest]) { request =>
            AuthService.googleAuth(request.idToken) match
              case Right(response) =>
                complete(response.toJson)
              case Left(error) =>
                complete(StatusCodes.Unauthorized -> ErrorResponse(error).toJson)
          }
        }
      },
      
      path("verify-email") {
        post {
          entity(as[VerifyEmailRequest]) { request =>
            AuthService.verifyEmail(request.token) match
              case Right(message) =>
                complete(MessageResponse(message).toJson)
              case Left(error) =>
                complete(StatusCodes.BadRequest -> ErrorResponse(error).toJson)
          }
        }
      },
      
      path("resend-verification") {
        post {
          entity(as[ResendVerificationRequest]) { request =>
            AuthService.resendVerification(request.email) match
              case Right(message) =>
                complete(MessageResponse(message).toJson)
              case Left(error) =>
                complete(StatusCodes.BadRequest -> ErrorResponse(error).toJson)
          }
        }
      },
      
      path("me") {
        get {
          optionalHeaderValueByName("Authorization") {
            case Some(authHeader) if authHeader.startsWith("Bearer ") =>
              val token = authHeader.stripPrefix("Bearer ")
              AuthService.getCurrentUser(token) match
                case Some(user) => complete(user.toJson)
                case None => complete(StatusCodes.Unauthorized -> ErrorResponse("Недействительный токен").toJson)
            case _ =>
              complete(StatusCodes.Unauthorized -> ErrorResponse("Требуется авторизация").toJson)
          }
        }
      },
      
      path("toggle-view-mode") {
        post {
          optionalHeaderValueByName("Authorization") {
            case Some(authHeader) if authHeader.startsWith("Bearer ") =>
              val token = authHeader.stripPrefix("Bearer ")
              entity(as[ToggleViewModeRequest]) { request =>
                AuthService.toggleViewMode(token, request.viewAsGuest) match
                  case Right(user) => complete(user.toJson)
                  case Left(error) => complete(StatusCodes.Forbidden -> ErrorResponse(error).toJson)
              }
            case _ =>
              complete(StatusCodes.Unauthorized -> ErrorResponse("Требуется авторизация").toJson)
          }
        }
      }
    )
  }
