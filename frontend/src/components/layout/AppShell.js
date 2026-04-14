import Sidebar from './Sidebar';
import Header from './Header';

export default function AppShell({ children }) {
  return (
    <div className="min-h-screen" style={{ background: '#F7F9FB' }}>
      <Sidebar />
      <div className="ml-64 flex flex-col min-h-screen transition-all duration-200">
        <Header />
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
