'use client';

interface TransactionNotification {
  id: string;
  transactionId: string;
  message: string;
  type: 'confirmation' | 'status_change' | 'payment';
  timestamp: Date;
  read: boolean;
}

interface TransactionNotificationProps {
  notifications: TransactionNotification[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
}

export default function TransactionNotifications({ 
  notifications, 
  onMarkAsRead, 
  onClearAll 
}: TransactionNotificationProps) {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`bg-white border-l-4 rounded-lg shadow-lg p-4 transform transition-all duration-300 ${
            notification.type === 'confirmation' ? 'border-green-500' :
            notification.type === 'status_change' ? 'border-blue-500' :
            'border-yellow-500'
          } ${!notification.read ? 'opacity-100' : 'opacity-75'}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <div className={`w-2 h-2 rounded-full ${
                  notification.type === 'confirmation' ? 'bg-green-500' :
                  notification.type === 'status_change' ? 'bg-blue-500' :
                  'bg-yellow-500'
                }`}></div>
                <span className="text-xs text-gray-500">
                  {notification.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm text-gray-800 leading-tight">
                {notification.message}
              </p>
            </div>
            <button
              onClick={() => onMarkAsRead(notification.id)}
              className="ml-2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      ))}
      
      {notifications.length > 1 && (
        <button
          onClick={onClearAll}
          className="w-full text-xs text-gray-500 hover:text-gray-700 py-1 text-center"
        >
          Clear all notifications
        </button>
      )}
    </div>
  );
}