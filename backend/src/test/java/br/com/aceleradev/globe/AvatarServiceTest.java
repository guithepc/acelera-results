package br.com.aceleradev.globe;

import br.com.aceleradev.globe.domain.StudentArea;
import br.com.aceleradev.globe.domain.StudentGender;
import br.com.aceleradev.globe.service.AvatarService;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AvatarServiceTest {

    private final AvatarService service = new AvatarService();

    @Test
    void generateIsDeterministicForSameInput() {
        String a = service.generate("stellar-falcon", StudentGender.MALE, StudentArea.BACKEND);
        String b = service.generate("stellar-falcon", StudentGender.MALE, StudentArea.BACKEND);
        assertEquals(a, b);
    }

    @Test
    void generateChangesBackgroundByArea() {
        String backend = service.generate("stellar-falcon", StudentGender.MALE, StudentArea.BACKEND);
        String frontend = service.generate("stellar-falcon", StudentGender.MALE, StudentArea.FRONTEND);
        assertTrue(backend.contains("backgroundColor=9fe1cb"));
        assertTrue(frontend.contains("backgroundColor=b6d0fb"));
    }

    @Test
    void generateEncodesSpecialCharactersInName() {
        String url = service.generate("a b<c>", StudentGender.FEMALE, StudentArea.DATA);
        assertTrue(url.contains("a+b%3Cc%3E") || url.contains("seed="));
    }
}
