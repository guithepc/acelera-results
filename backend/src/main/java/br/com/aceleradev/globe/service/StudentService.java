package br.com.aceleradev.globe.service;

import br.com.aceleradev.globe.domain.Student;
import br.com.aceleradev.globe.dto.CreateStudentRequest;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;

@ApplicationScoped
public class StudentService {

    private static final Logger LOG = Logger.getLogger(StudentService.class);

    @Inject AvatarService          avatarService;
    @Inject GeocodingService       geocodingService;
    @Inject AnonymousNameGenerator nameGenerator;

    @Transactional
    public Student create(CreateStudentRequest req) {
        LOG.infof("Starting new student registration: area=%s, city=%s, state=%s", req.area, req.city, req.state);

        String name = nameGenerator.generate();
        String avatarUrl = avatarService.generate(name, req.gender, req.area);
        GeocodingService.Coords coords = geocodingService.geocode(req.city, req.state, req.neighborhood);

        Student student = persist(req, name, avatarUrl, coords);
        LOG.infof("Student registered successfully: id=%s, name=%s", student.id, student.anonymousName);
        return student;
    }

    private Student persist(CreateStudentRequest req, String name, String avatarUrl, GeocodingService.Coords coords) {
        LOG.info("Saving student to database");
        Student student      = new Student();
        student.area         = req.area;
        student.gender       = req.gender;
        student.seniority    = req.seniority;
        student.city         = req.city;
        student.state        = req.state.toUpperCase();
        student.salary       = req.salary;
        student.firstJobInIt = req.firstJobInIt;
        student.keyInsight   = req.keyInsight;
        student.stacks       = req.stacks;
        student.courseTime   = req.courseTime;
        student.anonymousName = name;
        student.avatarUrl    = avatarUrl;
        student.lat          = coords.lat();
        student.lng          = coords.lng();
        student.persist();
        LOG.infof("Entity saved successfully: id=%s", student.id);
        return student;
    }
}
