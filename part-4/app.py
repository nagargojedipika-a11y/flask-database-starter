from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

app = Flask(__name__, static_folder='frontend', template_folder='frontend')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///api_demo.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# =======================
# MODELS
# =======================
class Author(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    bio = db.Column(db.Text)
    city = db.Column(db.String(100))
    books = db.relationship('Book', backref='author', cascade='all, delete', lazy=True)

    def to_dict(self, with_books=False):
        data = {'id': self.id, 'name': self.name, 'bio': self.bio, 'city': self.city}
        if with_books:
            data['books'] = [b.to_dict() for b in self.books]
        return data

class Book(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    year = db.Column(db.Integer)
    isbn = db.Column(db.String(20))
    author_id = db.Column(db.Integer, db.ForeignKey('author.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "year": self.year,
            "isbn": self.isbn,
            "author_id": self.author_id,
            "author_name": self.author.name if self.author else ""
        }

# =======================
# AUTHOR APIs
# =======================
@app.route('/api/authors', methods=['GET'])
def get_authors():
    search = request.args.get('search')
    query = Author.query
    if search:
        search = search.lower()
        query = query.filter(db.or_(Author.name.ilike(f"%{search}%"), Author.city.ilike(f"%{search}%")))
    authors = query.all()
    return jsonify(success=True, authors=[a.to_dict() for a in authors])

@app.route('/api/authors', methods=['POST'])
def create_author():
    data = request.json
    author = Author(name=data['name'], bio=data.get('bio'), city=data.get('city'))
    db.session.add(author)
    db.session.commit()
    return jsonify(success=True, author=author.to_dict())

@app.route('/api/authors/<int:id>', methods=['PUT'])
def update_author(id):
    author = Author.query.get_or_404(id)
    data = request.json
    author.name = data.get('name', author.name)
    author.city = data.get('city', author.city)
    author.bio = data.get('bio', author.bio)
    db.session.commit()
    return jsonify(success=True, author=author.to_dict())

@app.route('/api/authors/<int:id>', methods=['DELETE'])
def delete_author(id):
    author = Author.query.get_or_404(id)
    db.session.delete(author)
    db.session.commit()
    return jsonify(success=True)

# =======================
# BOOK APIs
# =======================
@app.route('/api/books', methods=['GET'])
def get_books():
    search = request.args.get('search', '')
    query = Book.query.join(Author)
    if search:
        search_term = f"%{search}%"
        query = query.filter(db.or_(
            Book.title.ilike(search_term),
            Book.isbn.ilike(search_term),
            Author.name.ilike(search_term)
        ))
    books = query.all()
    return jsonify(success=True, books=[b.to_dict() for b in books])

@app.route('/api/books', methods=['POST'])
def create_book():
    data = request.json
    book = Book(title=data['title'], year=data.get('year'), isbn=data.get('isbn'), author_id=data['author_id'])
    db.session.add(book)
    db.session.commit()
    return jsonify(success=True, book=book.to_dict())

@app.route('/api/books/<int:id>', methods=['PUT'])
def update_book(id):
    book = Book.query.get_or_404(id)
    data = request.json
    book.title = data.get('title', book.title)
    book.year = data.get('year', book.year)
    book.isbn = data.get('isbn', book.isbn)
    book.author_id = data.get('author_id', book.author_id)
    db.session.commit()
    return jsonify(success=True, book=book.to_dict())

@app.route('/api/books/<int:id>', methods=['DELETE'])
def delete_book(id):
    book = Book.query.get_or_404(id)
    db.session.delete(book)
    db.session.commit()
    return jsonify(success=True)

# =======================
# FRONTEND
# =======================
@app.route('/')
def index():
    return send_from_directory(app.template_folder, 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory(app.static_folder, path)

# =======================
# SAMPLE DATA
# =======================
def init_sample_data():
    if Author.query.count() == 0:
        a1 = Author(name='Chetan Bhagat', bio='Known for youth-oriented stories', city='New Delhi')
        a2 = Author(name='Arundhati Roy', bio='Book Prize Winning Author', city='Shillong')
        a3 = Author(name='Robert C. Martin', bio='Software architect', city='USA')
        db.session.add_all([a1, a2, a3])
        db.session.commit()

        b1 = Book(title='2 states', year=2009, isbn='978-159327989', author_id=a1.id)
        b2 = Book(title='The Ministry of Utmost Happiness', year=2017, isbn='978-1491991442', author_id=a2.id)
        b3 = Book(title='Clean Code', year=2008, isbn='978-0132350884', author_id=a3.id)
        db.session.add_all([b1, b2, b3])
        db.session.commit()

with app.app_context():
    db.create_all()
    init_sample_data()

if __name__ == '__main__':
    app.run(debug=True)
