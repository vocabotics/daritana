# 🧪 TESTING GUIDE - Daritana Platform

## 🚀 Quick Start

### Access the Application
1. **Frontend URL**: http://localhost:8080
2. **Backend API**: http://localhost:8001
3. **API Health Check**: http://localhost:8001/health

## 📝 Test Accounts

You can use these credentials to test different user roles:

### Project Lead (Full Access)
- **Email**: ahmad@daritana.com
- **Password**: password123
- **Role**: project_lead

### Designer
- **Email**: designer@daritana.com  
- **Password**: password123
- **Role**: designer

### Client
- **Email**: client@daritana.com
- **Password**: password123
- **Role**: client

### Staff
- **Email**: staff@daritana.com
- **Password**: password123
- **Role**: staff

## ✅ Features to Test

### 1. Authentication Flow
- [ ] Login with different user accounts
- [ ] Register new account
- [ ] Password reset flow
- [ ] Logout functionality
- [ ] Session persistence (refresh page)

### 2. Dashboard
- [ ] View role-specific statistics
- [ ] Check recent activities
- [ ] Verify Malaysian compliance indicators
- [ ] Test responsive design (resize browser)

### 3. Project Management
- [ ] Create new project (project_lead/staff only)
- [ ] View project list
- [ ] Filter projects by status/type/priority
- [ ] Search projects
- [ ] Switch between grid/list view
- [ ] Click on project to view details
- [ ] Edit project information
- [ ] View project timeline

### 4. File Management
- [ ] Navigate to Files section
- [ ] Upload files (drag & drop)
- [ ] Create folders
- [ ] Switch between grid/list view
- [ ] Download files
- [ ] Share files
- [ ] Delete files

### 5. Task Management
- [ ] Create new task
- [ ] Assign task to team member
- [ ] Set priority and due date
- [ ] Add attachments
- [ ] Update task status
- [ ] Add tags

### 6. Team Management (project_lead/admin)
- [ ] View team members
- [ ] Send invitations
- [ ] Copy invite link
- [ ] Manage pending invitations
- [ ] Remove team members

### 7. User Profile
- [ ] Navigate to Profile (click avatar → Profile)
- [ ] Edit personal information
- [ ] Update professional details
- [ ] Configure notification preferences
- [ ] Change security settings
- [ ] Set language/timezone preferences

### 8. Responsive Design
- [ ] Test on mobile viewport (375px)
- [ ] Test on tablet viewport (768px)
- [ ] Test on desktop (1440px)
- [ ] Check hamburger menu on mobile
- [ ] Verify touch interactions

## 🔍 Role-Based Access Testing

### As Project Lead
✅ Can access all features
✅ Can create/edit/delete projects
✅ Can manage team
✅ Can view financial data

### As Designer
✅ Can view assigned projects
✅ Can create/update designs
✅ Can upload files
✅ Cannot manage team
✅ Cannot delete projects

### As Client
✅ Can only view own projects
✅ Cannot create projects
✅ Cannot manage team
✅ Can approve designs
✅ Limited file access

### As Staff
✅ Can view all projects
✅ Can create tasks
✅ Can upload files
✅ Cannot manage budget
✅ Cannot invite users

## 🐛 Known Issues & Workarounds

1. **Database Connection**: Currently using mock data, so changes won't persist after refresh
2. **File Upload**: Shows simulated progress, files aren't actually stored
3. **Real-time Updates**: WebSocket connections not active, so no live updates
4. **Email Notifications**: Not configured, invitations are simulated

## 📊 Test Scenarios

### Scenario 1: Project Creation Flow
1. Login as project_lead
2. Go to Projects
3. Click "New Project"
4. Fill in:
   - Name: "Test Renovation Project"
   - Type: Renovation
   - Budget: 150000
   - Location: Kuala Lumpur
   - Client details
5. Save project
6. Verify project appears in list
7. Open project details
8. Add team members

### Scenario 2: File Management Flow
1. Login as any user
2. Go to Files
3. Click "Upload Files"
4. Drag and drop multiple files
5. Watch upload progress
6. Create a new folder
7. Move files to folder
8. Download a file
9. Delete a file

### Scenario 3: Team Collaboration Flow
1. Login as project_lead
2. Go to Team
3. Click "Invite Members"
4. Enter email: test@example.com
5. Select role: Designer
6. Send invitation
7. Check pending invitations
8. Copy invite link

### Scenario 4: Client Experience
1. Login as client
2. View dashboard (limited stats)
3. Go to Projects (only see own)
4. Cannot access Team section
5. Can view project details
6. Can download files
7. Cannot edit project

## 💡 Tips for Testing

1. **Use Browser DevTools**
   - Open Console (F12) to check for errors
   - Use Network tab to monitor API calls
   - Test responsive design with device emulator

2. **Test Data Validation**
   - Try invalid email formats
   - Enter negative budget values
   - Submit empty required fields
   - Test Malaysian phone number format

3. **Performance Testing**
   - Upload large files
   - Create many projects
   - Test with slow network (DevTools → Network → Slow 3G)

4. **Accessibility Testing**
   - Navigate with keyboard only (Tab, Enter, Escape)
   - Check color contrast
   - Test with screen reader

## 🎯 Quick Test Checklist

- [ ] Application loads without errors
- [ ] Can login successfully
- [ ] Dashboard displays correctly
- [ ] Can navigate all menu items
- [ ] Forms validate properly
- [ ] Responsive design works
- [ ] Permissions work correctly
- [ ] Malaysian features work (states, currency)

## 📱 Mobile Testing

1. Open browser DevTools (F12)
2. Click device toggle (Ctrl+Shift+M)
3. Select device preset or custom size
4. Test:
   - [ ] Hamburger menu works
   - [ ] Forms are usable
   - [ ] Tables scroll horizontally
   - [ ] Modals fit screen
   - [ ] Touch interactions work

## 🛠️ Troubleshooting

### Frontend won't load
- Check if running on http://localhost:8080
- Clear browser cache (Ctrl+Shift+Delete)
- Check console for errors

### API errors
- Verify backend is running on port 8001
- Check CORS errors in console
- Try different browser

### Login not working
- Use test credentials above
- Check browser console for errors
- Try incognito/private mode

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Verify both servers are running
3. Try refreshing the page
4. Clear browser cache
5. Try different browser

---

**Happy Testing! 🎉**

The application is ready for testing. Both frontend and backend are running successfully!