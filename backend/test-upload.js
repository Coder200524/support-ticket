const fs = require('fs');

async function testUpload() {
  try {
    // 1. Create a test user or login
    let token = '';
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'testcustomer@example.com', password: 'password123' })
    });
    
    if (loginRes.ok) {
      const data = await loginRes.json();
      token = data.data.token;
    } else {
      const regRes = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Customer',
          email: 'testcustomer@example.com',
          password: 'password123',
          role: 'customer'
        })
      });
      const data = await regRes.json();
      token = data.data.token;
    }

    if (!token) throw new Error('No token');

    // 2. Create a dummy file
    fs.writeFileSync('dummy.txt', 'Hello World');

    // 3. Upload file using fetch
    const fileBlob = new Blob([fs.readFileSync('dummy.txt')], { type: 'text/plain' });
    const formData = new FormData();
    formData.append('title', 'Test Upload Ticket');
    formData.append('description', 'Testing if file uploads work from backend directly');
    formData.append('priority', 'low');
    formData.append('attachment', fileBlob, 'dummy.txt');

    const uploadRes = await fetch('http://localhost:5000/api/tickets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const result = await uploadRes.json();
    console.log('Upload Result:', result);
    
    // Check ticket attachments via API
    const getRes = await fetch(`http://localhost:5000/api/tickets/${result.data.ticket.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const ticketData = await getRes.json();
    console.log('Ticket from API attachments:', ticketData.data.ticket.attachments);

  } catch (error) {
    console.error('Upload Error:', error);
  } finally {
    if (fs.existsSync('dummy.txt')) fs.unlinkSync('dummy.txt');
  }
}

testUpload();
