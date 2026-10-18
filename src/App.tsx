import { useState, useEffect } from 'react';
import { Header } from './components/common/Header';
import type { ActiveTab } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { MainEditorView } from './components/editor/MainEditorView';
import { HumanizerWorkspace } from './components/humanizer/HumanizerWorkspace';
import { SimilarityWorkspace } from './components/similarity/SimilarityWorkspace';
import { PrivacyLab } from './components/privacyLab/PrivacyLab';
import { VaultWorkspace } from './components/vault/VaultWorkspace';
import { DocumentationViewer } from './components/docs/DocumentationViewer';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('editor');
  const [currentText, setCurrentText] = useState('');
  const [documentTitle, setDocumentTitle] = useState('Untitled Draft.txt');
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Keep HTML class in sync with theme state
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  };

  const handleQuickHumanize = () => {
    setActiveTab('humanizer');
  };

  const handleQuickCheckSimilarity = () => {
    setActiveTab('similarity');
  };

  const handleLoadVaultIntoEditor = (text: string, title: string) => {
    setCurrentText(text);
    setDocumentTitle(title);
    setActiveTab('editor');
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDark={isDark}
        toggleTheme={toggleTheme}
      />

      <main className="flex-1 py-4 sm:py-6">
        {activeTab === 'editor' && (
          <MainEditorView
            currentText={currentText}
            setCurrentText={setCurrentText}
            documentTitle={documentTitle}
            setDocumentTitle={setDocumentTitle}
            setActiveTab={setActiveTab}
            onQuickHumanize={handleQuickHumanize}
            onQuickCheckSimilarity={handleQuickCheckSimilarity}
          />
        )}

        {activeTab === 'humanizer' && (
          <HumanizerWorkspace
            originalText={currentText}
            setOriginalText={setCurrentText}
          />
        )}

        {activeTab === 'similarity' && (
          <SimilarityWorkspace
            initialSubmittedText={currentText}
          />
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
