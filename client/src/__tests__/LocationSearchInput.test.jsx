import React, { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LocationSearchInput from '../components/common/LocationSearchInput';

// Mock geocodingService so tests don't depend on real network calls.
// The search test needs searchLocations to resolve quickly so the component
// can exit the "Searching..." state and render results.
vi.mock('../services/geocodingService', () => ({
  geocodingService: {
    searchLocations: vi.fn().mockResolvedValue({
      results: [
        {
          label: 'Coimbatore, Tamil Nadu, India',
          name: 'Coimbatore',
          latitude: 11.0168,
          longitude: 76.9558,
          country: 'India',
          source: 'catalog',
        },
      ],
      source: 'catalog',
    }),
    getPresetLocations: vi.fn().mockReturnValue([
      { id: 'coimbatore', name: 'Coimbatore', latitude: 11.0168, longitude: 76.9558, country: 'India' },
    ]),
  },
}));

function TestWrapper(props) {
  const [value, setValue] = useState(props.initialValue || '');
  const [resolved, setResolved] = useState(props.initialResolved || null);

  return (
    <LocationSearchInput
      id="test-input"
      label="Starting Point"
      value={value}
      onChange={setValue}
      onSelect={(item) => {
        setResolved(item);
        if (item) setValue(item.label);
        props.onSelect?.(item);
      }}
      resolvedLocation={resolved}
      {...props}
    />
  );
}

describe('LocationSearchInput', () => {
  it('renders input with label and placeholder', () => {
    render(<TestWrapper placeholder="Enter a location..." />);
    expect(screen.getByLabelText(/Starting Point/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter a location.../i)).toBeInTheDocument();
  });

  it('displays verified coordinates when resolvedLocation is provided', () => {
    render(
      <TestWrapper
        initialValue="Coimbatore, Tamil Nadu"
        initialResolved={{
          label: 'Coimbatore, Tamil Nadu',
          latitude: 11.0168,
          longitude: 76.9558,
        }}
      />
    );
    expect(screen.getByText(/Verified \(11.017, 76.956\)/i)).toBeInTheDocument();
  });

  it('shows error when searching with less than 2 characters', async () => {
    render(<TestWrapper initialValue="a" />);
    const searchBtn = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchBtn);

    await waitFor(() => {
      expect(screen.getByText(/at least 2 characters/i)).toBeInTheDocument();
    });
  });

  it('performs search and allows selecting a result', async () => {
    const onSelectMock = vi.fn();
    render(<TestWrapper initialValue="Coimbatore" onSelect={onSelectMock} />);

    const searchBtn = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchBtn);

    // Should display matching location results
    await waitFor(() => {
      expect(screen.getByText(/Matching Locations/i)).toBeInTheDocument();
    });

    const matchBtn = screen.getAllByRole('button').find((b) => b.textContent.includes('Coimbatore'));
    expect(matchBtn).toBeDefined();

    fireEvent.click(matchBtn);

    expect(onSelectMock).toHaveBeenCalled();
    const calledArg = onSelectMock.mock.calls[0][0];
    expect(calledArg).toHaveProperty('latitude');
    expect(calledArg).toHaveProperty('longitude');
  });

  it('clears input and invalidates resolved location when clear button is clicked', async () => {
    render(
      <TestWrapper
        initialValue="Coimbatore"
        initialResolved={{
          label: 'Coimbatore',
          latitude: 11.0168,
          longitude: 76.9558,
        }}
      />
    );

    const clearBtn = screen.getByTitle(/clear location/i);
    fireEvent.click(clearBtn);

    const input = screen.getByLabelText(/Starting Point/i);
    expect(input.value).toBe('');
    expect(screen.queryByText(/Verified/i)).not.toBeInTheDocument();
  });
});
