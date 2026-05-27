package br.com.aceleradev.globe.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "aluno")
public class Aluno extends PanacheEntityBase {

    @Id
    @GeneratedValue
    public UUID id;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "area", columnDefinition = "aluno_area")
    public AlunoArea area;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "gender", columnDefinition = "aluno_gender")
    public AlunoGender gender;

    @Column(name = "city", nullable = false)
    public String city;

    @Column(name = "state", nullable = false, columnDefinition = "bpchar(2)")
    public String state;

    @Column(name = "salary")
    public String salary;

    @Column(name = "first_job_in_it", nullable = false)
    public Boolean firstJobInIt = false;

    @Column(name = "key_insight", columnDefinition = "TEXT")
    public String keyInsight;

    @Column(name = "anonymous_name", nullable = false, length = 80)
    public String anonymousName;

    @Column(name = "avatar_url", nullable = false, columnDefinition = "TEXT")
    public String avatarUrl;

    @Column(name = "lat", nullable = false, columnDefinition = "numeric")
    public Double lat;

    @Column(name = "lng", nullable = false, columnDefinition = "numeric")
    public Double lng;

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt = LocalDateTime.now();
}
