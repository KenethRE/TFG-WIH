import sqlite3
from logwriter import write_log

class SQLite3Wrapper:
    def __init__(self, db_file):
        self.db_file = db_file
        self.conn = None

    def connect(self):
        self.conn = sqlite3.connect(self.db_file)
        self.conn.row_factory = sqlite3.Row

    def execute(self, sql, params=None):
        with self.conn:
            cur = self.conn.cursor()
            if params:
                cur.execute(sql, params)
            else:
                cur.execute(sql)
            return cur

    def select(self, table, columns=None, condition=None):
        cols = ', '.join(columns) if columns else '*'
        sql = f"SELECT {cols} FROM {table}"
        if condition:
            sql += f" WHERE {condition}"
        cur = self.conn.cursor()
        cur.execute(sql)
        return cur.fetchall()

    def insert(self, table, data):
        keys = ', '.join(data.keys())
        placeholders = ', '.join(['?'] * len(data))
        sql = f"INSERT INTO {table} ({keys}) VALUES ({placeholders})"
        with self.conn:
            self.conn.execute(sql, tuple(data.values()))

    def delete(self, table, condition):
        sql = f"DELETE FROM {table} WHERE {condition}"
        with self.conn:
            self.conn.execute(sql)

db = SQLite3Wrapper("app.db")
db.connect()

def database_init():
    db.execute("DROP TABLE IF EXISTS USERS;")
    db.execute("DROP TABLE IF EXISTS WEBSITES;")
    db.execute("DROP TABLE IF EXISTS ELEMENTS;")
    db.execute("DROP TABLE IF EXISTS DEVICES;")
    tables = [
        """ CREATE TABLE USERS (
            Username TEXT PRIMARY KEY,
            Email TEXT,
            Password TEXT,
            isActive INTEGER DEFAULT 1
        ); """,
        """ CREATE TABLE WEBSITES (
            WebsiteID INTEGER PRIMARY KEY AUTOINCREMENT,
            Name TEXT NOT NULL,
            URL TEXT NOT NULL
        ); """,
        """ CREATE TABLE ELEMENTS (
            ElementID TEXT PRIMARY KEY,
            WebsiteID INTEGER NOT NULL,
            Name TEXT NOT NULL,
            Type TEXT NOT NULL,
            HTML TEXT,
            FOREIGN KEY (WebsiteID) REFERENCES WEBSITES(WebsiteID)
        ); """,
        """
        CREATE TABLE DEVICES (
            DeviceID TEXT PRIMARY KEY,
            Username TEXT NOT NULL,
            DeviceType TEXT NOT NULL,
            FOREIGN KEY (Username) REFERENCES USERS(Username)
        );
        """
    ]

    for table in tables:
        write_log(f"Executing SQL: {table}")
        db.execute(table)

def check_database(logfile='log.txt'):
    """
    Check if the database is initialized and create it if not.
    """
    tables = db.select("sqlite_master", columns=['name'], condition="type='table'")
    if tables:
        print("Database already initialized.")
        write_log("Database already exists")
    else:
        write_log("Database not initialized, initializing now...")
        database_init()
    return db

if __name__ == "__main__":
    check_database()
    write_log("Database check complete. You can now run your application.")