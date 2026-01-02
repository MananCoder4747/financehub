// ========================================
// Finance Manager Pro - JavaScript
// ========================================

// Current user
let currentUser = null;

// Auth Elements
const authScreen = document.getElementById('auth-screen');
const appContainer = document.getElementById('app-container');
const googleSignInBtn = document.getElementById('google-signin-btn');
const signOutBtn = document.getElementById('signout-btn');
const userAvatar = document.getElementById('user-avatar');
const userName = document.getElementById('user-name');
const userEmail = document.getElementById('user-email');

// DOM Elements
const balanceEl = document.getElementById('balance');
const transactionList = document.getElementById('transaction-list');
const recentTransactionsList = document.getElementById('recent-transactions');
const form = document.getElementById('transaction-form');
const descriptionInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const categoryInput = document.getElementById('category');
const dateInput = document.getElementById('date');
const filterCategory = document.getElementById('filter-category');
const filterType = document.getElementById('filter-type');
const clearAllBtn = document.getElementById('clear-all');

// Borrow/Lend elements
const transactionTypeInput = document.getElementById('transaction-type');
const personSelect = document.getElementById('person');
const personEmailInput = document.getElementById('person-email');
const dueDateInput = document.getElementById('due-date');
const reminderInput = document.getElementById('reminder');
const typeBtns = document.querySelectorAll('.type-btn');
const addPersonBtn = document.getElementById('add-person-btn');

// Add Person Form elements
const addPersonForm = document.getElementById('add-person-form');
const newPersonNameInput = document.getElementById('new-person-name');
const newPersonEmailInput = document.getElementById('new-person-email');

// Summary elements
const totalLentEl = document.getElementById('total-lent');
const totalBorrowedEl = document.getElementById('total-borrowed');
const totalPeopleEl = document.getElementById('total-people');
const totalPendingEl = document.getElementById('total-pending');
const dueRemindersEl = document.getElementById('due-reminders');
const peopleListEl = document.getElementById('people-list');
const currentDateEl = document.getElementById('current-date');

// Modal elements
const personModal = document.getElementById('person-modal');
const modalPersonName = document.getElementById('modal-person-name');
const modalPersonEmail = document.getElementById('modal-person-email');
const modalNetBalance = document.getElementById('modal-net-balance');
const modalAvatar = document.getElementById('modal-avatar');
const personTransactionsList = document.getElementById('person-transactions');
const sharedIndicator = document.getElementById('shared-indicator');

// Navigation
const navItems = document.querySelectorAll('.nav-item');
const contentSections = document.querySelectorAll('.content-section');
const viewAllLinks = document.querySelectorAll('.view-all');
const pageTitle = document.querySelector('.page-title');

// Mobile elements
const mobileBalance = document.getElementById('mobile-balance');
const mobileBalanceValue = document.getElementById('mobile-balance-value');
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileOverlay = document.getElementById('mobile-overlay');
const sidebar = document.querySelector('.sidebar');

// Category Icons
const categoryIcons = {
    salary: '💼',
    food: '🍔',
    transport: '🚗',
    utilities: '💡',
    entertainment: '🎮',
    shopping: '🛒',
    health: '🏥',
    lend: '📤',
    borrow: '📥',
    other: '📦'
};

// Avatar colors
const avatarColors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b',
    '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#a855f7'
];

// Initialize transactions from localStorage
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

// Saved people list
let savedPeople = JSON.parse(localStorage.getItem('savedPeople')) || [];

// Shared transactions from Firebase
let sharedTransactions = [];

// Set default date to today in DD/MM/YYYY format
function setTodayDate() {
    const today = new Date();
    dateInput.value = formatDateToDDMMYYYY(today);
}

