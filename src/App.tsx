import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/common/Header';
import type { ActiveTab } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { FreeAiHumanizerPage } from './components/humanizer/FreeAiHumanizerPage';
import { FreePlagiarismCheckerPage } from './components/similarity/FreePlagiarismCheckerPage';
import { FreeParaphrasingToolPage } from './components/paraphrase/FreeParaphrasingToolPage';
import { HowToHumanizeGuidePage } from './components/guide/HowToHumanizeGuidePage';
import { PrivacyLab } from './components/privacyLab/PrivacyLab';
import { VaultWorkspace } from './components/vault/VaultWorkspace';
import { DocumentationViewer } from './components/docs/DocumentationViewer';
import { updatePageMeta } from './lib/seo/metaManager';

function getTabFromHash(): ActiveTab {
  if (typeof window === 'undefined') return 'humanizer';
  const rawHash = window.location.hash.replace(/^#\/?/, '').trim().toLowerCase();
  if (rawHash === 'plagiarism-checker' || rawHash === 'similarity') return 'plagiarism-checker';
  if (rawHash === 'paraphrase' || rawHash === 'paraphrasing-tool') return 'paraphrase';
  if (rawHash === 'how-to-humanize' || rawHash === 'guide') return 'how-to-humanize';
  if (rawHash === 'privacy-lab') return 'privacy-lab';
  if (rawHash === 'vault') return 'vault';
  if (rawHash === 'docs' || rawHash === 'threat-model') return 'docs';
  return 'humanizer';
}

function getHashFromTab(tab: ActiveTab): string {
  if (tab === 'humanizer' || tab === 'editor') return '#/';
  if (tab === 'plagiarism-checker' || tab === 'similarity') return '#/plagiarism-checker';
  if (tab === 'paraphrase') return '#/paraphrase';
  if (tab === 'how-to-humanize') return '#/how-to-humanize';
  if (tab === 'privacy-lab') return '#/privacy-lab';
  if (tab === 'vault') return '#/vault';
  if (tab === 'docs') return '#/docs';
  return '#/';
}

export function App() {
  const [activeTab, setActiveTabState] = useState<ActiveTab>(() => getTabFromHash());
  const [currentText, setCurrentText] = useState('');
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Switch tabs and synchronize with browser history & URL hash
  const setActiveTab = useCallback((newTab: ActiveTab) => {
    setActiveTabState(newTab);
    const targetHash = getHashFromTab(newTab);
    if (window.location.hash !== targetHash) {
      window.history.pushState(null, '', targetHash);
    }
    updatePageMeta(newTab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Listen to browser Back/Forward navigation
  useEffect(() => {
    const handleHashChange = () => {
      const tab = getTabFromHash();
      setActiveTabState(tab);
      updatePageMeta(tab);
    };

    window.addEventListener('hashchange', handleHashChange);
    // Initial SEO meta setup on mount
    updatePageMeta(activeTab);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [activeTab]);

  // Keep HTML root class in sync with dark theme
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
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
    <div className="flex min-h-screen flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDark={isDark}
        toggleTheme={toggleTheme}
      />

      <main className="flex-1 py-4 sm:py-6">
        {isHumanizerActive && (
          <FreeAiHumanizerPage
            currentText={currentText}
            setCurrentText={setCurrentText}
            setActiveTab={setActiveTab}
          />
        )}

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
          <VaultWorkspace onLoadIntoEditor={handleLoadVaultIntoEditor} />
        )}

        {activeTab === 'docs' && <DocumentationViewer />}
      </main>

      <Footer setActiveTab={setActiveTab} />
    </div>
  );
}

export default App;
