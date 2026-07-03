import React, { useState } from 'react';
import { useNodesStore } from '../stores/nodesStore';

interface UserCompaniesProps {
  userId: string;
  associatedCompanies: string[];
  // ============================================================================
  // INTEGRATION MARKER: EVENT HANDLER PASSTHROUGHS
  // Connect these handlers directly to your store update actions in the parent view.
  // ============================================================================
  onAddCompany: (userId: string, newCompanyId: string) => void | Promise<void>;
  onRemoveCompany: (userId: string, companyIdToRemove: string) => void | Promise<void>;
}

export const UserCompanies: React.FC<UserCompaniesProps> = ({
  userId,
  associatedCompanies,
  onAddCompany,
  onRemoveCompany,
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>('');
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const { companies: allCompanies } = useNodesStore();

  // ============================================================================
  // INTEGRATION MARKER: YOUR DATA DICTIONARY / LOOKUP SOURCE
  // Replace this hardcoded array with your real data source or store selection
  // of all available company:yard:node combinations in your ecosystem.
  // ============================================================================
  const masterCompanySuggestions = allCompanies

  // Filtering recommendations matching typing pattern
  const filteredSuggestions = inputValue.trim() === ''
    ? []
    : masterCompanySuggestions.filter(company => 
        company.id.toLowerCase().includes(inputValue.toLowerCase()) && 
        !associatedCompanies.includes(company.id) // Don't suggest what they already have
      );

  const handleCommitAdd = async () => {
    if (!selectedSuggestion) return;
    try {
      await onAddCompany(userId, selectedSuggestion);
      // Reset layout variables on success
      setIsEditing(false);
      setInputValue('');
      setSelectedSuggestion(null);
    } catch (err) {
      console.error("Failed to commit company attachment", err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Target Badges Collection Wrapper */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {associatedCompanies.map((company) => (
          <div 
            key={company} 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              backgroundColor: '#e1f5fe', 
              color: '#0288d1', 
              padding: '4px 8px', 
              borderRadius: '4px', 
              fontSize: '13px',
              fontWeight: 500 
            }}
          >
            <span style={{ marginRight: '6px' }}>{company}</span>
            <button 
              onClick={() => onRemoveCompany(userId, company)}
              title="Remove Association"
              style={{ border: 'none', background: 'transparent', color: '#d32f2f', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', padding: '0 2px' }}
            >
              ×
            </button>
          </div>
        ))}

        {/* Global Modal/Box Interaction Opener Trigger */}
        {!isEditing && associatedCompanies.length === 0 && (
          <button
            onClick={() => setIsEditing(true)}
            style={{ padding: '4px 10px', borderRadius: '4px', border: '1px dashed #0288d1', background: 'transparent', color: '#0288d1', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
          >
            + Attach ID
          </button>
        )}
      </div>

      {/* Autocomplete Lookahead Entry Form Panel Overlay */}
      {isEditing && (
        <div style={{ position: 'relative', border: '1px solid #d1d1d6', padding: '10px', borderRadius: '6px', backgroundColor: '#fbfbfd', maxWidth: '340px', marginTop: '4px' }}>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Type path (company:yard)..."
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setSelectedSuggestion(null); // Clear locked selection if typing resumes
              }}
              style={{ flex: 1, padding: '6px 10px', borderRadius: '4px', border: '1px solid #c7c7cc', fontSize: '13px', outline: 'none' }}
            />
            
            {/* Contextually triggered green validation button specified in prompt */}
            {selectedSuggestion && (
              <button
                onClick={handleCommitAdd}
                style={{ backgroundColor: '#34c759', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
              >
                Add
              </button>
            )}

            <button
              onClick={() => {
                setIsEditing(false);
                setInputValue('');
                setSelectedSuggestion(null);
              }}
              style={{ background: 'transparent', border: 'none', color: '#8e8e93', cursor: 'pointer', fontSize: '12px' }}
            >
              Cancel
            </button>
          </div>

          {/* Dynamic Suggestion Dropdown List */}
          {filteredSuggestions.length > 0 && !selectedSuggestion && (
            <div style={{ position: 'relative', top: '8px', left: 0, right: 0, backgroundColor: 'white', border: '1px solid #c7c7cc', borderRadius: '4px', zIndex: 10, maxHeight: '120px', overflowY: 'auto', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              {filteredSuggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  onClick={() => {
                    setSelectedSuggestion(suggestion.id);
                    setInputValue(suggestion.id); // Lock string explicitly inside input layout view
                  }}
                  style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px', borderBottom: '1px solid #f2f2f7' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f2f2f7')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  {suggestion.id}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};