// Format date to DD/MM/YYYY
function formatDateToDDMMYYYY(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

// Parse DD/MM/YYYY to Date object
function parseDDMMYYYY(dateStr) {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    // Validate the date
    if (date.getDate() !== day || date.getMonth() !== month || date.getFullYear() !== year) {
        return null;
    }
    return date;
}

// Convert DD/MM/YYYY to YYYY-MM-DD for storage
function ddmmyyyyToISO(dateStr) {
    const date = parseDDMMYYYY(dateStr);
    if (!date) return null;
    return date.toISOString().split('T')[0];
}

// Convert YYYY-MM-DD to DD/MM/YYYY for display
function isoToDDMMYYYY(isoStr) {
    if (!isoStr) return '';
    const parts = isoStr.split('-');
    if (parts.length !== 3) return isoStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

// Auto-format date input as user types
function setupDateInput(input) {
    input.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.slice(0, 2) + '/' + value.slice(2);
        }
        if (value.length >= 5) {
            value = value.slice(0, 5) + '/' + value.slice(5, 9);
        }
        e.target.value = value;
    });
}

// Display current date
function updateCurrentDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentDateEl.textContent = new Date().toLocaleDateString('en-IN', options);
}

// ========================================
// Saved People Management
// ========================================

function savePeopleToStorage() {
    localStorage.setItem('savedPeople', JSON.stringify(savedPeople));
    if (currentUser && isFirebaseConfigured()) {
        savePeopleToFirebase();
    }
}

async function savePeopleToFirebase() {
    if (!currentUser) return;
    try {
        await db.collection('users').doc(currentUser.uid).set({
            savedPeople: savedPeople
        }, { merge: true });
    } catch (error) {
        console.error('Error saving people to Firebase:', error);
    }
}

async function loadPeopleFromFirebase() {
    if (!currentUser) return;
    try {
        const doc = await db.collection('users').doc(currentUser.uid).get();
        if (doc.exists && doc.data().savedPeople) {
            savedPeople = doc.data().savedPeople;
            localStorage.setItem('savedPeople', JSON.stringify(savedPeople));
        }
    } catch (error) {
        console.error('Error loading people from Firebase:', error);
    }
}

function addPerson(name, email = '') {
    // Check if person already exists
    const exists = savedPeople.find(p => p.name.toLowerCase() === name.toLowerCase());
    if (exists) {
        alert('This person already exists!');
        return false;
    }
    
    const person = {
        id: Date.now().toString(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        createdAt: new Date().toISOString()
    };
    
    savedPeople.push(person);
    savePeopleToStorage();
    updatePersonSelect();
    updatePeopleList();
    return true;
}

function deletePerson(personId) {
    // Check if person has transactions
    const hasTransactions = transactions.some(t => {
        const person = savedPeople.find(p => p.id === personId);
        return person && t.person && t.person.toLowerCase() === person.name.toLowerCase();
    });
    
    if (hasTransactions) {
        if (!confirm('This person has transactions. Delete anyway? (Transactions will remain)')) {
            return;
        }
    }
    
    savedPeople = savedPeople.filter(p => p.id !== personId);
    savePeopleToStorage();
    updatePersonSelect();
    updatePeopleList();
}

function updatePersonSelect() {
    const currentValue = personSelect.value;
    personSelect.innerHTML = '<option value="">-- Select a person --</option>';
    
    savedPeople.forEach(person => {
        const option = document.createElement('option');
        option.value = person.name;
        option.dataset.email = person.email || '';
        option.textContent = person.name + (person.email ? ` (${person.email})` : '');
        personSelect.appendChild(option);
    });
    
    // Restore selected value if it exists
    if (currentValue && savedPeople.find(p => p.name === currentValue)) {
        personSelect.value = currentValue;
    }
}

// ========================================
// Authentication
// ========================================

// Check if Firebase is configured
function isFirebaseConfigured() {
    try {
        const config = firebase.app().options;
        return config.apiKey && config.apiKey !== 'YOUR_API_KEY';
    } catch (e) {
        return false;
    }
}

// Skip sign-in and use local mode
function skipSignIn() {
    authScreen.classList.add('hidden');
    appContainer.style.display = 'flex';
    document.getElementById('user-profile').style.display = 'none';
    init();
}

// Auth state observer
function initAuth() {
    // Set up skip button listener
    const skipBtn = document.getElementById('skip-signin-btn');
    if (skipBtn) {
        skipBtn.addEventListener('click', skipSignIn);
    }

    if (!isFirebaseConfigured()) {
        // Firebase not configured, show auth screen but Google button won't work
        console.log('Firebase not configured. Google sign-in disabled.');
        const googleBtn = document.getElementById('google-signin-btn');
        if (googleBtn) {
            googleBtn.style.opacity = '0.5';
            googleBtn.style.cursor = 'not-allowed';
            googleBtn.title = 'Firebase not configured';
        }
        return;
    }

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            authScreen.classList.add('hidden');
            appContainer.style.display = 'flex';
            
            // Update user profile
            userAvatar.src = user.photoURL || 'https://via.placeholder.com/40';
            userName.textContent = user.displayName || 'User';
            userEmail.textContent = user.email;
            
            // Load data from Firebase
            await loadTransactionsFromFirebase();
            await loadPeopleFromFirebase();
            await loadSharedTransactions();
            
            init();
        } else {
            currentUser = null;
            authScreen.classList.remove('hidden');
            appContainer.style.display = 'none';
        }
    });
}

