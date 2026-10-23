import React, { useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import type { ActiveTab } from './Header';

export interface DropdownItem {
  id: ActiveTab;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

interface NavDropdownProps {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  items: DropdownItem[];
  resolvedTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export const NavDropdown: React.FC<NavDropdownProps> = ({
  id,
  label,
  icon: TriggerIcon,
  items,
  resolvedTab,
  setActiveTab,
  isOpen,
  onToggle,
  onClose,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  const isParentActive = items.some((item) => item.id === resolvedTab);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle keyboard events on the trigger
  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!isOpen) {
        onToggle();
        // Focus first item once open
        setTimeout(() => {
          itemRefs.current[0]?.focus();
        }, 50);
      } else {
        itemRefs.current[0]?.focus();
      }
    } else if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      onClose();
    }
  };

  // Handle keyboard events inside the menu
  const handleMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      triggerRef.current?.focus();
      return;
    }

    const currentIndex = itemRefs.current.findIndex(
      (ref) => ref === document.activeElement
    );

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
      itemRefs.current[nextIndex]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
      itemRefs.current[prevIndex]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      itemRefs.current[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      itemRefs.current[items.length - 1]?.focus();
    }
  };

  const menuId = `${id}-menu`;
  const buttonId = `${id}-button`;

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <button
        ref={triggerRef}
        id={buttonId}
        type="button"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={onToggle}
        onKeyDown={handleTriggerKeyDown}
        className={`flex items-center space-x-1.5 rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-[color,background-color,border-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1 ${
          isParentActive
            ? 'bg-[var(--accent-light)] text-[var(--accent-deep)] dark:text-[#34D399] shadow-xs'
            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]'
        }`}
      >
        {TriggerIcon && <TriggerIcon className="h-3.5 w-3.5 shrink-0" />}
        <span>{label}</span>
        {isParentActive && (
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
        )}
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 transition-transform duration-150 motion-reduce:transition-none ${
            isOpen ? 'rotate-180' : 'rotate-0'
          }`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          id={menuId}
          role="menu"
          aria-labelledby={buttonId}
          onKeyDown={handleMenuKeyDown}
          className="absolute left-0 mt-2 w-72 origin-top-left rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] p-2 shadow-xl ring-1 ring-black/5 backdrop-blur-md transition-[opacity,transform] duration-150 ease-out z-50 animate-in fade-in zoom-in-95"
        >
          <div className="space-y-1">
            {items.map((item, index) => {
              const ItemIcon = item.icon;
              const isItemActive = resolvedTab === item.id;

              return (
                <a
                  key={item.id}
                  ref={(el) => {
                    itemRefs.current[index] = el;
                  }}
                  id={`item-${item.id}`}
                  href={item.href}
                  role="menuitem"
                  aria-current={isItemActive ? 'page' : undefined}
                  tabIndex={isOpen ? 0 : -1}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab(item.id);
                    onClose();
                  }}
                  className={`group flex items-start space-x-3 rounded-lg p-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                    isItemActive
                      ? 'bg-[var(--accent-light)] text-[var(--accent-deep)] dark:text-[#34D399]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <div
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition-colors ${
                      isItemActive
                        ? 'border-[var(--accent-border)] bg-[var(--bg-surface)] text-[var(--accent)]'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-muted)] group-hover:border-[var(--border-strong)] group-hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <ItemIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[var(--text-primary)]">
                        {item.label}
                      </span>
                      {isItemActive && (
                        <span className="rounded-full bg-[var(--accent)]/15 px-1.5 py-0.5 text-[10px] font-bold text-[var(--accent)]">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-[11px] leading-tight text-[var(--text-muted)]">
                      {item.description}
                    </p>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
