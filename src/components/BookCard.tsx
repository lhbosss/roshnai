import { BookCoverImage } from '@/components/ui/image';
import { Card } from '@/components/ui/card';

interface BookCardProps {
  book: {
    _id: string;
    title: string;
    author: string;
    coverImage?: string;
    description?: string;
    genre?: string;
    isbn?: string;
  };
  onClick?: (bookId: string) => void;
  priority?: boolean;
  className?: string;
}

export function BookCard({ book, onClick, priority = false, className = '' }: BookCardProps) {
  const handleClick = () => {
    onClick?.(book._id);
  };

  return (
    <Card 
      className={`group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${className}`}
      onClick={handleClick}
    >
      <div className="p-4">
        <div className="aspect-[2/3] relative mb-3 overflow-hidden rounded-lg bg-gray-100">
          <BookCoverImage
            src={book.coverImage || '/images/default-book-cover.png'}
            alt={`Cover of ${book.title}`}
            width={160}
            height={240}
            priority={priority}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        </div>
        
        <div className="space-y-2">
          <h3 className="font-semibold text-sm line-clamp-2 text-gray-900">
            {book.title}
          </h3>
          
          <p className="text-xs text-gray-600 line-clamp-1">
            by {book.author}
          </p>
          
          {book.genre && (
            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              {book.genre}
            </span>
          )}
          
          {book.description && (
            <p className="text-xs text-gray-500 line-clamp-2 mt-2">
              {book.description}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

// Grid layout for book cards
export function BookGrid({ 
  books, 
  onBookClick,
  loading = false,
  className = '' 
}: {
  books: Array<BookCardProps['book']>;
  onBookClick?: (bookId: string) => void;
  loading?: boolean;
  className?: string;
}) {
  if (loading) {
    return (
      <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 ${className}`}>
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="aspect-[2/3] bg-gray-200 rounded-lg mb-3"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 ${className}`}>
      {books.map((book, index) => (
        <BookCard
          key={book._id}
          book={book}
          onClick={onBookClick}
          priority={index < 5} // Prioritize first 5 books for loading
        />
      ))}
    </div>
  );
}