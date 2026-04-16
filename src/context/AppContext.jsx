import { createContext, useContext, useReducer, useCallback } from 'react';
import { validateEventJSON, parseEventData } from '../engine/dataModel';
import { analyzeEvent } from '../engine/scoringEngine';
import { generateInsights, generateRecommendations, detectPatterns } from '../engine/intelligenceLayer';

const AppContext = createContext(null);

const initialState = {
  events: [],          // Array of { raw, parsed, analysis, insights, recommendations }
  activeEventIndex: 0,
  patterns: [],
  loading: false,
  error: null,
  view: 'upload',      // 'upload' | 'overview' | 'networking' | 'speakers' | 'sponsors' | 'insights' | 'compare'
};

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_EVENT': {
      const newEvents = [...state.events, action.payload];
      const analyses = newEvents.map(e => e.analysis);
      const patterns = detectPatterns(analyses);
      return {
        ...state,
        events: newEvents,
        activeEventIndex: newEvents.length - 1,
        patterns,
        view: 'overview',
        error: null,
      };
    }
    case 'REMOVE_EVENT': {
      const newEvents = state.events.filter((_, i) => i !== action.payload);
      const analyses = newEvents.map(e => e.analysis);
      const patterns = detectPatterns(analyses);
      return {
        ...state,
        events: newEvents,
        activeEventIndex: Math.min(state.activeEventIndex, newEvents.length - 1),
        patterns,
        view: newEvents.length === 0 ? 'upload' : state.view,
      };
    }
    case 'SET_ACTIVE_EVENT':
      return { ...state, activeEventIndex: action.payload };
    case 'SET_VIEW':
      return { ...state, view: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const loadEvent = useCallback((jsonData) => {
    try {
      const validation = validateEventJSON(jsonData);
      if (!validation.valid) {
        dispatch({ type: 'SET_ERROR', payload: `Validation errors: ${validation.errors.join(', ')}` });
        return false;
      }

      const parsed = parseEventData(jsonData);
      const analysis = analyzeEvent(parsed);
      const insights = generateInsights(analysis);
      const recommendations = generateRecommendations(analysis);

      dispatch({
        type: 'ADD_EVENT',
        payload: { raw: jsonData, parsed, analysis, insights, recommendations },
      });

      return true;
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: `Failed to process event: ${err.message}` });
      return false;
    }
  }, []);

  const removeEvent = useCallback((index) => {
    dispatch({ type: 'REMOVE_EVENT', payload: index });
  }, []);

  const activeEvent = state.events[state.activeEventIndex] || null;

  const value = {
    ...state,
    activeEvent,
    loadEvent,
    removeEvent,
    dispatch,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
