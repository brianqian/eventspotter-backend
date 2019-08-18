DROP DATABASE IF EXISTS eventspotter_db;
CREATE DATABASE eventspotter_db;
USE eventspotter_db;


CREATE TABLE user_info (
  user_id VARCHAR(100),
  display_name VARCHAR(30) NOT NULL,
  img_URL VARCHAR(500),
  refresh_token CHAR(200) NOT NULL,
  access_token CHAR(200) NOT NULL,
  access_token_expiration VARCHAR(20) NOT NULL,
    total_songs INTEGER(100),
  PRIMARY KEY (user_id)
);


CREATE TABLE user_settings(
  id INTEGER NOT NULL AUTO_INCREMENT,
  user_id VARCHAR (100),
  zipcode INTEGER (10),
  search_radius INTEGER (10),
  show_acousticness BOOLEAN,
  show_danceability BOOLEAN,
  show_energy BOOLEAN,
  show_instrumentalness BOOLEAN,
  show_loudness BOOLEAN,
  show_tempo BOOLEAN,
  show_valence BOOLEAN,
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES user_info(user_id) ON DELETE CASCADE
);

CREATE TABLE library(
  song_id VARCHAR(100),
  title VARCHAR(100),
  artist VARCHAR(200),
  acousticness FLOAT(7) DEFAULT NULL,
  danceability FLOAT(7) DEFAULT NULL,
  energy FLOAT(7) DEFAULT NULL,
  instrumentalness FLOAT(7) DEFAULT NULL,
  loudness FLOAT(7) DEFAULT NULL,
  tempo FLOAT(7) DEFAULT NULL,
  valence FLOAT(7) DEFAULT NULL,
  PRIMARY KEY (song_id)
  
  );

  CREATE TABLE UserLibrary(
    user_id VARCHAR(100),
    song_id VARCHAR(100),
    date_added VARCHAR(100),
    PRIMARY KEY (user_id, song_id),
	FOREIGN KEY (user_id) REFERENCES user_info(user_id) ON DELETE CASCADE
  )
