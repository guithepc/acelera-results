package br.com.aceleradev.globe;

import br.com.aceleradev.globe.service.GeocodingService;
import io.quarkus.test.InjectMock;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@QuarkusTest
class AdminStudentResourceTest {

    @InjectMock
    GeocodingService geocodingService;

    static final String TOKEN = "test-token";

    @BeforeEach
    void mockGeocoding() {
        when(geocodingService.geocode(anyString(), anyString(), any())).thenReturn(new GeocodingService.Coords(-23.5505, -46.6333));
    }

    private static String validBody(String city) {
        return """
                {
                  "area": "BACKEND",
                  "gender": "MALE",
                  "city": "%s",
                  "state": "SP",
                  "salary": "R$ 5.000",
                  "firstJobInIt": true,
                  "keyInsight": "Consegui minha primeira vaga em TI",
                  "stacks": "Java, Quarkus",
                  "courseTime": "6 meses"
                }
                """.formatted(city);
    }

    @Test
    void listAllWithoutTokenReturns401() {
        given()
                .when().get("/api/admin/students")
                .then()
                .statusCode(401);
    }

    @Test
    void listAllWithWrongTokenReturns401() {
        given()
                .header("X-Admin-Token", "wrong")
                .when().get("/api/admin/students")
                .then()
                .statusCode(401);
    }

    @Test
    void listAllWithTokenReturns200() {
        given()
                .header("X-Admin-Token", TOKEN)
                .when().get("/api/admin/students")
                .then()
                .statusCode(200);
    }

    @Test
    void createReturns201AndPersists() {
        String id = given()
                .header("X-Admin-Token", TOKEN)
                .contentType(ContentType.JSON)
                .body(validBody("São Paulo"))
                .when().post("/api/admin/students")
                .then()
                .statusCode(201)
                .body("anonymousName", not(org.hamcrest.Matchers.blankString()))
                .body("lat", org.hamcrest.Matchers.equalTo(-23.5505f))
                .body("lng", org.hamcrest.Matchers.equalTo(-46.6333f))
                .extract().jsonPath().getString("id");

        given()
                .when().get("/api/students/" + id)
                .then()
                .statusCode(200)
                .body("city", org.hamcrest.Matchers.equalTo("São Paulo"))
                .body("stacks", org.hamcrest.Matchers.equalTo("Java, Quarkus"));
    }

    @Test
    void createWithInvalidBodyReturns400() {
        given()
                .header("X-Admin-Token", TOKEN)
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "area": "BACKEND",
                          "gender": "MALE",
                          "city": "",
                          "state": "ABC",
                          "salary": "",
                          "firstJobInIt": true,
                          "keyInsight": ""
                        }
                        """)
                .when().post("/api/admin/students")
                .then()
                .statusCode(400);
    }

    @Test
    void updateChangesAvatarWhenAreaChangesAndKeepsStacks() {
        String id = given()
                .header("X-Admin-Token", TOKEN)
                .contentType(ContentType.JSON)
                .body(validBody("São Paulo"))
                .when().post("/api/admin/students")
                .then().statusCode(201)
                .extract().jsonPath().getString("id");

        String oldAvatar = given()
                .header("X-Admin-Token", TOKEN)
                .when().get("/api/admin/students")
                .then().statusCode(200)
                .extract().jsonPath().getString("find { it.id == '" + id + "' }.avatarUrl");

        given()
                .header("X-Admin-Token", TOKEN)
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "area": "FRONTEND",
                          "gender": "MALE",
                          "city": "São Paulo",
                          "state": "SP",
                          "salary": "R$ 5.000",
                          "firstJobInIt": true,
                          "keyInsight": "Consegui minha primeira vaga em TI",
                          "stacks": "Java, Quarkus",
                          "courseTime": "6 meses"
                        }
                        """)
                .when().put("/api/admin/students/" + id)
                .then()
                .statusCode(200)
                .body("area", org.hamcrest.Matchers.equalTo("FRONTEND"))
                .body("stacks", org.hamcrest.Matchers.equalTo("Java, Quarkus"))
                .body("avatarUrl", containsString("b6d0fb"))
                .body("avatarUrl", not(org.hamcrest.Matchers.equalTo(oldAvatar)));
    }

    @Test
    void updateWithInvalidUuidReturns400() {
        given()
                .header("X-Admin-Token", TOKEN)
                .contentType(ContentType.JSON)
                .body(validBody("São Paulo"))
                .when().put("/api/admin/students/not-a-uuid")
                .then()
                .statusCode(400);
    }

    @Test
    void deleteRemovesStudent() {
        String id = given()
                .header("X-Admin-Token", TOKEN)
                .contentType(ContentType.JSON)
                .body(validBody("Rio de Janeiro"))
                .when().post("/api/admin/students")
                .then().statusCode(201)
                .extract().jsonPath().getString("id");

        given()
                .header("X-Admin-Token", TOKEN)
                .when().delete("/api/admin/students/" + id)
                .then()
                .statusCode(204);

        given()
                .when().get("/api/students/" + id)
                .then()
                .statusCode(404);
    }

    @Test
    void regenerateReturnsNewAvatarAndName() {
        String id = given()
                .header("X-Admin-Token", TOKEN)
                .contentType(ContentType.JSON)
                .body(validBody("Belo Horizonte"))
                .when().post("/api/admin/students")
                .then().statusCode(201)
                .extract().jsonPath().getString("id");

        given()
                .header("X-Admin-Token", TOKEN)
                .when().patch("/api/admin/students/" + id + "/regenerate")
                .then()
                .statusCode(200)
                .body("anonymousName", not(org.hamcrest.Matchers.blankString()))
                .body("avatarUrl", containsString("dicebear"));
    }

    @Test
    void regenerateWithUnknownUuidReturns404() {
        given()
                .header("X-Admin-Token", TOKEN)
                .when().patch("/api/admin/students/" + UUID.randomUUID() + "/regenerate")
                .then()
                .statusCode(404);
    }
}
