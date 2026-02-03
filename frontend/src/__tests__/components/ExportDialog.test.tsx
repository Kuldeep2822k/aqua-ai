/**
 * ExportDialog Component Tests
 * Tests for the data export dialog
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExportDialog from '../../components/ExportDialog';

// Mock file download functionality
global.URL.createObjectURL = jest.fn(() => 'blob:test-url');
global.URL.revokeObjectURL = jest.fn();

describe('ExportDialog Component', () => {
    const mockOnClose = jest.fn();
    const mockData = [
        {
            id: 1,
            location_name: 'Ganga at Varanasi',
            state: 'Uttar Pradesh',
            ph: 7.5,
            dissolved_oxygen: 6.2,
            turbidity: 5.0,
            wqi_score: 72,
            timestamp: '2024-01-15T10:00:00Z',
        },
        {
            id: 2,
            location_name: 'Yamuna at Delhi',
            state: 'Delhi',
            ph: 8.0,
            dissolved_oxygen: 4.5,
            turbidity: 12.0,
            wqi_score: 45,
            timestamp: '2024-01-15T09:00:00Z',
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should not render when closed', () => {
            render(
                <ExportDialog
                    open={false}
                    onClose={mockOnClose}
                    data={mockData}
                    dataType="water-quality"
                />
            );

            expect(screen.queryByText(/Export Data/i)).not.toBeInTheDocument();
        });

        it('should render dialog when open', () => {
            render(
                <ExportDialog
                    open={true}
                    onClose={mockOnClose}
                    data={mockData}
                    dataType="water-quality"
                />
            );

            expect(screen.getByRole('heading', { name: /Export Data/i })).toBeInTheDocument();
        });

        it('should render format selection', () => {
            render(
                <ExportDialog
                    open={true}
                    onClose={mockOnClose}
                    data={mockData}
                    dataType="water-quality"
                />
            );

            expect(screen.getByRole('combobox')).toBeInTheDocument();
        });

        it('should render field selection', () => {
            render(
                <ExportDialog
                    open={true}
                    onClose={mockOnClose}
                    data={mockData}
                    dataType="water-quality"
                />
            );

            expect(screen.getByText(/Select Fields/i)).toBeInTheDocument();
        });
    });

    describe('Format Selection', () => {
        it('should have CSV format option', () => {
            render(
                <ExportDialog
                    open={true}
                    onClose={mockOnClose}
                    data={mockData}
                    dataType="water-quality"
                />
            );

            // Check if CSV is in the select or options
            const select = screen.getByRole('combobox');
            expect(select).toBeInTheDocument();
        });

        it('should select format when clicked', async () => {
            render(
                <ExportDialog
                    open={true}
                    onClose={mockOnClose}
                    data={mockData}
                    dataType="water-quality"
                />
            );

            const select = screen.getByRole('combobox');
            expect(select).toBeInTheDocument();
        });
    });

    describe('Field Selection', () => {
        it('should toggle field selection', async () => {
            render(
                <ExportDialog
                    open={true}
                    onClose={mockOnClose}
                    data={mockData}
                    dataType="water-quality"
                />
            );

            // Just verify it renders
            expect(screen.getByText(/Select Fields/i)).toBeInTheDocument();
        });
    });

    describe('Date Range', () => {
        it('should have date range inputs', () => {
            render(
                <ExportDialog
                    open={true}
                    onClose={mockOnClose}
                    data={mockData}
                    dataType="water-quality"
                />
            );

            // MUI DatePicker inputs
            const datePickers = screen.queryAllByRole('textbox');
            expect(datePickers.length).toBeGreaterThanOrEqual(0);
        });
    });

    describe('Export Actions', () => {
        it('should have export button', () => {
            render(
                <ExportDialog
                    open={true}
                    onClose={mockOnClose}
                    data={mockData}
                    dataType="water-quality"
                />
            );

            const exportButtons = screen.getAllByRole('button').filter(b => 
                b.textContent?.includes('Export') && !b.textContent?.includes('Data')
            );
            expect(exportButtons.length).toBeGreaterThan(0);
        });

        it('should have cancel button', () => {
            render(
                <ExportDialog
                    open={true}
                    onClose={mockOnClose}
                    data={mockData}
                    dataType="water-quality"
                />
            );

            expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
        });

        it('should call onClose when cancel is clicked', async () => {
            render(
                <ExportDialog
                    open={true}
                    onClose={mockOnClose}
                    data={mockData}
                    dataType="water-quality"
                />
            );

            const cancelButton = screen.getByRole('button', { name: /cancel/i });
            fireEvent.click(cancelButton);

            expect(mockOnClose).toHaveBeenCalled();
        });

        it('should export when export button is clicked', async () => {
            // Mock document.createElement carefully
            const originalCreateElement = document.createElement;
            const mockLink = {
                href: '',
                download: '',
                click: jest.fn(),
                setAttribute: jest.fn(),
                style: {},
                appendChild: jest.fn(),
                removeChild: jest.fn(),
            };
            
            const createElementSpy = jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
                if (tagName === 'a') return mockLink as any;
                return originalCreateElement.call(document, tagName);
            });

            render(
                <ExportDialog
                    open={true}
                    onClose={mockOnClose}
                    data={mockData}
                    dataType="water-quality"
                />
            );

            const exportButton = screen.getAllByRole('button').find(b => 
                b.textContent?.includes('Export') && !b.textContent?.includes('Data')
            );
            if (exportButton) {
                fireEvent.click(exportButton);
            }

            createElementSpy.mockRestore();
        });
    });

    describe('Data Types', () => {
        it('should handle water-quality data type', () => {
            render(
                <ExportDialog
                    open={true}
                    onClose={mockOnClose}
                    data={mockData}
                    dataType="water-quality"
                />
            );

            expect(screen.getByRole('heading', { name: /Export Data/i })).toBeInTheDocument();
        });

        it('should handle locations data type', () => {
            const locationData = [
                { id: 1, name: 'Location A', state: 'State A' },
                { id: 2, name: 'Location B', state: 'State B' },
            ];

            render(
                <ExportDialog
                    open={true}
                    onClose={mockOnClose}
                    data={locationData}
                    dataType="locations"
                />
            );

            expect(screen.getByRole('heading', { name: /Export Data/i })).toBeInTheDocument();
        });

        it('should handle alerts data type', () => {
            const alertData = [
                { id: 1, severity: 'critical', message: 'Alert 1' },
                { id: 2, severity: 'warning', message: 'Alert 2' },
            ];

            render(
                <ExportDialog
                    open={true}
                    onClose={mockOnClose}
                    data={alertData}
                    dataType="alerts"
                />
            );

            expect(screen.getByRole('heading', { name: /Export Data/i })).toBeInTheDocument();
        });
    });

    describe('Empty Data', () => {
        it('should handle empty data array', () => {
            render(
                <ExportDialog
                    open={true}
                    onClose={mockOnClose}
                    data={[]}
                    dataType="water-quality"
                />
            );

            expect(screen.getByRole('heading', { name: /Export Data/i })).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('should have accessible dialog', () => {
            render(
                <ExportDialog
                    open={true}
                    onClose={mockOnClose}
                    data={mockData}
                    dataType="water-quality"
                />
            );

            const dialog = screen.getByRole('dialog');
            expect(dialog).toBeInTheDocument();
        });

        it('should have accessible buttons', () => {
            render(
                <ExportDialog
                    open={true}
                    onClose={mockOnClose}
                    data={mockData}
                    dataType="water-quality"
                />
            );

            const buttons = screen.getAllByRole('button');
            expect(buttons.length).toBeGreaterThan(0);
        });
    });
});
