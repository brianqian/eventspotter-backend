# Eventspotter-backend

This is the backend API supporting my frontend for Eventspotter: [Code](https://github.com/brianqian/eventspotter-react) // [Deployment](https://eventspotter.herokuapp.com).

Because the frontend uses Next.js, API routing is new and only select middleware is supported their framework. I separated the two projects into a frontend and backend project.

# Tables

Currently there are 3 tables in use, user_info, library, and UserLibrary. The library is a unique collection of all the songs users have collectively added and UserLibrary is a mapping table recording each user's song library. Because Spotify is a rate limited API and each request for songs is limited to 50 songs per request, the database prevents the Spotify limit from being reached for better scalability.

```SQL
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
  added_at VARCHAR(100),
  PRIMARY KEY (user_id, song_id),
  FOREIGN KEY (user_id) REFERENCES user_info(user_id)
  ON DELETE CASCADE
  )
```
