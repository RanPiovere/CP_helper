package careermatch

import akka.actor.typed.ActorSystem
import akka.actor.typed.scaladsl.Behaviors
import akka.http.scaladsl.Http
import scala.concurrent.{ExecutionContextExecutor, Await}
import scala.concurrent.duration.Duration
import scala.util.{Success, Failure}
import careermatch.routes.Routes
import careermatch.db.Database

object Main:
  def main(args: Array[String]): Unit =
    given system: ActorSystem[Nothing] = ActorSystem(Behaviors.empty, "careermatch")
    given executionContext: ExecutionContextExecutor = system.executionContext
    
    println("Initializing database...")
    Database.initializeDatabase()
    println("Seeding professions...")
    Database.seedProfessions()
    println("Database ready!")
    
    val host = sys.env.getOrElse("HOST", "0.0.0.0")
    val port = sys.env.getOrElse("PORT", "8080").toInt
    
    val bindingFuture = Http().newServerAt(host, port).bind(Routes.routes)
    
    bindingFuture.onComplete {
      case Success(binding) =>
        println(s"CareerMatch API server running at http://${binding.localAddress.getHostString}:${binding.localAddress.getPort}/")
      case Failure(exception) =>
        println(s"Failed to bind HTTP server: ${exception.getMessage}")
        system.terminate()
    }
    
    Await.result(system.whenTerminated, Duration.Inf)
