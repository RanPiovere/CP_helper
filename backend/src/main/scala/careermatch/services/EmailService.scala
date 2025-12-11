package careermatch.services

import javax.mail.*
import javax.mail.internet.*
import java.util.Properties

object EmailService:
  
  private val smtpHost = sys.env.getOrElse("SMTP_HOST", "")
  private val smtpPort = sys.env.getOrElse("SMTP_PORT", "587")
  private val smtpUser = sys.env.getOrElse("SMTP_USER", "")
  private val smtpPassword = sys.env.getOrElse("SMTP_PASSWORD", "")
  private val fromEmail = sys.env.getOrElse("SMTP_FROM", smtpUser)
  private val appUrl = sys.env.getOrElse("APP_URL", "http://localhost:5000")
  
  private def getSession(): Option[Session] =
    if smtpHost.isEmpty || smtpUser.isEmpty then
      println("SMTP not configured, skipping email send")
      None
    else
      val props = new Properties()
      props.put("mail.smtp.auth", "true")
      props.put("mail.smtp.starttls.enable", "true")
      props.put("mail.smtp.host", smtpHost)
      props.put("mail.smtp.port", smtpPort)
      
      Some(Session.getInstance(props, new Authenticator() {
        override def getPasswordAuthentication(): PasswordAuthentication =
          new PasswordAuthentication(smtpUser, smtpPassword)
      }))
  
  def sendVerificationEmail(toEmail: String, name: String, token: String): Boolean =
    val verifyUrl = s"$appUrl/verify-email?token=$token"
    
    getSession() match
      case None =>
        println(s"Would send verification email to $toEmail with link: $verifyUrl")
        true
      case Some(session) =>
        try
          val message = new MimeMessage(session)
          message.setFrom(new InternetAddress(fromEmail, "CareerMatch"))
          message.setRecipients(Message.RecipientType.TO, toEmail)
          message.setSubject("Подтвердите ваш email - CareerMatch")
          
          val htmlContent = s"""
            |<!DOCTYPE html>
            |<html>
            |<head>
            |  <meta charset="UTF-8">
            |</head>
            |<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            |  <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            |    <h1 style="color: white; margin: 0;">CareerMatch</h1>
            |  </div>
            |  <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
            |    <h2 style="color: #1e293b;">Здравствуйте, $name!</h2>
            |    <p style="color: #475569; font-size: 16px;">
            |      Спасибо за регистрацию в CareerMatch. Для завершения регистрации, пожалуйста, подтвердите ваш email адрес.
            |    </p>
            |    <div style="text-align: center; margin: 30px 0;">
            |      <a href="$verifyUrl" style="background: #3b82f6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            |        Подтвердить email
            |      </a>
            |    </div>
            |    <p style="color: #64748b; font-size: 14px;">
            |      Если кнопка не работает, скопируйте и вставьте следующую ссылку в браузер:
            |    </p>
            |    <p style="color: #3b82f6; font-size: 14px; word-break: break-all;">$verifyUrl</p>
            |    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            |    <p style="color: #94a3b8; font-size: 12px;">
            |      Если вы не регистрировались в CareerMatch, просто проигнорируйте это письмо.
            |    </p>
            |  </div>
            |</body>
            |</html>
          """.stripMargin
          
          message.setContent(htmlContent, "text/html; charset=UTF-8")
          Transport.send(message)
          println(s"Verification email sent to $toEmail")
          true
        catch
          case e: Exception =>
            println(s"Failed to send email: ${e.getMessage}")
            false
