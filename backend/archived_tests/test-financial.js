// Test script for Financial Module
// Run with: node test-financial.js

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api/v1';
let authToken = '';

// Test data
const testUser = {
  email: 'test@daritana.com',
  password: 'password123'
};

const testQuotation = {
  project_id: '1',
  client_id: '1', 
  valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
  payment_terms: '30 days',
  discount_percentage: 5,
  terms_and_conditions: 'Standard terms and conditions apply',
  notes: 'Test quotation',
  items: [
    {
      description: 'Architectural Design Services - Phase 1',
      category: 'Design Services',
      quantity: 100,
      unit: 'sqm',
      unit_price: 150,
      sst_rate: 8,
      is_optional: false
    },
    {
      description: '3D Visualization and Rendering',
      category: 'Visualization',
      quantity: 5,
      unit: 'view',
      unit_price: 2000,
      sst_rate: 8,
      is_optional: false
    },
    {
      description: 'Project Management Services',
      category: 'Management',
      quantity: 1,
      unit: 'month',
      unit_price: 15000,
      sst_rate: 8,
      is_optional: true
    }
  ]
};

const testItemLibrary = [
  {
    item_code: 'ARCH-001',
    name: 'Architectural Design Services',
    description: 'Complete architectural design from concept to construction drawings',
    category: 'Design Services',
    unit: 'sqm',
    base_price: 150,
    sst_rate: 8
  },
  {
    item_code: 'INT-001',
    name: 'Interior Design Consultation',
    description: 'Interior design consultation and space planning',
    category: 'Design Services',
    unit: 'hour',
    base_price: 500,
    sst_rate: 8
  },
  {
    item_code: 'PM-001',
    name: 'Project Management',
    description: 'Full project management services',
    category: 'Management',
    unit: 'month',
    base_price: 15000,
    sst_rate: 8
  }
];

