// TennisBalance v13.1 - Application Logic
class TennisBalance {
    constructor() {
        this.HOURLY_RATE = 546; // руб/час
        this.participants = [];
        this.subscriptionBudget = 0;
        this.history = [];
        this.currentHistoryFilter = 'all';
        
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.updateUI();
    }

    // Event Listeners Setup
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Main page buttons
        document.getElementById('record-session-btn').addEventListener('click', () => {
            this.openModal('record-session-modal');
        });
        
        document.getElementById('add-contribution-btn').addEventListener('click', () => {
            this.openModal('add-contribution-modal');
        });
        
        document.getElementById('buy-subscription-btn').addEventListener('click', () => {
            this.openModal('buy-subscription-modal');
        });

        // Settings buttons
        document.getElementById('add-participant-btn').addEventListener('click', () => {
            this.addParticipant();
        });
        
        document.getElementById('update-rate-btn').addEventListener('click', () => {
            this.updateHourlyRate();
        });
        
        document.getElementById('add-demo-data-btn').addEventListener('click', () => {
            this.addDemoData();
        });
        
        document.getElementById('export-data-btn').addEventListener('click', () => {
            this.exportData();
        });
        
        document.getElementById('import-data-btn').addEventListener('click', () => {
            document.getElementById('import-file').click();
        });
        
        document.getElementById('import-file').addEventListener('change', (e) => {
            this.importData(e.target.files[0]);
        });
        
