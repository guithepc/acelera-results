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
    @Size(max = 100)
    public String city;

    @NotBlank
    @Size(min = 2, max = 2)
    public String state;

    @NotBlank
    @Size(max = 50)
    public String salary;

    @NotNull
    public Boolean firstJobInIt;

    @NotBlank
    @Size(max = 2000)
    public String keyInsight;

    @Size(max = 2000)
    public String stacks;

    @Size(max = 50)
    public String courseTime;

    @Size(max = 100)
    public String neighborhood;
}