// Google Sign In
async function signInWithGoogle() {
    try {
        await auth.signInWithPopup(googleProvider);
    } catch (error) {
        console.error('Sign in error:', error);
        alert('Failed to sign in. Please try again.');
    }
}

// Sign Out
async function signOut() {
    try {
        await auth.signOut();
        transactions = [];
        sharedTransactions = [];
        localStorage.removeItem('transactions');
    } catch (error) {
        console.error('Sign out error:', error);
    }
}

// Load transactions from Firebase
async function loadTransactionsFromFirebase() {
    if (!currentUser) return;
    
    try {
        const snapshot = await db.collection('users').doc(currentUser.uid).collection('transactions').get();
        
        if (!snapshot.empty) {
            transactions = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            localStorage.setItem('transactions', JSON.stringify(transactions));
        }
    } catch (error) {
        console.error('Error loading transactions:', error);
        // Fall back to localStorage
        transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    }
}

// Load shared transactions (where current user is the person)
async function loadSharedTransactions() {
    if (!currentUser) return;
    
    try {
        const snapshot = await db.collectionGroup('transactions')
            .where('personEmail', '==', currentUser.email.toLowerCase())
            .get();
        
        sharedTransactions = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            isShared: true
        }));
    } catch (error) {
        console.error('Error loading shared transactions:', error);
        sharedTransactions = [];
    }
}

// Save transaction to Firebase
async function saveTransactionToFirebase(transaction) {
    if (!currentUser || !isFirebaseConfigured()) return;
    
    try {
        await db.collection('users').doc(currentUser.uid).collection('transactions').doc(transaction.id).set({
            ...transaction,
            ownerEmail: currentUser.email.toLowerCase(),
            ownerName: currentUser.displayName,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error('Error saving transaction:', error);
    }
}

// Delete transaction from Firebase
async function deleteTransactionFromFirebase(transactionId) {
    if (!currentUser || !isFirebaseConfigured()) return;
    
    try {
        await db.collection('users').doc(currentUser.uid).collection('transactions').doc(transactionId).delete();
    } catch (error) {
        console.error('Error deleting transaction:', error);
    }
}

// Update transaction in Firebase
async function updateTransactionInFirebase(transaction) {
    if (!currentUser || !isFirebaseConfigured()) return;
    
    try {
        await db.collection('users').doc(currentUser.uid).collection('transactions').doc(transaction.id).update(transaction);
    } catch (error) {
        console.error('Error updating transaction:', error);
    }
}

// Event listeners for auth
if (googleSignInBtn) {
    googleSignInBtn.addEventListener('click', signInWithGoogle);
}
if (signOutBtn) {
    signOutBtn.addEventListener('click', signOut);
}

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', initAuth);

// Initialize app
function init() {
    updateCurrentDate();
    updatePersonSelect();
    setupDateInputs();
    setTodayDate();
    updateUI();
    checkReminders();
    setupTypeToggle();
    setupNavigation();
    setupMobileMenu();
    handleResize();
    window.addEventListener('resize', handleResize);
}

// Setup date inputs for auto-formatting
function setupDateInputs() {
    setupDateInput(dateInput);
    setupDateInput(dueDateInput);
    setupDateInput(reminderInput);
}

// Handle window resize for mobile
function handleResize() {
    if (window.innerWidth <= 768) {
        if (mobileBalance) mobileBalance.style.display = 'flex';
    } else {
        if (mobileBalance) mobileBalance.style.display = 'none';
        if (sidebar) sidebar.classList.remove('open');
        if (mobileOverlay) mobileOverlay.classList.remove('active');
    }
}

// Setup mobile menu
function setupMobileMenu() {
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    }
    if (mobileOverlay) {
        mobileOverlay.addEventListener('click', closeMobileMenu);
    }
    
    // Close menu when nav item clicked on mobile
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                closeMobileMenu();
            }
        });
    });
}

