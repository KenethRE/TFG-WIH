from cryptography.fernet import Fernet
secrets_file = '/root/flask_key.key'
fernet = Fernet(open(secrets_file, 'r').read().strip().encode())

def get_secrets():
    return fernet.decrypt("gAAAABoTUsfhd-ZppGmDrpHBdKeYKiM9Q-LBneUuAi53EKGfM-dBUbuF3FtXMdIvoYWGJVos_Xr9kn9TBnmpCrriP2THfctmSzC0tCD9EoZyUloq9S6u4w=".encode()).decode()

def encrypt_data(data):
    encrypted_data = fernet.encrypt(data.encode())
    return encrypted_data.decode()

def decrypt_data(encrypted_data):
    decrypted_data = fernet.decrypt(encrypted_data.encode())
    return decrypted_data.decode()
