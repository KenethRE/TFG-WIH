# TFG-WIH

This repository contains all code related to my work on "Web Interaction Hub Mirror" as a proposal for my final degree's project. This code is free to use and I ensure that all libraries included can be freely shared, so please feel free to fork this project if you would like to continue working on it!

# Project Structure

```
TFG-WIH/
├── .devcontainer/
│   ├── devcontainer.json         # Development container configuration
│   └── postCreate.sh             # Script executed after container creation
├── .github/
│   └── workflows/
│       └── blank.yml             # GitHub Actions pipeline configuration
├── .pytest_cache/                # pytest cache for test results
├── .wih_venv/                    # Python virtual environment
├── backend_testbed/
│   ├── custom_elements/          # Output from WIH Webpage Parser
│   ├── static/                   # Static libraries for demo rendering
│   ├── templates/
│   │   ├── base.html
│   │   ├── login.html
│   │   ├── signup.html
│   │   └── login_success.html
│   ├── tests/                    # Backend tests
│   ├── database.py               # Database connection/configuration
│   ├── encryption.py             # Encryption/decryption functions
│   ├── event_definition.json     # Supported events for Event Model
│   ├── models.py                 # Database models
│   └── myapp.py                  # Main Flask app and WebSocket server
├── conf.d/
│   └── app.conf                  # Main NGINX configuration
├── test_results/                 # pytest backend test results
├── www/
│   ├── static/                   # (Legacy) static files for reference
│   ├── v2/                       # Current static files (JS, CSS, images)
│   ├── index.html                # First demo version (legacy)
│   └── version2.html             # Current WIH Web Frontend (demo)
├── Dockerfile                    # Docker image build instructions
└── requirements.txt              # Python dependencies
```