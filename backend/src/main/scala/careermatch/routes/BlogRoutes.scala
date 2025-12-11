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

object BlogRoutes:
  
  val routes: Route = pathPrefix("blogs") {
    concat(
      pathEnd {
        concat(
          get {
            parameter("category".?) { category =>
              val blogs = category match
                case Some(cat) => Database.getBlogsByCategory(cat)
                case None => Database.getAllBlogs()
              complete(blogs.toJson)
            }
          },
          post {
            entity(as[CreateBlogRequest]) { request =>
              optionalHeaderValueByName("Authorization") {
                case Some(authHeader) if authHeader.startsWith("Bearer ") =>
                  val token = authHeader.stripPrefix("Bearer ")
                  val userId = AuthService.getUserId(token)
                  val userName = userId.flatMap(id => Database.getUserById(id).map(_.name))
                  Database.createBlog(
                    request.title, 
                    request.content, 
                    request.category, 
                    request.subcategory, 
                    userId,
                    userName.getOrElse(request.authorName.getOrElse("Гость"))
                  ) match
                    case Some(blog) => complete(StatusCodes.Created -> blog.toJson)
                    case None => complete(StatusCodes.InternalServerError -> ErrorResponse("Ошибка создания блога").toJson)
                case _ =>
                  Database.createBlog(
                    request.title, 
                    request.content, 
                    request.category, 
                    request.subcategory, 
                    None,
                    request.authorName.getOrElse("Гость")
                  ) match
                    case Some(blog) => complete(StatusCodes.Created -> blog.toJson)
                    case None => complete(StatusCodes.InternalServerError -> ErrorResponse("Ошибка создания блога").toJson)
              }
            }
          }
        )
      },
      path(IntNumber) { blogId =>
        concat(
          get {
            Database.getBlogById(blogId) match
              case Some(blog) => complete(blog.toJson)
              case None => complete(StatusCodes.NotFound -> ErrorResponse("Блог не найден").toJson)
          },
          delete {
            optionalHeaderValueByName("Authorization") {
              case Some(authHeader) if authHeader.startsWith("Bearer ") =>
                val token = authHeader.stripPrefix("Bearer ")
                if AuthService.isAdmin(token) then
                  if Database.deleteBlog(blogId) then
                    complete(MessageResponse("Блог удалён").toJson)
                  else
                    complete(StatusCodes.NotFound -> ErrorResponse("Блог не найден").toJson)
                else
                  complete(StatusCodes.Forbidden -> ErrorResponse("Требуются права администратора").toJson)
              case _ =>
                complete(StatusCodes.Unauthorized -> ErrorResponse("Требуется авторизация").toJson)
            }
          }
        )
      }
    )
  }
