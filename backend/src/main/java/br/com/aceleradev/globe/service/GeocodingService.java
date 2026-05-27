package br.com.aceleradev.globe.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.WebApplicationException;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Random;

@ApplicationScoped
public class GeocodingService {

    @ConfigProperty(name = "geocoding.user-agent")
    String userAgent;

    @Inject
    ObjectMapper mapper;

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    public record Coords(double lat, double lng) {}

    public Coords geocode(String city, String state) {
        String query = city + ", " + state + ", Brasil";
        String url = "https://nominatim.openstreetmap.org/search"
                + "?q=" + URLEncoder.encode(query, StandardCharsets.UTF_8)
                + "&format=json&limit=1";

        try {
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(15))
                    .header("User-Agent", userAgent)
                    .GET()
                    .build();

            HttpResponse<String> resp = http.send(req, HttpResponse.BodyHandlers.ofString());

            if (resp.statusCode() / 100 != 2) {
                throw new WebApplicationException(
                        "Falha no Nominatim: " + resp.statusCode(), 502);
            }

            JsonNode arr = mapper.readTree(resp.body());
            if (!arr.isArray() || arr.isEmpty()) {
                throw new WebApplicationException("Cidade não encontrada: " + query, 422);
            }

            JsonNode loc = arr.get(0);
            double lat = Double.parseDouble(loc.get("lat").asText());
            double lng = Double.parseDouble(loc.get("lon").asText());

            // offset aleatório de bairro: ~0.01° a 0.04° (~1km a 4km)
            Random rnd = new Random();
            double offsetLat = (rnd.nextDouble() * 0.03 + 0.01) * (rnd.nextBoolean() ? 1 : -1);
            double offsetLng = (rnd.nextDouble() * 0.03 + 0.01) * (rnd.nextBoolean() ? 1 : -1);

            return new Coords(lat + offsetLat, lng + offsetLng);

        } catch (WebApplicationException e) {
            throw e;
        } catch (Exception e) {
            throw new WebApplicationException("Erro no geocoding: " + e.getMessage(), 502);
        }
    }
}
