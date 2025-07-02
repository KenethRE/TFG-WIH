import secrets
from flask_bcrypt import Bcrypt
from pathlib import Path
secrets_file = '/root/.flask_key.key'

# This code is used to handle encryption and decryption of sensitive data
# Ensure the key is read correctly and strip any whitespace

def get_secrets():
    SECRET_FILE_PATH = Path(secrets_file)
    try:
        with SECRET_FILE_PATH.open("r") as secret_file:
            # Read the secret key from the file
            secret = secret_file.read()
            if not secret:
                raise ValueError("Secret file is empty")
            return secret
        
    except FileNotFoundError:
        # Let's create a cryptographically secure code in that file
        with SECRET_FILE_PATH.open("w") as secret_file:
            secret = secrets.token_hex(32)
            secret_file.write(secret)
            secret_file.flush()
            secret_file.close()
            return secret
    
    except PermissionError:
        # return secret directly if permission is denied
        return secrets.token_hex(32)