        document.getElementById('clear-data-btn').addEventListener('click', () => {
            if (confirm('Вы уверены, что хотите очистить все данные?')) {
                this.clearData();
            }
        });

        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.closeModal(e.target.dataset.modal);
            });
        });

        // Modal background click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });

        // Forms
        document.getElementById('record-session-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.recordSession();
        });
        
        document.getElementById('add-contribution-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addContribution();
        });
        
        document.getElementById('buy-subscription-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.buySubscription();
        });

        // History filter
        document.getElementById('history-filter').addEventListener('change', (e) => {
            this.currentHistoryFilter = e.target.value;
            this.updateHistoryDisplay();
        });

        // Enter key for participant input
        document.getElementById('new-participant').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addParticipant();
            }
        });
    }

    // Data Management
    loadData() {
        try {
            const data = localStorage.getItem('tennisBalance');
            if (data) {
                const parsed = JSON.parse(data);
                this.participants = parsed.participants || [];
                this.subscriptionBudget = parsed.subscriptionBudget || 0;
                this.history = parsed.history || [];
                this.HOURLY_RATE = parsed.hourlyRate || 546;
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    saveData() {
        try {
            const data = {
                participants: this.participants,
                subscriptionBudget: this.subscriptionBudget,
                history: this.history,
                hourlyRate: this.HOURLY_RATE
            };
            localStorage.setItem('tennisBalance', JSON.stringify(data));
        } catch (error) {
            console.error('Error saving data:', error);
        }
    }

    // UI Updates
    updateUI() {
        this.updateBudgetDisplay();
        this.updateParticipantsDisplay();
        this.updateSettingsParticipants();
        this.updateModalParticipants();
        this.updateHistoryDisplay();
        this.updateHourlyRateDisplay();
    }

    updateHourlyRateDisplay() {
        document.getElementById('current-rate').textContent = this.HOURLY_RATE;
        document.getElementById('hourly-rate').placeholder = `Текущая ставка: ${this.HOURLY_RATE} руб/час`;
    }

    updateBudgetDisplay() {
        const hours = Math.floor(this.subscriptionBudget / this.HOURLY_RATE * 10) / 10;
        document.getElementById('budget-hours').textContent = hours.toFixed(1);
        document.getElementById('budget-rubles').textContent = this.subscriptionBudget.toLocaleString('ru-RU');
    }

    updateParticipantsDisplay() {
        const container = document.getElementById('participants-list');
        
        if (!this.participants || this.participants.length === 0) {
            container.innerHTML = '<div class="no-participants">Участники не добавлены</div>';
            return;
        }

        container.innerHTML = this.participants.map(participant => {
            const balanceClass = participant.balance >= 0 ? 'positive' : 'negative';
            return `
                <div class="participant-card">
                    <div class="participant-name">${participant.name}</div>
                    <div class="participant-balance ${balanceClass}">
                        ${participant.balance >= 0 ? '+' : ''}${participant.balance.toLocaleString('ru-RU')} ₽
                    </div>
                </div>
            `;
        }).join('');
    }

    updateSettingsParticipants() {
        const container = document.getElementById('participants-settings-list');
        if (!this.participants || this.participants.length === 0) {
            container.innerHTML = '<li class="participant-item">Участники не добавлены</li>';
            return;
        }
        
        container.innerHTML = this.participants.map((participant, index) => `
            <li class="participant-item">
                <span>${participant.name} (${participant.balance >= 0 ? '+' : ''}${participant.balance.toLocaleString('ru-RU')} ₽)</span>
                <button class="participant-remove" onclick="app.removeParticipant(${index})">Удалить</button>
            </li>
        `).join('');
    }

    updateModalParticipants() {
        if (!this.participants || this.participants.length === 0) {
            // Clear all modal participant selections
            document.getElementById('session-participants').innerHTML = '<p>Сначала добавьте участников</p>';
            
            const selects = [
                document.getElementById('contribution-from'),
                document.getElementById('contribution-to'),
                document.getElementById('subscription-buyer')
            ];
            
            selects.forEach(select => {
                select.innerHTML = '<option value="">Участники не добавлены</option>';
            });
            return;
        }

        // Session participants (checkboxes)
        const sessionContainer = document.getElementById('session-participants');
        sessionContainer.innerHTML = this.participants.map((participant, index) => `
            <div class="checkbox-item">
                <input type="checkbox" id="session-participant-${index}" value="${index}">
                <label for="session-participant-${index}">${participant.name}</label>
            </div>
        `).join('');

        // Contribution and subscription selects
        const contributionFromSelect = document.getElementById('contribution-from');
        const contributionToSelect = document.getElementById('contribution-to');
        const subscriptionBuyerSelect = document.getElementById('subscription-buyer');

        const options = this.participants.map((participant, index) => 
            `<option value="${index}">${participant.name}</option>`
        ).join('');

        [contributionFromSelect, contributionToSelect, subscriptionBuyerSelect].forEach(select => {
            const currentValue = select.value;
            select.innerHTML = '<option value="">Выберите участника</option>' + options;
            if (currentValue && currentValue !== "") select.value = currentValue;
        });
    }

    updateHistoryDisplay() {
        const container = document.getElementById('history-list');
        
        let filteredHistory = this.history;
        if (this.currentHistoryFilter !== 'all') {
            filteredHistory = this.history.filter(item => item.type === this.currentHistoryFilter);
        }

        if (filteredHistory.length === 0) {
            container.innerHTML = '<div class="no-history">История пуста</div>';
            return;
        }

        container.innerHTML = filteredHistory.map(item => {
            const date = new Date(item.date).toLocaleString('ru-RU');
            const typeText = {
                'session': 'Сессия',
                'contribution': 'Взнос',
                'subscription': 'Абонемент'
            }[item.type];

            return `
                <div class="history-item">
                    <div class="history-actions">
                        <button class="history-delete" onclick="app.deleteHistoryItem(${item.id})">Удалить</button>
                    </div>
                    <div class="history-header">
                        <span class="history-type ${item.type}">${typeText}</span>
                        <span class="history-date">${date}</span>
                    </div>
                    <div class="history-details">
                        ${item.description || this.getDefaultDescription(item)}
                    </div>
                </div>
            `;
        }).join('');
    }

    getDefaultDescription(item) {
        switch (item.type) {
            case 'session':
                return `Участники: ${item.participants.join(', ')}. Сумма: ${item.amount.toLocaleString('ru-RU')} ₽`;
            case 'contribution':
                return `От ${item.from} к ${item.to}. Сумма: ${item.amount.toLocaleString('ru-RU')} ₽`;
            case 'subscription':
                return `Покупатель: ${item.participants[0]}. Сумма: ${item.amount.toLocaleString('ru-RU')} ₽`;
            default:
                return '';
        }
    }

    // Navigation
    switchTab(tabName) {
        // Update nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.toggle('active', tab.id === `${tabName}-tab`);
        });
    }

    // Modal Management
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
            this.updateModalParticipants();
            
            // Set default value for subscription amount when opening buy-subscription modal
            if (modalId === 'buy-subscription-modal') {
                const subscriptionAmountField = document.getElementById('subscription-amount');
                const defaultAmount = 15 * this.HOURLY_RATE;
                subscriptionAmountField.value = defaultAmount;
            }
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            // Reset forms
            const form = modal.querySelector('form');
            if (form) form.reset();
        }
    }

    // Participant Management
    addParticipant() {
        const input = document.getElementById('new-participant');
        const name = input.value.trim();
        
        if (!name) {
            alert('Введите имя участника');
            return;
        }

        if (this.participants.some(p => p.name === name)) {
            alert('Участник с таким именем уже существует');
            return;
        }

        this.participants.push({ name, balance: 0 });
        input.value = '';
        this.saveData();
        this.updateUI();
    }

    removeParticipant(index) {
        if (confirm(`Удалить участника ${this.participants[index].name}?`)) {
            this.participants.splice(index, 1);
            this.saveData();
            this.updateUI();
        }
    }

    // Settings Management
    updateHourlyRate() {
        const input = document.getElementById('hourly-rate');
        const newRate = parseFloat(input.value);
        
        if (!newRate || newRate <= 0) {
            alert('Введите корректную ставку (больше 0)');
            return;
        }

        this.HOURLY_RATE = newRate;
        input.value = '';
        this.saveData();
        this.updateUI();
        alert(`Ставка обновлена: ${newRate} руб/час`);
    }

    // Actions
    recordSession() {
        const selectedParticipants = Array.from(document.querySelectorAll('#session-participants input:checked'))
            .map(checkbox => parseInt(checkbox.value));
        const duration = parseFloat(document.getElementById('session-duration').value);
        const description = document.getElementById('session-description').value.trim();

        if (selectedParticipants.length === 0) {
            alert('Выберите участников сессии');
            return;
        }

        const totalCost = duration * this.HOURLY_RATE;
        const costPerParticipant = Math.round(totalCost / selectedParticipants.length);

        // Check if enough budget
        if (this.subscriptionBudget < totalCost) {
            alert('Недостаточно средств в бюджете абонемента');
            return;
        }

        // Deduct from participants
        selectedParticipants.forEach(index => {
            this.participants[index].balance -= costPerParticipant;
        });

        // Deduct from subscription budget
        this.subscriptionBudget -= totalCost;

        // Add to history
        this.history.push({
            id: Date.now(),
            type: 'session',
            date: new Date().toISOString(),
            participants: selectedParticipants.map(index => this.participants[index].name),
            participantIndices: selectedParticipants,
            amount: totalCost,
            costPerParticipant: costPerParticipant,
            description: description || `Сессия ${duration} ч.`
        });

        this.saveData();
        this.updateUI();
        this.closeModal('record-session-modal');
        alert(`Сессия записана. Списано ${totalCost.toLocaleString('ru-RU')} ₽`);
    }

    addContribution() {
        const fromIndex = parseInt(document.getElementById('contribution-from').value);
        const toIndex = parseInt(document.getElementById('contribution-to').value);
        const amount = parseFloat(document.getElementById('contribution-amount').value); // Changed from parseInt to parseFloat
        const description = document.getElementById('contribution-description').value.trim();

        if (isNaN(fromIndex) || isNaN(toIndex)) {
            alert('Выберите участников');
            return;
        }

        if (fromIndex === toIndex) {
            alert('Нельзя внести взнос самому себе');
            return;
        }

        if (isNaN(amount) || amount <= 0) {
            alert('Введите корректную сумму взноса');
            return;
        }

        // Update balances
        this.participants[fromIndex].balance += amount;
        this.participants[toIndex].balance -= amount;

        // Add to history
        this.history.push({
            id: Date.now(),
            type: 'contribution',
            date: new Date().toISOString(),
            from: this.participants[fromIndex].name,
            to: this.participants[toIndex].name,
            fromIndex: fromIndex,
            toIndex: toIndex,
            amount: amount,
            description: description || `Взнос ${amount.toLocaleString('ru-RU')} ₽`
        });

        this.saveData();
        this.updateUI();
        this.closeModal('add-contribution-modal');
        alert(`Взнос записан: ${amount.toLocaleString('ru-RU')} ₽`);
    }

    buySubscription() {
        const buyerIndex = parseInt(document.getElementById('subscription-buyer').value);
        const amount = parseFloat(document.getElementById('subscription-amount').value); // Changed from parseInt to parseFloat
        const description = document.getElementById('subscription-description').value.trim();

        if (isNaN(buyerIndex)) {
            alert('Выберите покупателя');
            return;
        }

        if (isNaN(amount) || amount <= 0) {
            alert('Введите корректную сумму абонемента');
            return;
        }

        // Update buyer balance and subscription budget
        this.participants[buyerIndex].balance += amount;
        this.subscriptionBudget += amount;

        // Add to history
        this.history.push({
            id: Date.now(),
            type: 'subscription',
            date: new Date().toISOString(),
            participants: [this.participants[buyerIndex].name],
            buyerIndex: buyerIndex,
            amount: amount,
            description: description || `Покупка абонемента ${amount.toLocaleString('ru-RU')} ₽`
        });

        this.saveData();
        this.updateUI();
        this.closeModal('buy-subscription-modal');
        alert(`Абонемент куплен: ${amount.toLocaleString('ru-RU')} ₽`);
    }

    // History Management
    deleteHistoryItem(itemId) {
        const item = this.history.find(h => h.id === itemId);
        if (!item) return;

        if (!confirm('Удалить эту запись из истории? Операция будет отменена.')) {
            return;
        }

        // Reverse the operation
        switch (item.type) {
            case 'session':
                // Return money to participants and budget
                if (item.participantIndices && item.costPerParticipant) {
                    item.participantIndices.forEach(index => {
                        if (this.participants[index]) {
                            this.participants[index].balance += item.costPerParticipant;
                        }
                    });
                }
                this.subscriptionBudget += item.amount;
                break;

            case 'contribution':
                // Reverse the contribution
                if (typeof item.fromIndex !== 'undefined' && typeof item.toIndex !== 'undefined') {
                    if (this.participants[item.fromIndex]) {
                        this.participants[item.fromIndex].balance -= item.amount;
                    }
                    if (this.participants[item.toIndex]) {
                        this.participants[item.toIndex].balance += item.amount;
                    }
                }
                break;

            case 'subscription':
                // Reverse the subscription purchase
                if (typeof item.buyerIndex !== 'undefined') {
                    if (this.participants[item.buyerIndex]) {
                        this.participants[item.buyerIndex].balance -= item.amount;
                    }
                }
                this.subscriptionBudget -= item.amount;
                break;
        }

        // Remove from history
        this.history = this.history.filter(h => h.id !== itemId);

        this.saveData();
        this.updateUI();
        alert('Запись удалена, операция отменена');
    }

    // Data Management
    addDemoData() {
        if (confirm('Добавить демо-данные? Это добавит участников и пример истории.')) {
            // Add demo participants - ensure they are properly structured
            const demoParticipants = [
                { name: "Григорий", balance: 2500 },
                { name: "Кирилл", balance: -800 },
                { name: "Егор", balance: 1200 },
                { name: "Руслан", balance: -300 },
                { name: "Полина", balance: 900 }
            ];

            // Replace participants array completely
            this.participants = [...demoParticipants];

            // Set demo subscription budget
            this.subscriptionBudget = 10000;

            // Add demo history
            this.history.push({
                id: Date.now(),
                type: 'subscription',
                date: new Date().toISOString(),
                participants: ['Григорий'],
                buyerIndex: 0,
                amount: 10000,
                description: 'Покупка абонемента (демо-данные)'
            });

            // Save and update immediately
            this.saveData();
            this.updateUI();
            
            // Switch to main tab to show the results
            this.switchTab('main');
            
            alert('Демо-данные добавлены! Переключитесь на главную страницу для просмотра.');
        }
    }

    exportData() {
        try {
            const data = {
                participants: this.participants,
                subscriptionBudget: this.subscriptionBudget,
                history: this.history,
                hourlyRate: this.HOURLY_RATE,
                exportDate: new Date().toISOString()
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `tennis-balance-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            alert('Ошибка экспорта данных');
            console.error(error);
        }
    }

    importData(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.participants && Array.isArray(data.participants)) {
                    this.participants = data.participants;
                }
                if (typeof data.subscriptionBudget === 'number') {
                    this.subscriptionBudget = data.subscriptionBudget;
                }
                if (data.history && Array.isArray(data.history)) {
                    this.history = data.history;
                }
                if (typeof data.hourlyRate === 'number') {
                    this.HOURLY_RATE = data.hourlyRate;
                }

                this.saveData();
                this.updateUI();
                alert('Данные импортированы успешно');
            } catch (error) {
                alert('Ошибка импорта данных. Проверьте формат файла.');
                console.error(error);
            }
        };
        reader.readAsText(file);
    }

    clearData() {
        this.participants = [];
        this.subscriptionBudget = 0;
        this.history = [];
        this.HOURLY_RATE = 546;
        this.saveData();
        this.updateUI();
        alert('Данные очищены');
    }

// Функции синхронизации с облаком
    async syncUploadToCloud() {
        try {
            const dataToSync = {
                participants: this.participants,
                subscriptionBudget: this.subscriptionBudget,
                history: this.history,
                hourlyRate: this.HOURLY_RATE,
                version: '13.1'
            };
    
            this.showSyncStatus('Сохранение в облако...', 'loading');
    
            const response = await fetch('/api/sync-upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSync)
            });
    
            const result = await response.json();
    
            if (response.ok && result.success) {
                this.showSyncStatus(`Данные сохранены в облако (${new Date(result.lastSync).toLocaleString('ru-RU')})`, 'success');
                return result;
            } else {
                throw new Error(result.error || 'Ошибка при сохранении');
            }
    
        } catch (error) {
            console.error('Ошибка синхронизации:', error);
            this.showSyncStatus(`Ошибка: ${error.message}`, 'error');
            return null;
        }
    }
}

// Initialize app
const app = new TennisBalance();
