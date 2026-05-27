package br.com.aceleradev.globe.dto;

import br.com.aceleradev.globe.domain.AlunoArea;
import br.com.aceleradev.globe.domain.AlunoGender;
import br.com.aceleradev.globe.domain.AlunoSeniority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class CreateAlunoRequest {

    @NotNull
    public AlunoArea area;

    @NotNull
    public AlunoGender gender;

    public AlunoSeniority seniority;

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

    public String stacks;

    public String neighborhood;
}
