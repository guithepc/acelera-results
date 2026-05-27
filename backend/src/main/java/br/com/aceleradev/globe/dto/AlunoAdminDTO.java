package br.com.aceleradev.globe.dto;

import br.com.aceleradev.globe.domain.AlunoArea;
import br.com.aceleradev.globe.domain.AlunoGender;

import java.time.LocalDateTime;
import java.util.UUID;

public record AlunoAdminDTO(
        UUID id,
        String anonymousName,
        String avatarUrl,
        AlunoArea area,
        AlunoGender gender,
        String city,
        String state,
        String salary,
        Boolean firstJobInIt,
        String keyInsight,
        Double lat,
        Double lng,
        LocalDateTime createdAt
) {}
