import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Customer, ConsultingRecord } from '../types/customer';
import { v4 as uuidv4 } from 'uuid';



// 타입 정의
interface CustomerContextType {
  customers: Customer[];
  filtered: Customer[];
  selectedCustomer: Customer | null;
  loading: boolean;
  error: Error | null;
  addCustomer: (customerData: Omit<Customer, 'id' | 'registeredAt'>) => Promise<string>;
  updateCustomer: (id: string, customerData: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  getCustomerById: (id: string) => Promise<Customer | null>;
  searchCustomers: (query: string) => void;
  setSelectedCustomer: (customer: Customer | null) => void;
  addConsultingHistory: (customerId: string, record: ConsultingRecord) => Promise<void>;
}

// 기본 컨텍스트 생성
const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

// 컨텍스트 제공자 컴포넌트
export const CustomerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filtered, setFiltered] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // 고객 검색 기능
  const searchCustomers = (query: string) => {
    if (!query) {
      setFiltered(customers);
      return;
    }

    const lowercaseQuery = query.toLowerCase();
    const results = customers.filter(
      customer =>
        customer.name.toLowerCase().includes(lowercaseQuery) ||
        customer.phone.includes(query) ||
        (customer.email && customer.email.toLowerCase().includes(lowercaseQuery))
    );
    setFiltered(results);
  };

  // 고객 추가 기능
  const addCustomer = async (customerData: Omit<Customer, 'id' | 'registeredAt'>): Promise<string> => {
    setLoading(true);
    setError(null);
    try {
      const newCustomer: Customer = {
        ...customerData,
        id: uuidv4(),
        registeredAt: new Date().toISOString(),
      };

      setCustomers(prev => [...prev, newCustomer]);
      setFiltered(prev => [...prev, newCustomer]);
      return newCustomer.id;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to add customer'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 고객 정보 업데이트 기능
  const updateCustomer = async (id: string, customerData: Partial<Customer>): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      setCustomers(prev =>
        prev.map(cust =>
          cust.id === id ? { ...cust, ...customerData } : cust
        )
      );
      setFiltered(prev =>
        prev.map(cust =>
          cust.id === id ? { ...cust, ...customerData } : cust
        )
      );
      
      // 현재 선택된 고객이 업데이트된 고객이면 선택된 고객도 업데이트
      if (selectedCustomer && selectedCustomer.id === id) {
        setSelectedCustomer({ ...selectedCustomer, ...customerData });
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update customer'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 고객 삭제 기능
  const deleteCustomer = async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      setCustomers(prev => prev.filter(cust => cust.id !== id));
      setFiltered(prev => prev.filter(cust => cust.id !== id));
      
      // 현재 선택된 고객이 삭제된 고객이면 선택 해제
      if (selectedCustomer && selectedCustomer.id === id) {
        setSelectedCustomer(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete customer'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ID로 고객 조회 기능
  const getCustomerById = async (id: string): Promise<Customer | null> => {
    setLoading(true);
    setError(null);
    try {
      const customer = customers.find(cust => cust.id === id) || null;
      return customer;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to get customer'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 상담 기록 추가 기능
  const addConsultingHistory = async (customerId: string, record: ConsultingRecord): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const customer = customers.find(cust => cust.id === customerId);
      if (!customer) {
        throw new Error('Customer not found');
      }

      const updatedHistory = [...(customer.consultingHistory || []), record];
      
      await updateCustomer(customerId, {
        consultingHistory: updatedHistory
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to add consulting record'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <CustomerContext.Provider
      value={{
        customers,
        filtered,
        selectedCustomer,
        loading,
        error,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        getCustomerById,
        searchCustomers,
        setSelectedCustomer,
        addConsultingHistory
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
};

// 컨텍스트 사용을 위한 커스텀 훅
export const useCustomer = () => {
  const context = useContext(CustomerContext);
  if (context === undefined) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }
  return context;
}; 