function toggleMobileMenu() {
    sidebar.classList.toggle('open');
    mobileOverlay.classList.toggle('active');
}

function closeMobileMenu() {
    sidebar.classList.remove('open');
    mobileOverlay.classList.remove('active');
}

// Setup navigation
function setupNavigation() {
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            switchSection(section);
        });
    });

    viewAllLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            switchSection(section);
        });
    });
}

function switchSection(sectionName) {
    // Update nav
    navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.section === sectionName);
    });

    // Update sections
    contentSections.forEach(section => {
        section.classList.toggle('active', section.id === `${sectionName}-section`);
    });

    // Update title
    const titles = {
        dashboard: 'Dashboard',
        transactions: 'Transactions',
        people: 'People'
    };
    pageTitle.textContent = titles[sectionName] || 'Dashboard';
}

// Setup transaction type toggle
function setupTypeToggle() {
    typeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            typeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const type = btn.dataset.type;
            transactionTypeInput.value = type;
            updateFormForType(type);
        });
    });
}

// Update form fields based on transaction type
function updateFormForType(type) {
    // Only lend and borrow now, always show person fields
    if (type === 'lend') {
        // Lend mode - money going out, will come back
    } else {
        // Borrow mode - money coming in, need to pay back
    }
}

// Update UI
function updateUI() {
    const filteredTransactions = getFilteredTransactions();
    renderTransactions(filteredTransactions);
    renderRecentTransactions();
    updateBalance();
    updateBorrowLendSummary();
    renderPeopleList();
    updateStats();
}

// Update stats
function updateStats() {
    const people = getPeopleWithBalances();
    const pending = transactions.filter(t => 
        (t.type === 'lend' || t.type === 'borrow') && !t.settled
    ).length;
    
    totalPeopleEl.textContent = people.length;
    totalPendingEl.textContent = pending;
}

// Get filtered transactions
function getFilteredTransactions() {
    let filtered = transactions;
    
    const typeFilter = filterType.value;
    const categoryFilter = filterCategory.value;
    
    if (typeFilter !== 'all') {
        filtered = filtered.filter(t => t.type === typeFilter);
    }
    
    if (categoryFilter !== 'all') {
        filtered = filtered.filter(t => t.category === categoryFilter);
    }
    
    return filtered;
}

// Update balance
function updateBalance() {
    const regularTransactions = transactions.filter(t => t.type === 'regular');
    const total = regularTransactions.reduce((acc, t) => acc + t.amount, 0);
    
    const formattedBalance = formatMoney(total);
    const balanceColor = total >= 0 ? '#10b981' : '#ef4444';
    
    balanceEl.textContent = formattedBalance;
    balanceEl.style.color = balanceColor;
    
    // Update mobile balance too
    if (mobileBalanceValue) {
        mobileBalanceValue.textContent = formattedBalance;
        mobileBalanceValue.style.color = total >= 0 ? '#10b981' : '#ef4444';
    }
}

// Update borrow/lend summary
function updateBorrowLendSummary() {
    const lendTransactions = transactions.filter(t => t.type === 'lend' && !t.settled);
    const borrowTransactions = transactions.filter(t => t.type === 'borrow' && !t.settled);
    
    const totalLent = lendTransactions.reduce((acc, t) => acc + t.amount, 0);
    const totalBorrowed = borrowTransactions.reduce((acc, t) => acc + t.amount, 0);
    
    totalLentEl.textContent = formatMoney(totalLent);
    totalBorrowedEl.textContent = formatMoney(totalBorrowed);
}

