# ---- build ----
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -B -q dependency:go-offline
COPY src ./src
RUN mvn -B -q package -DskipTests

# ---- runtime ----
FROM eclipse-temurin:17-jre-jammy
WORKDIR /work
COPY --from=build /app/target/quarkus-app/lib/      /work/lib/
COPY --from=build /app/target/quarkus-app/*.jar     /work/
COPY --from=build /app/target/quarkus-app/app/      /work/app/
COPY --from=build /app/target/quarkus-app/quarkus/  /work/quarkus/
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/work/quarkus-run.jar"]
