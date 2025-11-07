import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  UserPlus,
  Mail,
  Copy,
  Check,
  X,
  Users,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import { UserRole } from '@/services/permissions'

const inviteFormSchema = z.object({
  emails: z.string().min(1, 'At least one email is required'),
  role: z.enum(['client', 'staff', 'contractor', 'designer']),
  message: z.string().optional(),
  projectIds: z.array(z.string()).optional()
})

type InviteFormValues = z.infer<typeof inviteFormSchema>

interface Invitation {
  id: string
  email: string
  role: UserRole
  status: 'pending' | 'accepted' | 'expired' | 'cancelled'
  invitedBy: string
  invitedAt: string
  acceptedAt?: string
  projects?: string[]
}

interface TeamMember {
  id: string
  firstName: string
  lastName: string
  email: string
  role: UserRole
  avatar?: string
  joinedAt: string
  lastActive: string
  projectCount: number
}

interface TeamInvitationProps {
  hideHeader?: boolean
  showInviteDialog?: boolean
  setShowInviteDialog?: (show: boolean) => void
}

export function TeamInvitation({ hideHeader = false, showInviteDialog: externalShowInviteDialog, setShowInviteDialog: externalSetShowInviteDialog }: TeamInvitationProps) {
  const [internalShowInviteDialog, internalSetShowInviteDialog] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  
  // Use external dialog state if provided, otherwise use internal
  const showInviteDialog = externalShowInviteDialog !== undefined ? externalShowInviteDialog : internalShowInviteDialog
  const setShowInviteDialog = externalSetShowInviteDialog || internalSetShowInviteDialog
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      emails: '',
      role: 'staff',
      message: '',
      projectIds: []
    }
  })

  // Mock data
  const invitations: Invitation[] = [
    {
      id: '1',
      email: 'john.doe@example.com',
      role: 'designer',
      status: 'pending',
      invitedBy: 'Ahmad Rahman',
      invitedAt: '2024-01-20T10:00:00Z',
      projects: ['KLCC Tower', 'Penang Heritage']
    },
    {
      id: '2',
      email: 'sarah.lee@example.com',
      role: 'contractor',
      status: 'accepted',
      invitedBy: 'Ahmad Rahman',
      invitedAt: '2024-01-18T10:00:00Z',
      acceptedAt: '2024-01-19T14:30:00Z'
    },
    {
      id: '3',
      email: 'michael.tan@example.com',
      role: 'staff',
      status: 'expired',
      invitedBy: 'Lisa Wong',
      invitedAt: '2024-01-10T10:00:00Z'
    }
  ]

  const teamMembers: TeamMember[] = [
    {
      id: '1',
      firstName: 'Ahmad',
      lastName: 'Rahman',
      email: 'ahmad@daritana.com',
      role: 'project_lead',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      joinedAt: '2023-06-15',
      lastActive: '2 hours ago',
      projectCount: 12
    },
    {
      id: '2',
      firstName: 'Lisa',
      lastName: 'Wong',
      email: 'lisa@daritana.com',
      role: 'designer',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      joinedAt: '2023-08-20',
      lastActive: '30 minutes ago',
      projectCount: 8
    },
    {
      id: '3',
      firstName: 'David',
      lastName: 'Lim',
      email: 'david@daritana.com',
      role: 'contractor',
      joinedAt: '2023-09-10',
      lastActive: '1 day ago',
      projectCount: 5
    }
  ]

  const handleInvite = (data: InviteFormValues) => {
    const emails = data.emails.split(',').map(e => e.trim())
    
    // Validate emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const invalidEmails = emails.filter(email => !emailRegex.test(email))
    
    if (invalidEmails.length > 0) {
      toast.error(`Invalid emails: ${invalidEmails.join(', ')}`)
      return
    }

    // Send invitations
    toast.success(`Invitations sent to ${emails.length} recipient(s)`)
    setShowInviteDialog(false)
    form.reset()
  }

  const copyInviteLink = () => {
    const inviteLink = `https://daritana.com/invite/abc123xyz`
    navigator.clipboard.writeText(inviteLink)
    setCopiedLink(true)
    toast.success('Invite link copied to clipboard')
    setTimeout(() => setCopiedLink(false), 3000)
  }

  const resendInvitation = (invitation: Invitation) => {
    toast.success(`Invitation resent to ${invitation.email}`)
  }

  const cancelInvitation = (invitation: Invitation) => {
    toast.success(`Invitation to ${invitation.email} cancelled`)
  }

  const removeTeamMember = (member: TeamMember) => {
    if (confirm(`Remove ${member.firstName} ${member.lastName} from the team?`)) {
      toast.success(`${member.firstName} has been removed from the team`)
    }
  }

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'project_lead': return 'bg-purple-100 text-purple-800'
      case 'designer': return 'bg-blue-100 text-blue-800'
      case 'contractor': return 'bg-orange-100 text-orange-800'
      case 'staff': return 'bg-gray-100 text-gray-800'
      case 'client': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: Invitation['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'expired':
        return <XCircle className="h-4 w-4 text-gray-500" />
      case 'cancelled':
        return <X className="h-4 w-4 text-red-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header - hidden when toolbar is used */}
      {!hideHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Team Management</h2>
            <p className="text-muted-foreground">
              Manage your team members and send invitations
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={copyInviteLink}>
              {copiedLink ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Invite Link
                </>
              )}
            </Button>
            
            <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Members
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Invite Team Members</DialogTitle>
                <DialogDescription>
                  Send invitations to add new members to your team
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleInvite)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="emails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Addresses</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="email1@example.com, email2@example.com"
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter multiple emails separated by commas
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="staff">Staff</SelectItem>
                            <SelectItem value="designer">Designer</SelectItem>
                            <SelectItem value="contractor">Contractor</SelectItem>
                            <SelectItem value="client">Client</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Personal Message (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Add a personal message to the invitation..."
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowInviteDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      <Send className="h-4 w-4 mr-2" />
                      Send Invitations
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          </div>
        </div>
      )}
      
      {/* Dialog for toolbar button */}
      {hideHeader && (
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Invite Team Members</DialogTitle>
              <DialogDescription>
                Send invitations to add new members to your team
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleInvite)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="emails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Addresses</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="email1@example.com, email2@example.com"
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter multiple emails separated by commas
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="staff">Staff</SelectItem>
                          <SelectItem value="designer">Designer</SelectItem>
                          <SelectItem value="contractor">Contractor</SelectItem>
                          <SelectItem value="client">Client</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Personal Message (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add a personal message to the invitation..."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowInviteDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    <Send className="h-4 w-4 mr-2" />
                    Send Invitations
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}

      {/* Team Members */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Team Members</h3>
            <Badge variant="outline">
              <Users className="h-3 w-3 mr-1" />
              {teamMembers.length} members
            </Badge>
          </div>
          
          <div className="space-y-3">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback>
                      {member.firstName[0]}{member.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {member.firstName} {member.lastName}
                      </p>
                      <Badge className={cn(getRoleBadgeColor(member.role), "text-xs")}>
                        {member.role.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span>Joined {new Date(member.joinedAt).toLocaleDateString('en-MY')}</span>
                      <span>Active {member.lastActive}</span>
                      <span>{member.projectCount} projects</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Mail className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTeamMember(member)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Pending Invitations */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Pending Invitations</h3>
            <Badge variant="outline">
              {invitations.filter(i => i.status === 'pending').length} pending
            </Badge>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Invited By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.map((invitation) => (
                <TableRow key={invitation.id}>
                  <TableCell>{invitation.email}</TableCell>
                  <TableCell>
                    <Badge className={getRoleBadgeColor(invitation.role)}>
                      {invitation.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(invitation.status)}
                      <span className="text-sm capitalize">{invitation.status}</span>
                    </div>
                  </TableCell>
                  <TableCell>{invitation.invitedBy}</TableCell>
                  <TableCell>
                    {new Date(invitation.invitedAt).toLocaleDateString('en-MY')}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      {invitation.status === 'pending' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => resendInvitation(invitation)}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => cancelInvitation(invitation)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}