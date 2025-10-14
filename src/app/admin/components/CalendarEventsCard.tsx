'use client';

import React, { useState, useEffect } from 'react';
import ContentCard from '@/components/ui/ContentCard';
import Button from '@/components/ui/Button';
import { Calendar, Copy, ExternalLink, Check } from 'lucide-react';

interface Booking {
  id: string;
  startTime: string;
  endTime: string;
  attendeeName: string;
  attendeeEmail: string;
  status: string;
  notes: string | null;
  createdAt: string;
  meetingType: {
    name: string;
    description: string | null;
    duration: number;
  };
  conversationId: string;
}

interface CalendarEventsCardProps {
  appId: string;
}

export const CalendarEventsCard: React.FC<CalendarEventsCardProps> = ({ appId }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const calendarUrl = `${window.location.origin}/api/public/calendar/${appId}/bookings.ics`;

  useEffect(() => {
    fetchBookings();
  }, [appId]);

  const fetchBookings = async () => {
    try {
      const response = await fetch(`/api/admin/chat/bookings?appId=${appId}`);
      const data = await response.json();
      
      if (data.success) {
        setBookings(data.bookings);
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyCalendarUrl = async () => {
    try {
      await navigator.clipboard.writeText(calendarUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <ContentCard
      title="Calendar Events"
      description="View scheduled meetings and subscribe to calendar feed"
    >
      {/* Calendar Subscription URL */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h4 className="font-medium text-sm text-gray-900">Calendar Subscription URL</h4>
            <p className="text-xs text-gray-600 mt-1">
              Subscribe in Apple Calendar, Google Calendar, Outlook, or any calendar app
            </p>
          </div>
          <a
            href={calendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
        
        <div className="flex items-center gap-2 mt-3">
          <input
            type="text"
            value={calendarUrl}
            readOnly
            className="flex-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded-md font-mono"
          />
          <Button
            onClick={copyCalendarUrl}
            variant="outline"
            className="flex items-center gap-2"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Bookings List */}
      <div>
        <h4 className="font-medium text-sm text-gray-900 mb-3">
          Scheduled Events ({bookings.length})
        </h4>
        
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading bookings...</div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No bookings yet. Events will appear here when users schedule meetings through chat.
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="font-medium text-sm text-gray-900">
                        {booking.meetingType.name}
                      </h5>
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(
                          booking.status
                        )}`}
                      >
                        {booking.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">
                      {booking.attendeeName} ({booking.attendeeEmail})
                    </p>
                  </div>
                </div>
                
                <div className="text-xs text-gray-600 space-y-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(booking.startTime)}</span>
                    <span className="text-gray-400">•</span>
                    <span>{booking.meetingType.duration} min</span>
                  </div>
                  
                  {booking.notes && (
                    <div className="mt-2 p-2 bg-white rounded text-xs">
                      <span className="font-medium">Notes:</span> {booking.notes}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ContentCard>
  );
};

