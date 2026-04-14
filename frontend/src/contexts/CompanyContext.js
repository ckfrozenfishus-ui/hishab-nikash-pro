import { createContext, useContext, useState, useEffect } from 'react';

const CompanyContext = createContext(null);

export function CompanyProvider({ children }) {
  const [selectedCompany, setSelectedCompany] = useState(() => {
    const saved = localStorage.getItem('hn_selected_company');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (selectedCompany) {
      localStorage.setItem('hn_selected_company', JSON.stringify(selectedCompany));
    }
  }, [selectedCompany]);

  const selectCompany = (company) => {
    setSelectedCompany(company);
  };

  const clearCompany = () => {
    setSelectedCompany(null);
    localStorage.removeItem('hn_selected_company');
  };

  return (
    <CompanyContext.Provider value={{ selectedCompany, selectCompany, clearCompany }}>
      {children}
    </CompanyContext.Provider>
  );
}

export const useCompany = () => {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error('useCompany must be inside CompanyProvider');
  return ctx;
};
