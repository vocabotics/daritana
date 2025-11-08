# Testing Guide for Sprint 2.5 - Financial Module

## Prerequisites

Before testing, ensure you have:
- Node.js installed (v18+ recommended)
- PostgreSQL installed and running
- Git Bash or Command Prompt open
- Two terminal windows (one for backend, one for frontend)

## Step 1: Database Setup

### 1.1 Create/Verify Database
```bash
# Check if PostgreSQL is running
psql -U postgres -c "SELECT version();"

# Create database if not exists
psql -U postgres -c "CREATE DATABASE daritana;"

# Run the financial module migration
psql -U postgres -d daritana -f backend/src/database/migrations/003_financial_module.sql
```

### 1.2 Verify Tables Created
```bash
psql -U postgres -d daritana -c "\dt"
```

You should see these new tables:
- quotations
- quotation_items
- item_library
- invoices
- invoice_items
- payments
- receipts
- statements
- aging_reports

## Step 2: Backend Server Setup

### 2.1 Install Dependencies
```bash
# Navigate to backend folder
cd backend

# Install dependencies (if not done already)
npm install

# Create .env file if not exists
echo "DATABASE_URL=postgresql://postgres:password@localhost:5432/daritana" > .env
echo "JWT_SECRET=your-secret-key-here" >> .env
echo "PORT=5000" >> .env
```

### 2.2 Start Backend Server
```bash
# In backend folder
npm run dev
```

The backend should start on http://localhost:5000

## Step 3: Frontend Setup

### 3.1 Install Dependencies
```bash
# In a new terminal, navigate to project root
cd C:\daritana

# Install frontend dependencies
npm install
```

### 3.2 Start Frontend Development Server
```bash
npm run dev
```

The frontend should start on http://localhost:5173

## Step 4: Testing the Quotation System

### 4.1 Access the Application
1. Open browser and go to http://localhost:5173
2. Login with test credentials (check if you have mock auth)

### 4.2 Navigate to Financial Module
1. Click on "Financial" in the sidebar
2. Click on "Quotations" tab

### 4.3 Create a New Quotation
1. Click "New Quotation" button
2. Fill in the form:
   - Select a project
   - Select a client
   - Set valid until date
   - Add items (use Item Library or manual entry)
   - Set payment terms
3. Click "Save Draft"

### 4.4 Test Quotation Features
- **View List**: Check if quotation appears in list
- **Edit**: Click edit icon to modify
- **Status Changes**: Test approve/reject workflows
- **PDF Download**: Click download icon to generate PDF
- **Search**: Use search bar to filter quotations
- **Filter by Status**: Use status dropdown

## Step 5: API Testing with Postman/curl

### 5.1 Get Auth Token (if backend auth is enabled)
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@daritana.com","password":"password"}'
```

### 5.2 Test Quotation Endpoints

#### Create Quotation
```bash
curl -X POST http://localhost:5000/api/v1/finance/quotations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "project_id": "1",
    "client_id": "1",
    "valid_until": "2024-12-31",
    "payment_terms": "30 days",
    "items": [
      {
        "description": "Architectural Design Services",
        "quantity": 100,
        "unit": "sqm",
        "unit_price": 150,
        "sst_rate": 8
      }
    ]
  }'
```

#### Get All Quotations
```bash
curl http://localhost:5000/api/v1/finance/quotations \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Get Specific Quotation
```bash
curl http://localhost:5000/api/v1/finance/quotations/QUOTATION_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Download PDF
```bash
curl http://localhost:5000/api/v1/finance/quotations/QUOTATION_ID/pdf \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o quotation.pdf
```

## Step 6: Testing Item Library

### 6.1 Add Items to Library
```bash
curl -X POST http://localhost:5000/api/v1/finance/item-library \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "item_code": "ARCH-001",
    "name": "Architectural Design",
    "description": "Complete architectural design services",
    "category": "Design Services",
    "unit": "sqm",
    "base_price": 150,
    "sst_rate": 8
  }'
```

### 6.2 Get Item Library
```bash
curl http://localhost:5000/api/v1/finance/item-library \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Step 7: Verify SST Calculations

1. Create a quotation with:
   - Item price: RM 1000
   - Quantity: 2
   - SST Rate: 8%

2. Verify calculations:
   - Subtotal: RM 2000
   - SST: RM 160
   - Total: RM 2160

## Step 8: Test PDF Generation

1. Create a quotation
2. Click download PDF button
3. Verify PDF contains:
   - Company header
   - Client information
   - Item details
   - SST calculations
   - Total amount
   - Terms and conditions

## Troubleshooting

### Backend Issues

#### Database Connection Error
```bash
# Check PostgreSQL is running
pg_ctl status

# Start PostgreSQL if needed
pg_ctl start
```

#### Port Already in Use
```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (Windows)
taskkill /PID [PID_NUMBER] /F
```

#### Missing Dependencies
```bash
cd backend
npm install --legacy-peer-deps
```

### Frontend Issues

#### Module Not Found
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Build Errors
```bash
# Check for TypeScript errors
npm run build
```

### PDF Generation Issues

#### Puppeteer Installation
```bash
cd backend
npm install puppeteer --legacy-peer-deps
```

#### Template Not Found
Ensure template exists at:
`backend/src/templates/quotation.hbs`

## Testing Checklist

- [ ] Database tables created successfully
- [ ] Backend server running without errors
- [ ] Frontend server running without errors
- [ ] Can create new quotation
- [ ] Can view quotation list
- [ ] Can edit existing quotation
- [ ] SST calculations are correct
- [ ] Can add items from library
- [ ] Can download PDF
- [ ] PDF displays correctly
- [ ] Search and filters work
- [ ] Approval/rejection workflow works

## Mock Data for Quick Testing

### Create Test Project (if needed)
```sql
INSERT INTO projects (id, name, project_code, status, created_at, updated_at)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'KLCC Tower Renovation', 'KLCC-2024-001', 'active', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440002', 'Penang Heritage Hotel', 'PHH-2024-002', 'active', NOW(), NOW());
```

### Create Test Users (if needed)
```sql
INSERT INTO users (id, email, first_name, last_name, role, created_at, updated_at)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440003', 'john@example.com', 'John', 'Doe', 'client', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440004', 'sarah@daritana.com', 'Sarah', 'Lee', 'staff', NOW(), NOW());
```

## Expected Results

After successful testing, you should be able to:
1. ✅ Create and manage quotations
2. ✅ Generate professional PDF documents
3. ✅ Calculate Malaysian SST correctly
4. ✅ Use item library for quick quotation creation
5. ✅ Track quotation status (draft, sent, approved, rejected)
6. ✅ Search and filter quotations
7. ✅ View financial dashboard with quotation metrics

## Next Steps

Once testing is complete:
1. Document any bugs found
2. Note any improvements needed
3. Proceed with Invoice Management implementation
4. Test payment tracking features

---

## Quick Start Commands

```bash
# Terminal 1 - Backend
cd backend
npm install --legacy-peer-deps
npm run dev

# Terminal 2 - Frontend  
cd C:\daritana
npm install
npm run dev

# Terminal 3 - Database Migration
psql -U postgres -d daritana -f backend/src/database/migrations/003_financial_module.sql
```

Then open http://localhost:5173 in your browser.