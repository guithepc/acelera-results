package br.com.aceleradev.globe.dto;

import java.util.UUID;

public record StudentGlobeDTO(
        UUID id,
        String anonymousName,
        String area,
        Double lat,
        Double lng,
        String avatarUrl
) {}
