import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin, Users, Edit, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { calendarApi } from '@/lib/api';

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: Date;
  startTime: string;
  endTime: string;
  type: 'meeting' | 'deadline' | 'submission' | 'site_visit' | 'presentation';
  location?: string;
  attendees: string[];
  projectId?: string;
}

// Events will be loaded from real APIs

export function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    type: 'meeting' as CalendarEvent['type'],
    location: '',
    attendees: ''
  });

  // Load events from API
  useEffect(() => {
    const loadEvents = async () => {
      setIsLoading(true);
      try {
        const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
        const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString();
        
        const response = await calendarApi.getEvents({ startDate, endDate });
        if (response.data?.events) {
          const formattedEvents = response.data.events.map((event: any) => ({
            id: event.id,
            title: event.title || event.name,
            description: event.description || event.details || '',
            date: new Date(event.date || event.startDate || event.createdAt),
            startTime: event.startTime || event.start_time || '00:00',
            endTime: event.endTime || event.end_time || '00:00',
            type: event.type || 'meeting',
            location: event.location || '',
            attendees: event.attendees || event.participants || [],
            projectId: event.projectId || event.project_id
          }));
          setEvents(formattedEvents);
        }
      } catch (error) {
        console.error('Failed to load events:', error);
        toast.error('Failed to load calendar events');
      } finally {
        setIsLoading(false);
      }
    };

    loadEvents();
  }, [currentDate]);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => 
      event.date.getDate() === date.getDate() &&
      event.date.getMonth() === date.getMonth() &&
      event.date.getFullYear() === date.getFullYear()
    );
  };

  const getEventTypeColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'meeting':
        return 'bg-blue-100 text-blue-800';
      case 'deadline':
        return 'bg-red-100 text-red-800';
      case 'submission':
        return 'bg-orange-100 text-orange-800';
      case 'site_visit':
        return 'bg-green-100 text-green-800';
      case 'presentation':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const openEventDialog = (event?: CalendarEvent) => {
    if (event) {
      setEditingEvent(event);
      setNewEvent({
        title: event.title,
        description: event.description,
        startTime: event.startTime,
        endTime: event.endTime,
        type: event.type,
        location: event.location || '',
        attendees: event.attendees.join(', ')
      });
    } else {
      setEditingEvent(null);
      setNewEvent({
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        type: 'meeting',
        location: '',
        attendees: ''
      });
    }
    setIsEventDialogOpen(true);
  };

  const saveEvent = () => {
    if (!selectedDate || !newEvent.title) {
      toast.error('Please select a date and enter a title');
      return;
    }

    const eventData: CalendarEvent = {
      id: editingEvent?.id || Date.now().toString(),
      title: newEvent.title,
      description: newEvent.description,
      date: selectedDate,
      startTime: newEvent.startTime,
      endTime: newEvent.endTime,
      type: newEvent.type,
      location: newEvent.location,
      attendees: newEvent.attendees.split(',').map(a => a.trim()).filter(Boolean)
    };

    if (editingEvent) {
      setEvents(events.map(e => e.id === editingEvent.id ? eventData : e));
      toast.success('Event updated successfully');
    } else {
      setEvents([...events, eventData]);
      toast.success('Event created successfully');
    }

    setNewEvent({
      title: '',
      description: '',
      startTime: '',
      endTime: '',
      type: 'meeting',
      location: '',
      attendees: ''
    });
    setEditingEvent(null);
    setIsEventDialogOpen(false);
  };

  const deleteEvent = (eventId: string) => {
    setEvents(events.filter(e => e.id !== eventId));
    toast.success('Event deleted successfully');
  };

  const renderCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];
    const today = new Date();

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-32 border border-gray-200"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayEvents = getEventsForDate(date);
      const isToday = 
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
      const isSelected = selectedDate && 
        date.getDate() === selectedDate.getDate() &&
        date.getMonth() === selectedDate.getMonth() &&
        date.getFullYear() === selectedDate.getFullYear();

      days.push(
        <div
          key={day}
          className={`h-32 border border-gray-200 p-2 cursor-pointer hover:bg-gray-50 ${
            isToday ? 'bg-blue-50 border-blue-300' : ''
          } ${
            isSelected ? 'bg-blue-100 border-blue-500' : ''
          }`}
          onClick={() => setSelectedDate(date)}
        >
          <div className={`text-sm font-medium ${
            isToday ? 'text-blue-600' : 'text-gray-900'
          }`}>
            {day}
          </div>
          <div className="space-y-1 mt-1">
            {dayEvents.slice(0, 2).map(event => (
              <div
                key={event.id}
                className={`text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 ${
                  getEventTypeColor(event.type)
                }`}
                title={event.title}
                onClick={(e) => {
                  e.stopPropagation();
                  openEventDialog(event);
                }}
              >
                {event.startTime} {event.title}
              </div>
            ))}
            {dayEvents.length > 2 && (
              <div className="text-xs text-gray-500">+{dayEvents.length - 2} more</div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigateMonth('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-light architect-heading">
            {currentDate.toLocaleDateString('en-MY', { month: 'long', year: 'numeric' })}
          </h2>
          <Button variant="outline" onClick={() => navigateMonth('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={goToToday}>
            Today
          </Button>
        </div>
        
        <Button className="bg-black hover:bg-gray-800" onClick={() => openEventDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Event
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-3">
          <Card className="architect-border">
            <CardContent className="p-0">
              {/* Days of week header */}
              <div className="grid grid-cols-7 border-b border-gray-200">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-3 text-center font-medium text-gray-600 border-r border-gray-200 last:border-r-0">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar grid */}
              <div className="grid grid-cols-7">
                {renderCalendarGrid()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Event Details Sidebar */}
        <div className="space-y-6">
          {/* Selected Date Events */}
          <Card className="architect-border">
            <CardHeader>
              <CardTitle className="architect-heading">
                {selectedDate ? formatDate(selectedDate) : 'Select a Date'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDateEvents.length > 0 ? (
                <div className="space-y-3">
                  {selectedDateEvents.map(event => (
                    <div key={event.id} className="p-3 border border-gray-200 rounded-md">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{event.title}</h4>
                          <Badge className={`${getEventTypeColor(event.type)} text-xs mt-1`}>
                            {event.type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEventDialog(event)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteEvent(event.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="mt-2 space-y-1 text-xs text-gray-600">
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {event.startTime} - {event.endTime}
                        </div>
                        {event.location && (
                          <div className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {event.location}
                          </div>
                        )}
                        {event.attendees.length > 0 && (
                          <div className="flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            {event.attendees.slice(0, 2).join(', ')}
                            {event.attendees.length > 2 && ` +${event.attendees.length - 2} more`}
                          </div>
                        )}
                      </div>
                      
                      {event.description && (
                        <p className="text-xs text-gray-600 mt-2">{event.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  {selectedDate ? 'No events scheduled' : 'Click on a date to view events'}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="architect-border">
            <CardHeader>
              <CardTitle className="architect-heading text-sm">This Month</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Events</span>
                <span className="font-medium">{events.filter(e => 
                  e.date.getMonth() === currentDate.getMonth() &&
                  e.date.getFullYear() === currentDate.getFullYear()
                ).length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Meetings</span>
                <span className="font-medium">{events.filter(e => 
                  e.type === 'meeting' &&
                  e.date.getMonth() === currentDate.getMonth() &&
                  e.date.getFullYear() === currentDate.getFullYear()
                ).length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Deadlines</span>
                <span className="font-medium">{events.filter(e => 
                  e.type === 'deadline' &&
                  e.date.getMonth() === currentDate.getMonth() &&
                  e.date.getFullYear() === currentDate.getFullYear()
                ).length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Event Dialog */}
      <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Edit Event' : 'Add New Event'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Event Title</Label>
              <Input
                id="title"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                placeholder="Enter event title"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                placeholder="Event description"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={newEvent.startTime}
                  onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={newEvent.endTime}
                  onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="type">Event Type</Label>
              <Select value={newEvent.type} onValueChange={(value: CalendarEvent['type']) => setNewEvent({ ...newEvent, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="deadline">Deadline</SelectItem>
                  <SelectItem value="submission">Submission</SelectItem>
                  <SelectItem value="site_visit">Site Visit</SelectItem>
                  <SelectItem value="presentation">Presentation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={newEvent.location}
                onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                placeholder="Event location"
              />
            </div>
            
            <div>
              <Label htmlFor="attendees">Attendees</Label>
              <Input
                id="attendees"
                value={newEvent.attendees}
                onChange={(e) => setNewEvent({ ...newEvent, attendees: e.target.value })}
                placeholder="Comma-separated names"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEventDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveEvent} className="bg-black hover:bg-gray-800">
                {editingEvent ? 'Update Event' : 'Add Event'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}