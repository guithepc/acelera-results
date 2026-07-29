package br.com.aceleradev.globe.dto;

import br.com.aceleradev.globe.domain.StudentArea;
import br.com.aceleradev.globe.domain.StudentGender;
import br.com.aceleradev.globe.domain.StudentSeniority;

import java.time.LocalDateTime;
import java.util.UUID;

public record StudentAdminDTO(
        UUID id,
        String anonymousName,
        String avatarUrl,
        StudentArea area,
        StudentGender gender,
        StudentSeniority seniority,
        String city,
        String state,
        String salary,
        Boolean firstJobInIt,
        String keyInsight,
        String stacks,
        String courseTime,
        Double lat,
        Double lng,
        LocalDateTime createdAt
) {}