// Check and display reminders
function checkReminders() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const pendingTransactions = transactions.filter(t => 
        (t.type === 'lend' || t.type === 'borrow') && 
        !t.settled && 
        (t.dueDate || t.reminderDate)
    );
    
    const reminders = [];
    
    pendingTransactions.forEach(t => {
        // Check reminder date first
        if (t.reminderDate) {
            const reminderDate = new Date(t.reminderDate);
            reminderDate.setHours(0, 0, 0, 0);
            const daysUntilReminder = Math.ceil((reminderDate - today) / (1000 * 60 * 60 * 24));
            
            if (daysUntilReminder <= 0) {
                reminders.push({
                    transaction: t,
                    daysUntilDue: daysUntilReminder,
                    type: daysUntilReminder < 0 ? 'danger' : 'warning',
                    message: daysUntilReminder === 0 ? 'Reminder today!' : `Reminder ${Math.abs(daysUntilReminder)} day(s) ago`
                });
                return;
            }
        }
        
        // Check due date
        if (t.dueDate) {
            const dueDate = new Date(t.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
            
            if (daysUntilDue < 0) {
                reminders.push({
                    transaction: t,
                    daysUntilDue,
                    type: 'danger',
                    message: `Overdue by ${Math.abs(daysUntilDue)} day(s)`
                });
            } else if (daysUntilDue === 0) {
                reminders.push({
                    transaction: t,
                    daysUntilDue,
                    type: 'danger',
                    message: 'Due today!'
                });
            } else if (daysUntilDue <= 7) {
                reminders.push({
                    transaction: t,
                    daysUntilDue,
                    type: 'warning',
                    message: `Due in ${daysUntilDue} day(s)`
                });
            }
        }
    });
    
    renderReminders(reminders);
}

// Render reminders
function renderReminders(reminders) {
    if (reminders.length === 0) {
        dueRemindersEl.innerHTML = `
            <div class="empty-state">
                <span class="material-symbols-outlined">check_circle</span>
                <p>No pending reminders</p>
            </div>
        `;
        return;
    }
    
    dueRemindersEl.innerHTML = reminders.map(r => `
        <div class="reminder-alert ${r.type}">
            <span class="icon">${r.type === 'danger' ? '🚨' : '⏰'}</span>
            <div class="info">
                <strong>${r.transaction.type === 'lend' ? 'Receive from' : 'Pay to'} ${escapeHtml(r.transaction.person)}</strong>
                <small>${formatMoney(r.transaction.amount)} - ${r.message}</small>
            </div>
        </div>
    `).join('');
}

// Get unique people from transactions
function getPeopleWithBalances() {
    const people = {};
    
    // Process own transactions
    transactions.forEach(t => {
        if ((t.type === 'lend' || t.type === 'borrow') && t.person) {
            const name = t.person.toLowerCase().trim();
            if (!people[name]) {
                people[name] = {
                    name: t.person,
                    email: t.personEmail || null,
                    balance: 0,
                    transactions: [],
                    hasShared: false
                };
            }
            
            if (t.personEmail && !people[name].email) {
                people[name].email = t.personEmail;
            }
            
            if (!t.settled) {
                if (t.type === 'lend') {
                    people[name].balance += t.amount;
                } else {
                    people[name].balance -= t.amount;
                }
            }
            
            people[name].transactions.push({...t, source: 'own'});
        }
    });
    
    // Process shared transactions (where someone else added us)
    sharedTransactions.forEach(t => {
        const ownerName = t.ownerName || 'Unknown';
        const name = ownerName.toLowerCase().trim();
        
        if (!people[name]) {
            people[name] = {
                name: ownerName,
                email: t.ownerEmail || null,
                balance: 0,
                transactions: [],
                hasShared: true
            };
        }
        
        people[name].hasShared = true;
        
        if (!t.settled) {
            // Reverse the perspective - if they lent to us, we owe them
            if (t.type === 'lend') {
                people[name].balance -= t.amount;
            } else {
                people[name].balance += t.amount;
            }
        }
        
        people[name].transactions.push({...t, source: 'shared'});
    });
    
    return Object.values(people);
}

