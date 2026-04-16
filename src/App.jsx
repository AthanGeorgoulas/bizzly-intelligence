import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import UploadPage from './pages/UploadPage';
import OverviewPage from './pages/OverviewPage';
import NetworkingPage from './pages/NetworkingPage';
import SpeakersPage from './pages/SpeakersPage';
import SponsorsPage from './pages/SponsorsPage';
import InsightsPage from './pages/InsightsPage';
import ComparePage from './pages/ComparePage';

function AppContent() {
  const { view, events, activeEventIndex, dispatch } = useApp();

  const renderPage = () => {
    switch (view) {
      case 'upload': return <UploadPage />;
      case 'overview': return <OverviewPage />;
      case 'networking': return <NetworkingPage />;
      case 'speakers': return <SpeakersPage />;
      case 'sponsors': return <SponsorsPage />;
      case 'insights': return <InsightsPage />;
      case 'compare': return <ComparePage />;
      default: return <UploadPage />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        {events.length > 1 && view !== 'compare' && view !== 'upload' && (
          <div className="event-selector">
            {events.map((ev, i) => (
              <button
                key={i}
                className={`event-chip ${i === activeEventIndex ? 'active' : ''}`}
                onClick={() => dispatch({ type: 'SET_ACTIVE_EVENT', payload: i })}
              >
                {ev.parsed.event.name}
              </button>
            ))}
          </div>
        )}
        {renderPage()}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
