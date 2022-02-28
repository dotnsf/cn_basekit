/* items.ddl */

/* items */
drop table items;
create table if not exists items ( "id" varchar(50) not null primary key, "name" varchar(50) default '', "price" int default 0, "user" varchar(50) default '', "created" bigint default 0, "updated" bigint default 0 );
