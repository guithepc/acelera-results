package br.com.aceleradev.globe.resource;

import br.com.aceleradev.globe.domain.Aluno;
import br.com.aceleradev.globe.dto.AlunoAdminDTO;
import br.com.aceleradev.globe.dto.CreateAlunoRequest;
import br.com.aceleradev.globe.service.AlunoService;
import br.com.aceleradev.globe.service.AvatarService;
import br.com.aceleradev.globe.service.NicknameService;
import io.quarkus.cache.CacheInvalidateAll;
import io.quarkus.panache.common.Sort;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
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

@Path("/api/admin/alunos")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AdminAlunoResource {

    @Inject AlunoService    alunoService;
    @Inject AvatarService   avatarService;
    @Inject NicknameService nicknameService;

    @GET
    public List<AlunoAdminDTO> listAll() {
        return Aluno.<Aluno>listAll(Sort.by("createdAt").descending())
                .stream().map(this::toAdminDTO).toList();
    }

    @POST
    @CacheInvalidateAll(cacheName = "alunos-globe")
    public Response create(@Valid CreateAlunoRequest req) {
        Aluno a = alunoService.create(req);
        return Response.status(201).entity(toAdminDTO(a)).build();
    }

    @PUT
    @Path("/{id}")
    @Transactional
    @CacheInvalidateAll(cacheName = "alunos-globe")
    public Response update(@PathParam("id") UUID id, @Valid CreateAlunoRequest req) {
        Aluno a = Aluno.findById(id);
        if (a == null) throw new NotFoundException();
        a.area         = req.area;
        a.gender       = req.gender;
        a.seniority    = req.seniority;
        a.city         = req.city;
        a.state        = req.state.toUpperCase();
        a.salary       = req.salary;
        a.firstJobInIt = req.firstJobInIt;
        a.keyInsight   = req.keyInsight;
        a.stacks       = req.stacks;
        a.courseTime    = req.courseTime;
        return Response.ok(toAdminDTO(a)).build();
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    @CacheInvalidateAll(cacheName = "alunos-globe")
    public Response delete(@PathParam("id") UUID id) {
        boolean deleted = Aluno.deleteById(id);
        if (!deleted) throw new NotFoundException();
        return Response.noContent().build();
    }

    @PATCH
    @Path("/{id}/regenerate")
    @Transactional
    @CacheInvalidateAll(cacheName = "alunos-globe")
    public Response regenerate(@PathParam("id") UUID id) {
        Aluno a = Aluno.findById(id);
        if (a == null) throw new NotFoundException();
        String name = nicknameService.generate(a.gender);
        a.anonymousName = name;
        a.avatarUrl     = avatarService.generate(name, a.gender, a.area);
        return Response.ok(toAdminDTO(a)).build();
    }

    private AlunoAdminDTO toAdminDTO(Aluno a) {
        return new AlunoAdminDTO(a.id, a.anonymousName, a.avatarUrl,
                a.area, a.gender, a.seniority, a.city, a.state, a.salary,
                a.firstJobInIt, a.keyInsight, a.stacks, a.courseTime, a.lat, a.lng, a.createdAt);
    }
}
