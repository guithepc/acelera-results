CREATE TYPE aluno_area AS ENUM (
    'FRONTEND','BACKEND','FULLSTACK','MOBILE','CYBER','DATA','DEVOPS'
);
CREATE TYPE aluno_gender AS ENUM ('MALE','FEMALE','OTHER');

CREATE TABLE aluno (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anonymous_name   VARCHAR(80)   NOT NULL,
    avatar_url       TEXT          NOT NULL,
    area             aluno_area    NOT NULL,
    gender           aluno_gender  NOT NULL,
    first_job_in_it  BOOLEAN       NOT NULL DEFAULT false,
    salary           VARCHAR(50),
    city             VARCHAR(100)  NOT NULL,
    state            CHAR(2)       NOT NULL,
    lat              DECIMAL(9,6)  NOT NULL,
    lng              DECIMAL(9,6)  NOT NULL,
    key_insight      TEXT,
    created_at       TIMESTAMP     NOT NULL DEFAULT now()
);

CREATE INDEX idx_aluno_created_at ON aluno(created_at DESC);
CREATE INDEX idx_aluno_area       ON aluno(area);
CREATE INDEX idx_aluno_state      ON aluno(state);
