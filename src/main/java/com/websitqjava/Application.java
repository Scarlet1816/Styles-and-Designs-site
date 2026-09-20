package com.websitqjava;

import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class PostController {

    private static final List<Post> POSTS = new ArrayList<>();
    private static int nextId = 1;

    static {
        seed("Artwork One", "This is the description for Artwork One.", "Traditional", "@artistone", 24,
             "https://picsum.photos/seed/art1/400/400");
        seed("Dreamscape", "A dreamy digital artwork.", "Digital", "@artisttwo", 41,
             "https://picsum.photos/seed/art2/400/400");
        seed("Character Study", "A character design study.", "Digital", "@artistthree", 17,
             "https://picsum.photos/seed/art3/400/400");
        seed("Summer", "A bright summer illustration.", "Traditional", "@artistfour", 32,
             "https://picsum.photos/seed/art4/400/400");
        seed("Nature", "Inspired by nature.", "Traditional", "@artistfive", 56,
             "https://picsum.photos/seed/art5/400/400");
        seed("Portrait", "A portrait artwork.", "Traditional", "@artistsix", 29,
             "https://picsum.photos/seed/art6/400/400");
    }

    private static synchronized void seed(String title, String description, String category,
                                          String artist, int likes, String image) {
        Post p = new Post("art" + nextId++, title, description, category, artist, likes, image);
        POSTS.add(p);
    }

    @GetMapping("/posts")
    public Map<String, Object> getPosts() {
        Map<String, Object> response = new HashMap<>();
        response.put("posts", new ArrayList<>(POSTS));
        return response;
    }

    @PostMapping("/posts")
    public Post createPost(@RequestBody Post incoming) {
        if (incoming.title == null || incoming.title.trim().isEmpty()) {
            throw new IllegalArgumentException("title is required");
        }

        Post p = new Post();
        p.id = "art" + nextId++;
        p.title = incoming.title.trim();
        p.description = incoming.description == null ? "" : incoming.description.trim();
        p.category = incoming.category == null ? "Other" : incoming.category.trim();
        p.artist = (incoming.artist == null || incoming.artist.trim().isEmpty()) ? "@you" : incoming.artist.trim();
        p.likes = 0;
        p.image = (incoming.image == null || incoming.image.trim().isEmpty())
                ? "https://picsum.photos/seed/art" + nextId + "/400/400"
                : incoming.image.trim();

        synchronized (POSTS) {
            POSTS.add(p);
        }
        return p;
    }

    @GetMapping("/test")
    public Map<String, Object> test() {
        Map<String, Object> res = new HashMap<>();
        res.put("message", "Servlet is alive");
        res.put("time", new Date().toString());
        return res;
    }
}
