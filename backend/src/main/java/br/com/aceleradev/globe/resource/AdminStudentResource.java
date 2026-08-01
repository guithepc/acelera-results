package br.com.aceleradev.globe.resource;

import br.com.aceleradev.globe.domain.Student;
import br.com.aceleradev.globe.dto.StudentAdminDTO;
import br.com.aceleradev.globe.dto.CreateStudentRequest;
import br.com.aceleradev.globe.service.StudentService;
import br.com.aceleradev.globe.service.AvatarService;
import br.com.aceleradev.globe.service.AnonymousNameGenerator;
import io.quarkus.cache.CacheInvalidateAll;
import io.quarkus.panache.common.Sort;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.PATCH;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;
import java.util.UUID;

@Path("/api/admin/students")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AdminStudentResource {

    @Inject StudentService         studentService;
    @Inject AvatarService          avatarService;
    @Inject AnonymousNameGenerator nameGenerator;

    @GET
    public List<StudentAdminDTO> listAll() {
        return Student.<Student>listAll(Sort.by("createdAt").descending())
                .stream().map(this::toAdminDTO).toList();
    }

    @POST
    @CacheInvalidateAll(cacheName = "students-globe")
    @CacheInvalidateAll(cacheName = "students-stats")
    public Response create(@Valid CreateStudentRequest req) {
        Student s = studentService.create(req);
        return Response.status(201).entity(toAdminDTO(s)).build();
    }

    @PUT
    @Path("/{id}")
    @Transactional
    @CacheInvalidateAll(cacheName = "students-globe")
    @CacheInvalidateAll(cacheName = "students-stats")
    public Response update(@PathParam("id") String rawId, @Valid CreateStudentRequest req) {
        Student s = Student.findById(parseUuid(rawId));
        if (s == null) throw new NotFoundException();
        if (s.area != req.area || s.gender != req.gender) {
            s.avatarUrl = avatarService.generate(s.anonymousName, req.gender, req.area);
        }
        s.area         = req.area;
        s.gender       = req.gender;
        s.seniority    = req.seniority;
        s.city         = req.city;
        s.state        = req.state.toUpperCase();
        s.salary       = req.salary;
        s.firstJobInIt = req.firstJobInIt;
        s.keyInsight   = req.keyInsight;
        s.stacks       = req.stacks;
        s.courseTime    = req.courseTime;
        return Response.ok(toAdminDTO(s)).build();
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    @CacheInvalidateAll(cacheName = "students-globe")
    @CacheInvalidateAll(cacheName = "students-stats")
    public Response delete(@PathParam("id") String rawId) {
        boolean deleted = Student.deleteById(parseUuid(rawId));
        if (!deleted) throw new NotFoundException();
        return Response.noContent().build();
    }

    @PATCH
    @Path("/{id}/regenerate")
    @Transactional
    @CacheInvalidateAll(cacheName = "students-globe")
    @CacheInvalidateAll(cacheName = "students-stats")
    public Response regenerate(@PathParam("id") String rawId) {
        Student s = Student.findById(parseUuid(rawId));
        if (s == null) throw new NotFoundException();
        String name = nameGenerator.generate();
        s.anonymousName = name;
        s.avatarUrl     = avatarService.generate(name, s.gender, s.area);
        return Response.ok(toAdminDTO(s)).build();
    }

    private static UUID parseUuid(String rawId) {
        try {
            return UUID.fromString(rawId);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid id: " + rawId);
        }
    }

    private StudentAdminDTO toAdminDTO(Student s) {
        return new StudentAdminDTO(s.id, s.anonymousName, s.avatarUrl,
                s.area, s.gender, s.seniority, s.city, s.state, s.salary,
                s.firstJobInIt, s.keyInsight, s.stacks, s.courseTime, s.lat, s.lng, s.createdAt);
    }
}
