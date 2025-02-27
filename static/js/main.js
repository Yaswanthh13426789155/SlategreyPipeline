
document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const loginButton = document.getElementById('loginButton');
    const loginSection = document.getElementById('loginSection');
    const dashboard = document.getElementById('dashboard');
    const vmList = document.getElementById('vmList');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const noVmsMessage = document.getElementById('noVmsMessage');
    const userDisplay = document.getElementById('userDisplay');
    const logoutButton = document.getElementById('logoutButton');
    const refreshButton = document.getElementById('refreshButton');
    const searchVm = document.getElementById('searchVm');
    const loginMessage = document.getElementById('loginMessage');
    
    // Modal elements
    const vmModal = document.getElementById('vmModal');
    const closeModal = document.querySelector('.close-modal');
    const modalVmName = document.getElementById('modalVmName');
    const modalVmId = document.getElementById('modalVmId');
    const modalVmPowerState = document.getElementById('modalVmPowerState');
    const modalVmCpu = document.getElementById('modalVmCpu');
    const modalVmMemory = document.getElementById('modalVmMemory');
    const powerOnBtn = document.getElementById('powerOnBtn');
    const powerOffBtn = document.getElementById('powerOffBtn');
    const resetBtn = document.getElementById('resetBtn');
    const suspendBtn = document.getElementById('suspendBtn');
    const actionStatus = document.getElementById('actionStatus');
    
    // Current VM ID for modal actions
    let currentVmId = null;
    
    // Login function
    loginButton.addEventListener('click', async function() {
        const vcenterUrl = document.getElementById('vcenterUrl').value;
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        if (!vcenterUrl || !username || !password) {
            showMessage(loginMessage, 'Please fill in all fields', 'error');
            return;
        }
        
        try {
            showMessage(loginMessage, 'Connecting...', 'info');
            
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    url: vcenterUrl,
                    username: username,
                    password: password
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showMessage(loginMessage, 'Login successful! Loading VMs...', 'success');
                userDisplay.textContent = username;
                setTimeout(() => {
                    loginSection.style.display = 'none';
                    dashboard.style.display = 'flex';
                    loadVms();
                }, 1000);
            } else {
                showMessage(loginMessage, data.error || 'Login failed', 'error');
            }
        } catch (error) {
            showMessage(loginMessage, `Error: ${error.message}`, 'error');
        }
    });
    
    // Load VMs function
    async function loadVms() {
        try {
            loadingIndicator.style.display = 'flex';
            noVmsMessage.style.display = 'none';
            
            // Clear existing VM list
            const existingVmCards = document.querySelectorAll('.vm-card');
            existingVmCards.forEach(card => card.remove());
            
            const response = await fetch('/api/vms');
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to load VMs');
            }
            
            const data = await response.json();
            const vms = data.value || [];
            
            loadingIndicator.style.display = 'none';
            
            if (vms.length === 0) {
                noVmsMessage.style.display = 'block';
                return;
            }
            
            vms.forEach(vm => {
                const vmCard = createVmCard(vm);
                vmList.appendChild(vmCard);
            });
        } catch (error) {
            loadingIndicator.style.display = 'none';
            noVmsMessage.textContent = `Error: ${error.message}`;
            noVmsMessage.style.display = 'block';
        }
    }
    
    // Create VM card function
    function createVmCard(vm) {
        const vmCard = document.createElement('div');
        vmCard.className = 'vm-card';
        vmCard.setAttribute('data-vm-id', vm.vm);
        vmCard.setAttribute('data-vm-name', vm.name);
        vmCard.setAttribute('data-vm-power-state', vm.power_state);
        vmCard.setAttribute('data-vm-cpu', vm.cpu_count || 'N/A');
        vmCard.setAttribute('data-vm-memory', formatMemorySize(vm.memory_size_MiB) || 'N/A');
        
        const vmInfo = document.createElement('div');
        vmInfo.className = 'vm-info';
        
        const vmIcon = document.createElement('div');
        vmIcon.className = 'vm-icon';
        vmIcon.innerHTML = '<i class="fas fa-desktop"></i>';
        
        const vmName = document.createElement('div');
        vmName.className = 'vm-name';
        vmName.textContent = vm.name;
        
        vmInfo.appendChild(vmIcon);
        vmInfo.appendChild(vmName);
        
        const vmStatus = document.createElement('div');
        vmStatus.className = 'vm-status';
        
        const statusIndicator = document.createElement('div');
        statusIndicator.className = 'status-indicator';
        
        const statusText = document.createElement('span');
        
        // Set status based on power state
        if (vm.power_state === 'POWERED_ON') {
            statusIndicator.classList.add('status-powered-on');
            statusText.textContent = 'Powered On';
        } else if (vm.power_state === 'POWERED_OFF') {
            statusIndicator.classList.add('status-powered-off');
            statusText.textContent = 'Powered Off';
        } else if (vm.power_state === 'SUSPENDED') {
            statusIndicator.classList.add('status-suspended');
            statusText.textContent = 'Suspended';
        } else {
            statusText.textContent = vm.power_state;
        }
        
        vmStatus.appendChild(statusIndicator);
        vmStatus.appendChild(statusText);
        
        vmCard.appendChild(vmInfo);
        vmCard.appendChild(vmStatus);
        
        // Add click event to open modal
        vmCard.addEventListener('click', function() {
            openVmModal(this);
        });
        
        return vmCard;
    }
    
    // Format memory size
    function formatMemorySize(sizeInMiB) {
        if (!sizeInMiB) return 'N/A';
        
        if (sizeInMiB < 1024) {
            return `${sizeInMiB} MiB`;
        } else {
            return `${(sizeInMiB / 1024).toFixed(2)} GiB`;
        }
    }
    
    // Open VM modal
    function openVmModal(vmCard) {
        currentVmId = vmCard.getAttribute('data-vm-id');
        const vmName = vmCard.getAttribute('data-vm-name');
        const vmPowerState = vmCard.getAttribute('data-vm-power-state');
        const vmCpu = vmCard.getAttribute('data-vm-cpu');
        const vmMemory = vmCard.getAttribute('data-vm-memory');
        
        modalVmName.textContent = vmName;
        modalVmId.textContent = currentVmId;
        modalVmPowerState.textContent = vmPowerState;
        modalVmCpu.textContent = vmCpu;
        modalVmMemory.textContent = vmMemory;
        
        // Set button states based on power state
        if (vmPowerState === 'POWERED_ON') {
            powerOnBtn.disabled = true;
            powerOffBtn.disabled = false;
            resetBtn.disabled = false;
            suspendBtn.disabled = false;
        } else if (vmPowerState === 'POWERED_OFF') {
            powerOnBtn.disabled = false;
            powerOffBtn.disabled = true;
            resetBtn.disabled = true;
            suspendBtn.disabled = true;
        } else if (vmPowerState === 'SUSPENDED') {
            powerOnBtn.disabled = false;
            powerOffBtn.disabled = false;
            resetBtn.disabled = true;
            suspendBtn.disabled = true;
        }
        
        actionStatus.style.display = 'none';
        vmModal.style.display = 'block';
    }
    
    // Close modal
    closeModal.addEventListener('click', function() {
        vmModal.style.display = 'none';
        currentVmId = null;
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === vmModal) {
            vmModal.style.display = 'none';
            currentVmId = null;
        }
    });
    
    // Power actions
    powerOnBtn.addEventListener('click', function() {
        performPowerAction('start');
    });
    
    powerOffBtn.addEventListener('click', function() {
        performPowerAction('stop');
    });
    
    resetBtn.addEventListener('click', function() {
        performPowerAction('reset');
    });
    
    suspendBtn.addEventListener('click', function() {
        performPowerAction('suspend');
    });
    
    // Perform power action
    async function performPowerAction(action) {
        if (!currentVmId) return;
        
        try {
            showMessage(actionStatus, `Performing ${action} action...`, 'info');
            
            const response = await fetch(`/api/vm/${currentVmId}/power`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showMessage(actionStatus, data.message || `${action} action successful`, 'success');
                
                // Update the VM list after a power action
                setTimeout(() => {
                    loadVms();
                    vmModal.style.display = 'none';
                }, 2000);
            } else {
                showMessage(actionStatus, data.error || `${action} action failed`, 'error');
            }
        } catch (error) {
            showMessage(actionStatus, `Error: ${error.message}`, 'error');
        }
    }
    
    // Logout
    logoutButton.addEventListener('click', async function() {
        try {
            await fetch('/api/logout', {
                method: 'POST'
            });
            
            dashboard.style.display = 'none';
            loginSection.style.display = 'block';
            document.getElementById('vcenterUrl').value = '';
            document.getElementById('username').value = '';
            document.getElementById('password').value = '';
            loginMessage.style.display = 'none';
        } catch (error) {
            console.error('Logout error:', error);
            // Still redirect to login screen even if there's an error
            dashboard.style.display = 'none';
            loginSection.style.display = 'block';
        }
    });
    
    // Refresh VM list
    refreshButton.addEventListener('click', function() {
        loadVms();
    });
    
    // Search VMs
    searchVm.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const vmCards = document.querySelectorAll('.vm-card');
        
        vmCards.forEach(card => {
            const vmName = card.getAttribute('data-vm-name').toLowerCase();
            if (vmName.includes(searchTerm)) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    });
    
    // Show message utility
    function showMessage(element, message, type) {
        element.textContent = message;
        element.className = 'message';
        element.classList.add(type);
        element.style.display = 'block';
    }
});
