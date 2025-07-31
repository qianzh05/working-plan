// 全局状态
var workPlans = [];
var editingPlan = null;
var processes = {
    drilling: { 
        name: '钻孔', 
        enabled: false, 
        priority: 1,
        parameters: { time: 5.0, count: 3 }
    },
    assembly: { 
        name: '装配', 
        enabled: false, 
        priority: 2,
        parameters: { time: 10.0, count: 1 }
    },
    weighing: { 
        name: '称重', 
        enabled: false, 
        priority: 3,
        parameters: { weight: 2.0, count: 1 }  // 注意这里改成了weight
    },
    coding: { 
        name: '喷码', 
        enabled: false, 
        priority: 4,
        parameters: { time: 3.0, count: 1 }
    }
};

// 生成工作计划名称
function generatePlanName() {
    var enabledProcesses = Object.keys(processes)
        .filter(function(key) { return processes[key].enabled; })
        .map(function(key) { return { key: key, process: processes[key] }; })
        .sort(function(a, b) { return a.process.priority - b.process.priority; })
        .map(function(item) { return item.process.name; });
    
    return enabledProcesses.length > 0 ? enabledProcesses.join('-') : '未配置工序';
}

// 验证优先级
function validatePriorities() {
    var enabledProcesses = Object.keys(processes)
        .filter(function(key) { return processes[key].enabled; })
        .map(function(key) { return processes[key].priority; });
    
    var uniquePriorities = enabledProcesses.filter(function(value, index, self) {
        return self.indexOf(value) === index;
    });
    
    return enabledProcesses.length === uniquePriorities.length;
}

// 更新工序参数
function updateParameter(processKey, paramType, value) {
    if (!processes[processKey].parameters) {
        processes[processKey].parameters = {};
    }
    processes[processKey].parameters[paramType] = parseFloat(value) || 0;
}

// 更新UI
function updateUI() {
    // 更新预览名称
    document.getElementById('previewName').textContent = generatePlanName();
    
    // 更新错误提示
    var errorSection = document.getElementById('errorSection');
    if (!validatePriorities()) {
        document.getElementById('errorTitle').textContent = '优先级冲突';
        document.getElementById('errorMessage').textContent = '每个启用的工序必须有不同的优先级';
        errorSection.style.display = 'block';
    } else {
        errorSection.style.display = 'none';
    }

    // 更新喷码工序状态
    var codingToggle = document.getElementById('codingToggle');
    var codingNote = document.getElementById('codingNote');
    
    if (processes.assembly.enabled) {
        codingToggle.classList.remove('disabled');
        codingNote.style.display = 'none';
    } else {
        codingToggle.classList.add('disabled');
        codingToggle.classList.remove('active');
        processes.coding.enabled = false;
        hideProcessRows('coding');
        codingNote.style.display = 'inline';
    }
}

// 显示/隐藏工序参数行 - 修复版本
function showProcessRows(processKey) {
    if (processKey === 'weighing') {
        // 称重工序使用weight而不是time
        document.getElementById('weight').style.display = 'flex';
        document.getElementById('weighingCount').style.display = 'flex';
        document.getElementById('weighingPriority').style.display = 'flex';
    } else {
        // 其他工序使用time
        var timeElement = document.getElementById(processKey + 'Time');
        var countElement = document.getElementById(processKey + 'Count');
        var priorityElement = document.getElementById(processKey + 'Priority');
        
        if (timeElement) timeElement.style.display = 'flex';
        if (countElement) countElement.style.display = 'flex';
        if (priorityElement) priorityElement.style.display = 'flex';
    }
}