// Render people list (combines saved people with transaction people)
function renderPeopleList() {
    const transactionPeople = getPeopleWithBalances();
    
    // Merge saved people with transaction-based people
    const allPeople = [...savedPeople];
    
    // Add people from transactions who aren't in saved list
    transactionPeople.forEach(tp => {
        const exists = allPeople.find(p => p.name.toLowerCase() === tp.name.toLowerCase());
        if (!exists) {
            allPeople.push({
                id: tp.name.toLowerCase(),
                name: tp.name,
                email: tp.email || '',
                fromTransactions: true
            });
        }
    });
    
    if (allPeople.length === 0) {
        peopleListEl.innerHTML = `
            <div class="people-empty">
                <span class="material-symbols-outlined">group_off</span>
                <p>No people added yet. Add someone to get started!</p>
            </div>
        `;
        return;
    }
    
    peopleListEl.innerHTML = allPeople.map((person, index) => {
        // Find balance from transactions
        const txPerson = transactionPeople.find(tp => tp.name.toLowerCase() === person.name.toLowerCase());
        const balance = txPerson ? txPerson.balance : 0;
        const hasShared = txPerson ? txPerson.hasShared : false;
        
        return `
        <div class="person-card ${hasShared ? 'shared' : ''}" onclick="openPersonModal('${escapeHtml(person.name)}')">
            ${hasShared ? '<span class="shared-badge"><span class="material-symbols-outlined">link</span></span>' : ''}
            ${!person.fromTransactions ? `<button class="delete-person-btn" onclick="event.stopPropagation(); deletePerson('${person.id}')" title="Delete Person">
                <span class="material-symbols-outlined">close</span>
            </button>` : ''}
            <div class="person-avatar" style="background: linear-gradient(135deg, ${avatarColors[index % avatarColors.length]} 0%, ${avatarColors[(index + 1) % avatarColors.length]} 100%);">
                ${person.name.charAt(0).toUpperCase()}
            </div>
            <span class="name">${escapeHtml(person.name)}</span>
            ${person.email ? `<span class="person-email-display">${escapeHtml(person.email)}</span>` : ''}
            <span class="balance ${balance >= 0 ? 'positive' : 'negative'}">
                ${balance >= 0 ? '+' : ''}${formatMoney(balance)}
            </span>
        </div>
    `}).join('');
}

// Open person modal
function openPersonModal(personName) {
    const people = getPeopleWithBalances();
    const person = people.find(p => p.name.toLowerCase() === personName.toLowerCase());
    
    if (!person) return;
    
    const colorIndex = people.indexOf(person);
    modalAvatar.textContent = person.name.charAt(0).toUpperCase();
    modalAvatar.style.background = `linear-gradient(135deg, ${avatarColors[colorIndex % avatarColors.length]} 0%, ${avatarColors[(colorIndex + 1) % avatarColors.length]} 100%)`;
    
    modalPersonName.textContent = person.name;
    modalPersonEmail.textContent = person.email || '';
    modalNetBalance.textContent = (person.balance >= 0 ? '+' : '') + formatMoney(person.balance);
    modalNetBalance.style.color = person.balance >= 0 ? '#10b981' : '#ef4444';
    
    // Show shared indicator if applicable
    if (person.hasShared) {
        sharedIndicator.style.display = 'flex';
    } else {
        sharedIndicator.style.display = 'none';
    }
    
    personTransactionsList.innerHTML = person.transactions
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map(t => {
            const item = renderTransactionItem(t, true);
            if (t.source === 'shared') {
                return item.replace('transaction-item', 'transaction-item shared-transaction');
            }
            return item;
        })
        .join('');
    
    personModal.classList.add('active');
}

// Close person modal
function closePersonModal() {
    personModal.classList.remove('active');
}

// Check if date is overdue
function isOverdue(dateString) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dateString);
    return dueDate < today;
}

