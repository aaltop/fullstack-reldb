CREATE TABLE blogs (
  id SERIAL PRIMARY KEY,
  author text,
  url text NOT NULL,
  title text NOT NULL,
  likes integer DEFAULT 0
);


INSERT INTO blogs VALUES (author, url, title) values ("F. Herbert", "Herbert.com", "Spice of life");

INSERT INTO blogs (author, url, title) VALUES ('Blog Man', 'Bloggy.blog', 'Musings');

SELECT * FROM blogs;