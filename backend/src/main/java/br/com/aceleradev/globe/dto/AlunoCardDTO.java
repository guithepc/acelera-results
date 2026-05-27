package br.com.aceleradev.globe.dto;

import java.util.UUID;

public record AlunoCardDTO(
        UUID id,
        String anonymousName,
        String avatarUrl,
        String area,
        String seniority,
        String city,
        String state,
        String salary,
        Boolean firstJobInIt,
        String keyInsight,
        String stacks
) {}
