import type { Customer } from '../types/customer'

export const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'Sari Dewi',
    phone: '081234567890',
    email: 'sari.dewi@email.com',
    address: 'Jl. Merdeka No. 123, Jakarta Pusat',
    identityNumber: '3171234567890001',
    createdAt: '2024-01-15',
    totalTransactions: 5,
  },
  {
    id: '2',
    name: 'Andi Pratama',
    phone: '081234567891',
    email: 'andi.pratama@email.com',
    address: 'Jl. Sudirman No. 456, Jakarta Selatan',
    identityNumber: '3171234567890002',
    createdAt: '2024-02-20',
    totalTransactions: 3,
  },
  {
    id: '3',
    name: 'Maya Sari',
    phone: '081234567892',
    address: 'Jl. Thamrin No. 789, Jakarta Pusat',
    identityNumber: '3171234567890003',
    createdAt: '2024-03-10',
    totalTransactions: 2,
  },
  {
    id: '4',
    name: 'Budi Santoso',
    phone: '081234567893',
    email: 'budi.santoso@email.com',
    address: 'Jl. Gatot Subroto No. 321, Jakarta Selatan',
    createdAt: '2024-04-05',
    totalTransactions: 1,
  },
]
