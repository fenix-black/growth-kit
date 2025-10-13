'use client';

import { useState, useEffect } from 'react';
import { App } from '@prisma/client';
import ContentCard from '@/components/ui/ContentCard';
import Button from '@/components/ui/Button';

interface MeetingType {
  id?: string;
  name: string;
  description?: string;
  durationMinutes: number;
  color?: string;
}

interface CalendarSettingsCardProps {
  app: App;
}

export function CalendarSettingsCard({ app }: CalendarSettingsCardProps) {
  const [timezone, setTimezone] = useState('America/New_York');
  const [workingHours, setWorkingHours] = useState({
    monday: { start: '09:00', end: '17:00' },
    tuesday: { start: '09:00', end: '17:00' },
    wednesday: { start: '09:00', end: '17:00' },
    thursday: { start: '09:00', end: '17:00' },
    friday: { start: '09:00', end: '17:00' },
    saturday: { start: '', end: '' },
    sunday: { start: '', end: '' }
  });
  const [meetingTypes, setMeetingTypes] = useState<MeetingType[]>([
    { name: 'Demo Call', durationMinutes: 30, description: '30-minute product demo' },
    { name: 'Consultation', durationMinutes: 60, description: '1-hour consultation' }
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load existing calendar configuration
  useEffect(() => {
    const loadCalendarConfig = async () => {
      try {
        const response = await fetch(`/api/admin/chat/calendar?appId=${app.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.data.calendarConfig) {
            setTimezone(data.data.calendarConfig.timezone);
            setWorkingHours(data.data.calendarConfig.workingHours);
            setMeetingTypes(data.data.meetingTypes.map((mt: any) => ({
              id: mt.id,
              name: mt.name,
              description: mt.description,
              durationMinutes: mt.durationMinutes
            })));
          }
        }
      } catch (error) {
        console.error('Error loading calendar config:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCalendarConfig();
  }, [app.id]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/chat/calendar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appId: app.id,
          timezone,
          workingHours,
          meetingTypes
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save calendar settings');
      }

      alert('Calendar settings saved successfully!');
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save calendar settings');
    } finally {
      setIsSaving(false);
    }
  };

  const addMeetingType = () => {
    setMeetingTypes([...meetingTypes, {
      name: '',
      durationMinutes: 30,
      description: ''
    }]);
  };

  const removeMeetingType = (index: number) => {
    setMeetingTypes(meetingTypes.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return (
      <ContentCard title="Calendar Settings">
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Loading calendar configuration...</div>
        </div>
      </ContentCard>
    );
  }

  return (
    <ContentCard title="Calendar Settings">
      <div className="space-y-4">
        {/* Timezone */}
        <div>
          <label htmlFor="timezone" className="block text-sm font-medium mb-2">Timezone</label>
          <select
            id="timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="America/New_York">Eastern Time (ET)</option>
            <option value="America/Chicago">Central Time (CT)</option>
            <option value="America/Denver">Mountain Time (MT)</option>
            <option value="America/Los_Angeles">Pacific Time (PT)</option>
            <option value="America/Santiago">Chile (Santiago) - GMT-3/GMT-4</option>
            <option value="Europe/London">London (GMT)</option>
            <option value="Europe/Paris">Paris (CET)</option>
            <option value="Asia/Tokyo">Tokyo (JST)</option>
          </select>
        </div>

        {/* Working hours */}
        <div>
          <label className="block text-sm font-medium mb-2">Working Hours</label>
          <div className="space-y-2 mt-2">
            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
              const hours = workingHours[day as keyof typeof workingHours];
              return (
                <div key={day} className="flex items-center gap-2">
                  <div className="w-24 capitalize">{day}</div>
                  <input
                    type="time"
                    value={hours.start}
                    onChange={(e) => setWorkingHours({
                      ...workingHours,
                      [day]: { ...hours, start: e.target.value }
                    })}
                    className="w-32 px-2 py-1 border rounded"
                  />
                  <span>to</span>
                  <input
                    type="time"
                    value={hours.end}
                    onChange={(e) => setWorkingHours({
                      ...workingHours,
                      [day]: { ...hours, end: e.target.value }
                    })}
                    className="w-32 px-2 py-1 border rounded"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Meeting types */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium">Meeting Types</label>
            <button
              onClick={addMeetingType}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
            >
              + Add Type
            </button>
          </div>
          <div className="space-y-3">
            {meetingTypes.map((type, index) => (
              <div key={index} className="p-3 border rounded space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={type.name}
                    onChange={(e) => {
                      const updated = [...meetingTypes];
                      updated[index].name = e.target.value;
                      setMeetingTypes(updated);
                    }}
                    placeholder="Meeting name"
                    className="flex-1 px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="number"
                    value={type.durationMinutes}
                    onChange={(e) => {
                      const updated = [...meetingTypes];
                      updated[index].durationMinutes = parseInt(e.target.value);
                      setMeetingTypes(updated);
                    }}
                    className="w-24 px-3 py-2 border rounded-lg"
                    placeholder="30"
                  />
                  <span className="text-sm text-gray-500 py-2">min</span>
                  <button
                    onClick={() => removeMeetingType(index)}
                    className="px-2 text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                </div>
                <input
                  type="text"
                  value={type.description || ''}
                  onChange={(e) => {
                    const updated = [...meetingTypes];
                    updated[index].description = e.target.value;
                    setMeetingTypes(updated);
                  }}
                  placeholder="Description (optional)"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            ))}
          </div>
        </div>

        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Calendar Settings'}
        </Button>
      </div>
    </ContentCard>
  );
}

