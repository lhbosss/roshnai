'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href: string;
  current?: boolean;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  bookTitle?: string;
  transactionId?: string;
}

export default function Breadcrumb({ items, bookTitle, transactionId }: BreadcrumbProps) {
  const pathname = usePathname();

  // Auto-generate breadcrumbs based on current path if not provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Home', href: '/' }
    ];

    let currentPath = '';
    
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === segments.length - 1;

      switch (segment) {
        case 'borrow':
          breadcrumbs.push({
            label: 'Browse Books',
            href: '/borrow',
            current: isLast
          });
          break;
        case 'books':
          if (segments[index + 1]) {
            breadcrumbs.push({
              label: 'Book Details',
              href: currentPath + '/' + segments[index + 1],
              current: false
            });
          }
          break;
        case 'my-books':
          breadcrumbs.push({
            label: 'My Books',
            href: '/my-books',
            current: isLast
          });
          break;
        case 'add':
          breadcrumbs.push({
            label: 'Add Book',
            href: currentPath,
            current: isLast
          });
          break;
        case 'transactions':
          breadcrumbs.push({
            label: 'Transactions',
            href: '/transactions',
            current: isLast
          });
          break;
        case 'messages':
          breadcrumbs.push({
            label: 'Messages',
            href: '/messages',
            current: isLast
          });
          break;
        case 'profile':
          breadcrumbs.push({
            label: 'Profile',
            href: '/profile',
            current: isLast
          });
          break;
        case 'complaints':
          breadcrumbs.push({
            label: 'Complaints',
            href: '/complaints',
            current: isLast
          });
          break;
        default:
          // For dynamic segments like book IDs or transaction IDs
          if (segment.match(/^[0-9a-fA-F]{24}$/)) {
            // MongoDB ObjectId pattern
            if (segments[index - 1] === 'books' && bookTitle) {
              breadcrumbs.push({
                label: bookTitle,
                href: currentPath,
                current: isLast
              });
            } else if (segments[index - 1] === 'transactions' && transactionId) {
              breadcrumbs.push({
                label: `Transaction ${transactionId.slice(-6)}`,
                href: currentPath,
                current: isLast
              });
            } else {
              breadcrumbs.push({
                label: segment.charAt(0).toUpperCase() + segment.slice(1),
                href: currentPath,
                current: isLast
              });
            }
          } else {
            breadcrumbs.push({
              label: segment.charAt(0).toUpperCase() + segment.slice(1).replace('-', ' '),
              href: currentPath,
              current: isLast
            });
          }
      }
    });

    return breadcrumbs;
  };

  const breadcrumbItems = items || generateBreadcrumbs();

  if (breadcrumbItems.length <= 1) {
    return null;
  }

  return (
    <nav className="flex mb-4" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        {breadcrumbItems.map((item, index) => (
          <li key={item.href} className="inline-flex items-center">
            {index > 0 && (
              <svg
                className="w-6 h-6 text-gray-400 mx-1"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            {item.current ? (
              <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2 dark:text-gray-400">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="ml-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ml-2 dark:text-gray-400 dark:hover:text-white"
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}