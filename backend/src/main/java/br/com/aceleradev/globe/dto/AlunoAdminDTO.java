package br.com.aceleradev.globe.dto;

import br.com.aceleradev.globe.domain.AlunoArea;
import br.com.aceleradev.globe.domain.AlunoGender;
import br.com.aceleradev.globe.domain.AlunoSeniority;

import java.time.LocalDateTime;
import java.util.UUID;

public record AlunoAdminDTO(
        UUID id,
        String anonymousName,
        String avatarUrl,
        AlunoArea area,
        AlunoGender gender,
        AlunoSeniority seniority,
        String city,
        String state,
        String salary,
        Boolean firstJobInIt,
        String keyInsight,
        String stacks,
        Double lat,
        Double lng,
        LocalDateTime createdAt
) {}
