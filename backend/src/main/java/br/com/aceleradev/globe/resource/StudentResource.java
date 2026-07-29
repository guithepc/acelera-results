package br.com.aceleradev.globe.resource;

import br.com.aceleradev.globe.domain.Student;
import br.com.aceleradev.globe.dto.StudentCardDTO;
import br.com.aceleradev.globe.dto.StudentGlobeDTO;
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

@Path("/api/students")
@Produces(MediaType.APPLICATION_JSON)
public class StudentResource {

    @GET
    @CacheResult(cacheName = "students-globe")
    public List<StudentGlobeDTO> listAll() {
        return Student.<Student>listAll()
                .stream()
                .map(s -> new StudentGlobeDTO(
                        s.id, s.anonymousName, s.area.name(),
                        s.lat, s.lng, s.avatarUrl))
                .toList();
    }

    @GET
    @Path("/{id}")
    public StudentCardDTO findById(@PathParam("id") UUID id) {
        Student s = Student.findById(id);
        if (s == null) throw new NotFoundException();
        return new StudentCardDTO(
                s.id, s.anonymousName, s.avatarUrl,
                s.area.name(), s.seniority != null ? s.seniority.name() : null,
                s.city, s.state, s.salary, s.firstJobInIt, s.keyInsight, s.stacks, s.courseTime);
    }

    @GET
    @Path("/stats")
    public Map<String, Object> stats() {
        long total  = Student.count();
        long states = Student.getEntityManager()
                .createQuery("SELECT COUNT(DISTINCT s.state) FROM Student s", Long.class)
                .getSingleResult();
        return Map.of("total", total, "states", states);
    }
}
