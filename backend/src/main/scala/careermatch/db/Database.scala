package careermatch.db

import careermatch.models.*
import java.sql.{Connection, DriverManager, ResultSet, Timestamp}
import com.zaxxer.hikari.{HikariConfig, HikariDataSource}
import spray.json.*
import careermatch.models.JsonFormats.given
import java.net.URI
import java.time.Instant

object Database:
  
  private lazy val dataSource: HikariDataSource =
    val dbUrl = sys.env.getOrElse("DATABASE_URL", "")
    
    val config = new HikariConfig()
    
    if dbUrl.nonEmpty then
      val uri = new URI(dbUrl)
      val host = uri.getHost
      val port = if uri.getPort == -1 then 5432 else uri.getPort
      val database = uri.getPath.stripPrefix("/")
      val userInfo = uri.getUserInfo
      val query = Option(uri.getQuery).map("?" + _).getOrElse("")
      
      val (username, password) = if userInfo != null && userInfo.contains(":") then
        val parts = userInfo.split(":", 2)
        (parts(0), parts(1))
      else
        (userInfo, "")
      
      val jdbcUrl = s"jdbc:postgresql://$host:$port/$database$query"
      config.setJdbcUrl(jdbcUrl)
      config.setUsername(username)
      config.setPassword(password)
    
    config.setMaximumPoolSize(10)
    config.setMinimumIdle(2)
    config.setConnectionTimeout(30000)
    config.setDriverClassName("org.postgresql.Driver")
    new HikariDataSource(config)
  
  def getConnection(): Connection = dataSource.getConnection()
  
  def initializeDatabase(): Unit =
    val conn = getConnection()
    try
      val stmt = conn.createStatement()
      
      stmt.executeUpdate("""
        CREATE TABLE IF NOT EXISTS professions (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          skills TEXT[],
          riasec_profile JSONB NOT NULL,
          avg_salary INTEGER,
          demand_score INTEGER,
          work_type VARCHAR(100),
          education_required VARCHAR(100)
        )
      """)
      
      stmt.executeUpdate("""
        CREATE TABLE IF NOT EXISTS user_profiles (
          id SERIAL PRIMARY KEY,
          session_id VARCHAR(255),
          riasec_scores JSONB,
          interests TEXT[],
          skills TEXT[],
          preferences JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      """)
      
      stmt.executeUpdate("""
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255),
          name VARCHAR(255) NOT NULL,
          email_verified BOOLEAN DEFAULT FALSE,
          google_id VARCHAR(255) UNIQUE,
          role VARCHAR(50) DEFAULT 'guest',
          is_viewing_as_guest BOOLEAN DEFAULT FALSE,
          verification_token VARCHAR(255),
          verification_expires TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      """)
      
      stmt.executeUpdate("""
        ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'guest'
      """)
      
      stmt.executeUpdate("""
        ALTER TABLE users ADD COLUMN IF NOT EXISTS is_viewing_as_guest BOOLEAN DEFAULT FALSE
      """)
      
      stmt.executeUpdate("""
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
      """)
      
      stmt.executeUpdate("""
        CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id)
      """)
      
      stmt.executeUpdate("""
        CREATE TABLE IF NOT EXISTS partner_courses (
          id SERIAL PRIMARY KEY,
          profession_id INTEGER REFERENCES professions(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          url VARCHAR(500) NOT NULL,
          provider VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      """)
      
      stmt.executeUpdate("""
        CREATE TABLE IF NOT EXISTS news (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          content TEXT NOT NULL,
          author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      """)
      
      stmt.executeUpdate("""
        CREATE TABLE IF NOT EXISTS custom_tests (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      """)
      
      stmt.executeUpdate("""
        CREATE TABLE IF NOT EXISTS custom_test_questions (
          id SERIAL PRIMARY KEY,
          test_id INTEGER REFERENCES custom_tests(id) ON DELETE CASCADE,
          text TEXT NOT NULL,
          options TEXT[] NOT NULL,
          correct_option_index INTEGER NOT NULL,
          order_num INTEGER NOT NULL
        )
      """)
      
      stmt.close()
    finally
      conn.close()
  
  def seedProfessions(): Unit =
    val conn = getConnection()
    try
      val checkStmt = conn.prepareStatement("SELECT COUNT(*) FROM professions")
      val rs = checkStmt.executeQuery()
      rs.next()
      if rs.getInt(1) == 0 then
        val professions = getSeedProfessions()
        professions.foreach { p =>
          insertProfession(conn, p)
        }
      checkStmt.close()
    finally
      conn.close()
  
  private def insertProfession(conn: Connection, p: Profession): Unit =
    val stmt = conn.prepareStatement("""
      INSERT INTO professions (name, description, skills, riasec_profile, avg_salary, demand_score, work_type, education_required)
      VALUES (?, ?, ?, ?::jsonb, ?, ?, ?, ?)
    """)
    stmt.setString(1, p.name)
    stmt.setString(2, p.description)
    stmt.setArray(3, conn.createArrayOf("text", p.skills.toArray))
    stmt.setString(4, p.riasecProfile.toJson.compactPrint)
    stmt.setInt(5, p.avgSalary)
    stmt.setInt(6, p.demandScore)
    stmt.setString(7, p.workType)
    stmt.setString(8, p.educationRequired)
    stmt.executeUpdate()
    stmt.close()
  
  def getAllProfessions(): List[Profession] =
    val conn = getConnection()
    try
      val stmt = conn.createStatement()
      val rs = stmt.executeQuery("SELECT * FROM professions ORDER BY id")
      val professions = scala.collection.mutable.ListBuffer[Profession]()
      while rs.next() do
        professions += parseProfession(rs)
      stmt.close()
      professions.toList
    finally
      conn.close()
  
  def getProfessionById(id: Int): Option[Profession] =
    val conn = getConnection()
    try
      val stmt = conn.prepareStatement("SELECT * FROM professions WHERE id = ?")
      stmt.setInt(1, id)
      val rs = stmt.executeQuery()
      val result = if rs.next() then Some(parseProfession(rs)) else None
      stmt.close()
      result
    finally
      conn.close()
  
  private def parseProfession(rs: ResultSet): Profession =
    val riasecJson = rs.getString("riasec_profile")
    val riasec = riasecJson.parseJson.convertTo[RiasecProfile]
    
    val skillsArray = Option(rs.getArray("skills"))
      .map(_.getArray.asInstanceOf[Array[String]].toList)
      .getOrElse(List.empty)
    
    Profession(
      id = rs.getInt("id"),
      name = rs.getString("name"),
      description = Option(rs.getString("description")).getOrElse(""),
      skills = skillsArray,
      riasecProfile = riasec,
      avgSalary = rs.getInt("avg_salary"),
      demandScore = rs.getInt("demand_score"),
      workType = Option(rs.getString("work_type")).getOrElse(""),
      educationRequired = Option(rs.getString("education_required")).getOrElse("")
    )
  
  private def getSeedProfessions(): List[Profession] = List(
    Profession(0, "Программист", "Разработка программного обеспечения и приложений", 
      List("программирование", "алгоритмы", "базы данных", "git", "английский"),
      RiasecProfile(40, 90, 30, 20, 30, 50), 150000, 95, "удалённая", "высшее"),
    Profession(0, "Data Scientist", "Анализ данных и машинное обучение",
      List("Python", "статистика", "машинное обучение", "SQL", "визуализация"),
      RiasecProfile(30, 95, 25, 25, 35, 60), 180000, 90, "удалённая", "высшее"),
    Profession(0, "UX/UI Дизайнер", "Проектирование пользовательских интерфейсов",
      List("Figma", "дизайн", "прототипирование", "исследования", "креативность"),
      RiasecProfile(30, 50, 95, 60, 40, 30), 120000, 85, "гибкий график", "высшее"),
    Profession(0, "Врач-терапевт", "Диагностика и лечение заболеваний",
      List("медицина", "диагностика", "коммуникация", "анатомия", "фармакология"),
      RiasecProfile(50, 85, 20, 95, 30, 50), 100000, 80, "офис", "высшее"),
    Profession(0, "Менеджер проектов", "Управление проектами и командами",
      List("управление", "планирование", "коммуникация", "Agile", "лидерство"),
      RiasecProfile(30, 40, 25, 70, 90, 60), 140000, 88, "гибкий график", "высшее"),
    Profession(0, "Маркетолог", "Продвижение продуктов и услуг",
      List("маркетинг", "аналитика", "креативность", "SMM", "копирайтинг"),
      RiasecProfile(20, 50, 70, 60, 85, 45), 100000, 82, "гибкий график", "высшее"),
    Profession(0, "Бухгалтер", "Ведение финансовой отчётности",
      List("бухгалтерия", "1С", "налоги", "Excel", "внимательность"),
      RiasecProfile(25, 40, 15, 35, 30, 95), 70000, 75, "офис", "среднее спец."),
    Profession(0, "Инженер-механик", "Проектирование и обслуживание механизмов",
      List("CAD", "механика", "чертежи", "материаловедение", "расчёты"),
      RiasecProfile(95, 75, 30, 25, 30, 50), 90000, 70, "офис", "высшее"),
    Profession(0, "Психолог", "Консультирование и психологическая помощь",
      List("психология", "эмпатия", "консультирование", "диагностика", "терапия"),
      RiasecProfile(20, 70, 50, 95, 40, 35), 80000, 78, "гибкий график", "высшее"),
    Profession(0, "Учитель", "Обучение и воспитание учащихся",
      List("педагогика", "коммуникация", "терпение", "методика", "организация"),
      RiasecProfile(30, 55, 45, 95, 50, 55), 60000, 85, "офис", "высшее"),
    Profession(0, "Финансовый аналитик", "Анализ финансовых данных и прогнозирование",
      List("финансы", "Excel", "аналитика", "отчётность", "моделирование"),
      RiasecProfile(25, 85, 20, 30, 70, 80), 130000, 82, "офис", "высшее"),
    Profession(0, "Системный администратор", "Обслуживание IT-инфраструктуры",
      List("Linux", "сети", "безопасность", "скрипты", "мониторинг"),
      RiasecProfile(70, 75, 15, 30, 25, 70), 100000, 80, "офис", "среднее спец."),
    Profession(0, "Графический дизайнер", "Создание визуального контента",
      List("Photoshop", "Illustrator", "типографика", "композиция", "цвет"),
      RiasecProfile(40, 35, 95, 40, 45, 30), 90000, 75, "удалённая", "среднее спец."),
    Profession(0, "HR-менеджер", "Управление персоналом и подбор кадров",
      List("рекрутинг", "коммуникация", "оценка персонала", "HR-системы", "мотивация"),
      RiasecProfile(25, 40, 30, 90, 75, 55), 95000, 80, "офис", "высшее"),
    Profession(0, "Продуктовый менеджер", "Развитие и управление продуктом",
      List("продуктовая стратегия", "аналитика", "UX", "Agile", "коммуникация"),
      RiasecProfile(30, 70, 55, 65, 85, 50), 170000, 90, "гибкий график", "высшее"),
    Profession(0, "Электрик", "Монтаж и обслуживание электросетей",
      List("электротехника", "схемы", "безопасность", "монтаж", "диагностика"),
      RiasecProfile(95, 50, 15, 30, 25, 60), 70000, 75, "офис", "среднее спец."),
    Profession(0, "Переводчик", "Перевод текстов и устный перевод",
      List("иностранные языки", "грамотность", "культура", "редактура", "внимание"),
      RiasecProfile(20, 60, 70, 55, 30, 65), 75000, 65, "удалённая", "высшее"),
    Profession(0, "Архитектор", "Проектирование зданий и сооружений",
      List("AutoCAD", "3D-моделирование", "черчение", "строительство", "дизайн"),
      RiasecProfile(75, 70, 90, 35, 45, 55), 120000, 70, "офис", "высшее"),
    Profession(0, "DevOps-инженер", "Автоматизация разработки и развёртывания",
      List("Docker", "Kubernetes", "CI/CD", "Linux", "облачные сервисы"),
      RiasecProfile(60, 85, 20, 25, 35, 70), 200000, 92, "удалённая", "высшее"),
    Profession(0, "Копирайтер", "Написание рекламных и информационных текстов",
      List("копирайтинг", "SEO", "креативность", "редактура", "маркетинг"),
      RiasecProfile(20, 45, 85, 50, 60, 40), 70000, 70, "удалённая", "высшее")
  )
  
  private def parseUser(rs: ResultSet): User =
    User(
      id = rs.getInt("id"),
      email = rs.getString("email"),
      passwordHash = Option(rs.getString("password_hash")).getOrElse(""),
      name = rs.getString("name"),
      emailVerified = rs.getBoolean("email_verified"),
      googleId = Option(rs.getString("google_id")),
      role = Option(rs.getString("role")).getOrElse("guest"),
      isViewingAsGuest = rs.getBoolean("is_viewing_as_guest"),
      createdAt = rs.getTimestamp("created_at").toInstant
    )
  
  def getUserByEmail(email: String): Option[User] =
    val conn = getConnection()
    try
      val stmt = conn.prepareStatement("SELECT * FROM users WHERE email = ?")
      stmt.setString(1, email.toLowerCase)
      val rs = stmt.executeQuery()
      val result = if rs.next() then Some(parseUser(rs)) else None
      stmt.close()
      result
    finally
      conn.close()
  
  def getUserById(id: Int): Option[User] =
    val conn = getConnection()
    try
      val stmt = conn.prepareStatement("SELECT * FROM users WHERE id = ?")
      stmt.setInt(1, id)
      val rs = stmt.executeQuery()
      val result = if rs.next() then Some(parseUser(rs)) else None
      stmt.close()
      result
    finally
      conn.close()
  
  def getUserByGoogleId(googleId: String): Option[User] =
    val conn = getConnection()
    try
      val stmt = conn.prepareStatement("SELECT * FROM users WHERE google_id = ?")
      stmt.setString(1, googleId)
      val rs = stmt.executeQuery()
      val result = if rs.next() then Some(parseUser(rs)) else None
      stmt.close()
      result
    finally
      conn.close()
  
  def isFirstUser(): Boolean =
    val conn = getConnection()
    try
      val stmt = conn.prepareStatement("SELECT COUNT(*) FROM users")
      val rs = stmt.executeQuery()
      rs.next()
      val count = rs.getInt(1)
      stmt.close()
      count == 0
    finally
      conn.close()

  def createUser(email: String, passwordHash: String, name: String, verificationToken: String): Option[User] =
    val conn = getConnection()
    try
      val role = if isFirstUser() then "admin" else "guest"
      val stmt = conn.prepareStatement(
        """INSERT INTO users (email, password_hash, name, role, verification_token, verification_expires)
           VALUES (?, ?, ?, ?, ?, ?)
           RETURNING id, email, password_hash, name, email_verified, google_id, role, is_viewing_as_guest, created_at"""
      )
      stmt.setString(1, email.toLowerCase)
      stmt.setString(2, passwordHash)
      stmt.setString(3, name)
      stmt.setString(4, role)
      stmt.setString(5, verificationToken)
      stmt.setTimestamp(6, Timestamp.from(Instant.now.plusSeconds(86400)))
      val rs = stmt.executeQuery()
      val result = if rs.next() then Some(parseUser(rs)) else None
      stmt.close()
      result
    finally
      conn.close()
  
  def createGoogleUser(email: String, name: String, googleId: String): Option[User] =
    val conn = getConnection()
    try
      val role = if isFirstUser() then "admin" else "guest"
      val stmt = conn.prepareStatement(
        """INSERT INTO users (email, name, google_id, role, email_verified)
           VALUES (?, ?, ?, ?, TRUE)
           RETURNING id, email, password_hash, name, email_verified, google_id, role, is_viewing_as_guest, created_at"""
      )
      stmt.setString(1, email.toLowerCase)
      stmt.setString(2, name)
      stmt.setString(3, googleId)
      stmt.setString(4, role)
      val rs = stmt.executeQuery()
      val result = if rs.next() then Some(parseUser(rs)) else None
      stmt.close()
      result
    finally
      conn.close()
  
  def verifyUserEmail(token: String): Boolean =
    val conn = getConnection()
    try
      val stmt = conn.prepareStatement(
        """UPDATE users SET email_verified = TRUE, verification_token = NULL, verification_expires = NULL
           WHERE verification_token = ? AND verification_expires > CURRENT_TIMESTAMP"""
      )
      stmt.setString(1, token)
      val updated = stmt.executeUpdate()
      stmt.close()
      updated > 0
    finally
      conn.close()
  
  def updateVerificationToken(userId: Int, token: String): Boolean =
    val conn = getConnection()
    try
      val stmt = conn.prepareStatement(
        """UPDATE users SET verification_token = ?, verification_expires = ?
           WHERE id = ?"""
      )
      stmt.setString(1, token)
      stmt.setTimestamp(2, Timestamp.from(Instant.now.plusSeconds(86400)))
      stmt.setInt(3, userId)
      val updated = stmt.executeUpdate()
      stmt.close()
      updated > 0
    finally
      conn.close()
  
  def linkGoogleAccount(userId: Int, googleId: String): Boolean =
    val conn = getConnection()
    try
      val stmt = conn.prepareStatement(
        """UPDATE users SET google_id = ?, email_verified = TRUE WHERE id = ?"""
      )
      stmt.setString(1, googleId)
      stmt.setInt(2, userId)
      val updated = stmt.executeUpdate()
      stmt.close()
      updated > 0
    finally
      conn.close()

  def toggleViewMode(userId: Int, viewAsGuest: Boolean): Boolean =
    val conn = getConnection()
    try
      val stmt = conn.prepareStatement(
        """UPDATE users SET is_viewing_as_guest = ? WHERE id = ? AND role = 'admin'"""
      )
      stmt.setBoolean(1, viewAsGuest)
      stmt.setInt(2, userId)
      val updated = stmt.executeUpdate()
      stmt.close()
      updated > 0
    finally
      conn.close()

  private def parseCourse(rs: ResultSet): PartnerCourse =
    PartnerCourse(
      id = rs.getInt("id"),
      professionId = rs.getInt("profession_id"),
      title = rs.getString("title"),
      description = Option(rs.getString("description")).getOrElse(""),
      url = rs.getString("url"),
      provider = Option(rs.getString("provider")).getOrElse(""),
      createdAt = rs.getTimestamp("created_at").toInstant
    )

  def getCoursesByProfession(professionId: Int): List[PartnerCourse] =
    val conn = getConnection()
    try
      val stmt = conn.prepareStatement("SELECT * FROM partner_courses WHERE profession_id = ? ORDER BY created_at DESC")
      stmt.setInt(1, professionId)
      val rs = stmt.executeQuery()
      val courses = scala.collection.mutable.ListBuffer[PartnerCourse]()
      while rs.next() do
        courses += parseCourse(rs)
      stmt.close()
      courses.toList
    finally
      conn.close()

  def getAllCourses(): List[PartnerCourse] =
    val conn = getConnection()
    try
      val stmt = conn.createStatement()
      val rs = stmt.executeQuery("SELECT * FROM partner_courses ORDER BY created_at DESC")
      val courses = scala.collection.mutable.ListBuffer[PartnerCourse]()
      while rs.next() do
        courses += parseCourse(rs)
      stmt.close()
      courses.toList
    finally
      conn.close()

  def createCourse(professionId: Int, title: String, description: String, url: String, provider: String): Option[PartnerCourse] =
    val conn = getConnection()
    try
      val stmt = conn.prepareStatement(
        """INSERT INTO partner_courses (profession_id, title, description, url, provider)
           VALUES (?, ?, ?, ?, ?)
           RETURNING id, profession_id, title, description, url, provider, created_at"""
      )
      stmt.setInt(1, professionId)
      stmt.setString(2, title)
      stmt.setString(3, description)
      stmt.setString(4, url)
      stmt.setString(5, provider)
      val rs = stmt.executeQuery()
      val result = if rs.next() then Some(parseCourse(rs)) else None
      stmt.close()
      result
    finally
      conn.close()

  def deleteCourse(courseId: Int): Boolean =
    val conn = getConnection()
    try
      val stmt = conn.prepareStatement("DELETE FROM partner_courses WHERE id = ?")
      stmt.setInt(1, courseId)
      val deleted = stmt.executeUpdate()
      stmt.close()
      deleted > 0
    finally
      conn.close()

  private def parseNews(rs: ResultSet): News =
    News(
      id = rs.getInt("id"),
      title = rs.getString("title"),
      content = rs.getString("content"),
      authorId = rs.getInt("author_id"),
      authorName = Option(rs.getString("author_name")).getOrElse("Админ"),
      createdAt = rs.getTimestamp("created_at").toInstant
    )

  def getAllNews(): List[News] =
    val conn = getConnection()
    try
      val stmt = conn.createStatement()
      val rs = stmt.executeQuery("""
        SELECT n.*, u.name as author_name 
        FROM news n 
        LEFT JOIN users u ON n.author_id = u.id 
        ORDER BY n.created_at DESC
      """)
      val news = scala.collection.mutable.ListBuffer[News]()
      while rs.next() do
        news += parseNews(rs)
      stmt.close()
      news.toList
    finally
      conn.close()

  def createNews(title: String, content: String, authorId: Int): Option[News] =
    val conn = getConnection()
    try
      val stmt = conn.prepareStatement(
        """INSERT INTO news (title, content, author_id)
           VALUES (?, ?, ?)
           RETURNING id, title, content, author_id, created_at"""
      )
      stmt.setString(1, title)
      stmt.setString(2, content)
      stmt.setInt(3, authorId)
      val rs = stmt.executeQuery()
      val result = if rs.next() then
        val authorStmt = conn.prepareStatement("SELECT name FROM users WHERE id = ?")
        authorStmt.setInt(1, authorId)
        val authorRs = authorStmt.executeQuery()
        val authorName = if authorRs.next() then authorRs.getString("name") else "Админ"
        authorStmt.close()
        Some(News(
          id = rs.getInt("id"),
          title = rs.getString("title"),
          content = rs.getString("content"),
          authorId = rs.getInt("author_id"),
          authorName = authorName,
          createdAt = rs.getTimestamp("created_at").toInstant
        ))
      else None
      stmt.close()
      result
    finally
      conn.close()

  def deleteNews(newsId: Int): Boolean =
    val conn = getConnection()
    try
      val stmt = conn.prepareStatement("DELETE FROM news WHERE id = ?")
      stmt.setInt(1, newsId)
      val deleted = stmt.executeUpdate()
      stmt.close()
      deleted > 0
    finally
      conn.close()

  private def parseCustomTest(rs: ResultSet): CustomTest =
    CustomTest(
      id = rs.getInt("id"),
      title = rs.getString("title"),
      description = Option(rs.getString("description")).getOrElse(""),
      authorId = rs.getInt("author_id"),
      isActive = rs.getBoolean("is_active"),
      createdAt = rs.getTimestamp("created_at").toInstant
    )

  private def parseTestQuestion(rs: ResultSet): CustomTestQuestion =
    val optionsArray = Option(rs.getArray("options"))
      .map(_.getArray.asInstanceOf[Array[String]].toList)
      .getOrElse(List.empty)
    CustomTestQuestion(
      id = rs.getInt("id"),
      testId = rs.getInt("test_id"),
      text = rs.getString("text"),
      options = optionsArray,
      correctOptionIndex = rs.getInt("correct_option_index"),
      orderNum = rs.getInt("order_num")
    )

  def getAllTests(): List[CustomTest] =
    val conn = getConnection()
    try
      val stmt = conn.createStatement()
      val rs = stmt.executeQuery("SELECT * FROM custom_tests WHERE is_active = TRUE ORDER BY created_at DESC")
      val tests = scala.collection.mutable.ListBuffer[CustomTest]()
      while rs.next() do
        tests += parseCustomTest(rs)
      stmt.close()
      tests.toList
    finally
      conn.close()

  def getAllTestsAdmin(): List[CustomTest] =
    val conn = getConnection()
    try
      val stmt = conn.createStatement()
      val rs = stmt.executeQuery("SELECT * FROM custom_tests ORDER BY created_at DESC")
      val tests = scala.collection.mutable.ListBuffer[CustomTest]()
      while rs.next() do
        tests += parseCustomTest(rs)
      stmt.close()
      tests.toList
    finally
      conn.close()

  def getTestById(testId: Int): Option[CustomTest] =
    val conn = getConnection()
    try
      val stmt = conn.prepareStatement("SELECT * FROM custom_tests WHERE id = ?")
      stmt.setInt(1, testId)
      val rs = stmt.executeQuery()
      val result = if rs.next() then Some(parseCustomTest(rs)) else None
      stmt.close()
      result
    finally
      conn.close()

  def getTestQuestions(testId: Int): List[CustomTestQuestion] =
    val conn = getConnection()
    try
      val stmt = conn.prepareStatement("SELECT * FROM custom_test_questions WHERE test_id = ? ORDER BY order_num")
      stmt.setInt(1, testId)
      val rs = stmt.executeQuery()
      val questions = scala.collection.mutable.ListBuffer[CustomTestQuestion]()
      while rs.next() do
        questions += parseTestQuestion(rs)
      stmt.close()
      questions.toList
    finally
      conn.close()

  def createTest(title: String, description: String, authorId: Int, questions: List[CreateQuestionRequest]): Option[CustomTest] =
    val conn = getConnection()
    try
      conn.setAutoCommit(false)
      val testStmt = conn.prepareStatement(
        """INSERT INTO custom_tests (title, description, author_id)
           VALUES (?, ?, ?)
           RETURNING id, title, description, author_id, is_active, created_at"""
      )
      testStmt.setString(1, title)
      testStmt.setString(2, description)
      testStmt.setInt(3, authorId)
      val testRs = testStmt.executeQuery()
      
      if testRs.next() then
        val test = parseCustomTest(testRs)
        testStmt.close()
        
        questions.zipWithIndex.foreach { case (q, idx) =>
          val qStmt = conn.prepareStatement(
            """INSERT INTO custom_test_questions (test_id, text, options, correct_option_index, order_num)
               VALUES (?, ?, ?, ?, ?)"""
          )
          qStmt.setInt(1, test.id)
          qStmt.setString(2, q.text)
          qStmt.setArray(3, conn.createArrayOf("text", q.options.toArray))
          qStmt.setInt(4, q.correctOptionIndex)
          qStmt.setInt(5, idx + 1)
          qStmt.executeUpdate()
          qStmt.close()
        }
        
        conn.commit()
        Some(test)
      else
        testStmt.close()
        conn.rollback()
        None
    catch
      case e: Exception =>
        conn.rollback()
        None
    finally
      conn.setAutoCommit(true)
      conn.close()

  def deleteTest(testId: Int): Boolean =
    val conn = getConnection()
    try
      val stmt = conn.prepareStatement("DELETE FROM custom_tests WHERE id = ?")
      stmt.setInt(1, testId)
      val deleted = stmt.executeUpdate()
      stmt.close()
      deleted > 0
    finally
      conn.close()

  def toggleTestActive(testId: Int, isActive: Boolean): Boolean =
    val conn = getConnection()
    try
      val stmt = conn.prepareStatement("UPDATE custom_tests SET is_active = ? WHERE id = ?")
      stmt.setBoolean(1, isActive)
      stmt.setInt(2, testId)
      val updated = stmt.executeUpdate()
      stmt.close()
      updated > 0
    finally
      conn.close()
