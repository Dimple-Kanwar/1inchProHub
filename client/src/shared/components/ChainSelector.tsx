import React, { useState } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Typography,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Chip,
  InputAdornment,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

import { ChainConfig, ChainType } from '../../types/blockchain';
import { getChainIcon } from '../utils/chainUtils';

interface ChainSelectorProps {
  chains: ChainConfig[];
  selectedChain: ChainConfig | null;
  onChainSelect: (chain: ChainConfig) => void;
  label?: string;
  disabled?: boolean;
  showModal?: boolean;
  filterByType?: ChainType[];
}

export const ChainSelector: React.FC<ChainSelectorProps> = ({
  chains,
  selectedChain,
  onChainSelect,
  label = 'Select Chain',
  disabled = false,
  showModal = true,
  filterByType,
}) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter chains based on type filter and search term
  const filteredChains = chains.filter(chain => {
    const matchesType = !filterByType || filterByType.includes(chain.type);
    const matchesSearch = !searchTerm || 
      chain.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chain.symbol.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesType && matchesSearch;
  });

  // Group chains by type for better organization
  const groupedChains = filteredChains.reduce((groups, chain) => {
    const type = chain.type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(chain);
    return groups;
  }, {} as Record<ChainType, ChainConfig[]>);

  const handleChainSelect = (chain: ChainConfig) => {
    onChainSelect(chain);
    setOpen(false);
    setSearchTerm('');
  };

  const getChainTypeLabel = (type: ChainType): string => {
    switch (type) {
      case ChainType.EVM: return 'EVM Compatible';
      case ChainType.MOVE: return 'Move-based';
      case ChainType.WASM: return 'WebAssembly';
      case ChainType.UTXO: return 'UTXO-based';
      case ChainType.STELLAR: return 'Stellar Network';
      case ChainType.SOLANA: return 'Solana';
      case ChainType.COSMOS: return 'Cosmos Ecosystem';
      default: return type.toString();
    }
  };

  const getChainTypeColor = (type: ChainType) => {
    switch (type) {
      case ChainType.EVM: return 'primary';
      case ChainType.MOVE: return 'secondary';
      case ChainType.WASM: return 'success';
      case ChainType.UTXO: return 'warning';
      case ChainType.STELLAR: return 'info';
      case ChainType.SOLANA: return 'error';
      case ChainType.COSMOS: return 'default';
      default: return 'default';
    }
  };

  if (showModal) {
    return (
      <>
        <Box
          onClick={() => !disabled && setOpen(true)}
          sx={{
            p: 2,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            cursor: disabled ? 'not-allowed' : 'pointer',
            bgcolor: disabled ? 'action.disabled' : 'background.paper',
            '&:hover': {
              borderColor: disabled ? 'divider' : 'primary.main',
            },
          }}
        >
          {selectedChain ? (
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar 
                src={selectedChain.iconUrl || getChainIcon(selectedChain.id)}
                sx={{ width: 32, height: 32 }}
              >
                {selectedChain.symbol.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="body1" fontWeight="medium">
                  {selectedChain.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {getChainTypeLabel(selectedChain.type)}
                </Typography>
              </Box>
            </Box>
          ) : (
            <Typography variant="body1" color="text.secondary">
              {label}
            </Typography>
          )}
        </Box>

        <Dialog 
          open={open} 
          onClose={() => setOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Select Blockchain Network</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              placeholder="Search networks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />

            {Object.entries(groupedChains).map(([type, chains]) => (
              <Box key={type} mb={2}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Chip 
                    label={getChainTypeLabel(type as ChainType)}
                    size="small"
                    color={getChainTypeColor(type as ChainType) as any}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {chains.length} network{chains.length !== 1 ? 's' : ''}
                  </Typography>
                </Box>
                
                <List dense>
                  {chains.map((chain) => (
                    <ListItem key={chain.id} disablePadding>
                      <ListItemButton 
                        onClick={() => handleChainSelect(chain)}
                        selected={selectedChain?.id === chain.id}
                      >
                        <ListItemAvatar>
                          <Avatar 
                            src={chain.iconUrl || getChainIcon(chain.id)}
                            sx={{ width: 32, height: 32 }}
                          >
                            {chain.symbol.charAt(0)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={chain.name}
                          secondary={`${chain.symbol} • ${chain.testnet ? 'Testnet' : 'Mainnet'}`}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Box>
            ))}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Simple select dropdown (fallback)
  return (
    <FormControl fullWidth disabled={disabled}>
      <InputLabel>{label}</InputLabel>
      <Select
        value={selectedChain?.id || ''}
        onChange={(e) => {
          const chain = chains.find(c => c.id === e.target.value);
          if (chain) onChainSelect(chain);
        }}
        label={label}
      >
        {filteredChains.map((chain) => (
          <MenuItem key={chain.id} value={chain.id}>
            <Box display="flex" alignItems="center" gap={1}>
              <Avatar 
                src={chain.iconUrl || getChainIcon(chain.id)}
                sx={{ width: 24, height: 24 }}
              >
                {chain.symbol.charAt(0)}
              </Avatar>
              {chain.name}
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};