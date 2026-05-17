import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TicketCard from '../components/TicketCard';
import '@testing-library/jest-dom';

const mockTicket = {
  id: 'ticket-1',
  title: 'Cannot login to my account',
  description: 'Whenever I try to login, it says invalid password.',
  status: 'open',
  priority: 'high',
  createdAt: new Date().toISOString(),
  createdBy: { name: 'John Doe' },
  _count: { comments: 3 }
};

describe('TicketCard Component', () => {
  it('renders ticket title and description', () => {
    render(
      <BrowserRouter>
        <TicketCard ticket={mockTicket} />
      </BrowserRouter>
    );
    
    // Check if the title and description are rendered
    expect(screen.getByText('Cannot login to my account')).toBeInTheDocument();
    expect(screen.getByText('Whenever I try to login, it says invalid password.')).toBeInTheDocument();
  });

  it('renders correct priority and status badges', () => {
    render(
      <BrowserRouter>
        <TicketCard ticket={mockTicket} />
      </BrowserRouter>
    );
    
    // priority: high, status: open
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('displays the creator name and comment count', () => {
    render(
      <BrowserRouter>
        <TicketCard ticket={mockTicket} />
      </BrowserRouter>
    );
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
