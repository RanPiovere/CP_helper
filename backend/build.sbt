val scala3Version = "3.3.1"

lazy val root = project
  .in(file("."))
  .settings(
    name := "careermatch",
    version := "0.1.0",
    scalaVersion := scala3Version,
    
    libraryDependencies ++= Seq(
      "com.typesafe.akka" %% "akka-http" % "10.5.3" cross CrossVersion.for3Use2_13,
      "com.typesafe.akka" %% "akka-http-spray-json" % "10.5.3" cross CrossVersion.for3Use2_13,
      "com.typesafe.akka" %% "akka-actor-typed" % "2.8.5" cross CrossVersion.for3Use2_13,
      "com.typesafe.akka" %% "akka-stream" % "2.8.5" cross CrossVersion.for3Use2_13,
      "io.spray" %% "spray-json" % "1.3.6" cross CrossVersion.for3Use2_13,
      "org.postgresql" % "postgresql" % "42.7.1",
      "com.zaxxer" % "HikariCP" % "5.1.0",
      "ch.qos.logback" % "logback-classic" % "1.4.14",
      "com.typesafe" % "config" % "1.4.3",
      "com.github.jwt-scala" %% "jwt-core" % "10.0.1" cross CrossVersion.for3Use2_13,
      "org.mindrot" % "jbcrypt" % "0.4",
      "com.sun.mail" % "javax.mail" % "1.6.2"
    ),
    
    Compile / mainClass := Some("careermatch.Main"),
    
    assembly / assemblyJarName := "careermatch.jar",
    assembly / assemblyMergeStrategy := {
      case PathList("META-INF", xs @ _*) => MergeStrategy.discard
      case "reference.conf" => MergeStrategy.concat
      case x => MergeStrategy.first
    }
  )
