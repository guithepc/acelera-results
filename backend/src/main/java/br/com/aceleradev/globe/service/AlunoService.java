package br.com.aceleradev.globe.service;

import br.com.aceleradev.globe.domain.Aluno;
import br.com.aceleradev.globe.dto.CreateAlunoRequest;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;

@ApplicationScoped
public class AlunoService {

    private static final Logger LOG = Logger.getLogger(AlunoService.class);

    @Inject AvatarService    avatarService;
    @Inject GeocodingService geocodingService;

    public Aluno create(CreateAlunoRequest req) {
        LOG.infof("Starting new student registration: area=%s, city=%s, state=%s", req.area, req.city, req.state);

        String name = req.anonymousName;
        String avatarUrl = avatarService.generate(name, req.gender, req.area);
        GeocodingService.Coords coords = geocodingService.geocode(req.city, req.state, req.neighborhood);

        Aluno aluno = persist(req, name, avatarUrl, coords);
        LOG.infof("Student registered successfully: id=%s, name=%s", aluno.id, aluno.anonymousName);
        return aluno;
    }

    @Transactional
    Aluno persist(CreateAlunoRequest req, String name, String avatarUrl, GeocodingService.Coords coords) {
        LOG.info("Saving student to database");
        Aluno aluno          = new Aluno();
        aluno.area           = req.area;
        aluno.gender         = req.gender;
        aluno.seniority      = req.seniority;
        aluno.city           = req.city;
        aluno.state          = req.state.toUpperCase();
        aluno.salary         = req.salary;
        aluno.firstJobInIt   = req.firstJobInIt;
        aluno.keyInsight     = req.keyInsight;
        aluno.stacks         = req.stacks;
        aluno.courseTime      = req.courseTime;
        aluno.anonymousName  = name;
        aluno.avatarUrl      = avatarUrl;
        aluno.lat            = coords.lat();
        aluno.lng            = coords.lng();
        aluno.persist();
        LOG.infof("Entity saved successfully: id=%s", aluno.id);
        return aluno;
    }
}
