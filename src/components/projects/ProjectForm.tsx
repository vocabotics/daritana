import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { CalendarIcon, Plus, X } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const projectFormSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  type: z.enum(['renovation', 'new_construction', 'interior', 'landscape', 'commercial', 'residential']),
  status: z.enum(['planning', 'in_progress', 'on_hold', 'completed', 'cancelled']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  budget: z.number().min(0, 'Budget must be positive'),
  startDate: z.date(),
  endDate: z.date(),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  postcode: z.string().regex(/^\d{5}$/, 'Must be 5 digits'),
  clientName: z.string().min(2, 'Client name is required'),
  clientEmail: z.string().email('Invalid email'),
  clientPhone: z.string().regex(/^(\+?6?01)[0-46-9]-*[0-9]{7,8}$/, 'Invalid Malaysian phone number'),
  teamMembers: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional()
})

type ProjectFormValues = z.infer<typeof projectFormSchema>

interface ProjectFormProps {
  onSubmit: (data: ProjectFormValues) => void
  initialData?: Partial<ProjectFormValues>
  isLoading?: boolean
}

export function ProjectForm({ onSubmit, initialData, isLoading }: ProjectFormProps) {
  const [teamMembers, setTeamMembers] = useState<string[]>(initialData?.teamMembers || [])
  const [tags, setTags] = useState<string[]>(initialData?.tags || [])
  const [newMember, setNewMember] = useState('')
  const [newTag, setNewTag] = useState('')

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      type: initialData?.type || 'renovation',
      status: initialData?.status || 'planning',
      priority: initialData?.priority || 'medium',
      budget: initialData?.budget || 0,
      startDate: initialData?.startDate || new Date(),
      endDate: initialData?.endDate || new Date(),
      address: initialData?.address || '',
      city: initialData?.city || 'Kuala Lumpur',
      state: initialData?.state || 'Wilayah Persekutuan',
      postcode: initialData?.postcode || '',
      clientName: initialData?.clientName || '',
      clientEmail: initialData?.clientEmail || '',
      clientPhone: initialData?.clientPhone || '',
      teamMembers: teamMembers,
      tags: tags
    }
  })

  const handleSubmit = (values: ProjectFormValues) => {
    onSubmit({
      ...values,
      teamMembers,
      tags
    })
  }

  const addTeamMember = () => {
    if (newMember && !teamMembers.includes(newMember)) {
      setTeamMembers([...teamMembers, newMember])
      setNewMember('')
    }
  }

  const removeTeamMember = (member: string) => {
    setTeamMembers(teamMembers.filter(m => m !== member))
  }

  const addTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag])
      setNewTag('')
    }
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Basic Information</h3>
          
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project Name</FormLabel>
                <FormControl>
                  <Input placeholder="Modern Office Renovation" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe the project scope and objectives..."
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="renovation">Renovation</SelectItem>
                      <SelectItem value="new_construction">New Construction</SelectItem>
                      <SelectItem value="interior">Interior Design</SelectItem>
                      <SelectItem value="landscape">Landscape</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="residential">Residential</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Timeline & Budget */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Timeline & Budget</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="budget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget (RM)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="150000"
                      {...field}
                      onChange={e => {
                        const value = e.target.value
                        field.onChange(value === '' ? 0 : parseFloat(value))
                      }}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Location */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Location</h3>
          
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input placeholder="123 Jalan Ampang" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder="Kuala Lumpur" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Wilayah Persekutuan">Wilayah Persekutuan</SelectItem>
                      <SelectItem value="Selangor">Selangor</SelectItem>
                      <SelectItem value="Penang">Penang</SelectItem>
                      <SelectItem value="Johor">Johor</SelectItem>
                      <SelectItem value="Perak">Perak</SelectItem>
                      <SelectItem value="Pahang">Pahang</SelectItem>
                      <SelectItem value="Negeri Sembilan">Negeri Sembilan</SelectItem>
                      <SelectItem value="Melaka">Melaka</SelectItem>
                      <SelectItem value="Kedah">Kedah</SelectItem>
                      <SelectItem value="Kelantan">Kelantan</SelectItem>
                      <SelectItem value="Terengganu">Terengganu</SelectItem>
                      <SelectItem value="Perlis">Perlis</SelectItem>
                      <SelectItem value="Sabah">Sabah</SelectItem>
                      <SelectItem value="Sarawak">Sarawak</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="postcode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Postcode</FormLabel>
                  <FormControl>
                    <Input placeholder="50450" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Client Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Client Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="clientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Ahmad Rahman" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clientEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="client@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clientPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="012-3456789" {...field} />
                  </FormControl>
                  <FormDescription>Malaysian phone number format</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Team Members */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Team Members</h3>
          
          <div className="flex gap-2">
            <Input
              placeholder="Enter team member email"
              value={newMember}
              onChange={(e) => setNewMember(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTeamMember())}
            />
            <Button type="button" onClick={addTeamMember} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {teamMembers.map((member) => (
              <div key={member} className="flex items-center gap-1 bg-secondary px-3 py-1 rounded-md">
                <span className="text-sm">{member}</span>
                <button
                  type="button"
                  onClick={() => removeTeamMember(member)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Tags</h3>
          
          <div className="flex gap-2">
            <Input
              placeholder="Enter tag"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            />
            <Button type="button" onClick={addTag} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <div key={tag} className="flex items-center gap-1 bg-primary/10 px-3 py-1 rounded-md">
                <span className="text-sm">{tag}</span>
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline">
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Project'}
          </Button>
        </div>
      </form>
    </Form>
  )
}