// Settle transaction
async function settleTransaction(id) {
    const transaction = transactions.find(t => t.id === id);
    if (transaction) {
        transaction.settled = true;
        transaction.settledDate = new Date().toISOString().split('T')[0];
        saveToLocalStorage();
        await updateTransactionInFirebase(transaction);
        updateUI();
        checkReminders();
        
        if (personModal.classList.contains('active') && transaction.person) {
            openPersonModal(transaction.person);
        }
    }
}

// Format money in INR
function formatMoney(amount) {
    const absAmount = Math.abs(amount);
    // Indian numbering system
    const formatted = absAmount.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    return '₹' + formatted;
}

// Format date
function formatDate(dateString) {
// Format date for display (DD/MM/YYYY)
function formatDate(dateString) {
    return isoToDDMMYYYY(dateString);
}

// Render single transaction item
function renderTransactionItem(transaction, showPerson = false) {
    const isIncome = transaction.type === 'regular' ? transaction.amount > 0 : transaction.type === 'lend';
    
    let badgeHtml = '';
    if (transaction.type === 'lend') {
        badgeHtml = `<span class="transaction-badge badge-lend">LENT${showPerson ? '' : ' to ' + escapeHtml(transaction.person)}</span>`;
    } else if (transaction.type === 'borrow') {
        badgeHtml = `<span class="transaction-badge badge-borrow">BORROWED${showPerson ? '' : ' from ' + escapeHtml(transaction.person)}</span>`;
    }
    
    if (transaction.settled) {
        badgeHtml += '<span class="transaction-badge badge-settled">SETTLED</span>';
    }
    
    const category = transaction.type === 'regular' ? transaction.category : transaction.type;
    
    return `
        <li class="transaction-item ${isIncome ? 'income' : 'expense'}">
            <div class="transaction-icon">${categoryIcons[category]}</div>
            <div class="transaction-info">
                <div class="description">${escapeHtml(transaction.description)} ${badgeHtml}</div>
                <div class="meta">
                    <span>${categoryIcons[category]} ${capitalizeFirst(category)}</span>
                    <span>${formatDate(transaction.date)}</span>
                </div>
                ${transaction.dueDate && !transaction.settled ? `
                    <div class="transaction-due ${isOverdue(transaction.dueDate) ? 'overdue' : ''}">
                        📅 Due: ${formatDate(transaction.dueDate)}${isOverdue(transaction.dueDate) ? ' (OVERDUE)' : ''}
                    </div>
                ` : ''}
            </div>
            <span class="transaction-amount ${isIncome ? 'income' : 'expense'}">
                ${isIncome ? '+' : '-'}${formatMoney(transaction.amount)}
            </span>
            <div class="transaction-actions">
                ${(transaction.type === 'lend' || transaction.type === 'borrow') && !transaction.settled ? 
                    `<button class="settle-btn" onclick="settleTransaction('${transaction.id}')" title="Mark as settled">
                        <span class="material-symbols-outlined">check</span>
                    </button>` : ''
                }
                <button class="delete-btn" onclick="deleteTransaction('${transaction.id}')" title="Delete">
                    <span class="material-symbols-outlined">delete</span>
                </button>
            </div>
        </li>
    `;
}

// Render recent transactions (last 5)
function renderRecentTransactions() {
    const recent = [...transactions]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
    
    if (recent.length === 0) {
        recentTransactionsList.innerHTML = `
            <li class="empty-state">
                <span class="material-symbols-outlined">receipt_long</span>
                <p>No transactions yet</p>
            </li>
        `;
        return;
    }
    
    recentTransactionsList.innerHTML = recent.map(t => renderTransactionItem(t)).join('');
}

// Render all transactions
function renderTransactions(transactionsToRender) {
    if (transactionsToRender.length === 0) {
        transactionList.innerHTML = `
            <li class="empty-state">
                <span class="material-symbols-outlined">receipt_long</span>
                <p>No transactions found</p>
            </li>
        `;
        return;
    }

    const sorted = [...transactionsToRender].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );

    transactionList.innerHTML = sorted.map(t => renderTransactionItem(t)).join('');
}

