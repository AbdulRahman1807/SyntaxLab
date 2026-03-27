import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTeams } from './hooks/useTeams';
import SelectionWheel from './components/SelectionWheel';
import TeamManager from './components/TeamManager';
import RevealScreen from './components/RevealScreen';
import Workspace from './components/Workspace';
import ScrollBanner from './components/ScrollBanner';
import SpotlightCard from './components/SpotlightCard';
import { useDynamicTitle } from './hooks/useDynamicTitle';

const SEED_TEAMS_URL = '/teams.json';

// App states
const STATE_LOBBY = 'LOBBY';
const STATE_REVEAL = 'REVEAL';
const STATE_WORKSPACE = 'WORKSPACE';

export default function App() {
  const [appState, setAppState] = useState(STATE_LOBBY);
  const [seedTeams, setSeedTeams] = useState([]);
  const [pickedTeam, setPickedTeam] = useState(null);
  const [seedLoaded, setSeedLoaded] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);

  // Dynamic Browser Tab Hook
  useDynamicTitle(isSpinning);

  // Load seed from teams.json (only used if no localStorage yet)
  useEffect(() => {
    fetch(SEED_TEAMS_URL)
      .then(r => r.json())
      .then(data => setSeedTeams(data.teams || []))
      .catch(() => setSeedTeams([]))
      .finally(() => setSeedLoaded(true));
  }, []);

  const { activeTeams, completedTeams, addTeam, addTeams, deleteTeam, completeTeam, resetSession, clearAllTeams } = useTeams(
    seedLoaded ? seedTeams : []
  );

  function handlePicked(team) {
    setPickedTeam(team);
    setAppState(STATE_REVEAL);
  }

  function handleStartLab() {
    completeTeam(pickedTeam);
    setAppState(STATE_WORKSPACE);
  }

  function handleBackToLobby() {
    setAppState(STATE_LOBBY);
  }

  if (appState === STATE_REVEAL) {
    return (
      <>
        <div className="noise-overlay" />
        <RevealScreen
          teamName={pickedTeam}
          onStartLab={handleStartLab}
          onBack={handleBackToLobby}
        />
      </>
    );
  }

  if (appState === STATE_WORKSPACE) {
    return (
      <>
        <div className="noise-overlay" />
        <Workspace teamName={pickedTeam} onExit={handleBackToLobby} />
      </>
    );
  }

  // LOBBY
  return (
    <>
      <div className="noise-overlay" />
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-base)',
        overflow: 'auto',
        position: 'relative' // Needed to constrain the fixed banner visually if necessary, though it spans screen
      }}>
        <ScrollBanner />
        
        {/* Header (ensure z-index places UI above banner) */}
        <header style={{
          position: 'relative', zIndex: 10,
          padding: '18px 32px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-surface)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <span style={{ fontSize: '1.35rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
            <span style={{ color: 'var(--text-primary)' }}>Syntax</span>
            <span style={{ color: 'var(--text-muted)' }}>Lab</span>
          </span>
          <span style={{
            fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)',
            background: 'var(--bg-elevated)', borderRadius: 4, padding: '2px 8px',
            border: '1px solid var(--border)', letterSpacing: '0.06em', textTransform: 'uppercase'
          }}>Lobby</span>
          <span style={{ flex: 1 }} />
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {activeTeams.length} active · {completedTeams.length} completed
          </span>
        </header>

        {/* Main layout */}
        <motion.div 
          initial="hidden" animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.1 } }
          }}
          style={{
            position: 'relative', zIndex: 10,
            flex: 1,
            display: 'grid',
            gridTemplateColumns: '1.2fr 450px',
            gap: 48,
            maxWidth: 1600,
            width: '95%',
            margin: '0 auto',
            padding: '60px 40px',
            pointerEvents: 'none' // Let mouse stream through to scroll banner
          }}
        >
          {/* Left: Selection Wheel */}
          <motion.div 
            variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { type: 'spring', bounce: 0.2, duration: 0.8 } } }}
            style={{ display: 'flex', flexDirection: 'column', gap: 24, pointerEvents: 'none' }}
          >
            <div style={{ pointerEvents: 'auto' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 500, marginBottom: 6, color: 'var(--text-primary)' }}>
                Team Selector
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Spin the wheel to pick the next team.
              </p>
            </div>

            <SpotlightCard 
              padding={32}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'auto' }}
            >
              {/* Subtle glow behind wheel */}
              <div style={{
                position: 'relative',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}>

                <SelectionWheel
                  teams={activeTeams}
                  onPicked={handlePicked}
                  onReset={resetSession}
                  hasCompleted={completedTeams.length > 0}
                  onSpinStateChange={setIsSpinning}
                />
              </div>
            </SpotlightCard>
          </motion.div>

          {/* Right: Team Management */}
          <motion.div 
            variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { type: 'spring', bounce: 0.2, duration: 0.8 } } }}
            style={{ display: 'flex', flexDirection: 'column', gap: 24, pointerEvents: 'none' }}
          >
            <div style={{ pointerEvents: 'auto' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 500, marginBottom: 6, color: 'var(--text-primary)' }}>
                Team Management
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Add or remove teams from the active wheel.
              </p>
            </div>

            <SpotlightCard padding={24} style={{ pointerEvents: 'auto' }}>
              <TeamManager
                activeTeams={activeTeams}
                completedTeams={completedTeams}
                onAdd={addTeam}
                onAddMultiple={addTeams}
                onDelete={deleteTeam}
                onReset={resetSession}
                onClearAll={clearAllTeams}
                disabled={isSpinning}
              />
            </SpotlightCard>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}
