package careermatch.db

import careermatch.models.*
import java.sql.{Connection, DriverManager, ResultSet, Timestamp}
import com.zaxxer.hikari.{HikariConfig, HikariDataSource}
import spray.json.*
import careermatch.models.JsonFormats.given
import java.net.URI
import java.time.Instant

object Database:

  // =======================
  // DataSource / HikariCP
  // =======================
  private lazy val dataSource: HikariDataSource =
    val dbUrlRaw = sys.env.getOrElse("DATABASE_URL",
      throw new IllegalArgumentException("DATABASE_URL is not set")
    )

    val uri = new URI(dbUrlRaw)
    val host = uri.getHost
    val port = if uri.getPort == -1 then 5432 else uri.getPort
    val database = uri.getPath.stripPrefix("/")
    val query = Option(uri.getQuery).map("?" + _).getOrElse("")
    val (username, password) = Option(uri.getUserInfo)
      .map(_.split(":", 2))
      .map { case Array(u, p) => (u, p) }
      .getOrElse(throw new IllegalArgumentException("DATABASE_URL must contain username and password"))

    val jdbcUrl = s"jdbc:postgresql://$host:$port/$database$query"

    val config = new HikariConfig()
    config.setJdbcUrl(jdbcUrl)
    config.setUsername(username)
    config.setPassword(password)
    config.setMaximumPoolSize(10)
    config.setMinimumIdle(2)
    config.setConnectionTimeout(30000)
    config.setDriverClassName("org.postgresql.Driver")

    new HikariDataSource(config)

  def getConnection(): Connection = dataSource.getConnection()

  private def safeClose(rs: ResultSet): Unit =
    if rs != null then try rs.close() catch case _: Throwable => ()

  // =======================
  // Initialize DB
  // =======================
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
      stmt.executeUpdate("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)")
      stmt.executeUpdate("CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id)")
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

  // =======================
  // Professions
  // =======================
  private def parseProfession(rs: ResultSet): Profession =
    val riasecJson = rs.getString("riasec_profile")
    val riasec = riasecJson.parseJson.convertTo[RiasecProfile]
    val skillsArray = Option(rs.getArray("skills")).map(_.getArray.asInstanceOf[Array[String]].toList).getOrElse(List.empty)
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

  def getAllProfessions(): List[Profession] =
    val conn = getConnection()
    try
      val stmt = conn.createStatement()
      val rs = stmt.executeQuery("SELECT * FROM professions ORDER BY id")
      val list = scala.collection.mutable.ListBuffer[Profession]()
      while rs.next() do list += parseProfession(rs)
      safeClose(rs)
      stmt.close()
      list.toList
    finally
      conn.close()

  // =======================
  // Users
  // =======================
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
      val res = if rs.next() then Some(parseUser(rs)) else None
      safeClose(rs)
      stmt.close()
      res
    finally conn.close()

  def isFirstUser()(using conn: Connection = getConnection()): Boolean =
    val stmt = conn.prepareStatement("SELECT COUNT(*) FROM users")
    val rs = stmt.executeQuery()
    rs.next()
    val count = rs.getInt(1)
    safeClose(rs)
    stmt.close()
    count == 0

  // =======================
  // Partner Courses
  // =======================
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

  def getAllCourses(): List[PartnerCourse] =
    val conn = getConnection()
    try
      val stmt = conn.createStatement()
      val rs = stmt.executeQuery("SELECT * FROM partner_courses ORDER BY created_at DESC")
      val list = scala.collection.mutable.ListBuffer[PartnerCourse]()
      while rs.next() do list += parseCourse(rs)
      safeClose(rs)
      stmt.close()
      list.toList
    finally conn.close()

  // =======================
  // News
  // =======================
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
      val list = scala.collection.mutable.ListBuffer[News]()
      while rs.next() do list += parseNews(rs)
      safeClose(rs)
      stmt.close()
      list.toList
    finally conn.close()

  // =======================
  // Custom Tests
  // =======================
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
    val optionsArray = Option(rs.getArray("options")).map(_.getArray.asInstanceOf[Array[String]].toList).getOrElse(List.empty)
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
      val list = scala.collection.mutable.ListBuffer[CustomTest]()
      while rs.next() do list += parseCustomTest(rs)
      safeClose(rs)
      stmt.close()
      list.toList
    finally conn.close()