// Helper function for API calls
async function apiCall(method, endpoint, data = null) {
  try {
    const config = {
      method,
      url: `${API_BASE}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`Error in ${method} ${endpoint}:`, error.response?.data || error.message);
    throw error;
  }
}

// Test functions
async function testAuth() {
  console.log('\n📝 Testing Authentication...');
  try {
    // Try to register first (might fail if user exists)
    try {
      await apiCall('POST', '/auth/register', {
        ...testUser,
        firstName: 'Test',
        lastName: 'User'
      });
      console.log('✅ User registered');
    } catch (e) {
      console.log('ℹ️  User might already exist, trying login...');
    }

    // Login
    const loginResponse = await apiCall('POST', '/auth/login', testUser);
    authToken = loginResponse.token || loginResponse.data?.token;
    console.log('✅ Login successful');
    return true;
  } catch (error) {
    console.log('❌ Authentication failed');
    return false;
  }
}

async function testItemLibrary() {
  console.log('\n📚 Testing Item Library...');
  
  for (const item of testItemLibrary) {
    try {
      await apiCall('POST', '/finance/item-library', item);
      console.log(`✅ Added item: ${item.name}`);
    } catch (error) {
      console.log(`ℹ️  Item ${item.name} might already exist`);
    }
  }

  try {
    const items = await apiCall('GET', '/finance/item-library');
    console.log(`✅ Retrieved ${items.data?.length || 0} items from library`);
    return true;
  } catch (error) {
    console.log('❌ Failed to retrieve item library');
    return false;
  }
}

async function testQuotationCRUD() {
  console.log('\n💰 Testing Quotation CRUD...');
  
  try {
    // Create quotation
    console.log('Creating quotation...');
    const createResponse = await apiCall('POST', '/finance/quotations', testQuotation);
    const quotationId = createResponse.data?.id;
    console.log(`✅ Created quotation: ${createResponse.data?.quotation_number}`);

    // Get all quotations
    const listResponse = await apiCall('GET', '/finance/quotations');
    console.log(`✅ Retrieved ${listResponse.data?.length || 0} quotations`);

    // Get specific quotation
    if (quotationId) {
      const getResponse = await apiCall('GET', `/finance/quotations/${quotationId}`);
      console.log(`✅ Retrieved quotation: ${getResponse.data?.quotation_number}`);

      // Update quotation
      const updateData = {
        notes: 'Updated test quotation',
        discount_percentage: 10
      };
      await apiCall('PUT', `/finance/quotations/${quotationId}`, updateData);
      console.log('✅ Updated quotation');

      // Test approval workflow
      await apiCall('POST', `/finance/quotations/${quotationId}/approve`, {
        approval_notes: 'Approved for testing'
      });
      console.log('✅ Approved quotation');
    }

    return true;
  } catch (error) {
    console.log('❌ Quotation CRUD tests failed');
    return false;
  }
}

async function testSSCalculations() {
  console.log('\n🧮 Testing SST Calculations...');
  
  const testData = {
    project_id: '1',
    client_id: '1',
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    payment_terms: '30 days',
    items: [
      {
        description: 'Test Item',
        quantity: 2,
        unit: 'unit',
        unit_price: 1000,
        sst_rate: 8
      }
    ]
  };

  try {
    const response = await apiCall('POST', '/finance/quotations', testData);
    const quotation = response.data;
    
    const expectedSubtotal = 2000;
    const expectedSST = 160;
    const expectedTotal = 2160;

    console.log(`Subtotal: RM ${quotation.subtotal} (Expected: RM ${expectedSubtotal})`);
    console.log(`SST: RM ${quotation.sst_amount} (Expected: RM ${expectedSST})`);
    console.log(`Total: RM ${quotation.total_amount} (Expected: RM ${expectedTotal})`);

    if (
      Math.abs(quotation.subtotal - expectedSubtotal) < 0.01 &&
      Math.abs(quotation.sst_amount - expectedSST) < 0.01 &&
      Math.abs(quotation.total_amount - expectedTotal) < 0.01
    ) {
      console.log('✅ SST calculations are correct');
      return true;
    } else {
      console.log('❌ SST calculations are incorrect');
      return false;
    }
  } catch (error) {
    console.log('❌ SST calculation test failed');
    return false;
  }
}

async function testPDFGeneration() {
  console.log('\n📄 Testing PDF Generation...');
  
  try {
    // Create a quotation first
    const createResponse = await apiCall('POST', '/finance/quotations', testQuotation);
    const quotationId = createResponse.data?.id;
    
    if (!quotationId) {
      console.log('❌ Could not create quotation for PDF test');
      return false;
    }

    // Try to download PDF
    const pdfUrl = `${API_BASE}/finance/quotations/${quotationId}/pdf`;
    console.log(`Attempting to download PDF from: ${pdfUrl}`);
    
    const response = await axios({
      method: 'GET',
      url: pdfUrl,
      headers: {
        Authorization: `Bearer ${authToken}`
      },
      responseType: 'arraybuffer'
    });

    if (response.status === 200 && response.data.byteLength > 0) {
      console.log(`✅ PDF generated successfully (${response.data.byteLength} bytes)`);
      
      // Save PDF to file for manual inspection
      const fs = require('fs');
      fs.writeFileSync('test-quotation.pdf', response.data);
      console.log('✅ PDF saved as test-quotation.pdf');
      return true;
    } else {
      console.log('❌ PDF generation failed');
      return false;
    }
  } catch (error) {
    console.log('❌ PDF generation test failed:', error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Financial Module Tests');
  console.log('===================================');
  console.log('Make sure backend is running on http://localhost:5000');
  console.log('');

  const results = {
    auth: false,
    itemLibrary: false,
    quotationCRUD: false,
    sstCalculations: false,
    pdfGeneration: false
  };

  // Run tests
  results.auth = await testAuth();
  
  if (results.auth) {
    results.itemLibrary = await testItemLibrary();
    results.quotationCRUD = await testQuotationCRUD();
    results.sstCalculations = await testSSCalculations();
    results.pdfGeneration = await testPDFGeneration();
  }

  // Summary
  console.log('\n===================================');
  console.log('📊 Test Results Summary:');
  console.log('===================================');
  console.log(`Authentication:    ${results.auth ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Item Library:      ${results.itemLibrary ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Quotation CRUD:    ${results.quotationCRUD ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`SST Calculations:  ${results.sstCalculations ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`PDF Generation:    ${results.pdfGeneration ? '✅ PASSED' : '❌ FAILED'}`);

  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(r => r).length;
  
  console.log('\n===================================');
  console.log(`Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed successfully!');
  } else {
    console.log('⚠️  Some tests failed. Please check the logs above.');
  }
}

// Check if axios is installed
try {
  require('axios');
} catch (error) {
  console.log('Installing axios...');
  require('child_process').execSync('npm install axios', { stdio: 'inherit' });
}

// Run the tests
runTests().catch(console.error);