package br.com.aceleradev.globe.service;

import br.com.aceleradev.globe.domain.AlunoGender;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.WebApplicationException;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@ApplicationScoped
public class NicknameService {

    @ConfigProperty(name = "anthropic.api.key")
    String apiKey;

    @Inject
    ObjectMapper mapper;

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    public String generate(AlunoGender gender) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new WebApplicationException(
                    "ANTHROPIC_API_KEY não configurada", 500);
        }

        String genderPt = switch (gender) {
            case MALE   -> "masculino";
            case FEMALE -> "feminino";
            default     -> "neutro";
        };

        String prompt = ("""
                Gere um apelido anônimo engraçado para um dev brasileiro
                que acabou de conseguir sua primeira vaga em TI.
                Formato obrigatório: [Animal] [Adjetivo], ambos no gênero %s.
                Use animais brasileiros ou comuns.
                Exemplos masculinos: Golfinho Voador, Tamanduá Hacker,
                  Jabuti Fullstack, Capivara Deployado.
                Exemplos femininos: Borboleta Brilhante, Arara Deployada,
                  Capivara Curiosa, Jaguatirica Ágil.
                Retorne APENAS o apelido, nada mais, sem ponto final.
                """).formatted(genderPt);

        ObjectNode body = mapper.createObjectNode();
        body.put("model", "claude-haiku-4-5-20251001");
        body.put("max_tokens", 30);
        ArrayNode messages = body.putArray("messages");
        ObjectNode msg = messages.addObject();
        msg.put("role", "user");
        msg.put("content", prompt);

        try {
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.anthropic.com/v1/messages"))
                    .timeout(Duration.ofSeconds(30))
                    .header("x-api-key", apiKey)
                    .header("anthropic-version", "2023-06-01")
                    .header("content-type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(body)))
                    .build();

            HttpResponse<String> resp = http.send(req, HttpResponse.BodyHandlers.ofString());

            if (resp.statusCode() / 100 != 2) {
                throw new WebApplicationException(
                        "Falha na Claude API: " + resp.statusCode() + " " + resp.body(), 502);
            }

            JsonNode json = mapper.readTree(resp.body());
            String text = json.path("content").path(0).path("text").asText();
            return text == null ? "" : text.trim();

        } catch (WebApplicationException e) {
            throw e;
        } catch (Exception e) {
            throw new WebApplicationException("Erro ao chamar Claude API: " + e.getMessage(), 502);
        }
    }
}
