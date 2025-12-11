package careermatch.services

import careermatch.models.*
import careermatch.db.Database
import org.mindrot.jbcrypt.BCrypt
import pdi.jwt.{Jwt, JwtAlgorithm, JwtClaim}
import spray.json.*
import spray.json.DefaultJsonProtocol.*
import java.time.Instant
import scala.util.{Try, Success, Failure}

object AuthService:
  
  private val jwtSecret = sys.env.getOrElse("JWT_SECRET", "careermatch-default-secret-key-change-in-production")
  private val jwtAlgorithm = JwtAlgorithm.HS256
  private val tokenExpiry = 86400 * 7
  
  def hashPassword(password: String): String =
    BCrypt.hashpw(password, BCrypt.gensalt())
  
  def checkPassword(password: String, hash: String): Boolean =
    BCrypt.checkpw(password, hash)
  
  def generateToken(userId: Int, email: String): String =
    val claim = JwtClaim(
      content = s"""{"userId":$userId,"email":"$email"}""",
      expiration = Some(Instant.now.plusSeconds(tokenExpiry).getEpochSecond),
      issuedAt = Some(Instant.now.getEpochSecond)
    )
    Jwt.encode(claim, jwtSecret, jwtAlgorithm)
  
  def validateToken(token: String): Option[(Int, String)] =
    Jwt.decode(token, jwtSecret, Seq(jwtAlgorithm)) match
      case Success(claim) =>
        val now = Instant.now.getEpochSecond
        claim.expiration match
          case Some(exp) if exp > now =>
            Try {
              val json = claim.content.parseJson.asJsObject
              val userId = json.fields("userId").convertTo[Int]
              val email = json.fields("email").convertTo[String]
              (userId, email)
            }.toOption
          case _ => None
      case Failure(_) => None
  
  def generateVerificationToken(): String =
    java.util.UUID.randomUUID().toString
  
  def register(request: RegisterRequest): Either[String, (User, String)] =
    if request.email.isBlank || !request.email.contains("@") then
      Left("Некорректный email")
    else if request.password.length < 6 then
      Left("Пароль должен содержать минимум 6 символов")
    else if request.name.isBlank then
      Left("Имя не может быть пустым")
    else
      Database.getUserByEmail(request.email) match
        case Some(_) => Left("Пользователь с таким email уже существует")
        case None =>
          val passwordHash = hashPassword(request.password)
          val verificationToken = generateVerificationToken()
          Database.createUser(request.email, passwordHash, request.name, verificationToken) match
            case Some(user) =>
              EmailService.sendVerificationEmail(user.email, user.name, verificationToken)
              Right((user, generateToken(user.id, user.email)))
            case None => Left("Ошибка при создании пользователя")
  
  def login(request: LoginRequest): Either[String, AuthResponse] =
    Database.getUserByEmail(request.email) match
      case None => Left("Неверный email или пароль")
      case Some(user) =>
        if !checkPassword(request.password, user.passwordHash) then
          Left("Неверный email или пароль")
        else
          val token = generateToken(user.id, user.email)
          val userResponse = UserResponse(user.id, user.email, user.name, user.emailVerified, user.role, user.isViewingAsGuest)
          Right(AuthResponse(token, userResponse))
  
  def verifyEmail(token: String): Either[String, String] =
    Database.verifyUserEmail(token) match
      case true => Right("Email успешно подтверждён")
      case false => Left("Недействительный или истёкший токен подтверждения")
  
  def resendVerification(email: String): Either[String, String] =
    Database.getUserByEmail(email) match
      case None => Left("Пользователь не найден")
      case Some(user) =>
        if user.emailVerified then
          Left("Email уже подтверждён")
        else
          val newToken = generateVerificationToken()
          Database.updateVerificationToken(user.id, newToken)
          EmailService.sendVerificationEmail(user.email, user.name, newToken)
          Right("Письмо для подтверждения отправлено")
  
  def googleAuth(idToken: String): Either[String, AuthResponse] =
    GoogleAuthService.verifyIdToken(idToken) match
      case None => Left("Недействительный Google токен")
      case Some((googleId, email, name)) =>
        Database.getUserByGoogleId(googleId) match
          case Some(user) =>
            val token = generateToken(user.id, user.email)
            val userResponse = UserResponse(user.id, user.email, user.name, user.emailVerified, user.role, user.isViewingAsGuest)
            Right(AuthResponse(token, userResponse))
          case None =>
            Database.getUserByEmail(email) match
              case Some(existingUser) =>
                Database.linkGoogleAccount(existingUser.id, googleId)
                val token = generateToken(existingUser.id, existingUser.email)
                val userResponse = UserResponse(existingUser.id, existingUser.email, existingUser.name, true, existingUser.role, existingUser.isViewingAsGuest)
                Right(AuthResponse(token, userResponse))
              case None =>
                Database.createGoogleUser(email, name, googleId) match
                  case Some(user) =>
                    val token = generateToken(user.id, user.email)
                    val userResponse = UserResponse(user.id, user.email, user.name, user.emailVerified, user.role, user.isViewingAsGuest)
                    Right(AuthResponse(token, userResponse))
                  case None => Left("Ошибка при создании аккаунта")
  
  def getCurrentUser(token: String): Option[UserResponse] =
    validateToken(token).flatMap { case (userId, _) =>
      Database.getUserById(userId).map { user =>
        UserResponse(user.id, user.email, user.name, user.emailVerified, user.role, user.isViewingAsGuest)
      }
    }
  
  def toggleViewMode(token: String, viewAsGuest: Boolean): Either[String, UserResponse] =
    validateToken(token) match
      case None => Left("Недействительный токен")
      case Some((userId, _)) =>
        Database.getUserById(userId) match
          case None => Left("Пользователь не найден")
          case Some(user) =>
            if user.role != "admin" then
              Left("Только администратор может переключать режим просмотра")
            else
              Database.toggleViewMode(userId, viewAsGuest)
              Database.getUserById(userId).map { updatedUser =>
                UserResponse(updatedUser.id, updatedUser.email, updatedUser.name, updatedUser.emailVerified, updatedUser.role, updatedUser.isViewingAsGuest)
              } match
                case Some(userResp) => Right(userResp)
                case None => Left("Ошибка обновления режима просмотра")
  
  def isAdmin(token: String): Boolean =
    validateToken(token).flatMap { case (userId, _) =>
      Database.getUserById(userId).map { user =>
        user.role == "admin" && !user.isViewingAsGuest
      }
    }.getOrElse(false)
  
  def getUserId(token: String): Option[Int] =
    validateToken(token).map(_._1)