// Add transaction
async function addTransaction(e) {
    e.preventDefault();

    const type = transactionTypeInput.value;
    const description = descriptionInput.value.trim();
    const amount = Math.abs(parseFloat(amountInput.value));
    const dateStr = dateInput.value;

    // Validate date format
    const dateISO = ddmmyyyyToISO(dateStr);
    if (!dateISO) {
        alert('Please enter a valid date in DD/MM/YYYY format');
        return;
    }

    if (!description || isNaN(amount)) {
        alert('Please fill in all required fields');
        return;
    }

    // Get person from select dropdown
    const personName = personSelect.value;
    if (!personName) {
        alert('Please select a person');
        return;
    }
    
    // Find the selected person to get their email
    const selectedPerson = savedPeople.find(p => p.name === personName);
    const personEmail = selectedPerson ? selectedPerson.email : '';

    // Parse due date and reminder date
    const dueDateISO = dueDateInput.value ? ddmmyyyyToISO(dueDateInput.value) : null;
    const reminderDateISO = reminderInput.value ? ddmmyyyyToISO(reminderInput.value) : null;

    const transaction = {
        id: generateId(),
        type,
        description,
        date: dateISO,
        amount,
        person: personName,
        personEmail: personEmail || null,
        category: type,
        dueDate: dueDateISO,
        reminderDate: reminderDateISO,
        settled: false
    };

    transactions.push(transaction);
    saveToLocalStorage();
    await saveTransactionToFirebase(transaction);
    updateUI();
    checkReminders();

    // Reset form
    descriptionInput.value = '';
    amountInput.value = '';
    personSelect.value = '';
    dueDateInput.value = '';
    reminderInput.value = '';
    setTodayDate();
    descriptionInput.focus();
    
    // Show success feedback
    showNotification('Transaction added successfully!');
}

// Show notification
function showNotification(message) {
    // Simple visual feedback
    const btn = document.querySelector('.btn-submit');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="material-symbols-outlined">check_circle</span> Added!';
    btn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    
    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.background = '';
    }, 1500);
}

// Delete transaction
async function deleteTransaction(id) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        transactions = transactions.filter(t => t.id !== id);
        saveToLocalStorage();
        await deleteTransactionFromFirebase(id);
        updateUI();
        checkReminders();
    }
}

// Clear all transactions
async function clearAllTransactions() {
    if (transactions.length === 0) {
        alert('No transactions to clear');
        return;
    }

    if (confirm('Are you sure you want to delete ALL transactions? This cannot be undone.')) {
        // Delete all from Firebase
        for (const t of transactions) {
            await deleteTransactionFromFirebase(t.id);
        }
        transactions = [];
        saveToLocalStorage();
        updateUI();
        checkReminders();
    }
}

// Save to localStorage
function saveToLocalStorage() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Capitalize first letter
function capitalizeFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Close modal when clicking outside
personModal.addEventListener('click', (e) => {
    if (e.target === personModal) {
        closePersonModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && personModal.classList.contains('active')) {
        closePersonModal();
    }
});

// Add Person Form submit
if (addPersonForm) {
    addPersonForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = newPersonNameInput.value.trim();
        const email = newPersonEmailInput.value.trim();
        
        if (!name) {
            alert('Please enter a name');
            return;
        }
        
        if (addPerson(name, email)) {
            newPersonNameInput.value = '';
            newPersonEmailInput.value = '';
            showNotification('Person added successfully!');
        }
    });
}

// Add Person button in Quick Add form (navigate to People section)
if (addPersonBtn) {
    addPersonBtn.addEventListener('click', () => {
        // Navigate to People section
        navItems.forEach(item => {
            item.classList.toggle('active', item.dataset.section === 'people');
        });
        contentSections.forEach(section => {
            section.classList.toggle('active', section.id === 'people-section');
        });
        pageTitle.textContent = 'People';
        
        // Focus on name input
        setTimeout(() => {
            if (newPersonNameInput) newPersonNameInput.focus();
        }, 100);
    });
}

// Event Listeners
form.addEventListener('submit', addTransaction);
filterCategory.addEventListener('change', updateUI);
filterType.addEventListener('change', updateUI);
clearAllBtn.addEventListener('click', clearAllTransactions);

// Check reminders periodically (every minute)
setInterval(checkReminders, 60000);

// Initialize
init();
