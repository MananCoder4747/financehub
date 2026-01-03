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
const dateInput = document.getElementById('date');
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

// Reminder date input
const reminderDateField = document.getElementById('reminder-date-field');
const reminderDateInput = document.getElementById('reminder-date');

// Export buttons
const exportExcelBtn = document.getElementById('export-excel');
const exportPdfBtn = document.getElementById('export-pdf');

// ========================================
// Date Format Helpers (DD/MM/YYYY)
// ========================================

// Format date to DD/MM/YYYY
function formatDateToDDMMYYYY(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

// Parse DD/MM/YYYY to ISO format (YYYY-MM-DD)
function parseDDMMYYYY(dateStr) {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// Convert various date-like values (string/Date/Firestore Timestamp/epoch) to a Date object
function toDateObject(value) {
    if (!value) return null;

    if (value instanceof Date) {
        return isNaN(value.getTime()) ? null : value;
    }

    if (typeof value === 'number') {
        const d = new Date(value);
        return isNaN(d.getTime()) ? null : d;
    }

    if (typeof value === 'string') {
        // DD/MM/YYYY
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
            const iso = parseDDMMYYYY(value);
            if (!iso) return null;
            const d = new Date(iso);
            return isNaN(d.getTime()) ? null : d;
        }

        // ISO date or datetime
        const d = new Date(value);
        return isNaN(d.getTime()) ? null : d;
    }

    if (typeof value === 'object') {
        // Firestore Timestamp (has toDate())
        if (typeof value.toDate === 'function') {
            const d = value.toDate();
            return d instanceof Date && !isNaN(d.getTime()) ? d : null;
        }
        // Firestore Timestamp-like (seconds)
        if (typeof value.seconds === 'number') {
            const d = new Date(value.seconds * 1000);
            return isNaN(d.getTime()) ? null : d;
        }
        if (typeof value._seconds === 'number') {
            const d = new Date(value._seconds * 1000);
            return isNaN(d.getTime()) ? null : d;
        }
    }

    return null;
}

// Convert ISO to DD/MM/YYYY
function isoToDDMMYYYY(isoStr) {
    if (!isoStr) return '';

    if (typeof isoStr === 'string') {
        // If it's an ISO datetime, just keep the date portion
        const dateOnly = isoStr.includes('T') ? isoStr.split('T')[0] : isoStr;
        const parts = dateOnly.split('-');
        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
        // Already DD/MM/YYYY or other format
        return isoStr;
    }

    const d = toDateObject(isoStr);
    if (!d) return '';
    return formatDateToDDMMYYYY(d);
}

// Auto-format date input as user types
function setupDateInput(input) {
    if (!input) return;
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

// Set today's date in DD/MM/YYYY format
function setTodayDate() {
    if (dateInput) dateInput.value = formatDateToDDMMYYYY(new Date());
}

// Setup all date inputs with auto-formatting
function setupDateInputs() {
    setupDateInput(dateInput);
    setupDateInput(dueDateInput);
    setupDateInput(reminderDateInput);
}

// Setup reminder toggle for custom date
function setupReminderToggle() {
    if (!reminderInput || !reminderDateField) return;
    
    reminderInput.addEventListener('change', () => {
        if (reminderInput.value === 'custom') {
            reminderDateField.style.display = 'block';
        } else {
            reminderDateField.style.display = 'none';
            if (reminderDateInput) reminderDateInput.value = '';
        }
    });
}

// Setup export buttons
function setupExportButtons() {
    if (exportExcelBtn) {
        exportExcelBtn.addEventListener('click', exportToExcel);
    }
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', exportToPDF);
    }
}

// Export transactions to Excel (CSV)
function exportToExcel() {
    const allTransactions = [...transactions, ...sharedTransactions];
    if (allTransactions.length === 0) {
        alert('No transactions to export!');
        return;
    }
    
    // CSV headers
    let csv = 'Date,Description,Type,Category,Amount,Person,Person Email,Due Date,Status\n';
    
    // Add each transaction
    allTransactions.forEach(t => {
        const date = isoToDDMMYYYY(t.date) || '';
        const description = `"${(t.description || '').replace(/"/g, '""')}"`;
        const type = t.type || '';
        const category = t.category || '';
        const amount = t.amount || 0;
        const person = `"${(t.person || '').replace(/"/g, '""')}"`;
        const personEmail = `"${(t.personEmail || '').replace(/"/g, '""')}"`;
        const dueDate = isoToDDMMYYYY(t.dueDate) || '';
        const status = t.settled ? 'Settled' : 'Pending';
        
        csv += `${date},${description},${type},${category},${amount},${person},${personEmail},${dueDate},${status}\n`;
    });
    
    // Create and download file
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_${formatDateToDDMMYYYY(new Date()).replace(/\//g, '-')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Export transactions to PDF
function exportToPDF() {
    const allTransactions = [...transactions, ...sharedTransactions];
    if (allTransactions.length === 0) {
        alert('No transactions to export!');
        return;
    }
    
    // Create printable HTML
    let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Transactions Report</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { color: #6366f1; text-align: center; }
                .date { text-align: center; color: #666; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 12px; }
                th { background: #6366f1; color: white; }
                tr:nth-child(even) { background: #f9f9f9; }
                .income { color: #10b981; }
                .expense { color: #ef4444; }
                .lend { color: #3b82f6; }
                .borrow { color: #f59e0b; }
                .summary { margin-top: 20px; padding: 15px; background: #f0f0f0; border-radius: 8px; }
            </style>
        </head>
        <body>
            <h1>💰 Finance Manager Pro - Transactions Report</h1>
            <p class="date">Generated on: ${formatDateToDDMMYYYY(new Date())}</p>
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Type</th>
                        <th>Category</th>
                        <th>Amount</th>
                        <th>Person</th>
                        <th>Due Date</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    let totalIncome = 0, totalExpense = 0, totalLent = 0, totalBorrowed = 0;
    
    allTransactions.forEach(t => {
        const typeClass = t.type || 'other';
        const date = isoToDDMMYYYY(t.date) || '-';
        const dueDate = isoToDDMMYYYY(t.dueDate) || '-';
        const status = t.settled ? '✓ Settled' : '⏳ Pending';
        
        // Calculate totals
        if (t.type === 'income') totalIncome += t.amount;
        else if (t.type === 'expense') totalExpense += t.amount;
        else if (t.type === 'lend') totalLent += t.amount;
        else if (t.type === 'borrow') totalBorrowed += t.amount;
        
        html += `
            <tr>
                <td>${date}</td>
                <td>${t.description || '-'}</td>
                <td class="${typeClass}">${(t.type || '-').toUpperCase()}</td>
                <td>${t.category || '-'}</td>
                <td class="${typeClass}">₹${t.amount.toLocaleString('en-IN')}</td>
                <td>${t.person || '-'}</td>
                <td>${dueDate}</td>
                <td>${status}</td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
            <div class="summary">
                <h3>Summary</h3>
                <p><strong>Total Income:</strong> <span class="income">₹${totalIncome.toLocaleString('en-IN')}</span></p>
                <p><strong>Total Expense:</strong> <span class="expense">₹${totalExpense.toLocaleString('en-IN')}</span></p>
                <p><strong>Total Lent:</strong> <span class="lend">₹${totalLent.toLocaleString('en-IN')}</span></p>
                <p><strong>Total Borrowed:</strong> <span class="borrow">₹${totalBorrowed.toLocaleString('en-IN')}</span></p>
                <p><strong>Net Balance:</strong> ₹${(totalIncome - totalExpense + totalBorrowed - totalLent).toLocaleString('en-IN')}</p>
            </div>
        </body>
        </html>
    `;
    
    // Open print dialog
    const printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
    }, 250);
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
    renderPeopleList();
    return true;
}

function deletePerson(personId) {
    if (!confirm('Delete this person?')) return;
    savedPeople = savedPeople.filter(p => p.id !== personId);
    savePeopleToStorage();
    updatePersonSelect();
    renderPeopleList();
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
        alert('Sign-in failed. For mobile app, please use the web version at your Netlify URL for Google Sign-In, or use Skip to continue offline.');
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
    if (!currentUser || !isFirebaseConfigured()) return;
    
    try {
        // Query the sharedTransactions collection where this user's email is the personEmail
        const snapshot = await db.collection('sharedTransactions')
            .where('personEmail', '==', currentUser.email.toLowerCase())
            .get();
        
        sharedTransactions = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            isShared: true
        }));
        
        console.log('Loaded shared transactions:', sharedTransactions.length);
    } catch (error) {
        console.error('Error loading shared transactions:', error);
        sharedTransactions = [];
    }
}

// Save transaction to Firebase
async function saveTransactionToFirebase(transaction) {
    if (!currentUser || !isFirebaseConfigured()) return;
    
    try {
        const transactionData = {
            ...transaction,
            ownerEmail: currentUser.email.toLowerCase(),
            ownerName: currentUser.displayName,
            ownerUid: currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Save to user's transactions
        await db.collection('users').doc(currentUser.uid).collection('transactions').doc(transaction.id).set(transactionData);
        
        // If person has email, also save to shared transactions collection
        if (transaction.personEmail) {
            await db.collection('sharedTransactions').doc(transaction.id).set(transactionData);
            console.log('Shared transaction saved for:', transaction.personEmail);
        }
    } catch (error) {
        console.error('Error saving transaction:', error);
    }
}

// Delete transaction from Firebase
async function deleteTransactionFromFirebase(transactionId) {
    if (!currentUser || !isFirebaseConfigured()) return;
    
    try {
        // Delete from user's transactions
        await db.collection('users').doc(currentUser.uid).collection('transactions').doc(transactionId).delete();
        
        // Also delete from shared transactions
        await db.collection('sharedTransactions').doc(transactionId).delete();
    } catch (error) {
        console.error('Error deleting transaction:', error);
    }
}

// Update transaction in Firebase
async function updateTransactionInFirebase(transaction) {
    if (!currentUser || !isFirebaseConfigured()) return;
    
    try {
        const transactionData = {
            ...transaction,
            ownerEmail: currentUser.email.toLowerCase(),
            ownerName: currentUser.displayName,
            ownerUid: currentUser.uid,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Update in user's transactions
        await db.collection('users').doc(currentUser.uid).collection('transactions').doc(transaction.id).set(transactionData, { merge: true });
        
        // Update in shared transactions if person has email
        if (transaction.personEmail) {
            await db.collection('sharedTransactions').doc(transaction.id).set(transactionData, { merge: true });
        }
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
    setupReminderToggle();
    setupExportButtons();
    updateUI();
    checkReminders();
    setupTypeToggle();
    setupNavigation();
    setupMobileMenu();
    handleResize();
    window.addEventListener('resize', handleResize);
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

// Get filtered transactions (includes shared)
function getFilteredTransactions() {
    // Combine own and shared transactions
    let filtered = [...transactions, ...sharedTransactions];
    
    const typeFilter = filterType.value;
    
    if (typeFilter !== 'all') {
        filtered = filtered.filter(t => t.type === typeFilter);
    }
    
    return filtered;
}

// Update balance
function updateBalance() {
    // Calculate net balance from own transactions
    const ownLendTransactions = transactions.filter(t => t.type === 'lend' && !t.settled);
    const ownBorrowTransactions = transactions.filter(t => t.type === 'borrow' && !t.settled);
    
    const ownTotalLent = ownLendTransactions.reduce((acc, t) => acc + t.amount, 0);
    const ownTotalBorrowed = ownBorrowTransactions.reduce((acc, t) => acc + t.amount, 0);
    
    // Calculate from shared transactions (reversed perspective)
    // If someone lent TO me (their type='lend'), I OWE them (negative for me)
    // If someone borrowed FROM me (their type='borrow'), they OWE me (positive for me)
    const sharedLendTransactions = sharedTransactions.filter(t => t.type === 'lend' && !t.settled);
    const sharedBorrowTransactions = sharedTransactions.filter(t => t.type === 'borrow' && !t.settled);
    
    const sharedIOwe = sharedLendTransactions.reduce((acc, t) => acc + t.amount, 0); // They lent to me, I owe
    const sharedTheyOwe = sharedBorrowTransactions.reduce((acc, t) => acc + t.amount, 0); // They borrowed from me, they owe
    
    // Net balance: (what others owe me) - (what I owe others)
    const netBalance = (ownTotalLent + sharedTheyOwe) - (ownTotalBorrowed + sharedIOwe);
    
    const formattedBalance = formatMoney(Math.abs(netBalance));
    const balanceColor = netBalance >= 0 ? '#10b981' : '#ef4444';
    const prefix = netBalance >= 0 ? '+' : '-';
    
    balanceEl.textContent = (netBalance !== 0 ? prefix : '') + formattedBalance;
    balanceEl.style.color = balanceColor;
    
    // Update mobile balance too
    if (mobileBalanceValue) {
        mobileBalanceValue.textContent = (netBalance !== 0 ? prefix : '') + formattedBalance;
        mobileBalanceValue.style.color = balanceColor;
    }
}

// Update borrow/lend summary
function updateBorrowLendSummary() {
    // Own transactions
    const ownLendTransactions = transactions.filter(t => t.type === 'lend' && !t.settled);
    const ownBorrowTransactions = transactions.filter(t => t.type === 'borrow' && !t.settled);
    
    const ownTotalLent = ownLendTransactions.reduce((acc, t) => acc + t.amount, 0);
    const ownTotalBorrowed = ownBorrowTransactions.reduce((acc, t) => acc + t.amount, 0);
    
    // Shared transactions (reversed perspective)
    // Their 'lend' = I need to pay them back (my borrow)
    // Their 'borrow' = They need to pay me back (my lend)
    const sharedLendTransactions = sharedTransactions.filter(t => t.type === 'lend' && !t.settled);
    const sharedBorrowTransactions = sharedTransactions.filter(t => t.type === 'borrow' && !t.settled);
    
    const sharedAsMyBorrowed = sharedLendTransactions.reduce((acc, t) => acc + t.amount, 0);
    const sharedAsMyLent = sharedBorrowTransactions.reduce((acc, t) => acc + t.amount, 0);
    
    // Total from both sources
    const totalLent = ownTotalLent + sharedAsMyLent;
    const totalBorrowed = ownTotalBorrowed + sharedAsMyBorrowed;
    
    totalLentEl.textContent = formatMoney(totalLent);
    totalBorrowedEl.textContent = formatMoney(totalBorrowed);
}

// Check and display reminders
function checkReminders() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Combine own and shared transactions for reminders
    const allTransactionsForReminders = [
        ...transactions.filter(t => (t.type === 'lend' || t.type === 'borrow') && !t.settled && t.dueDate),
        ...sharedTransactions.filter(t => (t.type === 'lend' || t.type === 'borrow') && !t.settled && t.dueDate)
    ];
    
    const reminders = [];
    
    allTransactionsForReminders.forEach(t => {
        const dueDate = toDateObject(t.dueDate);
        if (!dueDate) return;
        dueDate.setHours(0, 0, 0, 0);
        const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        
        // Handle custom reminder date
        let shouldRemind = false;
        if (t.reminder === 'custom' && t.customReminderDate) {
            const reminderDate = toDateObject(t.customReminderDate);
            if (!reminderDate) return;
            reminderDate.setHours(0, 0, 0, 0);
            shouldRemind = today >= reminderDate;
        } else {
            const reminderDays = parseInt(t.reminder) || 0;
            shouldRemind = reminderDays > 0 && daysUntilDue <= reminderDays;
        }
        
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
        } else if (shouldRemind) {
            reminders.push({
                transaction: t,
                daysUntilDue,
                type: 'warning',
                message: `Due in ${daysUntilDue} day(s)`
            });
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
                <p>No people added yet. Add someone above to get started!</p>
            </div>
        `;
        return;
    }
    
    peopleListEl.innerHTML = allPeople.map((person, index) => {
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
        .sort((a, b) => (toDateObject(b.date)?.getTime() ?? 0) - (toDateObject(a.date)?.getTime() ?? 0))
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

// ========================================
// Details Modal Functions
// ========================================

const detailsModal = document.getElementById('details-modal');
const detailsModalIcon = document.getElementById('details-modal-icon');
const detailsModalTitle = document.getElementById('details-modal-title');
const detailsModalLabel = document.getElementById('details-modal-label');
const detailsModalTotal = document.getElementById('details-modal-total');
const detailsTransactionsList = document.getElementById('details-transactions-list');

// Open To Receive modal (money to collect from others)
function openReceiveModal() {
    // Get all lend transactions (own) + borrow transactions from shared (they borrowed from me)
    const ownLend = transactions.filter(t => t.type === 'lend' && !t.settled);
    const sharedBorrow = sharedTransactions.filter(t => t.type === 'borrow' && !t.settled);
    
    // Group by person
    const peopleToReceive = {};
    
    ownLend.forEach(t => {
        const name = t.person.toLowerCase();
        if (!peopleToReceive[name]) {
            peopleToReceive[name] = { name: t.person, amount: 0, count: 0 };
        }
        peopleToReceive[name].amount += t.amount;
        peopleToReceive[name].count++;
    });
    
    sharedBorrow.forEach(t => {
        const name = (t.ownerName || 'Unknown').toLowerCase();
        if (!peopleToReceive[name]) {
            peopleToReceive[name] = { name: t.ownerName || 'Unknown', amount: 0, count: 0 };
        }
        peopleToReceive[name].amount += t.amount;
        peopleToReceive[name].count++;
    });
    
    const total = Object.values(peopleToReceive).reduce((acc, p) => acc + p.amount, 0);
    
    detailsModalIcon.textContent = 'arrow_upward';
    detailsModalTitle.textContent = 'To Receive';
    detailsModalLabel.textContent = 'Total to Collect';
    detailsModalTotal.textContent = formatMoney(total);
    detailsModalTotal.style.color = '#10b981';
    
    renderDetailsList(peopleToReceive, 'positive');
    detailsModal.classList.add('active');
}

// Open To Pay modal (money to pay to others)
function openPayModal() {
    // Get all borrow transactions (own) + lend transactions from shared (they lent to me)
    const ownBorrow = transactions.filter(t => t.type === 'borrow' && !t.settled);
    const sharedLend = sharedTransactions.filter(t => t.type === 'lend' && !t.settled);
    
    // Group by person
    const peopleToPay = {};
    
    ownBorrow.forEach(t => {
        const name = t.person.toLowerCase();
        if (!peopleToPay[name]) {
            peopleToPay[name] = { name: t.person, amount: 0, count: 0 };
        }
        peopleToPay[name].amount += t.amount;
        peopleToPay[name].count++;
    });
    
    sharedLend.forEach(t => {
        const name = (t.ownerName || 'Unknown').toLowerCase();
        if (!peopleToPay[name]) {
            peopleToPay[name] = { name: t.ownerName || 'Unknown', amount: 0, count: 0 };
        }
        peopleToPay[name].amount += t.amount;
        peopleToPay[name].count++;
    });
    
    const total = Object.values(peopleToPay).reduce((acc, p) => acc + p.amount, 0);
    
    detailsModalIcon.textContent = 'arrow_downward';
    detailsModalTitle.textContent = 'To Pay';
    detailsModalLabel.textContent = 'Total to Pay';
    detailsModalTotal.textContent = formatMoney(total);
    detailsModalTotal.style.color = '#ef4444';
    
    renderDetailsList(peopleToPay, 'negative');
    detailsModal.classList.add('active');
}

// Open Pending modal (all pending transactions)
function openPendingModal() {
    // Get all pending transactions
    const allPending = [
        ...transactions.filter(t => !t.settled),
        ...sharedTransactions.filter(t => !t.settled)
    ];
    
    // Group by person
    const pendingByPerson = {};
    
    allPending.forEach(t => {
        let name, displayName;
        if (t.isShared) {
            name = (t.ownerName || 'Unknown').toLowerCase();
            displayName = t.ownerName || 'Unknown';
        } else {
            name = t.person.toLowerCase();
            displayName = t.person;
        }
        
        if (!pendingByPerson[name]) {
            pendingByPerson[name] = { name: displayName, amount: 0, count: 0 };
        }
        pendingByPerson[name].count++;
    });
    
    const totalCount = allPending.length;
    
    detailsModalIcon.textContent = 'pending_actions';
    detailsModalTitle.textContent = 'Pending Transactions';
    detailsModalLabel.textContent = 'Total Pending';
    detailsModalTotal.textContent = totalCount + ' transaction' + (totalCount !== 1 ? 's' : '');
    detailsModalTotal.style.color = '#f59e0b';
    
    renderPendingList(pendingByPerson);
    detailsModal.classList.add('active');
}

// Render details list (for receive/pay)
function renderDetailsList(people, amountClass) {
    const peopleArray = Object.values(people).sort((a, b) => b.amount - a.amount);
    
    if (peopleArray.length === 0) {
        detailsTransactionsList.innerHTML = `
            <li class="empty-state">
                <span class="material-symbols-outlined">check_circle</span>
                <p>No pending amounts</p>
            </li>
        `;
        return;
    }
    
    detailsTransactionsList.innerHTML = peopleArray.map((person, index) => `
        <li class="details-person-item" onclick="closeDetailsModal(); openPersonModal('${escapeHtml(person.name)}')">
            <div class="details-person-info">
                <div class="details-person-avatar" style="background: linear-gradient(135deg, ${avatarColors[index % avatarColors.length]} 0%, ${avatarColors[(index + 1) % avatarColors.length]} 100%);">
                    ${person.name.charAt(0).toUpperCase()}
                </div>
                <div>
                    <div class="details-person-name">${escapeHtml(person.name)}</div>
                    <div class="details-person-count">${person.count} transaction${person.count !== 1 ? 's' : ''}</div>
                </div>
            </div>
            <span class="details-person-amount ${amountClass}">${formatMoney(person.amount)}</span>
        </li>
    `).join('');
}

// Render pending list
function renderPendingList(people) {
    const peopleArray = Object.values(people).sort((a, b) => b.count - a.count);
    
    if (peopleArray.length === 0) {
        detailsTransactionsList.innerHTML = `
            <li class="empty-state">
                <span class="material-symbols-outlined">check_circle</span>
                <p>No pending transactions</p>
            </li>
        `;
        return;
    }
    
    detailsTransactionsList.innerHTML = peopleArray.map((person, index) => `
        <li class="details-person-item" onclick="closeDetailsModal(); openPersonModal('${escapeHtml(person.name)}')">
            <div class="details-person-info">
                <div class="details-person-avatar" style="background: linear-gradient(135deg, ${avatarColors[index % avatarColors.length]} 0%, ${avatarColors[(index + 1) % avatarColors.length]} 100%);">
                    ${person.name.charAt(0).toUpperCase()}
                </div>
                <div>
                    <div class="details-person-name">${escapeHtml(person.name)}</div>
                </div>
            </div>
            <span class="details-person-amount" style="color: var(--warning)">${person.count} pending</span>
        </li>
    `).join('');
}

// Close details modal
function closeDetailsModal() {
    detailsModal.classList.remove('active');
}

// Close details modal on outside click
if (detailsModal) {
    detailsModal.addEventListener('click', (e) => {
        if (e.target === detailsModal) {
            closeDetailsModal();
        }
    });
}

// Check if date is overdue
function isOverdue(dateString) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = toDateObject(dateString);
    if (!dueDate) return false;
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

// Format date for display (DD/MM/YYYY)
function formatDate(dateString) {
    if (!dateString) return '-';
    return isoToDDMMYYYY(dateString);
}

// Render single transaction item
function renderTransactionItem(transaction, showPerson = false) {
    const isShared = transaction.isShared === true;
    const isIncome = transaction.type === 'regular' ? transaction.amount > 0 : transaction.type === 'lend';
    
    let badgeHtml = '';
    if (transaction.type === 'lend') {
        // For shared transactions, reverse the label (their lend = my borrow)
        if (isShared) {
            badgeHtml = `<span class="transaction-badge badge-borrow">BORROWED from ${escapeHtml(transaction.ownerName || 'Unknown')}</span>`;
        } else {
            badgeHtml = `<span class="transaction-badge badge-lend">LENT${showPerson ? '' : ' to ' + escapeHtml(transaction.person)}</span>`;
        }
    } else if (transaction.type === 'borrow') {
        // For shared transactions, reverse the label (their borrow = my lend)
        if (isShared) {
            badgeHtml = `<span class="transaction-badge badge-lend">LENT to ${escapeHtml(transaction.ownerName || 'Unknown')}</span>`;
        } else {
            badgeHtml = `<span class="transaction-badge badge-borrow">BORROWED${showPerson ? '' : ' from ' + escapeHtml(transaction.person)}</span>`;
        }
    }
    
    if (transaction.settled) {
        badgeHtml += '<span class="transaction-badge badge-settled">SETTLED</span>';
    }
    
    // Add shared indicator
    if (isShared) {
        badgeHtml += '<span class="transaction-badge badge-shared">SHARED</span>';
    }
    
    const category = transaction.type === 'regular' ? transaction.category : transaction.type;
    
    // For shared transactions, reverse the income/expense display
    const displayAsIncome = isShared ? !isIncome : isIncome;
    
    return `
        <li class="transaction-item ${displayAsIncome ? 'income' : 'expense'}">
            <div class="transaction-icon">${categoryIcons[category]}</div>
            <div class="transaction-info">
                <div class="description">${escapeHtml(transaction.description)} ${badgeHtml}</div>
                <div class="meta">
                    <span>${formatDate(transaction.date)}</span>
                </div>
                ${transaction.dueDate && !transaction.settled ? `
                    <div class="transaction-due ${isOverdue(transaction.dueDate) ? 'overdue' : ''}">
                        📅 Due: ${formatDate(transaction.dueDate)}${isOverdue(transaction.dueDate) ? ' (OVERDUE)' : ''}
                    </div>
                ` : ''}
            </div>
            <span class="transaction-amount ${displayAsIncome ? 'income' : 'expense'}">
                ${displayAsIncome ? '+' : '-'}${formatMoney(transaction.amount)}
            </span>
            ${!isShared ? `
            <div class="transaction-actions">
                <button class="edit-btn" onclick="openEditModal('${transaction.id}')" title="Edit">
                    <span class="material-symbols-outlined">edit</span>
                </button>
                ${(transaction.type === 'lend' || transaction.type === 'borrow') && !transaction.settled ? 
                    `<button class="settle-btn" onclick="settleTransaction('${transaction.id}')" title="Mark as settled">
                        <span class="material-symbols-outlined">check</span>
                    </button>` : ''
                }
                <button class="delete-btn" onclick="deleteTransaction('${transaction.id}')" title="Delete">
                    <span class="material-symbols-outlined">delete</span>
                </button>
            </div>
            ` : `
            <div class="transaction-actions">
                <span class="shared-view-only" title="Shared transaction - view only">👁️</span>
            </div>
            `}
        </li>
    `;
}

// Render recent transactions (last 5)
function renderRecentTransactions() {
    // Combine own and shared transactions for recent list
    const allTransactions = [...transactions, ...sharedTransactions];
    const recent = allTransactions
        .sort((a, b) => (toDateObject(b.date)?.getTime() ?? 0) - (toDateObject(a.date)?.getTime() ?? 0))
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
        (toDateObject(b.date)?.getTime() ?? 0) - (toDateObject(a.date)?.getTime() ?? 0)
    );

    transactionList.innerHTML = sorted.map(t => renderTransactionItem(t)).join('');
}

// Add transaction
async function addTransaction(e) {
    e.preventDefault();

    const type = transactionTypeInput.value;
    const description = descriptionInput.value.trim();
    const amount = Math.abs(parseFloat(amountInput.value));
    const dateValue = dateInput.value;
    const date = parseDDMMYYYY(dateValue);

    if (!description || isNaN(amount) || !date) {
        alert('Please fill in all required fields (use DD/MM/YYYY format for dates)');
        return;
    }

    // Get person from select dropdown
    const personName = personSelect.value;
    if (!personName) {
        alert('Please select a person');
        return;
    }
    
    // Find the selected person to get their email (store in lowercase for sharing)
    const selectedPerson = savedPeople.find(p => p.name === personName);
    const personEmail = selectedPerson && selectedPerson.email ? selectedPerson.email.toLowerCase() : null;

    // Parse due date
    const dueDateValue = dueDateInput.value;
    const dueDate = dueDateValue ? parseDDMMYYYY(dueDateValue) : null;

    // Handle reminder date for custom option
    let reminderValue = reminderInput.value;
    let customReminderDate = null;
    if (reminderValue === 'custom' && reminderDateInput && reminderDateInput.value) {
        customReminderDate = parseDDMMYYYY(reminderDateInput.value);
    }

    const transaction = {
        id: generateId(),
        type,
        description,
        date,
        amount,
        person: personName,
        personEmail: personEmail || null,
        category: type,
        dueDate: dueDate,
        reminder: reminderValue,
        customReminderDate: customReminderDate,
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
    reminderInput.value = 'none';
    if (reminderDateField) reminderDateField.style.display = 'none';
    if (reminderDateInput) reminderDateInput.value = '';
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

// ========================================
// Edit Transaction Functions
// ========================================

const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const editIdInput = document.getElementById('edit-id');
const editTypeInput = document.getElementById('edit-type');
const editDescriptionInput = document.getElementById('edit-description');
const editAmountInput = document.getElementById('edit-amount');
const editPersonInput = document.getElementById('edit-person');
const editDateInput = document.getElementById('edit-date');
const editDueDateInput = document.getElementById('edit-due-date');
const editSettledInput = document.getElementById('edit-settled');

// Setup date inputs for edit modal
function setupEditDateInputs() {
    setupDateInput(editDateInput);
    setupDateInput(editDueDateInput);
}

// Open edit modal with transaction data
function openEditModal(transactionId) {
    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) return;
    
    // Populate person dropdown
    editPersonInput.innerHTML = savedPeople.map(p => 
        `<option value="${escapeHtml(p.name)}" ${p.name === transaction.person ? 'selected' : ''}>${escapeHtml(p.name)}</option>`
    ).join('');
    
    // Populate form fields
    editIdInput.value = transaction.id;
    editTypeInput.value = transaction.type;
    editDescriptionInput.value = transaction.description;
    editAmountInput.value = transaction.amount;
    editDateInput.value = isoToDDMMYYYY(transaction.date);
    editDueDateInput.value = transaction.dueDate ? isoToDDMMYYYY(transaction.dueDate) : '';
    editSettledInput.value = transaction.settled ? 'true' : 'false';
    
    // Setup date input formatting
    setupEditDateInputs();
    
    // Show modal
    editModal.classList.add('active');
}

// Close edit modal
function closeEditModal() {
    editModal.classList.remove('active');
    editForm.reset();
}

// Handle edit form submission
if (editForm) {
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = editIdInput.value;
        const transactionIndex = transactions.findIndex(t => t.id === id);
        
        if (transactionIndex === -1) {
            alert('Transaction not found!');
            return;
        }
        
        // Parse dates
        const date = parseDDMMYYYY(editDateInput.value);
        const dueDate = editDueDateInput.value ? parseDDMMYYYY(editDueDateInput.value) : null;
        
        if (!date) {
            alert('Please enter a valid date (DD/MM/YYYY)');
            return;
        }
        
        // Get person email
        const personName = editPersonInput.value;
        const selectedPerson = savedPeople.find(p => p.name === personName);
        const personEmail = selectedPerson ? selectedPerson.email : '';
        
        // Update transaction
        const updatedTransaction = {
            ...transactions[transactionIndex],
            type: editTypeInput.value,
            description: editDescriptionInput.value.trim(),
            amount: Math.abs(parseFloat(editAmountInput.value)),
            person: personName,
            personEmail: personEmail || null,
            category: editTypeInput.value,
            date: date,
            dueDate: dueDate,
            settled: editSettledInput.value === 'true'
        };
        
        transactions[transactionIndex] = updatedTransaction;
        
        // Save changes
        saveToLocalStorage();
        await updateTransactionInFirebase(updatedTransaction);
        
        // Close modal and update UI
        closeEditModal();
        updateUI();
        checkReminders();
        
        // Show confirmation
        showToast('Transaction updated successfully!');
    });
}

// Show toast notification
function showToast(message) {
    // Remove existing toast if any
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Create toast
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <span class="material-symbols-outlined">check_circle</span>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Hide and remove toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Close modal on outside click
if (editModal) {
    editModal.addEventListener('click', (e) => {
        if (e.target === editModal) {
            closeEditModal();
        }
    });
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
            showNotification('Person added!');
        }
    });
}

// Add Person button in Quick Add form (navigate to People section)
if (addPersonBtn) {
    addPersonBtn.addEventListener('click', () => {
        navItems.forEach(item => {
            item.classList.toggle('active', item.dataset.section === 'people');
        });
        contentSections.forEach(section => {
            section.classList.toggle('active', section.id === 'people-section');
        });
        pageTitle.textContent = 'People';
        
        setTimeout(() => {
            if (newPersonNameInput) newPersonNameInput.focus();
        }, 100);
    });
}

// Event Listeners
form.addEventListener('submit', addTransaction);
filterType.addEventListener('change', updateUI);
clearAllBtn.addEventListener('click', clearAllTransactions);

// Check reminders periodically (every minute)
setInterval(checkReminders, 60000);

// Initialize
init();
