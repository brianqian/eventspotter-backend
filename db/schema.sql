DROP DATABASE IF EXISTS eventspotter_db;
CREATE DATABASE eventspotter_db;
USE eventspotter_db;

CREATE TABLE user_info (
  user_id VARCHAR(100) PRIMARY KEY,
  display_name VARCHAR(30) NOT NULL,
  img_URL VARCHAR(500),
  refresh_token VARCHAR(200) NOT NULL,
  access_token VARCHAR(200) NOT NULL,
  access_token_expiration VARCHAR(20) NOT NULL,
  total_songs INT
);


CREATE TABLE user_settings(
  user_id VARCHAR(100) PRIMARY KEY,
  zipcode SMALLINT,
  search_radius SMALLINT,
  show_acousticness BOOLEAN,
  show_danceability BOOLEAN,
  show_energy BOOLEAN,
  show_instrumentalness BOOLEAN,
  show_loudness BOOLEAN,
  show_tempo BOOLEAN,
  show_valence BOOLEAN,
  show_speechiness BOOLEAN,
  show_liveness BOOLEAN,
  FOREIGN KEY (user_id) REFERENCES user_info(user_id) ON DELETE CASCADE
);

CREATE TABLE library(
  song_id VARCHAR(100) PRIMARY KEY,
  title VARCHAR(100),
  artist VARCHAR(200),
  album_img TEXT,
  acousticness FLOAT(7) DEFAULT NULL,
  danceability FLOAT(7) DEFAULT NULL, 
  energy FLOAT(7) DEFAULT NULL,
  instrumentalness FLOAT(7) DEFAULT NULL,
  loudness FLOAT(7) DEFAULT NULL,
  tempo FLOAT(7) DEFAULT NULL,
  valence FLOAT(7) DEFAULT NULL,
  speechiness FLOAT(7) DEFAULT NULL,
  liveness FLOAT(7) DEFAULT NULL
  );

  CREATE TABLE UserLibrary(
  user_id VARCHAR(100),
  song_id VARCHAR(100),
  added_at VARCHAR(100),
  PRIMARY KEY (user_id, song_id),
	FOREIGN KEY (user_id) REFERENCES user_info(user_id) ON DELETE CASCADE
  )
