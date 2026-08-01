package br.com.aceleradev.globe;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.isA;

@QuarkusTest
class StudentResourceTest {

    @Test
    void listAllReturnsJsonArray() {
        given()
                .when().get("/api/students")
                .then()
                .statusCode(200)
                .contentType("application/json")
                .body("size()", greaterThanOrEqualTo(0));
    }

    @Test
    void statsReturnsTotalAndStates() {
        given()
                .when().get("/api/students/stats")
                .then()
                .statusCode(200)
                .body("total", isA(Integer.class))
                .body("states", isA(Integer.class));
    }

    @Test
    void findByIdWithInvalidUuidReturns400() {
        given()
                .when().get("/api/students/not-a-uuid")
                .then()
                .statusCode(400);
    }

    @Test
    void findByIdWithUnknownUuidReturns404() {
        given()
                .when().get("/api/students/" + UUID.randomUUID())
                .then()
                .statusCode(404);
    }
}
