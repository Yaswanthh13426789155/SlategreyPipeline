
#!/bin/bash

echo "Setting up VMware Remote Access Application..."

# Create necessary directories if they don't exist
mkdir -p vmware_remote_access/static/css
mkdir -p vmware_remote_access/static/js
mkdir -p vmware_remote_access/templates

# Move into the project directory
cd vmware_remote_access

# Install required dependencies
echo "Installing required packages..."
pip install Flask requests urllib3

# Set up environment variables (using example values)
export FLASK_APP=app.py
export FLASK_ENV=development
export PORT=8080

# Start the application
echo "Starting the VMware Remote Access application..."
echo "Access the application at: https://$REPL_SLUG.$REPL_OWNER.repl.co"
python app.py
