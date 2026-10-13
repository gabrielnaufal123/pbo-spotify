CREATE DATABASE IF NOT EXISTS melodify;

USE melodify;

CREATE TABLE IF NOT EXISTS albums (
                                      id INT AUTO_INCREMENT PRIMARY KEY,
                                      title VARCHAR(150) NOT NULL,
    artist VARCHAR(150) NOT NULL,
    cover_url TEXT
    );

CREATE TABLE IF NOT EXISTS songs (
                                     id INT AUTO_INCREMENT PRIMARY KEY,
                                     album_id INT,
                                     title VARCHAR(150) NOT NULL,
    artist VARCHAR(150) NOT NULL,
    youtube_video_id VARCHAR(20) NOT NULL,
    track_number INT NOT NULL,

    FOREIGN KEY (album_id)
    REFERENCES albums(id)
    ON DELETE SET NULL
    );