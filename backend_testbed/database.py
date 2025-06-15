from sqlite4 import SQLite4
from logwriter import write_log

db = SQLite4("app.db")
db.connect()

def check_database(logfile='log.txt'):
    """
    Check if the database is initialized and create it if not.
    """
    if not db.select("USERS"):
        write_log("Database not initialized, initializing now...")
        database_init()
    else:
        write_log("Database already initialized.")
    return db

def database_init():
# Drop existing tables if they exist
    db.execute("DROP TABLE IF EXISTS USERS;")
    db.execute("DROP TABLE IF EXISTS WEBSITES;")
    db.execute("DROP TABLE IF EXISTS ELEMENTS;")
# Create new tables
    tables = [
            """ CREATE TABLE USERS (
                Username TEXT PRIMARY KEY,
                Email TEXT,
                Password TEXT,
                isActive INTEGER DEFAULT 1,
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
            ); """,
            """
            CREATE TABLE DEVICES (
                DeviceID INTEGER PRIMARY KEY AUTOINCREMENT,
                Username TEXT NOT NULL,
                DeviceType TEXT NOT NULL,
                FOREIGN KEY (Username) REFERENCES USERS(Username)
            );
            """
    ]

    for table in tables:
        db.execute(table)

if __name__ == "__main__":
    check_database()
    write_log("Database check complete. You can now run your application.")