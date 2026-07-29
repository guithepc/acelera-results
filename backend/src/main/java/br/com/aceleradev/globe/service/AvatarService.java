package br.com.aceleradev.globe.service;

import br.com.aceleradev.globe.domain.StudentArea;
import br.com.aceleradev.globe.domain.StudentGender;
import jakarta.enterprise.context.ApplicationScoped;

import org.jboss.logging.Logger;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Random;

@ApplicationScoped
public class AvatarService {

    private static final Logger LOG = Logger.getLogger(AvatarService.class);

    private static final List<String> HEADS = List.of(
            "afro", "buns", "cornrows", "cornrows2", "dreads1", "dreads2",
            "mohawk", "mohawk2", "long", "longBangs", "longCurly", "longAfro",
            "short1", "short2", "short3", "short4", "short5",
            "medium1", "medium2", "medium3", "mediumBangs", "mediumStraight",
            "flatTop", "pomp", "bun", "bun2", "twists", "twists2"
    );
    private static final List<String> FACES = List.of(
            "smile", "smileBig", "cute", "smileLOL", "cheeky",
            "calm", "lovingGrin1", "lovingGrin2", "driven", "awe"
    );
    private static final List<String> ACCESSORIES = List.of(
            "glasses", "glasses2", "glasses3", "glasses4", "glasses5",
            "sunglasses", "sunglasses2"
    );

    private static final Map<StudentArea, String> BG_COLORS = Map.ofEntries(
            Map.entry(StudentArea.FRONTEND,       "b6d0fb"),
            Map.entry(StudentArea.BACKEND,        "9fe1cb"),
            Map.entry(StudentArea.FULLSTACK,      "f5c4b3"),
            Map.entry(StudentArea.MOBILE,         "fac775"),
            Map.entry(StudentArea.CYBER,          "cecbf6"),
            Map.entry(StudentArea.DATA,           "d3d1c7"),
            Map.entry(StudentArea.DEVOPS,         "c0dd97"),
            Map.entry(StudentArea.QA,             "f9a8d4"),
            Map.entry(StudentArea.IA_AUTOMACOES,  "a7f3d0"),
            Map.entry(StudentArea.SUPORTE,        "fda4af")
    );

    public String generate(String anonymousName, StudentGender gender, StudentArea area) {
        LOG.infof("Generating avatar: name=%s, gender=%s, area=%s", anonymousName, gender, area);
        Random rnd = new Random(anonymousName.hashCode());

        String head      = pick(HEADS, rnd);
        String face      = pick(FACES, rnd);
        String accessory = pick(ACCESSORIES, rnd);
        String bg        = BG_COLORS.get(area);

        String facialHair = "";
        if (gender == StudentGender.MALE && rnd.nextInt(10) < 4) {
            facialHair = "&facialHair=full,goatee1,moustache1";
        }

        LOG.info("Avatar URL generated successfully");
        return "https://api.dicebear.com/9.x/open-peeps/svg"
                + "?seed="            + encode(anonymousName)
                + "&head="            + head
                + "&face="            + face
                + "&accessories="     + accessory
                + "&backgroundColor=" + bg
                + "&radius=50"
                + "&size=128"
                + facialHair;
    }

    private <T> T pick(List<T> list, Random rnd) {
        return list.get(rnd.nextInt(list.size()));
    }

    private String encode(String s) {
        return URLEncoder.encode(s, StandardCharsets.UTF_8);
    }
}
