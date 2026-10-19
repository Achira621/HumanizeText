import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/common/Header';
import type { ActiveTab } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { FreeAiHumanizerPage } from './components/humanizer/FreeAiHumanizerPage';
import { FreePlagiarismCheckerPage } from './components/similarity/FreePlagiarismCheckerPage';
import { AiDetectorPage } from './components/detector/AiDetectorPage';
import { MetadataInspectorPage } from './components/metadata/MetadataInspectorPage';
import { FreeParaphrasingToolPage } from './components/paraphrase/FreeParaphrasingToolPage';
import { HowToHumanizeGuidePage } from './components/guide/HowToHumanizeGuidePage';
import { PrivacyLab } from './components/privacyLab/PrivacyLab';
import { VaultWorkspace } from './components/vault/VaultWorkspace';
import { DocumentationViewer } from './components/docs/DocumentationViewer';
import { FlowingWavesBackground } from './components/common/FlowingWavesBackground';
import { updatePageMeta, getTabFromLocation, getPathFromTab } from './lib/seo/metaManager';

export function App() {
  const [activeTab, setActiveTabState] = useState<ActiveTab>(() => getTabFromLocation());
  const [currentText, setCurrentText] = useState('');
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('humanizetext_theme');
      if (stored !== null) {
        return stored === 'dark';
      }
    }
    // Default to clean light mode
    return false;
  });

  // Switch tabs and synchronize with browser history clean pathname
  const setActiveTab = useCallback((newTab: ActiveTab) => {
    setActiveTabState(newTab);
    const targetPath = getPathFromTab(newTab);
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
    updatePageMeta(newTab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Listen to browser Back/Forward navigation (popstate & hashchange)
  useEffect(() => {
    const handleLocationChange = () => {
      const tab = getTabFromLocation();
      setActiveTabState(tab);
      updatePageMeta(tab);
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    // Initial SEO meta setup on mount
    updatePageMeta(activeTab);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, [activeTab]);

  // Keep HTML root class and localStorage in sync with theme
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('humanizetext_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('humanizetext_theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  const handleLoadVaultIntoEditor = (text: string) => {
    setCurrentText(text);
    setActiveTab('humanizer');
  };

  const isHumanizerActive = activeTab === 'humanizer' || activeTab === 'editor';
  const isSimilarityActive = activeTab === 'plagiarism-checker' || activeTab === 'similarity';

  return (
    <div className="relative flex min-h-screen flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors overflow-hidden">
      {/* Brand Flowing Waves Background */}
      <FlowingWavesBackground variant="hero" />

      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDark={isDark}
        toggleTheme={toggleTheme}
      />

      <main className="relative z-10 flex-1 py-4 sm:py-6">
        {isHumanizerActive && (
          <FreeAiHumanizerPage
            currentText={currentText}
            setCurrentText={setCurrentText}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'ai-detector' && (
          <AiDetectorPage
            onSendToHumanizer={(text) => {
              setCurrentText(text);
              setActiveTab('humanizer');
            }}
          />
        )}

        {activeTab === 'metadata-inspector' && <MetadataInspectorPage />}

        {isSimilarityActive && (
          <FreePlagiarismCheckerPage
            initialSubmittedText={currentText}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'paraphrase' && (
          <FreeParaphrasingToolPage
            initialText={currentText}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'how-to-humanize' && (
          <HowToHumanizeGuidePage setActiveTab={setActiveTab} />
        )}

        {activeTab === 'privacy-lab' && <PrivacyLab />}

        {activeTab === 'vault' && (
          <VaultWorkspace
            onLoadIntoEditor={handleLoadVaultIntoEditor}
            onLoadIntoHumanizer={(text) => {
              setCurrentText(text);
              setActiveTab('humanizer');
            }}
            onLoadIntoPlagiarismChecker={(text) => {
              setCurrentText(text);
              setActiveTab('editor');
            }}
          />
        )}

        {activeTab === 'docs' && <DocumentationViewer />}
      </main>

      <Footer setActiveTab={setActiveTab} />
    </div>
  );
}

export default App;
