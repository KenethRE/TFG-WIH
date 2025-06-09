from sqlite4 import SQLite4
db = SQLite4("app.db")
# create users table
db.connect()

tables = [
        """ CREATE TABLE USERS (
            UserID INTEGER PRIMARY KEY,
            SocketID TEXT,
            deviceType TEXT,
            timestamp REAL
        ); """,
        """ CREATE TABLE WEBSITES (
            WebsiteID INTEGER PRIMARY KEY AUTOINCREMENT,
            Name TEXT NOT NULL,
            URL TEXT NOT NULL
        ); """,
        """ CREATE TABLE ELEMENTS (
            ElementID INTEGER PRIMARY KEY AUTOINCREMENT,
            WebsiteID INTEGER NOT NULL,
            Name TEXT NOT NULL,
            Type TEXT NOT NULL,
            FOREIGN KEY (WebsiteID) REFERENCES WEBSITES(WebsiteID)
        ); """
        ]

for table in tables:
    db.execute(table)

#print all tables created
for table in db.execute("SELECT name FROM sqlite_master WHERE type='table';"):
    print(f"Table created: {table[0]}")