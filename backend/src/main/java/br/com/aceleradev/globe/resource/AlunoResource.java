package br.com.aceleradev.globe.resource;

import br.com.aceleradev.globe.domain.Aluno;
import br.com.aceleradev.globe.dto.AlunoCardDTO;
import br.com.aceleradev.globe.dto.AlunoGlobeDTO;
import io.quarkus.cache.CacheResult;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Path("/api/alunos")
@Produces(MediaType.APPLICATION_JSON)
public class AlunoResource {

    @GET
    @CacheResult(cacheName = "alunos-globe")
    public List<AlunoGlobeDTO> listAll() {
        return Aluno.<Aluno>listAll()
                .stream()
                .map(a -> new AlunoGlobeDTO(
                        a.id, a.anonymousName, a.area.name(),
                        a.lat, a.lng, a.avatarUrl))
                .toList();
    }

    @GET
    @Path("/{id}")
    public AlunoCardDTO findById(@PathParam("id") UUID id) {
        Aluno a = Aluno.findById(id);
        if (a == null) throw new NotFoundException();
        return new AlunoCardDTO(
                a.id, a.anonymousName, a.avatarUrl,
                a.area.name(), a.seniority != null ? a.seniority.name() : null,
                a.city, a.state, a.salary, a.firstJobInIt, a.keyInsight, a.stacks, a.courseTime);
    }

    @GET
    @Path("/stats")
    public Map<String, Object> stats() {
        long total  = Aluno.count();
        long states = Aluno.getEntityManager()
                .createQuery("SELECT COUNT(DISTINCT a.state) FROM Aluno a", Long.class)
                .getSingleResult();
        return Map.of("total", total, "states", states);
    }
}
