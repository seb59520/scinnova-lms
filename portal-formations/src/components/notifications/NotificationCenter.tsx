import React, { useState } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { 
  Bell, Check, CheckCheck, Trash2, Settings, X,
  BookOpen, Trophy, MessageSquare, Calendar, AlertCircle, FileText
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import type { Notification, NotificationType } from '../../types/sessions';

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications();

  const getIcon = (type: NotificationType) => {
    const icons: Record<string, React.ReactNode> = {
      session_reminder: <Calendar className="h-4 w-4 text-blue-500" />,
      session_started: <BookOpen className="h-4 w-4 text-green-500" />,
      session_ended: <BookOpen className="h-4 w-4 text-gray-500" />,
      new_activity: <FileText className="h-4 w-4 text-purple-500" />,
      deadline_reminder: <AlertCircle className="h-4 w-4 text-orange-500" />,
      deadline_passed: <AlertCircle className="h-4 w-4 text-red-500" />,
      grade_published: <Trophy className="h-4 w-4 text-yellow-500" />,
      feedback_received: <MessageSquare className="h-4 w-4 text-blue-500" />,
      trainer_message: <MessageSquare className="h-4 w-4 text-purple-500" />,
      certificate_ready: <Trophy className="h-4 w-4 text-green-500" />,
      system: <Bell className="h-4 w-4 text-gray-500" />
    };
    return icons[type] || <Bell className="h-4 w-4 text-gray-500" />;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-l-red-500';
      case 'high': return 'border-l-orange-500';
      case 'normal': return 'border-l-blue-500';
      default: return 'border-l-gray-300';
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    if (notification.action_url) {
      setIsOpen(false);
      window.location.href = notification.action_url;
    }
  };

  return (
    <div className="relative">
      {/* Bouton */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panneau des notifications */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Contenu */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border z-50 max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsRead()}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                    title="Tout marquer comme lu"
                  >
                    <CheckCheck className="h-4 w-4" />
                  </button>
                )}
                <Link
                  to="/profile#notifications"
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                  title="Paramètres"
                >
                  <Settings className="h-4 w-4" />
                </Link>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Liste */}
            <div className="overflow-y-auto flex-1">
              {isLoading ? (
                <div className="p-8 text-center text-gray-500">
                  Chargement...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>Aucune notification</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`
                        p-4 hover:bg-gray-50 transition-colors cursor-pointer
                        border-l-4 ${getPriorityColor(notification.priority)}
                        ${!notification.is_read ? 'bg-blue-50/50' : ''}
                      `}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex gap-3">
                        <div className="mt-0.5">
                          {getIcon(notification.notification_type)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <p className={`text-sm ${!notification.is_read ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                              {notification.title}
                            </p>
                            {!notification.is_read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                            )}
                          </div>

                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {notification.message}
                          </p>

                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-400">
                              {formatDistanceToNow(new Date(notification.created_at), {
                                addSuffix: true,
                                locale: fr
                              })}
                            </span>

                            <div className="flex gap-1">
                              {!notification.is_read && (
                                <button
                                  className="p-1 text-gray-400 hover:text-blue-600 rounded"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                  }}
                                  title="Marquer comme lu"
                                >
                                  <Check className="h-3 w-3" />
                                </button>
                              )}
                              <button
                                className="p-1 text-gray-400 hover:text-red-600 rounded"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                }}
                                title="Supprimer"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-2 border-t">
                <Link
                  to="/notifications"
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-center py-2 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                >
                  Voir toutes les notifications
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
