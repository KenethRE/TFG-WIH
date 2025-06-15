from cryptography.fernet import Fernet
secrets_file = '/root/flask_key.key'

# This code is used to handle encryption and decryption of sensitive data
# Ensure the key is read correctly and strip any whitespace


def get_secrets():
    f = open(secrets_file, 'r')
    string_key = f.read().strip()
    f.close()
    if not string_key:
        raise ValueError("The key file is empty or not found.")
    fernet = Fernet(string_key.encode())
    return fernet.decrypt("gAAAABoTUsfhd-ZppGmDrpHBdKeYKiM9Q-LBneUuAi53EKGfM-dBUbuF3FtXMdIvoYWGJVos_Xr9kn9TBnmpCrriP2THfctmSzC0tCD9EoZyUloq9S6u4w=".encode()).decode()

def encrypt_data(data):
    f = open(secrets_file, 'r')
    string_key = f.read().strip()
    f.close()
    if not string_key:
        raise ValueError("The key file is empty or not found.")
    fernet = Fernet(string_key.encode())
    encrypted_data = fernet.encrypt(data.encode())
    return encrypted_data.decode()

def decrypt_data(encrypted_data):
    f = open(secrets_file, 'r')
    string_key = f.read().strip()
    f.close()
    if not string_key:
        raise ValueError("The key file is empty or not found.")
    fernet = Fernet(string_key.encode())
    decrypted_data = fernet.decrypt(encrypted_data.encode())
    return decrypted_data.decode()
