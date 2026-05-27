package br.com.aceleradev.globe.dto;

import br.com.aceleradev.globe.domain.AlunoArea;
import br.com.aceleradev.globe.domain.AlunoGender;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class CreateAlunoRequest {

    @NotNull
    public AlunoArea area;

    @NotNull
    public AlunoGender gender;

    @NotBlank
    public String city;

    @NotBlank
    @Size(min = 2, max = 2)
    public String state;

    @NotBlank
    public String salary;

    @NotNull
    public Boolean firstJobInIt;

    @NotBlank
    public String keyInsight;

    @NotBlank
    public String anonymousName;

    public String neighborhood;
}
