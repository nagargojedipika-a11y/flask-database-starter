// ================== GLOBAL CACHE ==================
let authorCache = [];
let bookCache = [];
let authorBackup = [];
let bookBackup = [];

// ================== STATS ==================
function updateStats() {
    document.getElementById('totalAuthors').innerText = authorBackup.length;
    document.getElementById('totalBooks').innerText = bookBackup.length;
}

// ================== SECTION SWITCH ==================
function showSection(s) {
    ['authors','books'].forEach(x=>{
        document.getElementById(x+'-section').classList.remove('active');
        document.getElementById(x+'-tab').classList.remove('active');
    });
    document.getElementById(s+'-section').classList.add('active');
    document.getElementById(s+'-tab').classList.add('active');
}

// ================== AUTHOR ==================
async function saveAuthor() {
    const payload = {
        name: authorName.value,
        city: authorCity.value,
        bio: authorBio.value
    };

    const url = authorId.value ? `/api/authors/${authorId.value}` : '/api/authors';
    const method = authorId.value ? 'PUT' : 'POST';

    await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    authorId.value = '';
    authorName.value = '';
    authorCity.value = '';
    authorBio.value = '';

    await loadAuthors();
    loadAuthorsInBookSelect();
}

async function deleteAuthor(id) {
    if (confirm('Move to Trash?')) {
        await fetch(`/api/authors/${id}`, {
            method: 'PUT',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ deleted: true })
        });
        loadAuthors();
        loadAuthorsInBookSelect();
    }
}

async function loadAuthors() {
    const search = document.getElementById('author-search').value.toLowerCase();
    const response = await fetch('/api/authors?deleted=false');
    const data = await response.json();
    
    authorBackup = data.authors;  // store total authors
    authorCache = [...authorBackup];   // use full list for filtering

    const filtered = authorCache.filter(a =>
        a.name.toLowerCase().includes(search) ||
        (a.city || '').toLowerCase().includes(search)
    );

    renderAuthors(filtered);
    updateStats();
}

function renderAuthors(list) {
    const tbody = document.querySelector('#authors-table tbody');
    tbody.innerHTML = '';
    list.forEach(a => {
        tbody.innerHTML += `
        <tr>
            <td>${a.id}</td>
            <td>${a.name}</td>
            <td>${a.bio || ''}</td>
            <td>${a.city || ''}</td>
            <td>
                <button onclick='fillAuthorForm(${JSON.stringify(a)})'>Edit</button>
                <button onclick='deleteAuthor(${a.id})'>Delete</button>
            </td>
        </tr>`;
    });
}

function fillAuthorForm(author){
    authorId.value = author.id;
    authorName.value = author.name;
    authorCity.value = author.city || '';
    authorBio.value = author.bio || '';
}

function sortAuthors(value) {
    if (value === 'name') authorCache.sort((a, b) => a.name.localeCompare(b.name));
    if (value === 'city') authorCache.sort((a, b) => (a.city || '').localeCompare(b.city || ''));
    renderAuthors(authorCache);
}

// ================== BOOK ==================
function loadAuthorsInBookSelect() {
    const bookAuthor = document.getElementById('bookAuthor');
    bookAuthor.innerHTML = '<option value="">Select Author</option>';
    authorBackup.forEach(a => {
        const opt = document.createElement("option");
        opt.value = a.id;
        opt.textContent = a.name;
        bookAuthor.appendChild(opt);
    });
}

async function saveBook() {
    if (!bookTitle.value || !bookYear.value || !bookIsbn.value || !bookAuthor.value) {
        alert("Please fill all fields");
        return;
    }

    const payload = {
        title: bookTitle.value.trim(),
        year: parseInt(bookYear.value),
        isbn: bookIsbn.value.trim(),
        author_id: parseInt(bookAuthor.value)
    };

    const url = bookId.value ? `/api/books/${bookId.value}` : '/api/books';
    const method = bookId.value ? 'PUT' : 'POST';

    const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        alert("Failed to save book");
        return;
    }

    bookId.value = '';
    bookTitle.value = '';
    bookYear.value = '';
    bookIsbn.value = '';
    bookAuthor.value = '';

    loadBooks();
}

async function deleteBook(id) {
    if (confirm('Move to Trash?')) {
        await fetch(`/api/books/${id}`, {
            method: 'PUT',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ deleted: true })
        });
        loadBooks();
    }
}

async function loadBooks() {
    const searchInput = document.getElementById('book-search');
    const search = searchInput.value.toLowerCase();

    const response = await fetch(`/api/books?deleted=false`);
    const data = await response.json();

    bookBackup = data.books;  // store total books
    bookCache = [...bookBackup];  // reset cache before filtering

    const filtered = bookCache.filter(b =>
        b.title.toLowerCase().includes(search) ||
        (b.author_name || '').toLowerCase().includes(search)
    );

    renderBooks(filtered);
    updateStats();
}

function renderBooks(list) {
    const tbody = document.querySelector('#books-table tbody');
    tbody.innerHTML = '';
    list.forEach(b => {
        tbody.innerHTML += `
        <tr>
            <td>${b.id}</td>
            <td>${b.title}</td>
            <td>${b.author_name || ''}</td>
            <td>${b.year || ''}</td>
            <td>${b.isbn || ''}</td>
            <td>
                <button onclick='fillBookForm(${JSON.stringify(b)})'>Edit</button>
                <button onclick='deleteBook(${b.id})'>Delete</button>
            </td>
        </tr>`;
    });
}

function fillBookForm(book){
    bookId.value = book.id;
    bookTitle.value = book.title;
    bookYear.value = book.year;
    bookIsbn.value = book.isbn;
    bookAuthor.value = book.author_id;
}

function sortBooks(value) {
    if (value === 'title') bookCache.sort((a, b) => a.title.localeCompare(b.title));
    if (value === 'year') bookCache.sort((a, b) => (a.year || 0) - (b.year || 0));
    renderBooks(bookCache);
}

// ================== INIT (ONLY ONCE) ==================
document.addEventListener("DOMContentLoaded", async () => {
    await loadAuthors();
    loadAuthorsInBookSelect();
    await loadBooks();
});