function hideProcessRows(processKey) {
    if (processKey === 'weighing') {
        // 称重工序使用weight而不是time
        document.getElementById('weight').style.display = 'none';
        document.getElementById('weighingCount').style.display = 'none';
        document.getElementById('weighingPriority').style.display = 'none';
    } else {
        // 其他工序使用time
        var timeElement = document.getElementById(processKey + 'Time');
        var countElement = document.getElementById(processKey + 'Count');
        var priorityElement = document.getElementById(processKey + 'Priority');
        
        if (timeElement) timeElement.style.display = 'none';
        if (countElement) countElement.style.display = 'none';
        if (priorityElement) priorityElement.style.display = 'none';
    }
}

// 切换工序状态
function toggleProcess(processKey) {
    if (processKey === 'coding' && !processes.assembly.enabled) {
        return;
    }

    // 如果是关闭装配，同时关闭喷码
    if (processKey === 'assembly' && processes.assembly.enabled) {
        processes.coding.enabled = false;
        document.getElementById('codingToggle').classList.remove('active');
        hideProcessRows('coding');
    }

    processes[processKey].enabled = !processes[processKey].enabled;
    
    // 更新切换按钮状态
    var toggle = document.getElementById(processKey + 'Toggle');
    
    if (processes[processKey].enabled) {
        toggle.classList.add('active');
        showProcessRows(processKey);
    } else {
        toggle.classList.remove('active');
        hideProcessRows(processKey);
    }

    updateUI();
}

// 更新优先级
function updatePriority(processKey, newPriority) {
    var priority = parseInt(newPriority);
    if (priority < 1 || priority > 4) return;
    
    processes[processKey].priority = priority;
    updateUI();
}

// 渲染工作计划表格
function renderTable() {
    var tbody = document.getElementById('workPlanTable');
    
    if (workPlans.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-state">暂无工作计划，点击上方按钮添加</td></tr>';
        return;
    }

    var html = '';
    for (var i = 0; i < workPlans.length; i++) {
        var plan = workPlans[i];
        var index = i + 1;
        var planNumber = 'WP-' + (index < 10 ? '00' + index : index < 100 ? '0' + index : index);
        
        html += '<tr>' +
            '<td>' + planNumber + '</td>' +
            '<td><strong>' + plan.name + '</strong></td>' +
            '<td><div class="image-placeholder">图片</div></td>' +
            '<td>' +
                '<div class="action-buttons">' +
                    '<button class="edit-btn" onclick="editPlan(' + plan.id + ')">✏️</button>' +
                    '<button class="delete-btn" onclick="deletePlan(' + plan.id + ')">🗑️</button>' +
                '</div>' +
            '</td>' +
        '</tr>';
    }
    
    tbody.innerHTML = html;
}

// 显示添加弹窗
function showAddModal() {
    editingPlan = null;
    document.getElementById('modalTitle').textContent = '新增工作计划';
    resetProcesses();
    document.getElementById('modal').classList.add('show');
}

// 编辑工作计划 - 修复版本
function editPlan(planId) {
    var plan = null;
    for (var i = 0; i < workPlans.length; i++) {
        if (workPlans[i].id === planId) {
            plan = workPlans[i];
            break;
        }
    }
    if (!plan) return;

    editingPlan = plan;
    document.getElementById('modalTitle').textContent = '编辑工作计划';
    
    // 深拷贝processes
    processes = JSON.parse(JSON.stringify(plan.processes));
    
    // 更新UI状态
    var keys = Object.keys(processes);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var toggle = document.getElementById(key + 'Toggle');
        
        if (processes[key].enabled) {
            toggle.classList.add('active');
            showProcessRows(key);
            
            // 更新参数值
            if (processes[key].parameters) {
                var priorityInput = document.querySelector('#' + key + 'Priority input');
                if (priorityInput) {
                    priorityInput.value = processes[key].priority;
                }
                
                if (key === 'weighing') {
                    // 称重工序特殊处理
                    var weightInput = document.querySelector('#weight input');
                    var countInput = document.querySelector('#weighingCount input');
                    
                    if (weightInput && processes[key].parameters.weight) {
                        weightInput.value = processes[key].parameters.weight;
                    }
                    if (countInput && processes[key].parameters.count) {
                        countInput.value = processes[key].parameters.count;
                    }
                } else {
                    // 其他工序
                    var timeInput = document.querySelector('#' + key + 'Time input');
                    var countInput = document.querySelector('#' + key + 'Count input');
                    
                    if (timeInput && processes[key].parameters.time) {
                        timeInput.value = processes[key].parameters.time;
                    }
                    if (countInput && processes[key].parameters.count) {
                        countInput.value = processes[key].parameters.count;
                    }
                }
            }
        } else {
            toggle.classList.remove('active');
            hideProcessRows(key);
        }
    }
    
    updateUI();
    document.getElementById('modal').classList.add('show');
}

