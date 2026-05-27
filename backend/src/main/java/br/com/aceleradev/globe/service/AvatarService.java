package br.com.aceleradev.globe.service;

import br.com.aceleradev.globe.domain.AlunoArea;
import br.com.aceleradev.globe.domain.AlunoGender;
import jakarta.enterprise.context.ApplicationScoped;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Random;

@ApplicationScoped
public class AvatarService {

    private static final List<String> HEADS = List.of(
            "afro", "buns", "cornrows", "cornrows2", "dreads", "dreads2",
            "mohawk", "mohawk2", "shortCurly", "shortFlat", "shortRound",
            "longBangs", "long", "straight01", "straight02"
    );
    private static final List<String> FACES = List.of(
            "smile", "cute", "smileLOL", "smileTeeth"
    );
    private static final List<String> ACCESSORIES = List.of(
            "glasses", "glasses2", "glasses3", "sunglasses", "none", "none"
    );

    private static final Map<AlunoArea, String> BG_COLORS = Map.of(
            AlunoArea.FRONTEND,  "b6d0fb",
            AlunoArea.BACKEND,   "9fe1cb",
            AlunoArea.FULLSTACK, "f5c4b3",
            AlunoArea.MOBILE,    "fac775",
            AlunoArea.CYBER,     "cecbf6",
            AlunoArea.DATA,      "d3d1c7",
            AlunoArea.DEVOPS,    "c0dd97"
    );

    public String generate(String anonymousName, AlunoGender gender, AlunoArea area) {
        Random rnd = new Random(anonymousName.hashCode());

        String head      = pick(HEADS, rnd);
        String face      = pick(FACES, rnd);
        String accessory = pick(ACCESSORIES, rnd);
        String bg        = BG_COLORS.get(area);

        String facialHair = "";
        if (gender == AlunoGender.MALE && rnd.nextInt(10) < 4) {
            facialHair = "&facialHair=beard,beardMustache";
        }

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
