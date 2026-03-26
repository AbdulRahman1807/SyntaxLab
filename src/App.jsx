import { useState, useEffect } from 'react';
import { useTeams } from './hooks/useTeams';
import SelectionWheel from './components/SelectionWheel';
import TeamManager from './components/TeamManager';
import RevealScreen from './components/RevealScreen';
import Workspace from './components/Workspace';

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

  // Load seed from teams.json (only used if no localStorage yet)
  useEffect(() => {
    fetch(SEED_TEAMS_URL)
      .then(r => r.json())
      .then(data => setSeedTeams(data.teams || []))
      .catch(() => setSeedTeams([]))
      .finally(() => setSeedLoaded(true));
  }, []);

  const { activeTeams, completedTeams, addTeam, deleteTeam, completeTeam, resetSession } = useTeams(
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
      }}>
        {/* Header */}
        <header style={{
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
        <div style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 380px',
          gap: 0,
          maxWidth: 1200,
          width: '100%',
          margin: '0 auto',
          padding: '40px 32px',
          gap: 32,
        }}>
          {/* Left: Selection Wheel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 500, marginBottom: 6, color: 'var(--text-primary)' }}>
                Team Selector
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Spin the wheel to randomly pick the next team for the lab.
              </p>
            </div>

            <div className="glass-card" style={{ padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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
                />
              </div>

              {activeTeams.length === 0 && completedTeams.length > 0 && (
                <div style={{ marginTop: 20, textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 12 }}>
                    All teams have completed the lab!
                  </p>
                  <button className="btn btn-primary" onClick={resetSession}>
                    ↺ Reset Session
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right: Team Management */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 500, marginBottom: 6, color: 'var(--text-primary)' }}>
                Team Management
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Add or remove teams from the active wheel.
              </p>
            </div>

            <div className="glass-card" style={{ padding: 24 }}>
              <TeamManager
                activeTeams={activeTeams}
                completedTeams={completedTeams}
                onAdd={addTeam}
                onDelete={deleteTeam}
                onReset={resetSession}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
