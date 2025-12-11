package careermatch.services

import spray.json.*
import DefaultJsonProtocol.*
import java.net.{URL, HttpURLConnection}
import java.io.{BufferedReader, InputStreamReader}
import scala.util.{Try, Success, Failure}

object GoogleAuthService:
  
  private val googleClientId = sys.env.getOrElse("GOOGLE_CLIENT_ID", "")
  
  def verifyIdToken(idToken: String): Option[(String, String, String)] =
    if googleClientId.isEmpty then
      println("Google Client ID not configured")
      return None
    
    try
      val url = new URL(s"https://oauth2.googleapis.com/tokeninfo?id_token=$idToken")
      val connection = url.openConnection().asInstanceOf[HttpURLConnection]
      connection.setRequestMethod("GET")
      connection.setConnectTimeout(5000)
      connection.setReadTimeout(5000)
      
      val responseCode = connection.getResponseCode
      if responseCode == 200 then
        val reader = new BufferedReader(new InputStreamReader(connection.getInputStream))
        val response = Iterator.continually(reader.readLine()).takeWhile(_ != null).mkString
        reader.close()
        
        val json = response.parseJson.asJsObject
        val fields = json.fields
        
        val aud = fields.get("aud").map(_.convertTo[String]).getOrElse("")
        if aud != googleClientId then
          println(s"Token audience mismatch: $aud vs $googleClientId")
          None
        else
          val sub = fields.get("sub").map(_.convertTo[String]).getOrElse("")
          val email = fields.get("email").map(_.convertTo[String]).getOrElse("")
          val name = fields.get("name").map(_.convertTo[String]).getOrElse(
            fields.get("given_name").map(_.convertTo[String]).getOrElse("User")
          )
          
          if sub.nonEmpty && email.nonEmpty then
            Some((sub, email, name))
          else
            None
      else
        println(s"Google token verification failed with status $responseCode")
        None
    catch
      case e: Exception =>
        println(s"Google token verification error: ${e.getMessage}")
        None
