import React, { useState, useEffect } from 'react';
import { PatternThumbnail } from '../components/visualizations';
import { ParsedPattern } from '../types/app';
import { PatternService, StoredPattern } from '../services/patternService';
import { usePatternLoader } from '../contexts/AppContext';

export const PatternsPage: React.FC = () => {
  const { loadPattern } = usePatternLoader();
  const [patterns, setPatterns] = useState<StoredPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Load patterns on component mount
  useEffect(() => {
    const loadPatterns = () => {
      try {
        setLoading(true);
        setError(null);
        
        // Initialize storage with sample patterns if empty
        PatternService.initializeStorage();
        
        // Get all stored patterns
        const storedPatterns = PatternService.getStoredPatterns();
        setPatterns(storedPatterns);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load patterns');
      } finally {
        setLoading(false);
      }
    };

    loadPatterns();
  }, []);

  const handlePatternLoad = async (patternId: string) => {
    try {
      await loadPattern(patternId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pattern');
    }
  };

  const handlePatternPreview = (patternId: string) => {
    // For now, just log - preview functionality can be added later
    console.log('Previewing pattern:', patternId);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-foreground-secondary">Loading patterns...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Patterns</h2>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Filter patterns based on search and category
  const filteredPatterns = patterns.filter(pattern => {
    const matchesSearch = searchQuery === '' || 
      pattern.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pattern.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || 
      pattern.category.toLowerCase() === selectedCategory.toLowerCase();
    
    return matchesSearch && matchesCategory;
  });

  // Get unique categories for filter
  const categories = ['all', ...Array.from(new Set(patterns.map(p => p.category)))];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Pattern Library</h1>
        <p className="text-foreground-secondary mb-6">
          Browse and discover patterns created by the community.
        </p>

        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search patterns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-foreground-secondary focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="sm:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results count */}
        <p className="text-sm text-foreground-secondary mb-4">
          {filteredPatterns.length} pattern{filteredPatterns.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {filteredPatterns.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎵</div>
          <h3 className="text-xl font-semibold mb-2">No patterns found</h3>
          <p className="text-foreground-secondary">
            {searchQuery || selectedCategory !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'No patterns are available at the moment.'
            }
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatterns.map((patternData) => (
            <PatternThumbnail
              key={patternData.id}
              pattern={patternData.parsedPattern}
              name={patternData.name}
              category={patternData.category}
              complexity={patternData.complexity}
              onClick={() => handlePatternLoad(patternData.id)}
              onPreview={() => handlePatternPreview(patternData.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