// 删除工作计划
function deletePlan(planId) {
    if (confirm('确定要删除这个工作计划吗？')) {
        workPlans = workPlans.filter(function(plan) {
            return plan.id !== planId;
        });
        renderTable();
    }
}

// 保存工作计划
function savePlan() {
    if (!validatePriorities()) {
        alert('每个工序的优先级必须不同！');
        return;
    }

    var enabledProcesses = Object.keys(processes).filter(function(key) {
        return processes[key].enabled;
    });
    
    if (enabledProcesses.length === 0) {
        alert('至少需要启用一个工序！');
        return;
    }

    if (processes.coding.enabled && !processes.assembly.enabled) {
        alert('喷码工序需要装配工序启用后才能启动！');
        return;
    }

    var planName = generatePlanName();
    var newPlan = {
        id: editingPlan ? editingPlan.id : Date.now(),
        name: planName,
        processes: JSON.parse(JSON.stringify(processes))
    };

    if (editingPlan) {
        for (var i = 0; i < workPlans.length; i++) {
            if (workPlans[i].id === editingPlan.id) {
                workPlans[i] = newPlan;
                break;
            }
        }
    } else {
        workPlans.push(newPlan);
    }

    closeModal();
    renderTable();
}

// 关闭弹窗
function closeModal() {
    document.getElementById('modal').classList.remove('show');
    resetProcesses();
}

// 重置工序状态 - 修复版本
function resetProcesses() {
    processes = {
        drilling: { 
            name: '钻孔', 
            enabled: false, 
            priority: 1,
            parameters: { time: 5.0, count: 3 }
        },
        assembly: { 
            name: '装配', 
            enabled: false, 
            priority: 2,
            parameters: { time: 10.0, count: 1 }
        },
        weighing: { 
            name: '称重', 
            enabled: false, 
            priority: 3,
            parameters: { weight: 2.0, count: 1 }  // 注意这里是weight
        },
        coding: { 
            name: '喷码', 
            enabled: false, 
            priority: 4,
            parameters: { time: 3.0, count: 1 }
        }
    };

    // 重置UI
    var keys = Object.keys(processes);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var toggle = document.getElementById(key + 'Toggle');
        
        toggle.classList.remove('active');
        hideProcessRows(key);
        
        // 重置输入值
        var priorityInput = document.querySelector('#' + key + 'Priority input');
        if (priorityInput) priorityInput.value = processes[key].priority;
        
        if (key === 'weighing') {
            // 称重工序特殊处理
            var weightInput = document.querySelector('#weight input');
            var countInput = document.querySelector('#weighingCount input');
            
            if (weightInput) weightInput.value = processes[key].parameters.weight;
            if (countInput) countInput.value = processes[key].parameters.count;
        } else {
            // 其他工序
            var timeInput = document.querySelector('#' + key + 'Time input');
            var countInput = document.querySelector('#' + key + 'Count input');
            
            if (timeInput) timeInput.value = processes[key].parameters.time;
            if (countInput) countInput.value = processes[key].parameters.count;
        }
    }

    updateUI();
}

// 点击弹窗外部关闭
document.getElementById('modal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
});

// 初始化
renderTable();