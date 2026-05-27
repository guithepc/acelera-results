package br.com.aceleradev.globe.service;

import br.com.aceleradev.globe.domain.Aluno;
import br.com.aceleradev.globe.dto.CreateAlunoRequest;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class AlunoService {

    @Inject NicknameService  nicknameService;
    @Inject AvatarService    avatarService;
    @Inject GeocodingService geocodingService;

    public Aluno create(CreateAlunoRequest req) {
        String name = nicknameService.generate(req.gender);
        String avatarUrl = avatarService.generate(name, req.gender, req.area);
        GeocodingService.Coords coords = geocodingService.geocode(req.city, req.state);

        return persist(req, name, avatarUrl, coords);
    }

    @Transactional
    Aluno persist(CreateAlunoRequest req, String name, String avatarUrl, GeocodingService.Coords coords) {
        Aluno aluno          = new Aluno();
        aluno.area           = req.area;
        aluno.gender         = req.gender;
        aluno.city           = req.city;
        aluno.state          = req.state.toUpperCase();
        aluno.salary         = req.salary;
        aluno.firstJobInIt   = req.firstJobInIt;
        aluno.keyInsight     = req.keyInsight;
        aluno.anonymousName  = name;
        aluno.avatarUrl      = avatarUrl;
        aluno.lat            = coords.lat();
        aluno.lng            = coords.lng();
        aluno.persist();
        return aluno;
    }
}