// =======================
// Professions Seeding
// =======================
  def seedProfessions(): Unit =
    val conn = getConnection()
    try
      val stmt = conn.prepareStatement("SELECT COUNT(*) FROM professions")
      val rs = stmt.executeQuery()
      rs.next()
      if rs.getInt(1) == 0 then
        getSeedProfessions().foreach(p => insertProfession(conn, p))
      safeClose(rs)
      stmt.close()
    finally conn.close()

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

  private def getSeedProfessions(): List[Profession] =
    List(
      Profession(0, "Программист", "Разработка ПО", List("программирование","git"), RiasecProfile(40,90,30,20,30,50), 150000, 95, "удалённая", "высшее"),
      Profession(0, "Data Scientist", "Анализ данных", List("Python","SQL"), RiasecProfile(30,95,25,25,35,60), 180000, 90, "удалённая", "высшее")
      // добавь остальные по аналогии
    )

  // =======================
  // Users Management
  // =======================
  def createUser(email: String, passwordHash: String, name: String, verificationToken: String): Option[User] =
    val conn = getConnection()
    try
      val role = if isFirstUser()(using conn) then "admin" else "guest"
      val stmt = conn.prepareStatement("""
        INSERT INTO users (email, password_hash, name, role, verification_token, verification_expires)
        VALUES (?, ?, ?, ?, ?, ?)
        RETURNING id, email, password_hash, name, email_verified, google_id, role, is_viewing_as_guest, created_at
      """)
      stmt.setString(1, email.toLowerCase)
      stmt.setString(2, passwordHash)
      stmt.setString(3, name)
      stmt.setString(4, role)
      stmt.setString(5, verificationToken)
      stmt.setTimestamp(6, Timestamp.from(Instant.now.plusSeconds(86400)))
      val rs = stmt.executeQuery()
      val result = if rs.next() then Some(parseUser(rs)) else None
      safeClose(rs)
      stmt.close()
      result
    finally conn.close()

  def createGoogleUser(email: String, name: String, googleId: String): Option[User] =
    val conn = getConnection()
    try
      val role = if isFirstUser()(using conn) then "admin" else "guest"
      val stmt = conn.prepareStatement("""
        INSERT INTO users (email, name, google_id, role, email_verified)
        VALUES (?, ?, ?, ?, TRUE)
        RETURNING id, email, password_hash, name, email_verified, google_id, role, is_viewing_as_guest, created_at
      """)
      stmt.setString(1, email.toLowerCase)
      stmt.setString(2, name)
      stmt.setString(3, googleId)
      stmt.setString(4, role)
      val rs = stmt.executeQuery()
      val result = if rs.next() then Some(parseUser(rs)) else None
      safeClose(rs)
      stmt.close()
      result
    finally conn.close()

  def verifyUserEmail(token: String): Boolean =
    val conn = getConnection()
    try
      val stmt = conn.prepareStatement("""
        UPDATE users SET email_verified = TRUE, verification_token = NULL, verification_expires = NULL
        WHERE verification_token = ? AND verification_expires > CURRENT_TIMESTAMP
      """)
      stmt.setString(1, token)
      val updated = stmt.executeUpdate()
      stmt.close()
      updated > 0
    finally conn.close()

  // =======================
  // Custom Tests Management
  // =======================
  def toggleTestActive(testId: Int, isActive: Boolean): Boolean =
    val conn = getConnection()
    try
      val stmt = conn.prepareStatement("UPDATE custom_tests SET is_active = ? WHERE id = ?")
      stmt.setBoolean(1, isActive)
      stmt.setInt(2, testId)
      val updated = stmt.executeUpdate()
      stmt.close()
      updated > 0
    finally conn.close()
