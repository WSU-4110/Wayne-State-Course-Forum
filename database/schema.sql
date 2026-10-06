create table users(
user_id serial primary key,
email varchar(255) unique not null, 
password_hash varchar(255) not null,
major varchar(100),
year varchar(50),
created_at timestamp default current_timestamp
);

create table courses(
course_id serial primary key, 
subject varchar (10) not null,
course_number varchar(10) not null,
course_name varchar(255) not null,
prerequisites text, 
created__at timestamp default current_timestamp,
unique (subject, course_number)
);

create table posts(
post_id serial primary key, 
user_id integer not null, 
course_id integer not null, 
title varchar(255) not null, 
content text not null,
tag varchar(50),
created_at timestamp default current_timestamp,
updated_at timestamp default current_timestamp,
foreign key (user_id) references users(user_id),
foreign key (course_id) references courses(course_id)
);

create table comments (
comment_id serial primary key,
post_id integer not null, 
user_id integer not null,
reply_comment_id integer,
content text not null,
created_at timestamp default current_timestamp, 
updated_at timestamp default current_timestamp,
foreign key (post_id) references posts(post_id),
foreign key (user_id) references users(user_id),
foreign key (reply_comment_id) references comments(comment_id)
)