async function test() {
  try {
    const baseUrl = 'http://localhost:5000/api';
    
    // 1. Register as Agent
    const email = `agent_${Date.now()}@example.com`;
    console.log('Registering agent:', email);
    let res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Agent',
        email: email,
        password: 'password123',
        role: 'agent'
      })
    });
    let data = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(data));
    const token = data.data.token;
    console.log('Registered! Token:', token.substring(0, 10) + '...');
    
    // 2. Create ticket
    console.log('Creating ticket...');
    res = await fetch(`${baseUrl}/tickets`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Agent Ticket',
        description: 'Test Description',
        priority: 'medium'
      })
    });
    data = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(data));
    const ticketId = data.data.ticket.id;
    console.log('Ticket created! ID:', ticketId);
    
    // 3. Add comment
    console.log('Adding comment...');
    res = await fetch(`${baseUrl}/comments`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        ticketId: ticketId,
        message: 'Test comment from agent',
        isInternalNote: false
      })
    });
    data = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(data));
    console.log('Comment added!', data);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
