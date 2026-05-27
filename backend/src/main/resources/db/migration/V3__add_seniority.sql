CREATE TYPE aluno_seniority AS ENUM ('TRAINEE','ESTAGIO','JUNIOR','PLENO','SENIOR','ASSISTENTE');

ALTER TABLE aluno ADD COLUMN seniority aluno_seniority;
