Creating a fully-fledged application that supports remote access to VMware virtual machines is a complex project that cannot be encapsulated in a single response. However, I can help outline a simple example application step by step. Due to the complexity and security requirements, this will be a very basic setup, and you will need to expand and secure it for a production environment.

### Step 1: Set Up the Environment

#### Prerequisites
- **Python**: Make sure you have Python installed (preferably Python 3.x).
- **Flask**: We'll use Flask to create a simple web server.
- **VMware vSphere API**: You'll need access to a vSphere environment and the necessary credentials.
- **Frontend**: To keep it simple, we'll create a basic HTML/JavaScript interface.

```bash
pip install Flask requests
```

### Step 2: Create the Flask Backend

1. **Create a new directory for your project**.

```bash
mkdir vmware_remote_access
cd vmware_remote_access
```

2. **Create a new file called `app.py`**.

```python
from flask import Flask, jsonify, request
import requests
import json

app = Flask(__name__)

# VMware API connection details
VSPHERE_URL = 'https://your-vcenter-server/rest/com/vmware/vcenter/vm'
USERNAME = 'your-username'
PASSWORD = 'your-password'
SESSION_ID = None

@app.route('/login', methods=['POST'])
def login():
    global SESSION_ID
    url = 'https://your-vcenter-server/rest/com/vmware/cis/session'
    response = requests.post(url, auth=(USERNAME, PASSWORD), verify=False)
    if response.status_code == 200:
        SESSION_ID = response.headers.get('vmware-api-session-id')
        return jsonify({"message": "Login successful"}), 200
    else:
        return jsonify({"error": "Login failed"}), 401

@app.route('/vms', methods=['GET'])
def get_vms():
    if SESSION_ID is None:
        return jsonify({"error": "Unauthorized"}), 401

    headers = {
        'vmware-api-session-id': SESSION_ID,
        'Content-Type': 'application/json'
    }
    
    response = requests.get(VSPHERE_URL, headers=headers, verify=False)
    if response.status_code == 200:
        vms = response.json()
        return jsonify(vms), 200
    else:
        return jsonify({"error": "Failed to fetch VMs"}), 500

if __name__ == '__main__':
    app.run(debug=True)
```

### Step 3: Create a Simple Frontend

1. **Create a `static` directory for HTML/JavaScript**.

```bash
mkdir static
```

2. **Create an `index.html` file inside the `static` folder**.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VMware Remote Access</title>
</head>
<body>
    <h1>VMware Remote Access</h1>
    <button id="loginButton">Login</button>
    <h2>Virtual Machines:</h2>
    <ul id="vmList"></ul>

    <script>
        document.getElementById('loginButton').onclick = async function() {
            const response = await fetch('/login', {
                method: 'POST'
            });
            if (response.ok) {
                alert('Login successful');
                loadVMs();
            } else {
                alert('Login failed');
            }
        };

        async function loadVMs() {
            const response = await fetch('/vms');
            const vmList = document.getElementById('vmList');
            vmList.innerHTML = '';
            if (response.ok) {
                const vms = await response.json();
                vms.value.forEach(vm => {
                    const listItem = document.createElement('li');
                    listItem.textContent = vm.name;
                    vmList.appendChild(listItem);
                });
            } else {
                alert('Failed to load VMs');
            }
        }
    </script>
</body>
</html>
```

### Step 4: Run the Flask Application

1. **Make sure you have the `Flask` server running**.

```bash
python app.py
```

2. **Open the application in your web browser**.

Go to `http://127.0.0.1:5000/static/index.html`.

### Important Notes:

1. **Security**: The above code does not include any authentication or authorization mechanisms to protect your API. You should implement proper security measures before deploying this in a production environment.

2. **Error Handling**: The code is very basic and lacks comprehensive error handling. You'll want to ensure that you handle exceptions and errors gracefully.

3. **HTTPS**: For production applications, always use HTTPS to secure your connections.

4. **VMware API credentials**: Store sensitive information like passwords securely (e.g., using environment variables or a secret management tool).

5. **VM Management**: This example only fetches the list of VMs. To expand this, consider adding endpoints for starting, stopping, and connecting to VMs. This will require more complex handling of sessions and protocols like RDP or VNC.

6. **Disable SSL Verification**: The `verify=False` parameter in the requests is only for development purposes. It is recommended to handle SSL certificates properly in production.

### Further Development

After you have set up the basic application, consider expanding its functionality with the following features:

- Implement the ability to connect to a VM using RDP or VNC.
- Add the capability to start/stop/restart VMs.
- Implement user management and roles for accessing different VMs.
- Improve the frontend design for better user experience.

This guide is a starting point; building a complete solution will require deeper knowledge of the frontend and backend technologies involved!