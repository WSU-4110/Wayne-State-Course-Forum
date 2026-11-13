alter table users
add column in not exists email_verfiied boolean not null default FALSE

create table if not exists email_verfication_codes{
    user id integer primary key references users(user_id) on delete cascade,
    code_hash text not null,
    expires_at TIMESPAMPTZ not null,
    attempts integer not null default 0,
    created_at TIMESPAMPTZ not null default NOW()  
}