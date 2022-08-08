CREATE TABLE IF NOT EXISTS SomeThing (
    SomeId INT PRIMARY KEY NOT NULL,
    SomeText TEXT NOT NULL
);

INSERT INTO SomeThing VALUES (1, 'Some random text just for show') ON CONFLICT DO NOTHING;