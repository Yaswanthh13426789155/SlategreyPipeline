
from flask import Flask, jsonify, request, render_template, send_from_directory
import requests
import json
import os
import platform
import logging
from urllib3.exceptions import InsecureRequestWarning

# Suppress only the single warning from urllib3 needed.
requests.packages.urllib3.disable_warnings(category=InsecureRequestWarning)

app = Flask(__name__, static_folder='static', template_folder='templates')
logging.basicConfig(level=logging.INFO)

# VMware API connection details - these should be configured by the user
VSPHERE_URL = os.environ.get('VSPHERE_URL', '')
USERNAME = os.environ.get('USERNAME', '')
PASSWORD = os.environ.get('PASSWORD', '')
SESSION_ID = None

@app.route('/')
def index():
    system_info = {
        "os": platform.system(),
        "version": platform.version(),
        "architecture": platform.machine()
    }
    return render_template('index.html', system_info=system_info)

@app.route('/api/login', methods=['POST'])
def login():
    global SESSION_ID, VSPHERE_URL, USERNAME, PASSWORD
    
    # Get credentials from request if not set in environment
    data = request.json
    if data:
        if 'url' in data and data['url']:
            VSPHERE_URL = data['url']
        if 'username' in data and data['username']:
            USERNAME = data['username']
        if 'password' in data and data['password']:
            PASSWORD = data['password']
    
    if not VSPHERE_URL or not USERNAME or not PASSWORD:
        return jsonify({"error": "Missing credentials"}), 400
        
    # Format the session URL based on the vSphere URL
    session_url = f"{VSPHERE_URL}/rest/com/vmware/cis/session"
    
    try:
        response = requests.post(session_url, auth=(USERNAME, PASSWORD), verify=False, timeout=10)
        if response.status_code == 200:
            SESSION_ID = response.json()['value']
            app.logger.info(f"Login successful for user {USERNAME}")
            return jsonify({"message": "Login successful"}), 200
        else:
            app.logger.error(f"Login failed: {response.status_code} - {response.text}")
            return jsonify({"error": f"Login failed: {response.text}"}), 401
    except Exception as e:
        app.logger.error(f"Login error: {str(e)}")
        return jsonify({"error": f"Connection error: {str(e)}"}), 500

@app.route('/api/vms', methods=['GET'])
def get_vms():
    if SESSION_ID is None:
        return jsonify({"error": "Unauthorized - Please log in first"}), 401

    headers = {
        'vmware-api-session-id': SESSION_ID,
        'Content-Type': 'application/json'
    }
    
    vm_url = f"{VSPHERE_URL}/rest/vcenter/vm"
    
    try:
        response = requests.get(vm_url, headers=headers, verify=False, timeout=15)
        if response.status_code == 200:
            vms = response.json()
            return jsonify(vms), 200
        else:
            error_msg = f"Failed to fetch VMs: {response.status_code} - {response.text}"
            app.logger.error(error_msg)
            return jsonify({"error": error_msg}), 500
    except Exception as e:
        app.logger.error(f"Error retrieving VMs: {str(e)}")
        return jsonify({"error": f"Connection error: {str(e)}"}), 500

@app.route('/api/vm/<vm_id>/power', methods=['POST'])
def power_action(vm_id):
    if SESSION_ID is None:
        return jsonify({"error": "Unauthorized - Please log in first"}), 401
        
    action = request.json.get('action', '')
    if action not in ['start', 'stop', 'reset', 'suspend']:
        return jsonify({"error": "Invalid power action"}), 400
        
    headers = {
        'vmware-api-session-id': SESSION_ID,
        'Content-Type': 'application/json'
    }
    
    power_url = f"{VSPHERE_URL}/rest/vcenter/vm/{vm_id}/power"
    
    # Map action to API endpoint
    action_map = {
        'start': 'start',
        'stop': 'stop',
        'reset': 'reset',
        'suspend': 'suspend'
    }
    
    try:
        response = requests.post(
            f"{power_url}/{action_map[action]}", 
            headers=headers, 
            verify=False, 
            timeout=15
        )
        
        if response.status_code in [200, 204]:
            return jsonify({"message": f"Power {action} action successful"}), 200
        else:
            error_msg = f"Failed to perform power action: {response.status_code} - {response.text}"
            app.logger.error(error_msg)
            return jsonify({"error": error_msg}), 500
    except Exception as e:
        app.logger.error(f"Error during power action: {str(e)}")
        return jsonify({"error": f"Connection error: {str(e)}"}), 500

@app.route('/api/system-info', methods=['GET'])
def system_info():
    info = {
        "os": platform.system(),
        "version": platform.version(),
        "architecture": platform.machine(),
        "hostname": platform.node()
    }
    return jsonify(info), 200

@app.route('/api/logout', methods=['POST'])
def logout():
    global SESSION_ID
    if SESSION_ID is None:
        return jsonify({"message": "Already logged out"}), 200
        
    headers = {
        'vmware-api-session-id': SESSION_ID,
        'Content-Type': 'application/json'
    }
    
    logout_url = f"{VSPHERE_URL}/rest/com/vmware/cis/session"
    
    try:
        response = requests.delete(logout_url, headers=headers, verify=False, timeout=10)
        SESSION_ID = None
        return jsonify({"message": "Logout successful"}), 200
    except Exception as e:
        app.logger.error(f"Logout error: {str(e)}")
        # Even if there's an error, we'll clear the session ID
        SESSION_ID = None
        return jsonify({"message": "Logged out, but with errors"}), 200

if __name__ == '__main__':
    # Use environment variable for port or default to 8080
    port = int(os.environ.get('PORT', 8080))
    # Listen on all network interfaces so it works on both local development and deployment
    app.run(host='0.0.0.0', port=port, debug=True)
