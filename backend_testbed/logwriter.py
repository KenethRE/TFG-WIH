import datetime
def write_log(data):
    with open('log.txt','a') as f:
        f.write(datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S") + " - " + data + '\n')
        f.flush()
        f.close()

if __name__ == "__main__":
    write_log("Log writer initialized.")
    # Example usage
    write_log("This is a test log entry.")
    write_log("Another log entry for testing purposes.")
    print("Log entries written to log.txt")