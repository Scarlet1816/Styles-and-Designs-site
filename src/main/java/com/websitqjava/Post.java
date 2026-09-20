package com.websitqjava;

public class Post {
    public String id;
    public String title;
    public String description;
    public String category;
    public String artist;
    public int likes;
    public String image;

    public Post() {}

    public Post(String id, String title, String description, String category,
                String artist, int likes, String image) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.category = category;
        this.artist = artist;
        this.likes = likes;
        this.image = image;
    }
}
