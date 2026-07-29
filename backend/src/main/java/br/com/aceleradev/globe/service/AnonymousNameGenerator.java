package br.com.aceleradev.globe.service;

import br.com.aceleradev.globe.domain.Student;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@ApplicationScoped
public class AnonymousNameGenerator {

    private static final List<String> ADJECTIVES = List.of(
            "stellar", "quantum", "cyber", "turbo", "elastic",
            "neon", "stealth", "atomic", "hyper", "blazing",
            "cosmic", "crypto", "digital", "dynamic", "epic",
            "fierce", "galactic", "phantom", "rapid", "shadow",
            "sonic", "swift", "thunder", "ultra", "vivid",
            "wild", "zero", "omega", "nova", "delta",
            "brave", "crimson", "frozen", "iron", "silent"
    );

    private static final List<String> NOUNS = List.of(
            "falcon", "phoenix", "mantis", "nebula", "forge",
            "vortex", "spark", "pulse", "storm", "blade",
            "circuit", "comet", "dragon", "eagle", "flame",
            "hawk", "jaguar", "knight", "lynx", "matrix",
            "nexus", "orbit", "panther", "raven", "shield",
            "tiger", "vertex", "wolf", "zenith", "bolt",
            "crow", "fox", "serpent", "titan", "wraith"
    );

    public String generate() {
        for (int i = 0; i < 100; i++) {
            ThreadLocalRandom rnd = ThreadLocalRandom.current();
            String name = ADJECTIVES.get(rnd.nextInt(ADJECTIVES.size()))
                    + "-" + NOUNS.get(rnd.nextInt(NOUNS.size()));

            if (Student.find("anonymousName", name).firstResult() == null) {
                return name;
            }
        }
        return ADJECTIVES.get(0) + "-" + NOUNS.get(0) + "-" + System.currentTimeMillis();
    }
}
