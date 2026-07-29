package br.com.aceleradev.globe.dto;

import br.com.aceleradev.globe.domain.StudentArea;
import br.com.aceleradev.globe.domain.StudentGender;
import br.com.aceleradev.globe.domain.StudentSeniority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class CreateStudentRequest {

    @NotNull
    public StudentArea area;

    @NotNull
    public StudentGender gender;

    public StudentSeniority seniority;

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

    public String stacks;

    public String courseTime;

    public String neighborhood;
}
